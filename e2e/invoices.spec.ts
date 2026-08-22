import { test, expect } from '@playwright/test'

test('create an invoice and see it in the list', async ({ page }) => {
  const clientName = `E2E Test Client ${Date.now()}`

  await page.goto('/invoices')
  await page.getByRole('button', { name: 'New Invoice', exact: true }).click()

  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Client Name').fill(clientName)
  await dialog.getByLabel('Amount ($)').fill('250')
  await dialog.getByRole('button', { name: 'Create invoice', exact: true }).click()

  const row = page.getByRole('row', { name: new RegExp(clientName) })
  await expect(row).toBeVisible()
  await expect(row.getByText('pending')).toBeVisible()

  // Clean up so repeated runs don't pile up test data in the test project.
  await row.getByRole('button').last().click() // trash icon, no accessible label yet
  await page.getByRole('button', { name: 'Delete' }).click() // confirm modal
  await expect(page.getByRole('row', { name: new RegExp(clientName) })).not.toBeVisible()
})

test('mark an invoice paid', async ({ page }) => {
  const clientName = `E2E Paid Client ${Date.now()}`

  await page.goto('/invoices')
  await page.getByRole('button', { name: 'New Invoice', exact: true }).click()

  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Client Name').fill(clientName)
  await dialog.getByLabel('Amount ($)').fill('500')
  await dialog.getByRole('button', { name: 'Create invoice', exact: true }).click()

  const row = page.getByRole('row', { name: new RegExp(clientName) })
  await expect(row).toBeVisible()

  // The "title" attribute is this icon-only button's accessible name.
  await row.getByRole('button', { name: 'Mark as paid' }).click()

  // Marking paid opens the transfer checklist modal — close it to get back to the table.
  await page.getByRole('button', { name: 'Got it' }).click()

  await expect(row.getByText('paid', { exact: true })).toBeVisible()

  // Clean up.
  await row.getByRole('button').last().click()
  await page.getByRole('button', { name: 'Delete' }).click()
  await expect(page.getByRole('row', { name: new RegExp(clientName) })).not.toBeVisible()
})
