import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    if (process.env.NEXT_PHASE === 'phase-production-build' || !process.env.DATABASE_URL) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let userId: string | null = null
    try {
      const { auth } = await import('@clerk/nextjs/server')
      userId = auth().userId ?? null
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { clerkClient } = await import('@clerk/nextjs/server')
    const { prisma } = await import('@/lib/db/prisma')
    const { logger } = await import('@/lib/logger')

    const body = await request.json()
    const { name } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Le nom de l\'organisation est requis' },
        { status: 400 }
      )
    }

    const client = await clerkClient()

    // TOUJOURS créer l'organisation dans Clerk d'abord
    // Cela garantit que l'utilisateur sera automatiquement membre de l'organisation créée
    let clerkOrg
    try {
      clerkOrg = await client.organizations.createOrganization({
        name: name.trim(),
        createdBy: userId,
      })
    } catch (clerkError) {
      logger.error('Clerk API Error:', clerkError)
      throw new Error(`Erreur Clerk: ${clerkError instanceof Error ? clerkError.message : 'Unknown Clerk error'}`)
    }

    // Créer l'organisation dans la base de données
    let organization
    try {
      organization = await prisma.organization.create({
        data: {
          name: clerkOrg.name,
          clerkOrgId: clerkOrg.id,
          shrinkPct: 0.1, // 10% par défaut
        },
      })
    } catch (dbError) {
      logger.error('Database Error:', dbError)
      // Si l'organisation existe déjà dans la DB mais pas dans Clerk, on la récupère
      if (dbError instanceof Error && dbError.message.includes('Unique constraint')) {
        const existing = await prisma.organization.findUnique({
          where: { clerkOrgId: clerkOrg.id },
        })
        if (existing) {
          organization = existing
        } else {
          throw new Error(`Erreur base de données: ${dbError.message}`)
        }
      } else {
        throw new Error(`Erreur base de données: ${dbError instanceof Error ? dbError.message : 'Unknown DB error'}`)
      }
    }

    return NextResponse.json({
      success: true,
      organization: {
        id: organization.id,
        name: organization.name,
        clerkOrgId: organization.clerkOrgId,
      },
      message: `L'organisation "${organization.name}" a été créée avec succès dans Clerk et la base de données.`,
    })
  } catch (error) {
    const { logger } = await import('@/lib/logger')
    logger.error('Error creating organization:', error)

    if (error instanceof Error) {
      // Si l'organisation existe déjà dans Clerk
      if (error.message.includes('already exists') || error.message.includes('duplicate')) {
        return NextResponse.json(
          { error: 'Une organisation avec ce nom existe déjà' },
          { status: 409 }
        )
      }

      // Erreur spécifique de Clerk
      if (error.message.includes('organizations') || error.message.includes('organization')) {
        return NextResponse.json(
          {
            error: 'Erreur Clerk lors de la création',
            details: error.message
          },
          { status: 500 }
        )
      }

      // Erreur de base de données
      if (error.message.includes('Unique constraint') || error.message.includes('duplicate key')) {
        return NextResponse.json(
          {
            error: 'Cette organisation existe déjà dans la base de données',
            details: error.message
          },
          { status: 409 }
        )
      }
    }

    return NextResponse.json(
      {
        error: 'Erreur lors de la création de l\'organisation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
