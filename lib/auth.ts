/**
 * Auth helpers. Use dynamic imports so this module is safe to load at build time (no Clerk/Prisma at top level).
 */

/**
 * Récupère l'organisation de l'utilisateur actuel
 * SOLUTION ROBUSTE : Synchronise automatiquement depuis Clerk si nécessaire
 * Ne retourne jamais null si orgId existe (sauf en cas d'erreur vraiment critique)
 */
export async function getCurrentOrganization() {
  const { auth } = await import('@clerk/nextjs/server')
  const authResult = await auth()
  const orgId = authResult.orgId ?? null
  if (!orgId) return null

  const { prisma } = await import('./db/prisma')
  const { logger } = await import('./logger')

  // Chercher l'organisation dans la DB
  let organization = await prisma.organization.findUnique({
    where: { clerkOrgId: orgId },
  })

  // Si l'organisation n'existe pas dans la DB mais existe dans Clerk,
  // on la crée automatiquement pour synchroniser
  if (!organization) {
    // Réessayer jusqu'à 3 fois en cas d'erreur temporaire (rate limit, etc.)
    let attempts = 0
    const maxAttempts = 3

    while (attempts < maxAttempts && !organization) {
      try {
        const { clerkClient } = await import('@clerk/nextjs/server')
        const client = await clerkClient()

        // Récupérer les infos de l'organisation depuis Clerk
        const clerkOrg = await client.organizations.getOrganization({ organizationId: orgId })

        // Créer l'organisation dans la DB
        try {
          organization = await prisma.organization.create({
            data: {
              name: clerkOrg.name,
              clerkOrgId: orgId,
              shrinkPct: 0.1, // 10% par défaut
            },
          })
          logger.log(`✅ Organisation "${organization.name}" synchronisée depuis Clerk`)
          break // Succès, sortir de la boucle
        } catch (dbError) {
          // Si l'organisation existe déjà (race condition), la récupérer
          if (dbError instanceof Error && dbError.message.includes('Unique constraint')) {
            organization = await prisma.organization.findUnique({
              where: { clerkOrgId: orgId },
            })
            if (organization) {
              logger.log(`✅ Organisation "${organization.name}" trouvée dans la DB`)
              break // Succès, sortir de la boucle
            }
          } else {
            // Ne pas faire remonter l'erreur : log et tentative findUnique une dernière fois
            logger.error('❌ Error creating organization in DB:', dbError)
            organization = await prisma.organization.findUnique({
              where: { clerkOrgId: orgId },
            })
            if (organization) break
            return null
          }
        }
      } catch (error) {
        attempts++

        // Vérifier si c'est un rate limit (erreur temporaire)
        const isRateLimit =
          (error as any)?.status === 429 ||
          (error as any)?.statusCode === 429 ||
          (error instanceof Error && error.message?.includes('Too Many Requests')) ||
          (error instanceof Error && error.message?.includes('429')) ||
          (error as any)?.code === 'too_many_requests'

        if (isRateLimit && attempts < maxAttempts) {
          // Attendre avant de réessayer (backoff exponentiel)
          const delay = Math.min(1000 * Math.pow(2, attempts - 1), 5000)
          logger.log(`⏳ Rate limit Clerk (tentative ${attempts}/${maxAttempts}), attente ${delay}ms...`)
          await new Promise(resolve => setTimeout(resolve, delay))
          continue // Réessayer
        } else if (isRateLimit) {
          // Dernière tentative échouée à cause du rate limit
          logger.error('❌ Rate limit Clerk après', maxAttempts, 'tentatives')
          return null
        } else {
          // Erreur non liée au rate limit
          logger.error('❌ Error syncing organization from Clerk:', error)
          if (attempts >= maxAttempts) {
            return null
          }
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts))
        }
      }
    }
  }

  return organization
}

/**
 * Récupère l'organisation pour le dashboard : essaie getCurrentOrganization(), puis si null
 * récupère la première organisation de l'utilisateur via Clerk et la crée en DB si besoin.
 * Évite l'écran "Synchronisation en cours" quand l'utilisateur a bien une org dans Clerk.
 * Un léger retry permet de réussir au premier chargement même en cas de latence Clerk/DB.
 */
