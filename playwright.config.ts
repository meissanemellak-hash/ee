import * as fs from 'fs'
import * as path from 'path'
import { defineConfig, devices } from '@playwright/test'

const staffAuthPath = path.join(__dirname, 'e2e', '.auth', 'staff.json')
const hasStaffAuth = fs.existsSync(staffAuthPath)
const hasStaffCredentials = !!(
  process.env.STAFF_EMAIL &&
  process.env.STAFF_PASSWORD
)

/**
 * Configuration Playwright pour les tests E2E.
 * Ne modifie pas le code applicatif ; les tests s'exécutent contre l'app (dev ou build).
 * - employee-role (local) : si e2e/.auth/staff.json existe (session créée à la main) OU si STAFF_EMAIL + STAFF_PASSWORD sont définis (setup-staff crée la session).
 * - employee-role (CI) : si STAFF_EMAIL et STAFF_PASSWORD (secrets GitHub) sont définis ; setup-staff puis employee-role.
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    actionTimeout: 15_000,
    screenshot: 'only-on-failure',
    video: 'off',
  },
  expect: {
    timeout: 15_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: /employee-role\.spec\.ts|setup-staff\.spec\.ts/,
    },
    ...(hasStaffAuth && !hasStaffCredentials
      ? [
          {
            name: 'employee-role',
            use: {
              ...devices['Desktop Chrome'],
              storageState: staffAuthPath,
            },
            testMatch: /employee-role\.spec\.ts/,
          },
        ]
      : []),
    ...(hasStaffCredentials
      ? [
          {
            name: 'setup-staff',
            use: { ...devices['Desktop Chrome'] },
            testMatch: /setup-staff\.spec\.ts/,
          },
          {
            name: 'employee-role',
            use: {
              ...devices['Desktop Chrome'],
              storageState: staffAuthPath,
            },
            testMatch: /employee-role\.spec\.ts/,
            dependencies: ['setup-staff'],
          },
        ]
      : []),
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    // En CI le serveur Next.js met plus de temps à démarrer (cold start)
    timeout: process.env.CI ? 240_000 : 120_000,
  },
})
