import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db/prisma'
import { getCurrentOrganization, getOrganizationByClerkIdIfMember } from '@/lib/auth'
import Papa from 'papaparse'
import { csvIngredientRowSchema } from '@/lib/validations/ingredients'

export const dynamic = 'force-dynamic'

/**
 * POST /api/ingredients/import
 * Importe des ingrédients depuis un fichier CSV
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
          details: 'Aucune organisation active. Vérifiez qu\'une organisation est bien sélectionnée (sélecteur en haut à droite) puis réessayez.',
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

    const ingredientsToCreate: {
      name: string
      unit: string
      costPerUnit: number
      packSize: number | null
      supplierName: string | null
    }[] = []
    const errors: string[] = []
    const existingNames = new Set(
      (
        await prisma.ingredient.findMany({
          where: { organizationId: organization.id },
          select: { name: true },
        })
      ).map((i) => i.name.toLowerCase())
    )

    for (let i = 0; i < parseResult.data.length; i++) {
      const row = parseResult.data[i] as Record<string, string>
      try {
        const normalizedRow = {
          name: row.nom ?? row.name ?? row.Name,
          unit: row.unite ?? row.unit ?? row.Unit,
          costPerUnit: row.cout_unitaire ?? row.costPerUnit ?? row.cost_per_unit ?? row.CostPerUnit,
          packSize: row.taille_pack ?? row.packSize ?? row.pack_size ?? row.PackSize,
          supplierName: row.fournisseur ?? row.supplierName ?? row.supplier_name ?? row.SupplierName,
        }
        const validated = csvIngredientRowSchema.parse(normalizedRow)
        const name = String(validated.name).trim()
        if (!name) {
          errors.push(`Ligne ${i + 2}: Nom vide`)
          continue
        }
        if (existingNames.has(name.toLowerCase())) {
          errors.push(`Ligne ${i + 2}: Un ingrédient nommé "${name}" existe déjà`)
          continue
        }
        const unit = String(validated.unit).trim()
        if (!unit) {
          errors.push(`Ligne ${i + 2}: Unité requise`)
          continue
        }
        const costPerUnit =
          typeof validated.costPerUnit === 'string'
            ? parseFloat(validated.costPerUnit.replace(',', '.'))
            : validated.costPerUnit
        if (isNaN(costPerUnit) || costPerUnit < 0) {
          errors.push(`Ligne ${i + 2}: Coût par unité invalide`)
          continue
        }
        let packSize: number | null = null
        if (validated.packSize != null && validated.packSize !== '') {
          packSize =
            typeof validated.packSize === 'string'
              ? parseFloat(validated.packSize.replace(',', '.'))
              : validated.packSize
          if (isNaN(packSize) || packSize <= 0) packSize = null
        }
        const supplierName = validated.supplierName
          ? String(validated.supplierName).trim() || null
          : null

        ingredientsToCreate.push({ name, unit, costPerUnit, packSize, supplierName })
        existingNames.add(name.toLowerCase())
      } catch (err) {
        errors.push(
          `Ligne ${i + 2}: ${err instanceof Error ? err.message : 'Erreur de validation'}`
        )
      }
    }

    if (ingredientsToCreate.length === 0) {
      return NextResponse.json(
        {
          error: 'Aucun ingrédient valide à importer',
          details: errors.length > 0 ? errors : 'Aucune ligne valide dans le fichier.',
        },
        { status: 400 }
      )
    }

    await prisma.ingredient.createMany({
      data: ingredientsToCreate.map((p) => ({
        organizationId: organization!.id,
        name: p.name,
        unit: p.unit,
        costPerUnit: p.costPerUnit,
        packSize: p.packSize,
        supplierName: p.supplierName,
      })),
    })

    return NextResponse.json({
      success: true,
      imported: ingredientsToCreate.length,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('[POST /api/ingredients/import] Erreur:', error)
    return NextResponse.json(
      {
        error: 'Erreur serveur',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    )
  }
}
