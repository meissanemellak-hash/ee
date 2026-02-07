import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { checkApiPermission } from '@/lib/auth-role'
import { prisma } from '@/lib/db/prisma'
import { getCurrentOrganization, getOrganizationByClerkIdIfMember } from '@/lib/auth'
import Papa from 'papaparse'
import { csvInventoryRowSchema } from '@/lib/validations/inventory'
import { runAllAlerts } from '@/lib/services/alerts'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

/**
 * POST /api/inventory/import
 * Importe l'inventaire d'un restaurant depuis un fichier CSV.
 * Colonnes : ingrédient, stock_actuel, seuil_min, seuil_max (optionnel).
 * Le restaurant est fourni dans le body (restaurantId).
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const restaurantId = formData.get('restaurantId') as string | null
    const clerkOrgIdFromClient = formData.get('clerkOrgId') as string | null

    if (!file) {
      return NextResponse.json(
        { error: 'Fichier requis', details: 'Veuillez sélectionner un fichier CSV.' },
        { status: 400 }
      )
    }
    if (!restaurantId) {
      return NextResponse.json(
        { error: 'Restaurant requis', details: 'Identifiant du restaurant manquant.' },
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
            "Aucune organisation active. Vérifiez qu'une organisation est bien sélectionnée.",
        },
        { status: 400 }
      )
    }

    const forbidden = await checkApiPermission(userId, organization.clerkOrgId, 'inventory:import')
    if (forbidden) return forbidden

    const restaurant = await prisma.restaurant.findFirst({
      where: { id: restaurantId, organizationId: organization.id },
      select: { id: true },
    })
    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant introuvable ou n\'appartient pas à votre organisation.' },
        { status: 404 }
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

    const ingredients = await prisma.ingredient.findMany({
      where: { organizationId: organization.id },
      select: { id: true, name: true },
    })
    const ingredientByName = new Map(ingredients.map((i) => [i.name.toLowerCase().trim(), i]))

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

    const toCreate: {
      ingredientId: string
      currentStock: number
      minThreshold: number
      maxThreshold: number | null
    }[] = []
    const errors: string[] = []

    for (let i = 0; i < parseResult.data.length; i++) {
      const row = parseResult.data[i] as Record<string, string>
      try {
        const ingredientVal = getRowVal(
          row,
          'ingrédient',
          'ingredient',
          'Ingredient',
          'ingredient_name'
        )
        const stockVal = getRowVal(
          row,
          'stock_actuel',
          'currentStock',
          'stock',
          'Stock',
          'current_stock'
        )
        const minVal = getRowVal(
          row,
          'seuil_min',
          'minThreshold',
          'min',
          'MinThreshold',
          'min_threshold'
        )
        const maxVal = getRowVal(
          row,
          'seuil_max',
          'maxThreshold',
          'max',
          'MaxThreshold',
          'max_threshold'
        )

        const normalizedRow = {
          ingredient: ingredientVal ?? '',
          currentStock: stockVal ?? '',
          minThreshold: minVal ?? '',
          maxThreshold: maxVal ?? undefined,
        }

        const validated = csvInventoryRowSchema.parse(normalizedRow)

        const ingredientName = String(validated.ingredient).trim()
        if (!ingredientName) {
          errors.push(`Ligne ${i + 2}: Nom d'ingrédient requis`)
          continue
        }

        const ingredient = ingredientByName.get(ingredientName.toLowerCase())
        if (!ingredient) {
          errors.push(`Ligne ${i + 2}: Ingrédient "${ingredientName}" introuvable. Créez-le d'abord.`)
          continue
        }

        const currentStock =
          typeof validated.currentStock === 'string'
            ? parseFloat(validated.currentStock.replace(',', '.'))
            : validated.currentStock
        const minThreshold =
          typeof validated.minThreshold === 'string'
            ? parseFloat(validated.minThreshold.replace(',', '.'))
            : validated.minThreshold
        let maxThreshold: number | null = null
        if (validated.maxThreshold != null && validated.maxThreshold !== '') {
          maxThreshold =
            typeof validated.maxThreshold === 'string'
              ? parseFloat(String(validated.maxThreshold).replace(',', '.'))
              : validated.maxThreshold
          if (isNaN(maxThreshold) || maxThreshold < 0) maxThreshold = null
        }

        if (isNaN(currentStock) || currentStock < 0) {
          errors.push(`Ligne ${i + 2}: Stock actuel invalide`)
          continue
        }
        if (isNaN(minThreshold) || minThreshold < 0) {
          errors.push(`Ligne ${i + 2}: Seuil min invalide`)
          continue
        }

        toCreate.push({
          ingredientId: ingredient.id,
          currentStock,
          minThreshold,
          maxThreshold,
        })
      } catch (err) {
        errors.push(
          `Ligne ${i + 2}: ${err instanceof Error ? err.message : 'Erreur de validation'}`
        )
      }
    }

    if (toCreate.length === 0) {
      return NextResponse.json(
        {
          error: 'Aucune ligne valide à importer',
          details: errors.length > 0 ? errors : 'Aucune ligne valide dans le fichier.',
        },
        { status: 400 }
      )
    }

    let created = 0
    let updated = 0

    for (const item of toCreate) {
      const existing = await prisma.inventory.findUnique({
        where: {
          restaurantId_ingredientId: {
            restaurantId: restaurant.id,
            ingredientId: item.ingredientId,
          },
        },
      })

      if (existing) {
        await prisma.inventory.update({
          where: { id: existing.id },
          data: {
            currentStock: item.currentStock,
            minThreshold: item.minThreshold,
            maxThreshold: item.maxThreshold,
            lastUpdated: new Date(),
          },
        })
        updated++
      } else {
        await prisma.inventory.create({
          data: {
            restaurantId: restaurant.id,
            ingredientId: item.ingredientId,
            currentStock: item.currentStock,
            minThreshold: item.minThreshold,
            maxThreshold: item.maxThreshold,
          },
        })
        created++
      }
      }

    // Génération automatique des alertes après import d'inventaire
    try {
      await runAllAlerts(restaurant.id)
    } catch (alertError) {
      logger.error('[POST /api/inventory/import] runAllAlerts:', alertError)
    }

    return NextResponse.json({
      success: true,
      imported: toCreate.length,
      created,
      updated,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    logger.error('[POST /api/inventory/import] Erreur:', error)
    return NextResponse.json(
      {
        error: 'Erreur serveur',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    )
  }
}
