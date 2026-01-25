/**
 * Script pour vérifier l'état de l'organisation "graille M"
 * Usage: npx tsx scripts/check-org-status.ts
 */

import { prisma } from '../lib/db/prisma'

async function main() {
  console.log('🔍 Vérification de l\'état de "graille M"...\n')

  try {
    // Chercher toutes les organisations dans la DB
    const allOrgs = await prisma.organization.findMany({
      orderBy: { createdAt: 'desc' },
    })

    console.log(`📊 Total d'organisations dans la DB: ${allOrgs.length}\n`)

    // Chercher "graille M" spécifiquement
    const grailleM = allOrgs.find(
      org => org.name.toLowerCase().includes('graille')
    )

    if (grailleM) {
      console.log('✅ "graille M" trouvée dans la DB:')
      console.log(`   - ID: ${grailleM.id}`)
      console.log(`   - Nom: ${grailleM.name}`)
      console.log(`   - Clerk Org ID: ${grailleM.clerkOrgId}`)
      console.log(`   - Créée le: ${grailleM.createdAt}`)
      console.log(`   - Shrink %: ${grailleM.shrinkPct}`)
    } else {
      console.log('❌ "graille M" NON trouvée dans la DB')
    }

    console.log('\n📋 Toutes les organisations:')
    allOrgs.forEach((org, index) => {
      console.log(`   ${index + 1}. ${org.name} (ID: ${org.id}, Clerk: ${org.clerkOrgId})`)
    })

    // Vérifier les restaurants associés
    if (grailleM) {
      const restaurants = await prisma.restaurant.findMany({
        where: { organizationId: grailleM.id },
      })
      console.log(`\n🍽️  Restaurants associés à "graille M": ${restaurants.length}`)
      restaurants.forEach((restaurant, index) => {
        console.log(`   ${index + 1}. ${restaurant.name}`)
      })
    }
  } catch (error) {
    console.error('❌ Erreur:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
