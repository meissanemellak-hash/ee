import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db/prisma'
import { getCurrentOrganization, getOrganizationByClerkIdIfMember } from '@/lib/auth'
import Papa from 'papaparse'
import { csvRestaurantRowSchema } from '@/lib/validations/restaurants'

export const dynamic = 'force-dynamic'

const DEFAULT_TIMEZONE = 'Europe/Paris'

/**
 * POST /api/restaurants/import
 * Importe des restaurants depuis un fichier CSV
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

    const restaurantsToCreate: { name: string; address: string | null; timezone: string }[] = []
    const errors: string[] = []
    const existingNames = new Set(
      (
        await prisma.restaurant.findMany({
          where: { organizationId: organization.id },
          select: { name: true },
        })
      ).map((r) => r.name.toLowerCase())
    )

    for (let i = 0; i < parseResult.data.length; i++) {
      const row = parseResult.data[i] as Record<string, string>
      try {
        const normalizedRow = {
          name: row.nom ?? row.name ?? row.Name,
          address: row.adresse ?? row.address ?? row.Address,
          timezone: row.fuseau ?? row.timezone ?? row.Timezone,
        }
        const validated = csvRestaurantRowSchema.parse(normalizedRow)
        const name = String(validated.name).trim()
        if (!name) {
          errors.push(`Ligne ${i + 2}: Nom vide`)
          continue
        }
        if (existingNames.has(name.toLowerCase())) {
          errors.push(`Ligne ${i + 2}: Un restaurant nommé "${name}" existe déjà`)
          continue
        }
        const address = validated.address ? String(validated.address).trim() || null : null
        const timezone = validated.timezone ? String(validated.timezone).trim() || DEFAULT_TIMEZONE : DEFAULT_TIMEZONE

        restaurantsToCreate.push({ name, address, timezone })
        existingNames.add(name.toLowerCase())
      } catch (err) {
        errors.push(
          `Ligne ${i + 2}: ${err instanceof Error ? err.message : 'Erreur de validation'}`
        )
      }
    }

    if (restaurantsToCreate.length === 0) {
      return NextResponse.json(
        {
          error: 'Aucun restaurant valide à importer',
          details: errors.length > 0 ? errors : 'Aucune ligne valide dans le fichier.',
        },
        { status: 400 }
      )
    }

    await prisma.restaurant.createMany({
      data: restaurantsToCreate.map((r) => ({
        organizationId: organization!.id,
        name: r.name,
        address: r.address,
        timezone: r.timezone,
      })),
    })

    return NextResponse.json({
      success: true,
      imported: restaurantsToCreate.length,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('[POST /api/restaurants/import] Erreur:', error)
    return NextResponse.json(
      {
        error: 'Erreur serveur',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    )
  }
}
