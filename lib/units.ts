/**
 * Normalisation et conversion d'unités pour recettes et inventaire.
 * Les quantités sont toujours stockées dans l'unité de l'ingrédient (ex. kg).
 * À la vente, la déduction d'inventaire utilise cette quantité (déjà dans l'unité ingrédient).
 */

const UNIT_ALIASES: Record<string, string> = {
  g: 'g',
  gramme: 'g',
  grammes: 'g',
  gram: 'g',
  grams: 'g',
  kg: 'kg',
  kilogramme: 'kg',
  kilogrammes: 'kg',
  l: 'L',
  litre: 'L',
  litres: 'L',
  liter: 'L',
  liters: 'L',
  ml: 'ml',
  millilitre: 'ml',
  millilitres: 'ml',
  paquet: 'paquet',
  paquets: 'paquet',
  unité: 'unité',
  unite: 'unité',
  unités: 'unité',
  units: 'unité',
  unit: 'unité',
}

export function normalizeUnit(u: string): string {
  const s = u.trim().toLowerCase()
  return UNIT_ALIASES[s] ?? s
}

/**
 * Convertit une quantité d'une unité vers l'unité de l'ingrédient.
 * Retourne null si les unités sont incompatibles (ex. g vs L).
 */
export function convertToIngredientUnit(
  quantity: number,
  fromUnit: string,
  toUnit: string
): number | null {
  const from = normalizeUnit(fromUnit)
  const to = normalizeUnit(toUnit)
  if (from === to) return quantity
  if ((from === 'g' && to === 'kg') || (from === 'kg' && to === 'g')) {
    return from === 'g' ? quantity / 1000 : quantity * 1000
  }
  if ((from === 'ml' && to === 'L') || (from === 'L' && to === 'ml')) {
    return from === 'ml' ? quantity / 1000 : quantity * 1000
  }
  return null
}

/** Unités convertibles entre elles (paires). */
const CONVERTIBLE_GROUPS: [string, string][] = [
  ['g', 'kg'],
  ['ml', 'L'],
]

/**
 * Retourne les unités utilisables pour la saisie (unité de l'ingrédient + unités convertibles).
 */
export function getCompatibleUnits(ingredientUnit: string): string[] {
  const normalized = normalizeUnit(ingredientUnit)
  const result = new Set<string>([normalized])
  for (const [a, b] of CONVERTIBLE_GROUPS) {
    if (normalized === a || normalized === b) {
      result.add(a)
      result.add(b)
    }
  }
  return Array.from(result).sort((x, y) => (x === normalized ? -1 : y === normalized ? 1 : x.localeCompare(y)))
}

/**
 * Quantité en unité recette (pi.unit ou ingredient.unit) → quantité en unité inventaire (ingredient.unit).
 * Utilisé pour la déduction d'inventaire à chaque vente.
 * Si l'unité recette est vide ou absente, on considère que la quantité est déjà dans l'unité de l'ingrédient.
 */
export function recipeQuantityToInventoryUnit(
  quantityNeeded: number,
  recipeUnit: string | null | undefined,
  ingredientUnit: string
): number {
  const effectiveRecipeUnit =
    recipeUnit != null && String(recipeUnit).trim() !== '' ? String(recipeUnit).trim() : null
  const from = normalizeUnit(effectiveRecipeUnit ?? ingredientUnit)
  const to = normalizeUnit(ingredientUnit ?? '')
  if (from === to) return quantityNeeded
  const converted = convertToIngredientUnit(quantityNeeded, from, to)
  return converted ?? quantityNeeded
}
