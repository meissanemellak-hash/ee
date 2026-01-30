import { z } from 'zod'

/** Une ligne CSV pour l'import de produits (colonnes en français ou anglais) */
export const csvProductRowSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  category: z.string().optional().nullable(),
  unitPrice: z.union([z.string(), z.number()]),
})
