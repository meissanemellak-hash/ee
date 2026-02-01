import { z } from 'zod'

/** Une ligne CSV pour l'import des recettes BOM (produit → ingrédient + quantité + unité optionnelle) */
export const csvBomRowSchema = z.object({
  product: z.string().min(1, 'Le nom du produit est requis'),
  ingredient: z.string().min(1, "Le nom de l'ingrédient est requis"),
  quantity: z.union([z.string(), z.number()]),
  unit: z.string().optional(),
})
