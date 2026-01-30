import { z } from 'zod'

/** Une ligne CSV pour l'import de restaurants (colonnes en français ou anglais) */
export const csvRestaurantRowSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  address: z.string().optional().nullable(),
  timezone: z.string().optional().nullable(),
})
