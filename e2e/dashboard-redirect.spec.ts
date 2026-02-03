import { test, expect } from '@playwright/test'

test.describe('Protection des routes dashboard', () => {
  test('dashboard redirige vers sign-in si non connecté', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'load' })
    await expect(page).toHaveURL(/\/sign-in/)
  })

  test('sales redirige vers sign-in si non connecté', async ({ page }) => {
    await page.goto('/dashboard/sales', { waitUntil: 'load' })
    await expect(page).toHaveURL(/\/sign-in/)
  })

  test('products redirige vers sign-in si non connecté', async ({ page }) => {
    await page.goto('/dashboard/products', { waitUntil: 'load' })
    await expect(page).toHaveURL(/\/sign-in/)
  })
})
