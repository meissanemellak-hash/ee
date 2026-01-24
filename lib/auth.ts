import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from './db/prisma'

/**
 * Récupère l'organisation de l'utilisateur actuel
 */
export async function getCurrentOrganization() {
  const { orgId } = auth()
  
  if (!orgId) {
    return null
  }

  const organization = await prisma.organization.findUnique({
    where: { clerkOrgId: orgId },
  })

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
