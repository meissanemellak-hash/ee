import { test, expect } from '@playwright/test'

test.describe('Authentification', () => {
  test('la page sign-in se charge', async ({ page }) => {
    await page.goto('/sign-in', { waitUntil: 'domcontentloaded' })
    await expect(page).toHaveURL(/\/sign-in/)
    await expect(page.locator('body')).toBeVisible()
  })

  test('accès à /dashboard sans auth redirige vers sign-in', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'load' })
    await expect(page).toHaveURL(/\/sign-in/)
  })
})
