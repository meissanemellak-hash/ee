import { prisma } from '../db/prisma'
import type { ForecastMethod } from '@/types'

interface ForecastInput {
  restaurantId: string
  productId: string
  forecastDate: Date
  method?: ForecastMethod
}

/**
 * Calcule une prévision basée sur la moyenne mobile
 */
async function calculateMovingAverage(
  restaurantId: string,
  productId: string,
  days: number = 7
): Promise<number> {
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const sales = await prisma.sale.findMany({
    where: {
      restaurantId,
      productId,
      saleDate: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      quantity: true,
    },
  })

  if (sales.length === 0) {
    return 0
  }

  const totalQuantity = sales.reduce((sum, sale) => sum + sale.quantity, 0)
  return totalQuantity / sales.length
}

/**
 * Calcule une prévision basée sur la saisonnalité
 * Compare les mêmes jours de la semaine sur les dernières semaines
 */
async function calculateSeasonality(
  restaurantId: string,
  productId: string,
  targetDate: Date,
  weeks: number = 4
): Promise<number> {
  const dayOfWeek = targetDate.getDay()
  const endDate = new Date(targetDate)
  endDate.setDate(endDate.getDate() - 1)
  const startDate = new Date(endDate)
  startDate.setDate(startDate.getDate() - (weeks * 7))

  const sales = await prisma.sale.findMany({
    where: {
      restaurantId,
      productId,
      saleDate: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      quantity: true,
      saleDate: true,
    },
  })

  // Filtrer les ventes du même jour de la semaine
  const sameDaySales = sales.filter(sale => {
    const saleDay = new Date(sale.saleDate).getDay()
    return saleDay === dayOfWeek
  })

  if (sameDaySales.length === 0) {
    // Fallback sur moyenne mobile si pas assez de données
    return calculateMovingAverage(restaurantId, productId)
  }

  const totalQuantity = sameDaySales.reduce(
    (sum, sale) => sum + sale.quantity,
    0
  )
  return totalQuantity / sameDaySales.length
}

/**
 * Génère une prévision de ventes
 */
export async function generateForecast(input: ForecastInput) {
  const { restaurantId, productId, forecastDate, method = 'moving_average' } = input

  let forecastedQuantity: number
  let confidence: number = 0.7

  switch (method) {
    case 'seasonality':
      forecastedQuantity = await calculateSeasonality(
        restaurantId,
        productId,
        forecastDate
      )
      confidence = 0.75
      break
    case 'moving_average':
    default:
      forecastedQuantity = await calculateMovingAverage(
        restaurantId,
        productId
      )
      confidence = 0.7
      break
  }

  // Arrondir à l'entier supérieur
  forecastedQuantity = Math.ceil(forecastedQuantity)

  // Vérifier si une prévision existe déjà (même jour)
  const startOfDay = new Date(forecastDate)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(forecastDate)
  endOfDay.setHours(23, 59, 59, 999)

  const existing = await prisma.forecast.findFirst({
    where: {
      restaurantId,
      productId,
      forecastDate: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
  })

  let forecast
  if (existing) {
    // Mettre à jour la prévision existante
    forecast = await prisma.forecast.update({
      where: { id: existing.id },
      data: {
        forecastedQuantity,
        method,
        confidence,
      },
    })
  } else {
    // Créer une nouvelle prévision
    forecast = await prisma.forecast.create({
      data: {
        restaurantId,
        productId,
        forecastDate,
        forecastedQuantity,
        method,
        confidence,
      },
    })
  }

  return forecast
}

/**
 * Génère des prévisions pour plusieurs produits
 */
export async function generateForecastsForRestaurant(
  restaurantId: string,
  forecastDate: Date,
  method?: ForecastMethod
) {
  const products = await prisma.product.findMany({
    where: {
      organization: {
        restaurants: {
          some: {
            id: restaurantId,
          },
        },
      },
    },
  })

  const forecasts = await Promise.all(
    products.map(product =>
      generateForecast({
        restaurantId,
        productId: product.id,
        forecastDate,
        method,
      })
    )
  )

  return forecasts
}
