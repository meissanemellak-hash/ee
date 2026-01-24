import { z } from 'zod'

export const saleSchema = z.object({
  restaurantId: z.string(),
  productId: z.string(),
  quantity: z.number().positive(),
  amount: z.number().positive(),
  saleDate: z.string().or(z.date()),
  saleHour: z.number().int().min(0).max(23),
})

export const csvSaleRowSchema = z.object({
  restaurant: z.string(),
  product: z.string(),
  quantity: z.string().or(z.number()),
  amount: z.string().or(z.number()),
  date: z.string(),
  hour: z.string().or(z.number()),
})

export const importSalesSchema = z.object({
  restaurantId: z.string(),
  sales: z.array(saleSchema),
})
