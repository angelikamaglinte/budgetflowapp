import { test as setup, expect } from '@playwright/test'

const authFile = 'e2e/.auth/user.json'

// Runs once before the rest of the suite (see the "setup" project in
// playwright.config.ts) and saves the logged-in session so every other
// test starts already authenticated, instead of re-logging in each time.
setup('authenticate', async ({ page }) => {
  const email = process.env.TEST_USER_EMAIL
  const password = process.env.TEST_USER_PASSWORD
  if (!email || !password) {
    throw new Error(
      'Missing TEST_USER_EMAIL / TEST_USER_PASSWORD. Set them in .env.test — see e2e/README.md.'
    )
  }

  await page.goto('/login')
  await page.getByPlaceholder('you@example.com').fill(email)
  await page.getByPlaceholder('••••••••').fill(password)
  await page.getByRole('button', { name: 'Sign in' }).click()

  // A fresh/free-tier Supabase project can be slow on its first real
  // request, so give this more room than Playwright's 5s default.
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 })
  await page.context().storageState({ path: authFile })
})
