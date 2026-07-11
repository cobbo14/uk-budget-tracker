import { test, expect } from '@playwright/test'
import { seedApp, baseState } from './helpers'

// Locks in the What-If gains fix: with a capital gain present and no
// adjustments, the scenario column must equal the current column (both
// including CGT). £50k salary + £20k gain (2025/26):
// IT £7,486 + NI £2,994.40 + CGT £4,063.80 (£270 @ 18% + £16,730 @ 24%
// on £17,000 taxable) = £14,544.20 ≈ £14,544
test('What-If scenario includes capital gains tax', async ({ page }) => {
  await seedApp(page, {
    states: {
      default: baseState({
        incomeSources: [
          { id: 'job1', name: 'Salary', type: 'employment', grossAmount: 50000 },
        ],
        gainSources: [
          { id: 'g1', name: 'Shares', gainAmount: 20000, allowableCosts: 0, isResidentialProperty: false, isBADR: false },
        ],
      }),
    },
  })
  await page.goto('/#planning')

  await expect(page.getByRole('heading', { name: 'What-If Calculator' })).toBeVisible()
  const rows = await page.evaluate(() => {
    const text = document.body.innerText
    const section = text.slice(text.indexOf('What-If'))
    const m = section.match(/Total Tax\n(£[\d,]+)\n(£[\d,]+)/)
    return m ? { current: m[1], scenario: m[2] } : null
  })
  expect(rows).not.toBeNull()
  expect(rows!.current).toBe('£14,544')
  expect(rows!.scenario).toBe('£14,544')
})
