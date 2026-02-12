import { prisma } from '../db/prisma'
import { logger } from '../logger'
import type { AlertType, AlertSeverity } from '@/types'
import { computeStaffingRecommendations } from './recommender'

interface AlertInput {
  restaurantId: string
  type: AlertType
  severity: AlertSeverity
  message: string
}

/**
 * Crée une alerte.
 * runAllAlerts supprime d'abord les alertes non résolues du restaurant, puis appelle
 * checkInventoryAlerts / checkForecastAlerts qui créent une alerte par situation :
 * on crée donc toujours une nouvelle alerte (pas de mise à jour d'une existante).
 */
export async function createAlert(input: AlertInput) {
  return prisma.alert.create({
    data: input,
  })
}

/**
 * État actuel des alertes dérivé de l'inventaire (sans écrire en base).
 * Utilisé pour afficher "État actuel" sur la page Alertes et éviter les faux négatifs.
 */
export interface CurrentAlertsStateItem {
  type: 'SHORTAGE' | 'OVERSTOCK'
  ingredientName: string
  message: string
  severity?: string
}

export interface CurrentAlertsState {
  shortages: number
  overstocks: number
  items: CurrentAlertsStateItem[]
}

export async function getCurrentAlertsStateFromInventory(restaurantId: string): Promise<CurrentAlertsState> {
  const inventory = await prisma.inventory.findMany({
    where: { restaurantId },
    include: { ingredient: true },
  })

  const items: CurrentAlertsStateItem[] = []

  for (const inv of inventory) {
    if (inv.maxThreshold != null && inv.currentStock > inv.maxThreshold) {
      items.push({
        type: 'OVERSTOCK',
        ingredientName: inv.ingredient.name,
        message: `Surstock pour ${inv.ingredient.name}: ${inv.currentStock} ${inv.ingredient.unit} (seuil max: ${inv.maxThreshold})`,
        severity: 'medium',
      })
    }
    if (inv.currentStock < inv.minThreshold) {
      const percentage = (inv.currentStock / inv.minThreshold) * 100
      const severity = percentage < 20 ? 'critical' : percentage < 50 ? 'high' : 'medium'
      items.push({
        type: 'SHORTAGE',
        ingredientName: inv.ingredient.name,
        message: `Rupture imminente pour ${inv.ingredient.name}: ${inv.currentStock} ${inv.ingredient.unit} (seuil min: ${inv.minThreshold})`,
        severity,
      })
    }
  }

  return {
    shortages: items.filter((i) => i.type === 'SHORTAGE').length,
    overstocks: items.filter((i) => i.type === 'OVERSTOCK').length,
    items,
  }
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

  logger.log(`[checkInventoryAlerts] Restaurant ${restaurantId}: ${inventory.length} entrées d'inventaire trouvées`)

  if (inventory.length === 0) {
    logger.log(`[checkInventoryAlerts] Aucun inventaire configuré pour le restaurant ${restaurantId}. Les alertes nécessitent un inventaire avec des seuils min/max.`)
    return
  }

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
  tomorrow.setHours(0, 0, 0, 0)
  
  const tomorrowEnd = new Date(tomorrow)
  tomorrowEnd.setHours(23, 59, 59, 999)

  logger.log(`[checkForecastAlerts] Restaurant ${restaurantId}: Recherche des prévisions pour ${tomorrow.toISOString()}`)

  // Récupérer les prévisions pour demain
  const forecasts = await prisma.forecast.findMany({
    where: {
      restaurantId,
      forecastDate: {
        gte: tomorrow,
        lte: tomorrowEnd,
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

  logger.log(`[checkForecastAlerts] Restaurant ${restaurantId}: ${forecasts.length} prévisions trouvées`)

  // Pour chaque prévision, vérifier si on a assez de stock
  for (const forecast of forecasts) {
    if (!forecast.product || !forecast.product.productIngredients) {
      logger.log(`[checkForecastAlerts] Prévision ${forecast.id} sans produit ou recette, ignorée`)
      continue
    }

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

        const todayStart = new Date()
        todayStart.setHours(0, 0, 0, 0)
        const forecastDay = new Date(forecast.forecastDate)
        forecastDay.setHours(0, 0, 0, 0)
        const diffDays = Math.round((forecastDay.getTime() - todayStart.getTime()) / (24 * 60 * 60 * 1000))
        const whenLabel =
          diffDays === 0
            ? "aujourd'hui"
            : diffDays === 1
              ? 'demain'
              : `dans ${diffDays} jours`

        await createAlert({
          restaurantId,
          type: 'SHORTAGE',
          severity,
          message: `Risque de rupture pour ${productIngredient.ingredient.name} ${whenLabel} (le ${forecast.forecastDate.toLocaleDateString('fr-FR')}). Stock actuel: ${inv.currentStock} ${productIngredient.ingredient.unit}, besoin estimé: ${neededQuantity.toFixed(2)}`,
        })
      }
    }
  }
}

const SLOT_LABELS = ['08:00-12:00', '12:00-14:00', '14:00-18:00', '18:00-22:00'] as const

/**
 * Récupère l'effectif recommandé par créneau : calcul depuis les ventes, ou en secours la dernière recommandation STAFFING en base.
 */
async function getRecommendedStaffBySlot(
  restaurantId: string,
  planDate: Date
): Promise<Map<string, number>> {
  let recommended: { timeSlot: string; recommendedStaff: number }[] = []
  try {
    recommended = await computeStaffingRecommendations(restaurantId, planDate)
  } catch (e) {
    logger.error('[checkStaffingAlerts] computeStaffingRecommendations:', e)
  }

  const recommendedBySlot = new Map(recommended.map((r) => [r.timeSlot, r.recommendedStaff]))

  // Si des créneaux manquent ou aucun calcul (pas de ventes 30j), utiliser la dernière recommandation STAFFING en base
  const missingSlots = SLOT_LABELS.filter((slot) => !recommendedBySlot.has(slot))
  if (missingSlots.length > 0) {
    const lastStaffing = await prisma.recommendation.findFirst({
      where: { restaurantId, type: 'STAFFING' },
      orderBy: { createdAt: 'desc' },
    })
    if (lastStaffing?.data && Array.isArray(lastStaffing.data)) {
      const data = lastStaffing.data as Array<{ timeSlot?: string; recommendedStaff?: number }>
      for (const item of data) {
        const slot = item.timeSlot
        const count = item.recommendedStaff
        if (slot && typeof count === 'number' && recommendedBySlot.get(slot) === undefined) {
          recommendedBySlot.set(slot, count)
        }
      }
    }
  }

  return recommendedBySlot
}

/**
 * Compare effectif prévu vs recommandé et crée les alertes Sur-effectif / Sous-effectif (option C).
 * Dates construites en UTC (7 prochains jours). Requête par plage pour garantir la correspondance avec les lignes en base.
 */
export async function checkStaffingAlerts(restaurantId: string) {
  const dates: Date[] = []
  const now = new Date()
  for (let i = 0; i < 7; i++) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + i, 0, 0, 0, 0))
    dates.push(d)
  }

  for (const planDate of dates) {
    const dateStr = planDate.toISOString().slice(0, 10)
    const planDayStart = new Date(dateStr + 'T00:00:00.000Z')
    const planDayEnd = new Date(planDayStart.getTime() + 24 * 60 * 60 * 1000)
    const plannedRows = await prisma.plannedStaffing.findMany({
      where: {
        restaurantId,
        planDate: { gte: planDayStart, lt: planDayEnd },
      },
    })
    if (plannedRows.length === 0) continue

    const recommendedBySlot = await getRecommendedStaffBySlot(restaurantId, planDate)
    const plannedBySlot = new Map(plannedRows.map((r) => [r.slotLabel, r.plannedCount]))

    for (const slot of SLOT_LABELS) {
      const planned = plannedBySlot.get(slot)
      if (planned === undefined) continue
      const rec = recommendedBySlot.get(slot)
      if (rec === undefined) continue

      const dateLabel = planDate.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
      const severity: AlertSeverity = Math.abs(planned - rec) >= 2 ? 'high' : 'medium'

      if (planned > rec) {
        await createAlert({
          restaurantId,
          type: 'OVERSTAFFING',
          severity,
          message: `Sur-effectif pour le créneau ${slot} le ${dateLabel}: ${planned} prévu vs ${rec} recommandé.`,
        })
      } else if (planned < rec) {
        await createAlert({
          restaurantId,
          type: 'UNDERSTAFFING',
          severity,
          message: `Sous-effectif pour le créneau ${slot} le ${dateLabel}: ${planned} prévu vs ${rec} recommandé.`,
        })
      }
    }
  }
}

