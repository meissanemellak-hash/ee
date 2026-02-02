/**
 * Définition des rôles et permissions
 * Étape 1 : Configuration seule, aucune intégration dans le code existant
 */

export type Role = 'admin' | 'manager' | 'staff'

export type Permission =
  | 'dashboard:view'
  | 'restaurants:view'
  | 'restaurants:create'
  | 'restaurants:edit'
  | 'restaurants:delete'
  | 'products:view'
  | 'products:create'
  | 'products:edit'
  | 'products:delete'
  | 'ingredients:view'
  | 'ingredients:create'
  | 'ingredients:edit'
  | 'ingredients:delete'
  | 'sales:view'
  | 'sales:create'
  | 'sales:edit'
  | 'sales:delete'
  | 'sales:import'
  | 'inventory:view'
  | 'inventory:edit'
  | 'inventory:import'
  | 'alerts:view'
  | 'alerts:resolve'
  | 'forecasts:view'
  | 'forecasts:generate'
  | 'recommendations:view'
  | 'recommendations:accept'
  | 'reports:view'
  | 'reports:generate'
  | 'settings:view'
  | 'settings:edit'
  | 'organizations:update'
  | 'users:invite'

/** Permissions par rôle */
const PERMISSIONS_BY_ROLE: Record<Role, Permission[]> = {
  admin: [
    'dashboard:view',
    'restaurants:view',
    'restaurants:create',
    'restaurants:edit',
    'restaurants:delete',
    'products:view',
    'products:create',
    'products:edit',
    'products:delete',
    'ingredients:view',
    'ingredients:create',
    'ingredients:edit',
    'ingredients:delete',
    'sales:view',
    'sales:create',
    'sales:edit',
    'sales:delete',
    'sales:import',
    'inventory:view',
    'inventory:edit',
    'inventory:import',
    'alerts:view',
    'alerts:resolve',
    'forecasts:view',
    'forecasts:generate',
    'recommendations:view',
    'recommendations:accept',
    'reports:view',
    'reports:generate',
    'settings:view',
    'settings:edit',
    'organizations:update',
    'users:invite',
  ],
  manager: [
    'dashboard:view',
    'restaurants:view',
    'restaurants:create',
    'restaurants:edit',
    'products:view',
    'products:create',
    'products:edit',
    'products:delete',
    'ingredients:view',
    'ingredients:create',
    'ingredients:edit',
    'ingredients:delete',
    'sales:view',
    'sales:create',
    'sales:edit',
    'sales:delete',
    'sales:import',
    'inventory:view',
    'inventory:edit',
    'inventory:import',
    'alerts:view',
    'alerts:resolve',
    'forecasts:view',
    'forecasts:generate',
    'recommendations:view',
    'recommendations:accept',
    'reports:view',
    'reports:generate',
    'settings:view',
  ],
  staff: [
    'dashboard:view',
    'restaurants:view',
    'products:view',
    'ingredients:view',
    'sales:view',
    'sales:create',
    'inventory:view',
    'alerts:view',
    'forecasts:view',
    'recommendations:view',
    'reports:view',
  ],
}

/**
 * Vérifie si un rôle a une permission
 */
export function can(role: Role | undefined, permission: Permission): boolean {
  if (!role) return false
  const permissions = PERMISSIONS_BY_ROLE[role]
  if (!permissions) return false
  return permissions.includes(permission)
}

/** Helpers pour les contrôles courants */
export const permissions = {
  canViewDashboard: (role: Role | undefined) => can(role, 'dashboard:view'),
  canViewRestaurants: (role: Role | undefined) => can(role, 'restaurants:view'),
  canCreateRestaurant: (role: Role | undefined) => can(role, 'restaurants:create'),
  canEditRestaurant: (role: Role | undefined) => can(role, 'restaurants:edit'),
  canDeleteRestaurant: (role: Role | undefined) => can(role, 'restaurants:delete'),
  canViewProducts: (role: Role | undefined) => can(role, 'products:view'),
  canCreateProduct: (role: Role | undefined) => can(role, 'products:create'),
  canEditProduct: (role: Role | undefined) => can(role, 'products:edit'),
  canDeleteProduct: (role: Role | undefined) => can(role, 'products:delete'),
  canViewIngredients: (role: Role | undefined) => can(role, 'ingredients:view'),
  canCreateIngredient: (role: Role | undefined) => can(role, 'ingredients:create'),
  canEditIngredient: (role: Role | undefined) => can(role, 'ingredients:edit'),
  canDeleteIngredient: (role: Role | undefined) => can(role, 'ingredients:delete'),
  canViewSales: (role: Role | undefined) => can(role, 'sales:view'),
  canCreateSale: (role: Role | undefined) => can(role, 'sales:create'),
  canEditSale: (role: Role | undefined) => can(role, 'sales:edit'),
  canDeleteSale: (role: Role | undefined) => can(role, 'sales:delete'),
  canImportSales: (role: Role | undefined) => can(role, 'sales:import'),
  canViewInventory: (role: Role | undefined) => can(role, 'inventory:view'),
  canEditInventory: (role: Role | undefined) => can(role, 'inventory:edit'),
  canImportInventory: (role: Role | undefined) => can(role, 'inventory:import'),
  canViewAlerts: (role: Role | undefined) => can(role, 'alerts:view'),
  canResolveAlert: (role: Role | undefined) => can(role, 'alerts:resolve'),
  canViewForecasts: (role: Role | undefined) => can(role, 'forecasts:view'),
  canGenerateForecast: (role: Role | undefined) => can(role, 'forecasts:generate'),
  canViewRecommendations: (role: Role | undefined) => can(role, 'recommendations:view'),
  canAcceptRecommendation: (role: Role | undefined) => can(role, 'recommendations:accept'),
  canViewReports: (role: Role | undefined) => can(role, 'reports:view'),
  canGenerateReport: (role: Role | undefined) => can(role, 'reports:generate'),
  canViewSettings: (role: Role | undefined) => can(role, 'settings:view'),
  canEditSettings: (role: Role | undefined) => can(role, 'settings:edit'),
  canUpdateOrganization: (role: Role | undefined) => can(role, 'organizations:update'),
  canInviteUsers: (role: Role | undefined) => can(role, 'users:invite'),
}

export const ROLES: Role[] = ['admin', 'manager', 'staff']
