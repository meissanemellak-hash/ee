export type AlertType = 'OVERSTOCK' | 'SHORTAGE' | 'OVERSTAFFING' | 'UNDERSTAFFING' | 'OTHER'
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical'
export type RecommendationType = 'ORDER' | 'STAFFING'
export type RecommendationPriority = 'low' | 'medium' | 'high'
export type RecommendationStatus = 'pending' | 'accepted' | 'dismissed'
export type ForecastMethod = 'moving_average' | 'seasonality' | 'trend'

export interface OrderRecommendation {
  ingredientId: string
  ingredientName: string
  currentStock: number
  recommendedQuantity: number
  unit: string
  estimatedCost: number
  reason: string
}

export interface StaffingRecommendation {
  date: string
  timeSlot: string // "12:00-14:00"
  recommendedStaff: number
  currentStaff?: number
  reason: string
  expectedSales: number
}

export interface SalesAnalysis {
  totalSales: number
  totalRevenue: number
  averagePerDay: number
  topProducts: Array<{
    productId: string
    productName: string
    quantity: number
    revenue: number
  }>
  salesByHour: Array<{
    hour: number
    quantity: number
    revenue: number
  }>
  salesByDay: Array<{
    date: string
    quantity: number
    revenue: number
  }>
}
