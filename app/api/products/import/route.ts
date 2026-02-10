import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { checkApiPermission } from '@/lib/auth-role'
import { prisma } from '@/lib/db/prisma'
import { getCurrentOrganization, getOrganizationByClerkIdIfMember } from '@/lib/auth'
import Papa from 'papaparse'
import { z } from 'zod'
import { csvProductRowSchema } from '@/lib/validations/products'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

/**
 * POST /api/products/import
 * Importe des produits depuis un fichier CSV
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

    const forbidden = await checkApiPermission(userId, organization.clerkOrgId, 'products:create')
    if (forbidden) return forbidden

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

    const productsToCreate: { name: string; category: string | null; unitPrice: number }[] = []
    const errors: string[] = []
    const existingNames = new Set(
      (await prisma.product.findMany({
        where: { organizationId: organization.id },
        select: { name: true },
      })).map((p) => p.name.toLowerCase())
    )

    for (let i = 0; i < parseResult.data.length; i++) {
      const row = parseResult.data[i] as Record<string, string>
      try {
        const normalizedRow = {
          name: row.nom ?? row.name ?? row.Name,
          category: row.categorie ?? row.category ?? row.Category ?? undefined,
          unitPrice: row.prix_unitaire ?? row.unitPrice ?? row.unit_price ?? row.UnitPrice,
        }
        const validated = csvProductRowSchema.parse(normalizedRow)
        const name = String(validated.name).trim()
        if (!name) {
          errors.push(`Ligne ${i + 2}: Nom du produit vide`)
          continue
        }
        if (existingNames.has(name.toLowerCase())) {
          errors.push(`Ligne ${i + 2}: Un produit nommé "${name}" existe déjà`)
          continue
        }
        const unitPrice =
          typeof validated.unitPrice === 'string'
            ? parseFloat(validated.unitPrice.replace(',', '.'))
            : validated.unitPrice
        if (isNaN(unitPrice) || unitPrice < 0) {
          errors.push(`Ligne ${i + 2}: Prix invalide`)
          continue
        }
        const category = validated.category ? String(validated.category).trim() || null : null
        productsToCreate.push({ name, category, unitPrice })
        existingNames.add(name.toLowerCase())
      } catch (err) {
        if (err instanceof z.ZodError) {
          errors.push(
            `Ligne ${i + 2}: Le fichier ne correspond pas au format attendu pour l'import produits. Il doit contenir les colonnes « nom » (ou name) et « prix_unitaire » (ou unitPrice). Téléchargez le modèle « Import produits » sur cette page. Si vous souhaitez importer des ventes, utilisez la page Import ventes.`
          )
        } else {
          errors.push(
            `Ligne ${i + 2}: ${err instanceof Error ? err.message : 'Erreur de validation'}`
          )
        }
      }
    }

    if (productsToCreate.length === 0) {
      return NextResponse.json(
        {
          error: 'Aucun produit valide à importer',
          details: errors.length > 0 ? errors : 'Aucune ligne valide dans le fichier.',
        },
        { status: 400 }
      )
    }

    await prisma.product.createMany({
      data: productsToCreate.map((p) => ({
        organizationId: organization!.id,
        name: p.name,
        category: p.category,
        unitPrice: p.unitPrice,
      })),
      skipDuplicates: false,
    })

    return NextResponse.json({
      success: true,
      imported: productsToCreate.length,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    logger.error('[POST /api/products/import] Erreur:', error)
    return NextResponse.json(
      { error: 'Erreur serveur', details: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 }
    )
  }
}
