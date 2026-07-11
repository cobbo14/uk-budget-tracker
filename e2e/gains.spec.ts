import { test, expect } from '@playwright/test'
import { seedApp, baseState } from './helpers'

// Locks in the cross-category in-year loss netting fix:
// non-BADR net −£5,000 offsets the £10,000 BADR gain → £5,000, minus the
// £3,000 AEA → £2,000 taxable at the 14% BADR rate = £280
test('in-year loss nets against BADR gain before the AEA', async ({ page }) => {
  await seedApp(page, {
    states: {
      default: baseState({
        incomeSources: [
          { id: 'job1', name: 'Salary', type: 'employment', grossAmount: 50000 },
        ],
        gainSources: [
          { id: 'g1', name: 'Loss sale', gainAmount: 0, allowableCosts: 5000, isResidentialProperty: false, isBADR: false },
          { id: 'g2', name: 'Business sale', gainAmount: 10000, allowableCosts: 0, isResidentialProperty: false, isBADR: true },
        ],
      }),
    },
  })
  await page.goto('/#gains')

  await expect(page.getByText('Total gains: £5,000 · CGT due: £280')).toBeVisible()
})
