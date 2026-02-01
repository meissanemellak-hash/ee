import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db/prisma'
import { getCurrentOrganization, getOrganizationByClerkIdIfMember } from '@/lib/auth'
import Papa from 'papaparse'
import { csvBomRowSchema } from '@/lib/validations/bom'

export const dynamic = 'force-dynamic'

/**
 * POST /api/products/bom/import
 * Importe des recettes (BOM - Bill of Materials) depuis un fichier CSV.
 * Chaque ligne associe un produit à un ingrédient avec une quantité.
 * Les produits et ingrédients doivent déjà exister dans l'organisation.
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const clerkOrgIdFromClient = formData.get('clerkOrgId') as string | null

    if (!file) {
      return NextResponse.json(
        { error: 'Fichier requis', details: 'Veuillez sélectionner un fichier CSV.' },
        { status: 400 }
      )
    }

    let organization = await getCurrentOrganization()
    if (!organization && clerkOrgIdFromClient) {
      organization = await getOrganizationByClerkIdIfMember(userId, clerkOrgIdFromClient)
    }
    if (!organization) {
      return NextResponse.json(
        {
          error: 'Organisation requise',
          details:
            "Aucune organisation active. Vérifiez qu'une organisation est bien sélectionnée (sélecteur en haut à droite) puis réessayez.",
        },
        { status: 400 }
      )
    }

    const text = await file.text()
    const parseResult = Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
    })

    if (parseResult.errors.length > 0) {
      return NextResponse.json(
        { error: 'Format CSV invalide', details: parseResult.errors },
        { status: 400 }
      )
    }

    const products = await prisma.product.findMany({
      where: { organizationId: organization.id },
      select: { id: true, name: true },
    })
    const ingredients = await prisma.ingredient.findMany({
      where: { organizationId: organization.id },
      select: { id: true, name: true, unit: true },
    })

    const productByName = new Map(products.map((p) => [p.name.toLowerCase().trim(), p]))
    const ingredientByName = new Map(ingredients.map((i) => [i.name.toLowerCase().trim(), i]))

    const normalizeUnit = (u: string): string => {
      const s = u.trim().toLowerCase()
      const map: Record<string, string> = {
        g: 'g',
        gramme: 'g',
        grammes: 'g',
        gram: 'g',
        grams: 'g',
        kg: 'kg',
        kilogramme: 'kg',
        kilogrammes: 'kg',
        l: 'L',
        litre: 'L',
        litres: 'L',
        liter: 'L',
        liters: 'L',
        ml: 'ml',
        millilitre: 'ml',
        millilitres: 'ml',
        paquet: 'paquet',
        paquets: 'paquet',
        unité: 'unité',
        unite: 'unité',
        unités: 'unité',
        units: 'unité',
        unit: 'unité',
      }
      return map[s] ?? s
    }

    /** Convertit la quantité CSV vers l'unité de l'ingrédient (g↔kg, ml↔L). Retourne null si incompatible. */
    const convertToIngredientUnit = (
      quantity: number,
      csvUnit: string,
      ingUnit: string
    ): number | null => {
      if (csvUnit === ingUnit) return quantity
      if ((csvUnit === 'g' && ingUnit === 'kg') || (csvUnit === 'kg' && ingUnit === 'g')) {
        return csvUnit === 'g' ? quantity / 1000 : quantity * 1000
      }
      if ((csvUnit === 'ml' && ingUnit === 'L') || (csvUnit === 'L' && ingUnit === 'ml')) {
        return csvUnit === 'ml' ? quantity / 1000 : quantity * 1000
      }
      return null
    }

    const bomToCreate: { productId: string; ingredientId: string; quantityNeeded: number }[] = []
    const errors: string[] = []

    const getRowVal = (row: Record<string, string>, ...keys: string[]) => {
      const normalizedRow: Record<string, string> = {}
      for (const k of Object.keys(row)) {
        normalizedRow[k.replace(/^\uFEFF/, '').trim()] = row[k]
      }
      for (const key of keys) {
        const val = normalizedRow[key] ?? normalizedRow[key.toLowerCase()]
        if (val != null && val !== '') return val
      }
      return undefined
    }

    for (let i = 0; i < parseResult.data.length; i++) {
      const row = parseResult.data[i] as Record<string, string>
      try {
        const productVal = getRowVal(row, 'produit', 'product', 'Product')
        const ingredientVal = getRowVal(row, 'ingrédient', 'ingredient', 'Ingredient')
        const quantityVal = getRowVal(
          row,
          'quantité',
          'quantite',
          'quantity',
          'Quantity',
          'quantityNeeded'
        )
        const unitVal = getRowVal(
          row,
          'unité',
          'unite',
          'unit',
          'Unit',
          'units'
        )

        const normalizedRow = {
          product: productVal ?? '',
          ingredient: ingredientVal ?? '',
          quantity: quantityVal ?? '',
          unit: unitVal ?? undefined,
        }

        const validated = csvBomRowSchema.parse(normalizedRow)

        const productName = String(validated.product).trim()
        const ingredientName = String(validated.ingredient).trim()

        if (!productName || !ingredientName) {
          errors.push(`Ligne ${i + 2}: Produit et ingrédient requis`)
          continue
        }

        const product = productByName.get(productName.toLowerCase())
        const ingredient = ingredientByName.get(ingredientName.toLowerCase())

        if (!product) {
          errors.push(`Ligne ${i + 2}: Produit "${productName}" introuvable. Créez-le d'abord.`)
          continue
        }
        if (!ingredient) {
          errors.push(`Ligne ${i + 2}: Ingrédient "${ingredientName}" introuvable. Créez-le d'abord.`)
          continue
        }

        const quantity =
          typeof validated.quantity === 'string'
            ? parseFloat(validated.quantity.replace(',', '.'))
            : validated.quantity

        if (isNaN(quantity) || quantity <= 0) {
          errors.push(`Ligne ${i + 2}: Quantité invalide (doit être > 0)`)
          continue
        }

        let quantityToStore = quantity
        if (validated.unit != null && validated.unit !== '') {
          const csvUnit = normalizeUnit(validated.unit)
          const ingUnit = normalizeUnit(ingredient.unit)
          const converted = convertToIngredientUnit(quantity, csvUnit, ingUnit)
          if (converted === null) {
            errors.push(
              `Ligne ${i + 2}: Unité "${validated.unit}" incompatible avec "${ingredientName}" (${ingredient.unit}). Conversions possibles : g↔kg, ml↔L.`
            )
            continue
          }
          quantityToStore = converted
        }

        bomToCreate.push({
          productId: product.id,
          ingredientId: ingredient.id,
          quantityNeeded: quantityToStore,
        })
      } catch (err) {
        errors.push(
          `Ligne ${i + 2}: ${err instanceof Error ? err.message : 'Erreur de validation'}`
        )
      }
    }

    if (bomToCreate.length === 0) {
      return NextResponse.json(
        {
          error: 'Aucune recette valide à importer',
          details:
            errors.length > 0 ? errors : 'Aucune ligne valide dans le fichier.',
        },
        { status: 400 }
      )
    }

    let created = 0
    let updated = 0

    for (const item of bomToCreate) {
      const existing = await prisma.productIngredient.findUnique({
        where: {
          productId_ingredientId: {
            productId: item.productId,
            ingredientId: item.ingredientId,
          },
        },
      })

      if (existing) {
        await prisma.productIngredient.update({
          where: { id: existing.id },
          data: { quantityNeeded: item.quantityNeeded },
        })
        updated++
      } else {
        await prisma.productIngredient.create({
          data: item,
        })
        created++
      }
    }

    return NextResponse.json({
      success: true,
      imported: bomToCreate.length,
      created,
      updated,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('[POST /api/products/bom/import] Erreur:', error)
    return NextResponse.json(
      {
        error: 'Erreur serveur',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    )
  }
}
