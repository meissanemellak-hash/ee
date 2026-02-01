import { z } from 'zod'

/** Une ligne CSV pour l'import d'inventaire (ingrédient + stock + seuils) */
export const csvInventoryRowSchema = z.object({
  ingredient: z.string().min(1, "Le nom de l'ingrédient est requis"),
  currentStock: z.union([z.string(), z.number()]),
  minThreshold: z.union([z.string(), z.number()]),
  maxThreshold: z.union([z.string(), z.number()]).optional().nullable(),
})
