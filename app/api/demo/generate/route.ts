import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { requireOrganization } from '@/lib/auth'
import { generateDemoData } from '@/lib/services/demo-data'

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const organization = await requireOrganization()
    
    // Générer les données de démo pour l'organisation actuelle
    const result = await generateDemoData(organization.clerkOrgId)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error generating demo data:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la génération des données de démonstration' },
      { status: 500 }
    )
  }
}
