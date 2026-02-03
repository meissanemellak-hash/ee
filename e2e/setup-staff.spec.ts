/**
 * Setup pour les tests rôle employé en CI.
 * S'exécute uniquement quand STAFF_EMAIL et STAFF_PASSWORD sont définis (ex. secrets GitHub).
 * Se connecte avec ce compte (doit avoir le rôle "staff" dans Clerk), attend le dashboard,
 * puis sauvegarde la session dans e2e/.auth/staff.json pour le projet employee-role.
 */
import * as fs from 'fs'
import * as path from 'path'
import { test, expect } from '@playwright/test'

test.describe.configure({ mode: 'serial' })

test('crée la session staff pour les tests employé', async ({ page }) => {
  const email = process.env.STAFF_EMAIL
  const password = process.env.STAFF_PASSWORD
  if (!email || !password) {
    test.skip()
    return
  }

  await page.goto('/sign-in', { waitUntil: 'load', timeout: 15_000 })

  // Clerk : champs email et mot de passe (libellés possibles : Email, E-mail, Mot de passe, Password)
  const emailInput = page.getByRole('textbox', { name: /email|e-mail|mail|adresse/i }).first()
  await emailInput.waitFor({ state: 'visible', timeout: 10_000 })
  await emailInput.fill(email)

  const passwordInput = page.locator('input[type="password"]').first()
  await passwordInput.waitFor({ state: 'visible', timeout: 5_000 })
  await passwordInput.fill(password)

  // Ne pas cliquer sur "Continuer avec Google" : prendre le bouton du formulaire email/mot de passe uniquement
  const allSubmitButtons = page.getByRole('button', { name: /sign in|se connecter|connexion|continue/i })
  const notGoogle = allSubmitButtons.filter({ hasNot: page.getByText('Google') })
  const submitButton = (await notGoogle.count()) > 0 ? notGoogle.first() : allSubmitButtons.last()
  await submitButton.click()

  // Attendre la redirection vers le dashboard (Clerk peut prendre quelques secondes)
  await page.waitForURL(/\/dashboard/, { timeout: 25_000 }).catch(async () => {
    const currentUrl = page.url()
    if (currentUrl.includes('/sign-in#/factor-one') || currentUrl.includes('/sign-in')) {
      throw new Error(
        'Après connexion, la page est restée sur sign-in (#/factor-one). ' +
        'Vérifiez dans Clerk : 1) Redirect URL après connexion = http://localhost:3000/dashboard (ou votre URL). ' +
        '2) Désactiver MFA / vérification supplémentaire pour le compte de test, ou utiliser un compte sans MFA.'
      )
    }
    throw new Error(`URL inattendue après connexion : ${currentUrl}`)
  })

  const authDir = path.join(process.cwd(), 'e2e', '.auth')
  fs.mkdirSync(authDir, { recursive: true })
  await page.context().storageState({ path: path.join(authDir, 'staff.json') })
})
