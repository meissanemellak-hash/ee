import { z } from 'zod'

/** Une ligne CSV pour l'import d'ingrédients (colonnes en français ou anglais) */
export const csvIngredientRowSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  unit: z.string().min(1, "L'unité est requise"),
  costPerUnit: z.union([z.string(), z.number()]),
  packSize: z.union([z.string(), z.number()]).optional().nullable(),
  supplierName: z.string().optional().nullable(),
})
