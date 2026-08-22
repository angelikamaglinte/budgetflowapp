import { test, expect } from '@playwright/test'

test('add an expense and see it in the list', async ({ page }) => {
  const title = `E2E Test Expense ${Date.now()}`

  await page.goto('/expenses')
  // exact: true — the empty state has its own "Add expense" (lowercase e)
  // shortcut button, which Playwright's default case-insensitive matching
  // would otherwise also match.
  await page.getByRole('button', { name: 'Add Expense', exact: true }).click()

  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Amount ($)').fill('42.50')
  await dialog.getByLabel('Title').fill(title)
  await dialog.getByLabel('Category').selectOption('Software')
  // Scoped to the dialog — its submit button's text is identical to the
  // empty-state button behind it ("Add expense"), so exact alone isn't
  // enough to disambiguate; only the dialog scope can.
  await dialog.getByRole('button', { name: 'Add expense', exact: true }).click()

  const row = page.getByRole('row', { name: new RegExp(title) })
  await expect(row).toBeVisible()

  // Clean up so repeated runs don't pile up test data in the test project.
  await row.getByRole('button').last().click() // trash icon, no accessible label yet
  await page.getByRole('button', { name: 'Delete' }).click() // confirm modal
  await expect(page.getByRole('row', { name: new RegExp(title) })).not.toBeVisible()
})
