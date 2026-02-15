import { NextRequest, NextResponse } from 'next/server'

/** Parse une date au format JJ/MM/AAAA (ou JJ-MM-AAAA) ou AAAA-MM-JJ (ISO). */
function parseSaleDate(dateStr: string): Date | null {
  const trimmed = dateStr.trim()
  const dmyMatch = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/)
  if (dmyMatch) {
    const [, day, month, year] = dmyMatch
    const d = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10))
    return isNaN(d.getTime()) ? null : d
  }
  const iso = new Date(trimmed)
  return isNaN(iso.getTime()) ? null : iso
}

export async function POST(request: NextRequest) {
  try {
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

    const { getCurrentOrganization, getOrganizationByClerkIdIfMember } = await import('@/lib/auth')
    const { checkApiPermission } = await import('@/lib/auth-role')
    const { prisma } = await import('@/lib/db/prisma')

    const formData = await request.formData()
    const file = formData.get('file') as File
    const restaurantId = formData.get('restaurantId') as string
    const clerkOrgIdFromClient = formData.get('clerkOrgId') as string | null

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

    const forbidden = await checkApiPermission(userId, organization.clerkOrgId, 'sales:import')
    if (forbidden) return forbidden

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

    const Papa = (await import('papaparse')).default
    const { csvSaleRowSchema } = await import('@/lib/validations/sales')
    const { recipeQuantityToInventoryUnit } = await import('@/lib/units')

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
        // Accepter colonnes en français ou en anglais
        const normalizedRow = {
          restaurant: row.restaurant ?? row.Restaurant,
          product: row.product ?? row.produit ?? row.Product,
          quantity: row.quantity ?? row.quantite ?? row.Quantity,
          amount: row.amount ?? row.montant ?? row.Amount ?? row.amount ?? row.Amount,
          date: row.date ?? row.Date ?? row.sale_date,
          hour: row.hour ?? row.heure ?? row.Hour ?? row.sale_hour,
        }
        const validated = csvSaleRowSchema.parse(normalizedRow)

        // Trouver le produit
        const product = productMap.get(validated.product.toLowerCase())
        if (!product) {
          errors.push(`Ligne ${i + 2}: Produit "${validated.product}" non trouvé`)
          continue
        }

        // Parser la date (JJ/MM/AAAA comme sur le site, ou AAAA-MM-JJ)
        const saleDate = parseSaleDate(validated.date)
        if (!saleDate) {
          errors.push(`Ligne ${i + 2}: Date invalide "${validated.date}" (attendu : JJ/MM/AAAA ou AAAA-MM-JJ)`)
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

    // Déduire les stocks selon les recettes (BOM) pour chaque produit importé
    const productIds = Array.from(new Set(salesToCreate.map(s => s.productId)))
    const quantityByProduct = new Map<string, number>()
    for (const s of salesToCreate) {
      quantityByProduct.set(s.productId, (quantityByProduct.get(s.productId) ?? 0) + s.quantity)
    }

    const productsWithBom = await prisma.product.findMany({
      where: { id: { in: productIds }, organizationId: organization.id },
      include: {
        productIngredients: {
          select: {
            ingredientId: true,
            quantityNeeded: true,
            unit: true,
            ingredient: { select: { unit: true } },
          },
        },
      },
    })

    await prisma.$transaction(async (tx) => {
      for (const product of productsWithBom) {
        const totalQty = quantityByProduct.get(product.id) ?? 0
        if (totalQty === 0 || product.productIngredients.length === 0) continue
        for (const pi of product.productIngredients) {
          const ingredientUnit = pi.ingredient?.unit ?? 'unité'
          const perUnitInInventory = recipeQuantityToInventoryUnit(
            pi.quantityNeeded,
            pi.unit,
            ingredientUnit
          )
          const amountToDeduct = perUnitInInventory * totalQty
          const inv = await tx.inventory.findUnique({
            where: {
              restaurantId_ingredientId: {
                restaurantId,
                ingredientId: pi.ingredientId,
              },
            },
          })
          if (inv) {
            await tx.inventory.update({
              where: { id: inv.id },
              data: {
                currentStock: { decrement: amountToDeduct },
                lastUpdated: new Date(),
              },
            })
          }
        }
      }
    })

    try {
      const { runAllAlerts } = await import('@/lib/services/alerts')
      await runAllAlerts(restaurantId)
    } catch (alertError) {
      const { logger } = await import('@/lib/logger')
      logger.error('[POST /api/sales/import] runAllAlerts:', alertError)
    }

    return NextResponse.json({
      success: true,
      imported: result.count,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    const { logger } = await import('@/lib/logger')
    logger.error('Error importing sales:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
