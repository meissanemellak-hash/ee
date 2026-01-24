import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { requireOrganization } from '@/lib/auth'
import { deleteDemoData } from '@/lib/services/demo-data'

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const organization = await requireOrganization()
    
    // Supprimer les données de démo pour l'organisation actuelle
    const result = await deleteDemoData(organization.clerkOrgId)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error deleting demo data:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression des données de démonstration' },
      { status: 500 }
    )
  }
}
