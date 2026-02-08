import { prisma } from '../db/prisma'
import type { ForecastMethod } from '@/types'

interface ForecastInput {
  restaurantId: string
  productId: string
  forecastDate: Date
  method?: ForecastMethod
}

/** Résultat d'un calcul de prévision avec métadonnées pour la confiance */
interface ForecastResult {
  value: number
  daysWithSales: number
  dailyQuantities: number[]
}

/**
 * Calcule le niveau de confiance (0..1) à partir des données historiques.
 * - Base : nombre de jours avec ventes (< 3 → 40 %, 3-6 → 55 %, 7-13 → 70 %, 14+ → 85 %)
 * - Bonus régularité : si variance faible (cv < 0.3), +5 % (plafond 95 %)
 */
function computeConfidence(daysWithSales: number, dailyQuantities: number[]): number {
  let base = 0.4
  if (daysWithSales >= 14) base = 0.85
  else if (daysWithSales >= 7) base = 0.7
  else if (daysWithSales >= 3) base = 0.55

  let confidence = base
  if (dailyQuantities.length >= 3) {
    const mean = dailyQuantities.reduce((s, q) => s + q, 0) / dailyQuantities.length
    const variance = dailyQuantities.reduce((s, q) => s + (q - mean) ** 2, 0) / dailyQuantities.length
    const std = Math.sqrt(variance)
    const cv = mean > 0 ? std / mean : 1
    if (cv < 0.3) confidence = Math.min(0.95, confidence + 0.05)
  }
  return Math.round(confidence * 100) / 100
}

/**
 * Calcule une prévision basée sur la moyenne mobile
 * Calcule la moyenne quotidienne des ventes sur les X derniers jours AVANT la date cible
 */
async function calculateMovingAverage(
  restaurantId: string,
  productId: string,
  days: number = 7,
  targetDate?: Date
): Promise<ForecastResult> {
  // Si une date cible est fournie, calculer les jours AVANT cette date
  // Sinon, utiliser aujourd'hui comme référence
  const referenceDate = targetDate ? new Date(targetDate) : new Date()
  referenceDate.setDate(referenceDate.getDate() - 1) // Exclure la date cible elle-même
  referenceDate.setHours(23, 59, 59, 999)
  
  const startDate = new Date(referenceDate)
  startDate.setDate(startDate.getDate() - days + 1) // +1 pour inclure le premier jour
  startDate.setHours(0, 0, 0, 0)

  const sales = await prisma.sale.findMany({
    where: {
      restaurantId,
      productId,
      saleDate: {
        gte: startDate,
        lte: referenceDate,
      },
    },
    select: {
      quantity: true,
      saleDate: true,
    },
  })

  if (sales.length === 0) {
    return { value: 0, daysWithSales: 0, dailyQuantities: [] }
  }

  // Grouper les ventes par jour et calculer la quantité totale par jour
  const salesByDay = new Map<string, number>()
  
  for (const sale of sales) {
    const dateKey = sale.saleDate.toISOString().split('T')[0] // Format: YYYY-MM-DD
    const currentTotal = salesByDay.get(dateKey) || 0
    salesByDay.set(dateKey, currentTotal + sale.quantity)
  }

  // Calculer la moyenne des quantités quotidiennes
  const dailyQuantities = Array.from(salesByDay.values())
  const totalDailyQuantity = dailyQuantities.reduce((sum, qty) => sum + qty, 0)
  const averageDailyQuantity = totalDailyQuantity / dailyQuantities.length

  return {
    value: averageDailyQuantity,
    daysWithSales: dailyQuantities.length,
    dailyQuantities,
  }
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
): Promise<ForecastResult> {
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
    return calculateMovingAverage(restaurantId, productId, 7, targetDate)
  }

  // Grouper les ventes par jour et calculer la quantité totale par jour
  const salesByDay = new Map<string, number>()
  
  for (const sale of sameDaySales) {
    const dateKey = sale.saleDate.toISOString().split('T')[0] // Format: YYYY-MM-DD
    const currentTotal = salesByDay.get(dateKey) || 0
    salesByDay.set(dateKey, currentTotal + sale.quantity)
  }

  // Calculer la moyenne des quantités quotidiennes pour ce jour de la semaine
  const dailyQuantities = Array.from(salesByDay.values())
  const totalDailyQuantity = dailyQuantities.reduce((sum, qty) => sum + qty, 0)
  const averageDailyQuantity = totalDailyQuantity / dailyQuantities.length

  return {
    value: averageDailyQuantity,
    daysWithSales: dailyQuantities.length,
    dailyQuantities,
  }
}

/**
 * Génère une prévision de ventes
 */
export async function generateForecast(input: ForecastInput) {
  const { restaurantId, productId, forecastDate, method = 'moving_average' } = input

  let result: ForecastResult

  switch (method) {
    case 'seasonality':
      result = await calculateSeasonality(
        restaurantId,
        productId,
        forecastDate
      )
      break
    case 'moving_average':
    default:
      result = await calculateMovingAverage(
        restaurantId,
        productId,
        7, // 7 jours
        forecastDate // Passer la date cible pour calculer les jours AVANT
      )
      break
  }

  const forecastedQuantity = Math.ceil(result.value)
  const confidence = computeConfidence(result.daysWithSales, result.dailyQuantities)

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
  // Récupérer le restaurant pour obtenir l'organizationId
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: { organizationId: true },
  })

  if (!restaurant) {
    throw new Error('Restaurant not found')
  }

  // Récupérer tous les produits de l'organisation
  const products = await prisma.product.findMany({
    where: {
      organizationId: restaurant.organizationId,
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
