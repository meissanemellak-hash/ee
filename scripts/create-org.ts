import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const clerkOrgId = 'org_38iiiphyogvJeKurnNT4opBeNt5'
  
  // Vérifier si l'organisation existe déjà
  const existing = await prisma.organization.findUnique({
    where: { clerkOrgId },
  })

  if (existing) {
    console.log('✅ Organisation déjà existante:', existing)
    return
  }

  // Créer l'organisation
  const organization = await prisma.organization.create({
    data: {
      clerkOrgId,
      name: 'Ma Chaîne de Restaurants', // Vous pouvez changer le nom plus tard
      shrinkPct: 0.1, // 10% de shrink par défaut
      isDemo: false,
    },
  })

  console.log('✅ Organisation créée avec succès:', organization)
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
