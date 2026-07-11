import { test, expect } from '@playwright/test'
import { seedApp } from './helpers'

test('empty state renders and a salary produces the correct net income', async ({ page }) => {
  await seedApp(page)
  await page.goto('/#income')

  await page.getByRole('button', { name: 'Add Income', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByRole('textbox', { name: 'Name' }).fill('Salary')
  await dialog.getByRole('spinbutton', { name: /Annual Gross Income/ }).fill('50000')
  await dialog.getByRole('button', { name: 'Add Income', exact: true }).click()

  await page.getByRole('button', { name: 'Summary' }).click()
  // £50,000 employment (2025/26): IT £7,486 + NI £2,994.40 → net £39,519.60 ≈ £39,520
  await expect(page.getByText('£39,520').first()).toBeVisible()
})

test('tab navigation reaches every view', async ({ page }) => {
  await seedApp(page)
  await page.goto('/')

  await page.getByRole('button', { name: 'Expenses' }).click()
  await expect(page.getByRole('heading', { name: 'Expenses' })).toBeVisible()

  await page.getByRole('button', { name: 'Gains' }).click()
  await expect(page.getByRole('heading', { name: 'Capital Gains' })).toBeVisible()

  await page.getByRole('button', { name: 'Settings' }).click()
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()

  await page.getByRole('button', { name: 'Summary' }).click()
  await expect(page.getByRole('heading', { name: /Free UK Tax Calculator/ })).toBeVisible()
})
