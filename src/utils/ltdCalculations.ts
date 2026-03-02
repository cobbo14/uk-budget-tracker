import type { AppSettings } from '@/types'
import type { TaxRules } from '@/taxRules/types'
import { calculateTax } from './taxCalculations'

// Corporation tax rates (2023+ small profits regime)
const CORP_TAX_SMALL_RATE = 0.19       // ≤ £50,000 profit
const CORP_TAX_MAIN_RATE = 0.25        // ≥ £250,000 profit
const CORP_TAX_SMALL_LIMIT = 50_000
const CORP_TAX_MAIN_LIMIT = 250_000

// Employer NI (2025-26: secondary threshold £5,000 at 15%)
const EMPLOYER_NI_THRESHOLD = 5_000
const EMPLOYER_NI_RATE = 0.15

export interface LtdScenario {
  salary: number
  corpTax: number
  employerNI: number
  employeeNI: number
  salaryIncomeTax: number
  dividendTax: number
  totalTax: number
  netTakeHome: number
  dividendExtracted: number
}

export interface SoleTraderScenario {
  incomeTax: number
  class4NI: number
  class2NI: number
  totalTax: number
  netTakeHome: number
}

export function calculateCorpTax(profit: number): number {
  if (profit <= 0) return 0
  if (profit <= CORP_TAX_SMALL_LIMIT) {
    return profit * CORP_TAX_SMALL_RATE
  }
  if (profit >= CORP_TAX_MAIN_LIMIT) {
    return profit * CORP_TAX_MAIN_RATE
  }
  // Marginal relief between £50k and £250k
  const mainRateTax = profit * CORP_TAX_MAIN_RATE
  const marginalRelief = (CORP_TAX_MAIN_LIMIT - profit) * ((CORP_TAX_MAIN_RATE - CORP_TAX_SMALL_RATE) * CORP_TAX_MAIN_LIMIT / (CORP_TAX_MAIN_LIMIT - CORP_TAX_SMALL_LIMIT))
  return Math.max(0, mainRateTax - marginalRelief)
}

export function calculateLtdScenario(
  profit: number,
  salary: number,
  settings: AppSettings,
  rules: TaxRules,
): LtdScenario {
  const clampedSalary = Math.max(0, Math.min(salary, profit))

  // Employer NI on salary above secondary threshold
  const employerNI = Math.max(0, clampedSalary - EMPLOYER_NI_THRESHOLD) * EMPLOYER_NI_RATE

  // Company profit after paying salary and employer NI
  const companyProfitAfterCosts = Math.max(0, profit - clampedSalary - employerNI)

  // Corporation tax on remaining company profit
  const corpTax = calculateCorpTax(companyProfitAfterCosts)

  // Post-corp-tax profit available as dividends
  const dividendExtracted = Math.max(0, companyProfitAfterCosts - corpTax)

  // Personal tax: director draws salary + dividends
  // Use the user's personal settings (Scottish taxpayer, student loan, etc.)
  // but strip out pension contributions for a clean structural comparison
  const personalSettings: AppSettings = {
    ...settings,
    pensionContributionType: 'none',
    pensionContributionValue: 0,
    employerPensionContributionType: 'flat',
    employerPensionContributionValue: 0,
    giftAidDonations: 0,
  }

  const incomeSources = [
    {
      id: 'ltd-salary',
      name: 'Director Salary',
      type: 'employment' as const,
      grossAmount: clampedSalary,
    },
    {
      id: 'ltd-dividend',
      name: 'Director Dividend',
      type: 'dividend' as const,
      grossAmount: dividendExtracted,
    },
  ]

  const personal = calculateTax(incomeSources, personalSettings, rules)
  const employeeNI = personal.class1NI
  const salaryIncomeTax = personal.incomeTax
  const dividendTax = personal.dividendTax

  const totalTax = corpTax + employerNI + employeeNI + salaryIncomeTax + dividendTax
  const netTakeHome = profit - totalTax

  return {
    salary: clampedSalary,
    corpTax,
    employerNI,
    employeeNI,
    salaryIncomeTax,
    dividendTax,
    totalTax,
    netTakeHome,
    dividendExtracted,
  }
}

export function calculateSoleTraderScenario(
  profit: number,
  settings: AppSettings,
  rules: TaxRules,
): SoleTraderScenario {
  // Strip pension/gift aid for a clean structural comparison
  const cleanSettings: AppSettings = {
    ...settings,
    pensionContributionType: 'none',
    pensionContributionValue: 0,
    employerPensionContributionType: 'flat',
    employerPensionContributionValue: 0,
    giftAidDonations: 0,
  }

  const incomeSources = [
    {
      id: 'se-profit',
      name: 'Self-Employment',
      type: 'self-employment' as const,
      grossAmount: profit,
    },
  ]

  const tax = calculateTax(incomeSources, cleanSettings, rules)

  const incomeTax = tax.incomeTax
  const class4NI = tax.class4NI
  const class2NI = tax.class2NI
  const totalTax = incomeTax + class4NI + class2NI
  const netTakeHome = profit - totalTax

  return {
    incomeTax,
    class4NI,
    class2NI,
    totalTax,
    netTakeHome,
  }
}

/** Find the salary that maximises net take-home for a Ltd Co director. */
export function findOptimalSalary(profit: number, settings: AppSettings, rules: TaxRules): number {
  if (profit <= 0) return 0

  let bestSalary = 0
  let bestTakeHome = calculateLtdScenario(profit, 0, settings, rules).netTakeHome
  const maxSalary = Math.min(profit, 50_000)

  for (let salary = 100; salary <= maxSalary; salary += 100) {
    const scenario = calculateLtdScenario(profit, salary, settings, rules)
    if (scenario.netTakeHome > bestTakeHome) {
      bestTakeHome = scenario.netTakeHome
      bestSalary = salary
    }
  }

  return bestSalary
}
