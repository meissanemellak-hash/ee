/**
 * Convertit une quantité de la recette vers l'unité de l'ingrédient (unité d'inventaire).
 * L'inventaire est toujours stocké dans l'unité de l'ingrédient (ex. kg au fournisseur).
 * La recette peut être saisie dans une autre unité (ex. g).
 */
export function convertQuantityToIngredientUnit(
  quantity: number,
  recipeUnit: string | null | undefined,
  ingredientUnit: string
): number {
  const recipe = (recipeUnit ?? ingredientUnit).trim().toLowerCase()
  const ingredient = ingredientUnit.trim().toLowerCase()

  if (recipe === ingredient) return quantity

  // Masse: g <-> kg
  if (recipe === 'g' && (ingredient === 'kg' || ingredient === 'kilogramme' || ingredient === 'kilogrammes'))
    return quantity / 1000
  if ((recipe === 'kg' || recipe === 'kilogramme' || recipe === 'kilogrammes') && ingredient === 'g')
    return quantity * 1000

  // Volume: ml <-> L
  if (recipe === 'ml' && (ingredient === 'l' || ingredient === 'litre' || ingredient === 'litres'))
    return quantity / 1000
  if ((recipe === 'l' || recipe === 'litre' || recipe === 'litres') && ingredient === 'ml')
    return quantity * 1000

  // Même famille non reconnue ou unités identiques déjà gérées : pas de conversion
  return quantity
}
