'use client'

import { useUserRole } from '@/lib/react-query/hooks/use-user-role'
import { permissions } from '@/lib/roles'

/**
 * Hook pour vérifier les permissions de l'utilisateur connecté
 * Utiliser pour masquer/afficher les boutons selon le rôle
 */
export function usePermissions() {
  const { data: role } = useUserRole()
  const r = role ?? 'admin'

  return {
    role: r,
    canViewDashboard: permissions.canViewDashboard(r),
    canViewRestaurants: permissions.canViewRestaurants(r),
    canCreateRestaurant: permissions.canCreateRestaurant(r),
    canEditRestaurant: permissions.canEditRestaurant(r),
    canDeleteRestaurant: permissions.canDeleteRestaurant(r),
    canViewProducts: permissions.canViewProducts(r),
    canCreateProduct: permissions.canCreateProduct(r),
    canEditProduct: permissions.canEditProduct(r),
    canDeleteProduct: permissions.canDeleteProduct(r),
    canViewIngredients: permissions.canViewIngredients(r),
    canCreateIngredient: permissions.canCreateIngredient(r),
    canEditIngredient: permissions.canEditIngredient(r),
    canDeleteIngredient: permissions.canDeleteIngredient(r),
    canViewSales: permissions.canViewSales(r),
    canCreateSale: permissions.canCreateSale(r),
    canEditSale: permissions.canEditSale(r),
    canDeleteSale: permissions.canDeleteSale(r),
    canViewInventory: permissions.canViewInventory(r),
    canEditInventory: permissions.canEditInventory(r),
    canImportInventory: permissions.canImportInventory(r),
    canViewAlerts: permissions.canViewAlerts(r),
    canResolveAlert: permissions.canResolveAlert(r),
    canViewForecasts: permissions.canViewForecasts(r),
    canGenerateForecast: permissions.canGenerateForecast(r),
    canViewRecommendations: permissions.canViewRecommendations(r),
    canAcceptRecommendation: permissions.canAcceptRecommendation(r),
    canViewReports: permissions.canViewReports(r),
    canGenerateReport: permissions.canGenerateReport(r),
    canViewSettings: permissions.canViewSettings(r),
    canEditSettings: permissions.canEditSettings(r),
    canInviteUsers: permissions.canInviteUsers(r),
  }
}
