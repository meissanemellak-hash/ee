import { prisma } from '../db/prisma'
import type { AlertType, AlertSeverity } from '@/types'

interface AlertInput {
  restaurantId: string
  type: AlertType
  severity: AlertSeverity
  message: string
}

/**
 * Crée une alerte
 */
export async function createAlert(input: AlertInput) {
  // Vérifier si une alerte similaire non résolue existe déjà
  const existingAlert = await prisma.alert.findFirst({
    where: {
      restaurantId: input.restaurantId,
      type: input.type,
      resolved: false,
    },
  })

  if (existingAlert) {
    // Mettre à jour l'alerte existante
    return prisma.alert.update({
      where: { id: existingAlert.id },
      data: {
        severity: input.severity,
        message: input.message,
      },
    })
  }

  return prisma.alert.create({
    data: input,
  })
}

/**
 * Vérifie les stocks et génère des alertes
 */
export async function checkInventoryAlerts(restaurantId: string) {
  const inventory = await prisma.inventory.findMany({
    where: { restaurantId },
    include: {
      ingredient: true,
    },
  })

  for (const inv of inventory) {
    // Alerte surstock
    if (inv.maxThreshold && inv.currentStock > inv.maxThreshold) {
      await createAlert({
        restaurantId,
        type: 'OVERSTOCK',
        severity: 'medium',
        message: `Surstock détecté pour ${inv.ingredient.name}: ${inv.currentStock} ${inv.ingredient.unit} (seuil max: ${inv.maxThreshold})`,
      })
    }

    // Alerte rupture de stock
    if (inv.currentStock < inv.minThreshold) {
      const percentage = (inv.currentStock / inv.minThreshold) * 100
      const severity: AlertSeverity =
        percentage < 20 ? 'critical' : percentage < 50 ? 'high' : 'medium'

      await createAlert({
        restaurantId,
        type: 'SHORTAGE',
        severity,
        message: `Rupture de stock imminente pour ${inv.ingredient.name}: ${inv.currentStock} ${inv.ingredient.unit} (seuil min: ${inv.minThreshold})`,
      })
    }
  }
}

/**
 * Vérifie les prévisions vs stocks et génère des alertes
 */
export async function checkForecastAlerts(restaurantId: string) {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)

  // Récupérer les prévisions pour demain
  const forecasts = await prisma.forecast.findMany({
    where: {
      restaurantId,
      forecastDate: {
        gte: new Date(tomorrow.setHours(0, 0, 0, 0)),
        lt: new Date(tomorrow.setHours(23, 59, 59, 999)),
      },
    },
    include: {
      product: {
        include: {
          productIngredients: {
            include: {
              ingredient: true,
            },
          },
        },
      },
    },
  })

  const inventory = await prisma.inventory.findMany({
    where: { restaurantId },
  })

  // Pour chaque prévision, vérifier si on a assez de stock
  for (const forecast of forecasts) {
    for (const productIngredient of forecast.product.productIngredients) {
      const inv = inventory.find(
        i => i.ingredientId === productIngredient.ingredientId
      )

      if (!inv) continue

      const neededQuantity =
        forecast.forecastedQuantity * productIngredient.quantityNeeded

      if (inv.currentStock < neededQuantity) {
        const shortage = neededQuantity - inv.currentStock
        const severity: AlertSeverity =
          shortage > inv.minThreshold * 2 ? 'critical' : 'high'

        await createAlert({
          restaurantId,
          type: 'SHORTAGE',
          severity,
          message: `Risque de rupture pour ${productIngredient.ingredient.name} le ${forecast.forecastDate.toLocaleDateString('fr-FR')}. Stock actuel: ${inv.currentStock} ${productIngredient.ingredient.unit}, besoin estimé: ${neededQuantity.toFixed(2)}`,
        })
      }
    }
  }
}

/**
 * Exécute toutes les vérifications d'alertes pour un restaurant
 */
export async function runAllAlerts(restaurantId: string) {
  await checkInventoryAlerts(restaurantId)
  await checkForecastAlerts(restaurantId)
}
