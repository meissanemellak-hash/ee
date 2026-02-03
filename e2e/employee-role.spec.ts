/**
 * Tests E2E rôle employé (staff).
 * S'exécutent uniquement avec une session staff sauvegardée dans e2e/.auth/staff.json.
 * Vérifient que les actions réservées aux managers/admins sont invisibles ou bloquées.
 *
 * Pour créer staff.json : connectez-vous en tant qu'employé, puis sauvegardez le state
 * (voir e2e/README.md).
 */
import { test, expect } from '@playwright/test'

test.describe('Rôle employé – restrictions UI', () => {
  test('page Restaurants : pas de bouton "Ajouter un restaurant"', async ({ page }) => {
    await page.goto('/dashboard/restaurants')
    await expect(page).toHaveURL(/\/dashboard\/restaurants/)
    await expect(page.getByRole('button', { name: /Ajouter un restaurant/ })).toHaveCount(0)
  })

  test('page Import ingrédients : accès refusé', async ({ page }) => {
    await page.goto('/dashboard/ingredients/import')
    await expect(page).toHaveURL(/\/dashboard\/ingredients\/import/)
    await expect(page.getByText(/Vous n'avez pas accès|import est réservé/i)).toBeVisible()
  })

  test('page Import restaurants : accès refusé', async ({ page }) => {
    await page.goto('/dashboard/restaurants/import')
    await expect(page).toHaveURL(/\/dashboard\/restaurants\/import/)
    await expect(page.getByText(/Vous n'avez pas accès|import est réservé/i)).toBeVisible()
  })

  test('page Import ventes : accès refusé', async ({ page }) => {
    await page.goto('/dashboard/sales/import')
    await expect(page).toHaveURL(/\/dashboard\/sales\/import/)
    await expect(page.getByText(/Vous n'avez pas accès|import est réservé/i)).toBeVisible()
  })

  test('page Import produits : accès refusé', async ({ page }) => {
    await page.goto('/dashboard/products/import')
    await expect(page).toHaveURL(/\/dashboard\/products\/import/)
    await expect(page.getByText(/Vous n'avez pas accès|import est réservé/i)).toBeVisible()
  })

  test('page Paramètres (accès direct) : accès refusé', async ({ page }) => {
    await page.goto('/dashboard/settings')
    await expect(page).toHaveURL(/\/dashboard\/settings/)
    await expect(
      page.getByText(/Vous n'avez pas accès|paramètres|administrateurs et managers/i)
    ).toBeVisible()
  })

  test('page Import inventaire (accès direct) : accès refusé', async ({ page }) => {
    await page.goto('/dashboard/restaurants')
    await expect(page).toHaveURL(/\/dashboard\/restaurants/)
    const links = await page.getByRole('link').all()
    let restaurantId: string | null = null
    for (const link of links) {
      const href = await link.getAttribute('href')
      if (href && /^\/dashboard\/restaurants\/[^/]+\/?$/.test(href)) {
        restaurantId = href.split('/').filter(Boolean)[2] ?? null
        break
      }
    }
    if (!restaurantId) {
      test.skip()
      return
    }
    await page.goto(`/dashboard/restaurants/${restaurantId}/inventory/import`)
    await expect(page).toHaveURL(new RegExp(`/dashboard/restaurants/${restaurantId}/inventory/import`))
    await expect(page.getByText(/Vous n'avez pas accès|import est réservé/i)).toBeVisible()
  })
})
