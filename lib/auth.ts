import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from './db/prisma'

/**
 * Récupère l'organisation de l'utilisateur actuel
 * SOLUTION ROBUSTE : Synchronise automatiquement depuis Clerk si nécessaire
 * Ne retourne jamais null si orgId existe (sauf en cas d'erreur vraiment critique)
 */
export async function getCurrentOrganization() {
  const { orgId } = auth()
  
  if (!orgId) {
    return null
  }

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
          console.log(`✅ Organisation "${organization.name}" synchronisée depuis Clerk`)
          break // Succès, sortir de la boucle
        } catch (dbError) {
          // Si l'organisation existe déjà (race condition), la récupérer
          if (dbError instanceof Error && dbError.message.includes('Unique constraint')) {
            organization = await prisma.organization.findUnique({
              where: { clerkOrgId: orgId },
            })
            if (organization) {
              console.log(`✅ Organisation "${organization.name}" trouvée dans la DB`)
              break // Succès, sortir de la boucle
            }
          } else {
            throw dbError
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
          console.log(`⏳ Rate limit Clerk (tentative ${attempts}/${maxAttempts}), attente ${delay}ms...`)
          await new Promise(resolve => setTimeout(resolve, delay))
          continue // Réessayer
        } else if (isRateLimit) {
          // Dernière tentative échouée à cause du rate limit
          console.error('❌ Rate limit Clerk après', maxAttempts, 'tentatives')
          // On retourne null mais l'organisation existe dans Clerk, donc le layout laissera passer
          return null
        } else {
          // Erreur non liée au rate limit
          console.error('❌ Error syncing organization from Clerk:', error)
          if (attempts >= maxAttempts) {
            // Après plusieurs tentatives, on retourne null
            // Mais comme orgId existe, le layout laissera quand même passer
            return null
          }
          // Attendre avant de réessayer
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts))
        }
      }
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
  const user = await currentUser()
  const organization = await getCurrentOrganization()

  return {
    user,
    organization,
  }
}