/**
 * Exécute toutes les vérifications d'alertes pour un restaurant.
 * On supprime d'abord les alertes non résolues du restaurant, puis on en recrée
 * à partir de l'état actuel (inventaire + prévisions), pour que la liste affiche
 * une alerte par situation (ex. 4 ruptures = 4 alertes).
 */
export async function runAllAlerts(restaurantId: string) {
  logger.log(`[runAllAlerts] Début de la vérification des alertes pour le restaurant ${restaurantId}`)
  await prisma.alert.deleteMany({
    where: { restaurantId, resolved: false },
  })
  await checkInventoryAlerts(restaurantId)
  await checkForecastAlerts(restaurantId)
  await checkStaffingAlerts(restaurantId)
  logger.log(`[runAllAlerts] Fin de la vérification des alertes pour le restaurant ${restaurantId}`)
}

/**
 * Crée des alertes de test pour un restaurant (utile pour le développement)
 * Note: Pour les tests, on crée directement les alertes sans vérifier les doublons
 */
export async function createTestAlerts(restaurantId: string) {
  // Supprimer les anciennes alertes de test pour éviter les doublons
  await prisma.alert.deleteMany({
    where: {
      restaurantId,
      message: {
        contains: 'ALERTE DE TEST',
      },
    },
  })

  // Créer 3 alertes de test avec des types différents pour éviter les conflits
  await prisma.alert.create({
    data: {
      restaurantId,
      type: 'SHORTAGE',
      severity: 'critical',
      message: '⚠️ ALERTE DE TEST - Rupture de stock critique pour Fromage: 0 kg (seuil min: 10 kg)',
      resolved: false,
    },
  })

  await prisma.alert.create({
    data: {
      restaurantId,
      type: 'SHORTAGE',
      severity: 'high',
      message: '⚠️ ALERTE DE TEST - Stock faible pour Tomate: 5 kg (seuil min: 20 kg)',
      resolved: false,
    },
  })

  await prisma.alert.create({
    data: {
      restaurantId,
      type: 'OVERSTOCK',
      severity: 'medium',
      message: '⚠️ ALERTE DE TEST - Surstock détecté pour Pain: 500 unités (seuil max: 200 unités)',
      resolved: false,
    },
  })

  logger.log(`[createTestAlerts] 3 alertes de test créées pour le restaurant ${restaurantId}`)
}
