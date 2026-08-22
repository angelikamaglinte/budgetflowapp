import { test, expect } from '@playwright/test'

test('import an expense from a CSV file', async ({ page }) => {
  const description = `E2E Import Vendor ${Date.now()}`
  const amount = ((Date.now() % 900) + 10).toFixed(2)
  const csv = `Date,Description,Amount\n2026-08-01,${description},${amount}\n`

  await page.goto('/expenses')
  await page.getByRole('button', { name: 'Import CSV', exact: true }).click()

  const dialog = page.getByRole('dialog')
  await dialog.locator('input[type="file"]').setInputFiles({
    name: 'test-import.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(csv),
  })

  // Column mapping is auto-detected from the header names, so the button is
  // enabled immediately — no manual column selection needed for this file.
  await dialog.getByRole('button', { name: 'Continue to Review', exact: true }).click()

  await expect(dialog.getByText(description)).toBeVisible()
  await dialog.getByRole('button', { name: /^Import \d+ Expense/ }).click()

  await expect(dialog).not.toBeVisible()

  const row = page.getByRole('row', { name: new RegExp(description) })
  await expect(row).toBeVisible()

  // Clean up so repeated runs don't pile up test data in the test project.
  await row.getByRole('button').last().click() // trash icon, no accessible label yet
  await page.getByRole('button', { name: 'Delete' }).click() // confirm modal
  await expect(page.getByRole('row', { name: new RegExp(description) })).not.toBeVisible()
})
