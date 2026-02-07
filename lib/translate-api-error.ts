/**
 * Traduit les messages d'erreur API (anglais) en français pour l'affichage dans les toasts.
 * Les messages déjà en français sont renvoyés tels quels.
 */
const API_ERROR_MAP: Record<string, string> = {
  // Auth / organisation
  Unauthorized: 'Non autorisé. Veuillez vous reconnecter.',
  'Unauthorized: Organization required': 'Non autorisé : veuillez sélectionner une organisation.',
  'Organization not found': 'Organisation introuvable.',
  'No organization selected': 'Aucune organisation sélectionnée.',
  'Restaurant not found': 'Restaurant introuvable.',
  'Restaurant required': 'Restaurant requis.',

  // Recommandations
  'Failed to fetch recommendations': 'Impossible de charger les recommandations.',
  'Failed to generate recommendations': 'Échec de la génération des recommandations.',
  'Failed to update recommendation': 'Impossible de mettre à jour la recommandation.',

  // Prévisions
  'Failed to fetch forecasts': 'Impossible de charger les prévisions.',
  'Failed to generate forecasts': 'Échec de la génération des prévisions.',
  'Failed to delete forecast': 'Impossible de supprimer la prévision.',

  // Inventaire
  'Failed to fetch inventory': 'Impossible de charger l\'inventaire.',

  // Ingrédients
  'Failed to fetch ingredients': 'Impossible de charger les ingrédients.',
  'Failed to fetch ingredient': 'Impossible de charger l\'ingrédient.',
  'Failed to create ingredient': 'Impossible de créer l\'ingrédient.',
  'Failed to update ingredient': 'Impossible de modifier l\'ingrédient.',
  'Failed to delete ingredient': 'Impossible de supprimer l\'ingrédient.',
  'Error fetching ingredient': 'Impossible de charger l\'ingrédient.',
  'Error updating ingredient': 'Impossible de modifier l\'ingrédient.',
  'Error deleting ingredient': 'Impossible de supprimer l\'ingrédient.',

  // Ventes
  'Failed to fetch sales': 'Impossible de charger les ventes.',
  'Failed to fetch sale': 'Impossible de charger la vente.',
  'Failed to create sale': 'Impossible de créer la vente.',
  'Failed to update sale': 'Impossible de modifier la vente.',
  'Failed to delete sale': 'Impossible de supprimer la vente.',

  // Produits
  'Failed to fetch products': 'Impossible de charger les produits.',
  'Failed to fetch product': 'Impossible de charger le produit.',
  'Failed to create product': 'Impossible de créer le produit.',
  'Failed to update product': 'Impossible de modifier le produit.',
  'Failed to delete product': 'Impossible de supprimer le produit.',
  'Failed to fetch product ingredients': 'Impossible de charger les ingrédients du produit.',

  // Restaurants
  'Failed to fetch restaurants': 'Impossible de charger les restaurants.',
  'Failed to fetch restaurant': 'Impossible de charger le restaurant.',
  'Failed to create restaurant': 'Impossible de créer le restaurant.',
  'Failed to update restaurant': 'Impossible de modifier le restaurant.',
  'Failed to delete restaurant': 'Impossible de supprimer le restaurant.',

  // Organisation / membres
  'Failed to load organization data': 'Impossible de charger les données de l\'organisation.',
  'Failed to load user data': 'Impossible de charger les données utilisateur.',
  'Failed to load members': 'Impossible de charger les membres.',

  // Alertes
  'Failed to fetch alerts': 'Impossible de charger les alertes.',
  'Failed to generate alerts': 'Échec de la génération des alertes.',
  'Failed to update alert': 'Impossible de mettre à jour l\'alerte.',

  // Générique
  'Unknown error': 'Erreur inconnue.',
  'Too Many Requests': 'Trop de requêtes. Veuillez réessayer plus tard.',
  '429': 'Trop de requêtes. Veuillez réessayer plus tard.',
}

export function translateApiError(message: string | undefined | null): string {
  if (message == null || message === '') return 'Une erreur est survenue.'
  const trimmed = message.trim()
  return API_ERROR_MAP[trimmed] ?? trimmed
}
