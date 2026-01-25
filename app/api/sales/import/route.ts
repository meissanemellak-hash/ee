import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db/prisma'
import { getCurrentOrganization } from '@/lib/auth'
import Papa from 'papaparse'
import { csvSaleRowSchema } from '@/lib/validations/sales'

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const organization = await getCurrentOrganization()
    if (!organization) {
      return NextResponse.json(
        { error: 'Organization required' },
        { status: 400 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const restaurantId = formData.get('restaurantId') as string

    if (!file || !restaurantId) {
      return NextResponse.json(
        { error: 'File and restaurantId are required' },
        { status: 400 }
      )
    }

    // Vérifier que le restaurant appartient à l'organisation
    const restaurant = await prisma.restaurant.findFirst({
      where: {
        id: restaurantId,
        organizationId: organization.id,
      },
    })

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      )
    }

    // Lire et parser le CSV
    const text = await file.text()
    const parseResult = Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
    })

    if (parseResult.errors.length > 0) {
      return NextResponse.json(
        { error: 'Invalid CSV format', details: parseResult.errors },
        { status: 400 }
      )
    }

    // Récupérer tous les produits de l'organisation pour le mapping
    const products = await prisma.product.findMany({
      where: { organizationId: organization.id },
    })

    // Créer un map pour trouver les produits par nom
    const productMap = new Map(products.map(p => [p.name.toLowerCase(), p]))

    // Valider et transformer les données
    const salesToCreate = []
    const errors = []

    for (let i = 0; i < parseResult.data.length; i++) {
      const row = parseResult.data[i] as Record<string, string>
      
      try {
        // Valider la ligne
        const validated = csvSaleRowSchema.parse({
          restaurant: row.restaurant || row.Restaurant,
          product: row.product || row.Product,
          quantity: row.quantity || row.Quantity,
          amount: row.amount || row.Amount || row.amount || row.Amount,
          date: row.date || row.Date || row.sale_date,
          hour: row.hour || row.Hour || row.sale_hour,
        })

        // Trouver le produit
        const product = productMap.get(validated.product.toLowerCase())
        if (!product) {
          errors.push(`Ligne ${i + 2}: Produit "${validated.product}" non trouvé`)
          continue
        }

        // Parser la date
        const saleDate = new Date(validated.date)
        if (isNaN(saleDate.getTime())) {
          errors.push(`Ligne ${i + 2}: Date invalide "${validated.date}"`)
          continue
        }

        // Parser l'heure
        let saleHour = 0
        if (typeof validated.hour === 'string') {
          const hourMatch = validated.hour.match(/(\d{1,2})/)
          saleHour = hourMatch ? parseInt(hourMatch[1]) : 0
        } else {
          saleHour = validated.hour
        }

        // Parser les quantités et montants
        const quantity = typeof validated.quantity === 'string' 
          ? parseFloat(validated.quantity) 
          : validated.quantity
        const amount = typeof validated.amount === 'string'
          ? parseFloat(validated.amount)
          : validated.amount

        salesToCreate.push({
          restaurantId,
          productId: product.id,
          quantity: Math.round(quantity),
          amount,
          saleDate,
          saleHour: Math.max(0, Math.min(23, saleHour)),
        })
      } catch (error) {
        errors.push(`Ligne ${i + 2}: ${error instanceof Error ? error.message : 'Erreur de validation'}`)
      }
    }

    if (salesToCreate.length === 0) {
      return NextResponse.json(
        { error: 'Aucune vente valide à importer', details: errors },
        { status: 400 }
      )
    }

    // Insérer les ventes en batch
    const result = await prisma.sale.createMany({
      data: salesToCreate,
      skipDuplicates: true,
    })

    return NextResponse.json({
      success: true,
      imported: result.count,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('Error importing sales:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
