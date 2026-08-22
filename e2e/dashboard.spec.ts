import { test, expect } from '@playwright/test'

test('dashboard loads for a logged-in user', async ({ page }) => {
  await page.goto('/dashboard')
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
})

test('sidebar navigates to Expenses', async ({ page }) => {
  await page.goto('/dashboard')
  await page.getByRole('link', { name: 'Expenses' }).click()
  await expect(page).toHaveURL(/\/expenses/)
  await expect(page.getByRole('heading', { name: 'Expenses' })).toBeVisible()
})
