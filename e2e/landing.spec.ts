import { test, expect } from '@playwright/test'

test.describe('Page d\'accueil', () => {
  test('affiche le header et le lien Se connecter', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load', timeout: 30_000 })
    await page.getByRole('link', { name: /Se connecter/i }).first().waitFor({ state: 'visible', timeout: 15_000 })
    await expect(page.getByText('AI Operations').first()).toBeVisible()
  })

  test('le lien Se connecter mène vers /sign-in', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load', timeout: 30_000 })
    await page.getByRole('link', { name: /Se connecter/i }).first().waitFor({ state: 'visible', timeout: 15_000 })
    await page.getByRole('link', { name: /Se connecter/i }).first().click()
    await expect(page).toHaveURL(/\/sign-in/)
  })

  test('affiche le titre hero', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load', timeout: 30_000 })
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Pilotez|plate-forme/i)
  })
})
