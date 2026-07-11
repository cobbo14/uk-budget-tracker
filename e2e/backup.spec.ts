import { test, expect } from '@playwright/test'
import { seedApp, baseState } from './helpers'

const salaryState = () => baseState({
  incomeSources: [
    { id: 'job1', name: 'Salary', type: 'employment', grossAmount: 50000 },
  ],
})

test('nudge appears when data exists and no backup was ever taken', async ({ page }) => {
  await seedApp(page, { states: { default: salaryState() } })
  await page.goto('/')

  const nudge = page.getByTestId('backup-nudge')
  await expect(nudge).toBeVisible()
  await expect(nudge).toContainText('no backup yet')
})

test('nudge stays hidden when the last backup is fresh', async ({ page }) => {
  await seedApp(page, {
    states: { default: salaryState() },
    extra: { lastExported: String(Date.now()) },
  })
  await page.goto('/')

  await expect(page.getByRole('heading', { name: /Free UK Tax Calculator/ })).toBeVisible()
  await expect(page.getByTestId('backup-nudge')).toHaveCount(0)
})

test('export downloads a JSON backup and clears the nudge', async ({ page }) => {
  await seedApp(page, { states: { default: salaryState() } })
  await page.goto('/')

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export backup' }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toBe('budget-tracker-export.json')
  await expect(page.getByTestId('backup-nudge')).toHaveCount(0)
})

test('remind me later snoozes the nudge', async ({ page }) => {
  await seedApp(page, { states: { default: salaryState() } })
  await page.goto('/')

  await page.getByRole('button', { name: 'Remind me later' }).click()
  await expect(page.getByTestId('backup-nudge')).toHaveCount(0)
})

test('persistent storage is requested after a save with data', async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as unknown as { __persistCalls: number }
    w.__persistCalls = 0
    if (navigator.storage) {
      navigator.storage.persisted = () => Promise.resolve(false)
      navigator.storage.persist = () => {
        w.__persistCalls++
        return Promise.resolve(true)
      }
    }
  })
  await seedApp(page, { states: { default: salaryState() } })
  await page.goto('/#gains')

  // Any settings tweak triggers the debounced save, which asks for
  // persistent storage because the profile has data
  await page.getByRole('spinbutton', { name: /Carried-forward capital losses/ }).fill('100')
  await page.waitForTimeout(700)
  const calls = await page.evaluate(() => (window as unknown as { __persistCalls: number }).__persistCalls)
  expect(calls).toBeGreaterThanOrEqual(1)
})