export async function getOrganizationForDashboard(userId: string): Promise<Awaited<ReturnType<typeof getCurrentOrganization>>> {
  for (let attempt = 0; attempt < 2; attempt++) {
    let organization = await getCurrentOrganization()
    if (organization) return organization

    const { clerkClient } = await import('@clerk/nextjs/server')
    const { prisma } = await import('./db/prisma')
    const { logger } = await import('./logger')

    try {
      const client = await clerkClient()
      const userMemberships = await client.users.getOrganizationMembershipList({ userId })
      if (!userMemberships.data?.length) return null

      const firstOrg = userMemberships.data[0].organization
      const clerkOrgId = firstOrg.id

      organization = await prisma.organization.findUnique({
        where: { clerkOrgId },
      })
      if (organization) return organization

      try {
        organization = await prisma.organization.create({
          data: {
            name: firstOrg.name,
            clerkOrgId,
            shrinkPct: 0.1,
          },
        })
        logger.log(`✅ Organisation "${organization.name}" synchronisée depuis Clerk (dashboard)`)
        return organization
      } catch (dbError) {
        if (dbError instanceof Error && dbError.message.includes('Unique constraint')) {
          organization = await prisma.organization.findUnique({
            where: { clerkOrgId },
          })
          if (organization) return organization
        } else {
          logger.error('Error creating organization (dashboard):', dbError)
          organization = await prisma.organization.findUnique({
            where: { clerkOrgId },
          })
          if (organization) return organization
        }
      }
    } catch (error) {
      logger.error('Error getOrganizationForDashboard:', error)
      if (attempt === 1) return null
      await new Promise((r) => setTimeout(r, 250))
    }
  }
  return null
}

/**
 * Garantit qu'une organisation Clerk existe en base (pour le super-admin, ex. génération lien paiement).
 * À appeler avec un clerkOrgId : si l'org n'est pas en DB, on la crée depuis Clerk puis on la retourne.
 */
export async function ensureOrganizationInDb(clerkOrgId: string) {
  const { prisma } = await import('./db/prisma')
  const { logger } = await import('./logger')

  let organization = await prisma.organization.findUnique({
    where: { clerkOrgId },
  })
  if (organization) return organization

  let attempts = 0
  const maxAttempts = 3

  while (attempts < maxAttempts && !organization) {
    try {
      const { clerkClient } = await import('@clerk/nextjs/server')
      const client = await clerkClient()
      const clerkOrg = await client.organizations.getOrganization({ organizationId: clerkOrgId })
      try {
        organization = await prisma.organization.create({
          data: {
            name: clerkOrg.name,
            clerkOrgId,
            shrinkPct: 0.1,
          },
        })
        logger.log(`✅ Organisation "${organization.name}" synchronisée depuis Clerk (admin)`)
        break
      } catch (dbError) {
        if (dbError instanceof Error && dbError.message.includes('Unique constraint')) {
          organization = await prisma.organization.findUnique({
            where: { clerkOrgId },
          })
          if (organization) break
        } else {
          throw dbError
        }
      }
    } catch (error) {
      attempts++
      const isRateLimit =
        (error as any)?.status === 429 ||
        (error as any)?.statusCode === 429 ||
        (error instanceof Error && error.message?.includes('Too Many Requests')) ||
        (error as any)?.code === 'too_many_requests'
      if (isRateLimit && attempts < maxAttempts) {
        const delay = Math.min(1000 * Math.pow(2, attempts - 1), 5000)
        await new Promise((resolve) => setTimeout(resolve, delay))
        continue
      }
      logger.error('❌ ensureOrganizationInDb:', error)
      throw error
    }
  }

  return organization
}

/**
 * Vérifie que l'utilisateur appartient à une organisation
 */
export async function requireOrganization() {
  const organization = await getCurrentOrganization()
  
  if (!organization) {
    throw new Error('Unauthorized: Organization required')
  }

  return organization
}

/**
 * Récupère l'organisation par clerkOrgId si l'utilisateur en est membre.
 * Utilisé quand la session n'a pas d'orgId mais que le client envoie clerkOrgId (ex. import).
 */
export async function getOrganizationByClerkIdIfMember(
  userId: string,
  clerkOrgId: string
) {
  try {
    const { clerkClient } = await import('@clerk/nextjs/server')
    const client = await clerkClient()
    const memberships = await client.users.getOrganizationMembershipList({ userId })
    const isMember = memberships.data?.some(
      (m) => m.organization.id === clerkOrgId
    )
    if (!isMember) return null

    const { prisma } = await import('./db/prisma')
    let organization = await prisma.organization.findUnique({
      where: { clerkOrgId },
    })
    if (organization) return organization

    const clerkOrg = await client.organizations.getOrganization({ organizationId: clerkOrgId })
    try {
      organization = await prisma.organization.create({
        data: {
          name: clerkOrg.name,
          clerkOrgId,
          shrinkPct: 0.1,
        },
      })
    } catch (dbError) {
      if (dbError instanceof Error && dbError.message.includes('Unique constraint')) {
        organization = await prisma.organization.findUnique({
          where: { clerkOrgId },
        })
      } else {
        throw dbError
      }
    }
    return organization
  } catch {
    return null
  }
}

/**
 * Récupère l'utilisateur actuel avec son organisation
 */
export async function getCurrentUserWithOrg() {
  const { currentUser } = await import('@clerk/nextjs/server')
  const user = await currentUser()
  const organization = await getCurrentOrganization()

  return {
    user,
    organization,
  }
}
