import { test, expect } from '@playwright/test'
import { seedApp, baseState, readProfileState, type SeedProfile } from './helpers'

const PROFILES: SeedProfile[] = [
  { id: 'default', name: 'Me' },
  { id: 'partner', name: 'Partner' },
]

/** A 50/50 split already established: origin expense + synced partner copy */
function splitStates() {
  return {
    default: baseState({
      expenses: [{
        id: 'exp1', name: 'Rent', category: 'housing', amount: 1000, frequency: 'monthly',
        splitGroupId: 'grp1', splitPercentage: 50, splitOriginProfileId: 'default',
        splitConfig: [
          { profileId: 'default', percentage: 50 },
          { profileId: 'partner', percentage: 50 },
        ],
      }],
    }),
    partner: baseState({
      expenses: [{
        id: 'exp2', name: 'Rent', category: 'housing', amount: 1000, frequency: 'monthly',
        splitGroupId: 'grp1', splitPercentage: 50, splitOriginProfileId: 'default',
      }],
    }),
  }
}

type Expense = {
  splitGroupId?: string
  splitPercentage?: number
  splitOriginProfileId?: string
  splitConfig?: { profileId: string; percentage: number }[]
}

test('creating a split syncs a copy into the partner profile', async ({ page }) => {
  await seedApp(page, { profiles: PROFILES })
  await page.goto('/#expenses')

  await page.getByRole('button', { name: 'Add Expense' }).first().click()
  const dialog = page.getByRole('dialog')
  await dialog.getByRole('textbox', { name: 'Name' }).fill('Rent')
  await dialog.getByRole('spinbutton', { name: 'Amount (£)' }).fill('1000')
  await dialog.getByRole('switch', { name: 'Split across profiles' }).click()
  await dialog.getByRole('button', { name: 'Add Expense' }).click()

  const partner = await readProfileState(page, 'partner')
  const copy = (partner!.expenses as Expense[])[0]
  expect(copy.splitGroupId).toBeTruthy()
  expect(copy.splitPercentage).toBe(50)
  expect(copy.splitOriginProfileId).toBe('default')
  expect(copy.splitConfig).toBeUndefined()
})

test('toggling the split off removes the partner copy', async ({ page }) => {
  await seedApp(page, { profiles: PROFILES, states: splitStates() })
  await page.goto('/#expenses')

  await page.locator('[aria-label="Edit Rent"]').click()
  await page.locator('#split-toggle').click()
  await page.getByRole('button', { name: 'Save Changes' }).click()

  const partner = await readProfileState(page, 'partner')
  expect(partner!.expenses).toHaveLength(0)
  const me = await readProfileState(page, 'default')
  expect((me!.expenses as Expense[])[0].splitGroupId).toBeUndefined()
})

test('partner opting out removes them from the origin split config', async ({ page }) => {
  await seedApp(page, { profiles: PROFILES, states: splitStates(), activeProfileId: 'partner' })
  await page.goto('/#expenses')

  await page.locator('[aria-label="Delete Rent"]').click()
  await page.getByRole('button', { name: 'Remove from this profile only' }).click()

  const me = await readProfileState(page, 'default')
  expect((me!.expenses as Expense[])[0].splitConfig).toEqual([
    { profileId: 'default', percentage: 50 },
  ])
  const partner = await readProfileState(page, 'partner')
  expect(partner!.expenses).toHaveLength(0)
})

test('undo after "delete from all profiles" restores the partner copy', async ({ page }) => {
  await seedApp(page, { profiles: PROFILES, states: splitStates() })
  await page.goto('/#expenses')

  await page.locator('[aria-label="Delete Rent"]').click()
  await page.getByRole('button', { name: 'Delete from all profiles' }).click()
  let partner = await readProfileState(page, 'partner')
  expect(partner!.expenses).toHaveLength(0)

  await page.getByRole('button', { name: 'Undo', exact: true }).click()
  partner = await readProfileState(page, 'partner')
  expect(partner!.expenses).toHaveLength(1)
  expect((partner!.expenses as Expense[])[0].splitGroupId).toBe('grp1')
  const me = await readProfileState(page, 'default')
  expect(me!.expenses).toHaveLength(1)
})

test('undo after toggling a split off restores the partner copy', async ({ page }) => {
  await seedApp(page, { profiles: PROFILES, states: splitStates() })
  await page.goto('/#expenses')

  await page.locator('[aria-label="Edit Rent"]').click()
  await page.locator('#split-toggle').click()
  await page.getByRole('button', { name: 'Save Changes' }).click()
  let partner = await readProfileState(page, 'partner')
  expect(partner!.expenses).toHaveLength(0)

  await page.getByRole('button', { name: 'Undo', exact: true }).click()
  partner = await readProfileState(page, 'partner')
  expect(partner!.expenses).toHaveLength(1)
  expect((partner!.expenses as Expense[])[0].splitPercentage).toBe(50)
})

test('origin removing only its copy detaches the partner copy', async ({ page }) => {
  await seedApp(page, { profiles: PROFILES, states: splitStates() })
  await page.goto('/#expenses')

  await page.locator('[aria-label="Delete Rent"]').click()
  await page.getByRole('button', { name: 'Remove from this profile only' }).click()

  const me = await readProfileState(page, 'default')
  expect(me!.expenses).toHaveLength(0)
  const partner = await readProfileState(page, 'partner')
  const copy = (partner!.expenses as Expense[])[0]
  expect(copy.splitGroupId).toBeUndefined()
  expect(copy.splitOriginProfileId).toBeUndefined()
  expect(copy.splitPercentage).toBe(50)
})
