import { describe, it, expect } from 'vitest'
import { projectPensionPot, projectPensionPotAdvanced } from './pensionProjection'

describe('projectPensionPot (backward compatibility)', () => {
  it('produces results with the original function signature', () => {
    const result = projectPensionPot(30, 50000, 57, 10000, 4, 30000, 3)
    expect(result.yearsToAccess).toBe(27)
    expect(result.projectedPotAtAccess).toBeGreaterThan(50000)
    expect(result.taxFreeLumpSum).toBeGreaterThan(0)
    expect(result.drawdownPot).toBeGreaterThan(0)
    expect(result.yearByYear).toHaveLength(27)
    expect(result.drawdownYears).toHaveLength(68) // 125 - 57
  })

  it('handles zero contributions', () => {
    const result = projectPensionPot(30, 100000, 57, 0, 4, 0, 3)
    expect(result.totalContributions).toBe(0)
    expect(result.projectedPotAtAccess).toBeGreaterThan(100000) // growth only
    expect(result.yearsOfIncome).toBe(Infinity) // no income needed
  })
})

describe('projectPensionPotAdvanced', () => {
  describe('LSA cap', () => {
    it('caps tax-free lump sum at £268,275 when 25% of pot exceeds it', () => {
      // Pot of £2,000,000: 25% = £500,000, but capped at £268,275
      const result = projectPensionPotAdvanced({
        currentAge: 56,
        currentPotValue: 2_000_000,
        pensionAccessAge: 57,
        annualContribution: 0,
        assumedGrowthRate: 4,
        annualIncomeNeeded: 0,
        inflationRate: 3,
        lumpSumAllowance: 268275,
      })
      expect(result.taxFreeLumpSum).toBe(268275)
      expect(result.lsaCapped).toBe(true)
      expect(result.drawdownPot).toBeCloseTo(result.projectedPotAtAccess - 268275, 0)
    })

    it('allows full 25% when pot is below cap threshold', () => {
      const result = projectPensionPotAdvanced({
        currentAge: 56,
        currentPotValue: 500_000,
        pensionAccessAge: 57,
        annualContribution: 0,
        assumedGrowthRate: 4,
        annualIncomeNeeded: 0,
        inflationRate: 3,
        lumpSumAllowance: 268275,
      })
      expect(result.lsaCapped).toBe(false)
      expect(result.taxFreeLumpSum).toBeCloseTo(result.projectedPotAtAccess * 0.25, 0)
    })

    it('uses overridden LSA for protected individuals', () => {
      const result = projectPensionPotAdvanced({
        currentAge: 56,
        currentPotValue: 2_000_000,
        pensionAccessAge: 57,
        annualContribution: 0,
        assumedGrowthRate: 4,
        annualIncomeNeeded: 0,
        inflationRate: 3,
        lumpSumAllowance: 500_000,
      })
      expect(result.taxFreeLumpSum).toBe(500_000)
      expect(result.lsaCapped).toBe(true) // 25% of ~2.08m = ~520k, exceeds custom 500k cap
    })
  })

  describe('State Pension integration', () => {
    it('calculates State Pension based on qualifying NI years', () => {
      const result = projectPensionPotAdvanced({
        currentAge: 56,
        currentPotValue: 100_000,
        pensionAccessAge: 57,
        annualContribution: 0,
        assumedGrowthRate: 4,
        annualIncomeNeeded: 30000,
        inflationRate: 0,
        qualifyingNIYears: 35,
        statePensionFullAnnual: 11973,
        statePensionAge: 67,
      })
      expect(result.statePensionAnnual).toBeCloseTo(11973, 0)
    })

    it('calculates partial State Pension with projected NI years', () => {
      const result = projectPensionPotAdvanced({
        currentAge: 56,
        currentPotValue: 100_000,
        pensionAccessAge: 57,
        annualContribution: 0,
        assumedGrowthRate: 4,
        annualIncomeNeeded: 30000,
        inflationRate: 0,
        qualifyingNIYears: 20,
        statePensionFullAnnual: 11973,
        statePensionAge: 67,
      })
      // 20 current years + 1 working year = 21 projected
      expect(result.projectedNIYears).toBe(21)
      expect(result.statePensionAnnual).toBeCloseTo((21 / 35) * 11973, 0)
    })

    it('State Pension starts at state pension age, not access age', () => {
      const result = projectPensionPotAdvanced({
        currentAge: 50,
        currentPotValue: 500_000,
        pensionAccessAge: 57,
        annualContribution: 0,
        assumedGrowthRate: 4,
        annualIncomeNeeded: 30000,
        inflationRate: 0,
        qualifyingNIYears: 35,
        statePensionFullAnnual: 11973,
        statePensionAge: 67,
      })
      // First 10 drawdown years (age 57-66): no State Pension
      for (let i = 0; i < 10; i++) {
        expect(result.drawdownYears[i].statePensionIncome).toBe(0)
      }
      // Age 67+: State Pension kicks in
      expect(result.drawdownYears[10].statePensionIncome).toBeGreaterThan(0)
    })

    it('reduces DC drawdown needed by State Pension amount', () => {
      const withSP = projectPensionPotAdvanced({
        currentAge: 56,
        currentPotValue: 500_000,
        pensionAccessAge: 67,
        annualContribution: 0,
        assumedGrowthRate: 0,
        annualIncomeNeeded: 30000,
        inflationRate: 0,
        qualifyingNIYears: 35,
        statePensionFullAnnual: 11973,
        statePensionAge: 67,
      })

      const withoutSP = projectPensionPotAdvanced({
        currentAge: 56,
        currentPotValue: 500_000,
        pensionAccessAge: 67,
        annualContribution: 0,
        assumedGrowthRate: 0,
        annualIncomeNeeded: 30000,
        inflationRate: 0,
      })

      // With State Pension, the DC pot should last longer
      expect(withSP.yearsOfIncome).toBeGreaterThan(withoutSP.yearsOfIncome)
      expect(withSP.dcIncomeNeeded).toBeLessThan(withoutSP.dcIncomeNeeded)
    })
  })

  describe('DB pension income', () => {
    it('reduces DC drawdown needed by DB pension amount', () => {
      const withDB = projectPensionPotAdvanced({
        currentAge: 56,
        currentPotValue: 500_000,
        pensionAccessAge: 57,
        annualContribution: 0,
        assumedGrowthRate: 0,
        annualIncomeNeeded: 30000,
        inflationRate: 0,
        dbPensionAnnualIncome: 10000,
      })

      const withoutDB = projectPensionPotAdvanced({
        currentAge: 56,
        currentPotValue: 500_000,
        pensionAccessAge: 57,
        annualContribution: 0,
        assumedGrowthRate: 0,
        annualIncomeNeeded: 30000,
        inflationRate: 0,
      })

      expect(withDB.yearsOfIncome).toBeGreaterThan(withoutDB.yearsOfIncome)
    })

    it('inflates DB income to access-age prices', () => {
      const result = projectPensionPotAdvanced({
        currentAge: 30,
        currentPotValue: 100_000,
        pensionAccessAge: 57,
        annualContribution: 0,
        assumedGrowthRate: 4,
        annualIncomeNeeded: 30000,
        inflationRate: 3,
        dbPensionAnnualIncome: 10000,
      })
      // DB income at access should be inflated by 27 years of 3%
      const expectedDbAtAccess = 10000 * Math.pow(1.03, 27)
      expect(result.dbPensionAnnualAtAccess).toBeCloseTo(expectedDbAtAccess, 0)
    })
  })

  describe('multiple pension pots', () => {
    it('sums multiple pots for total value', () => {
      const result = projectPensionPotAdvanced({
        currentAge: 56,
        currentPotValue: 0,
        pensionPots: [
          { id: '1', name: 'Pot 1', value: 100_000 },
          { id: '2', name: 'Pot 2', value: 200_000 },
        ],
        pensionAccessAge: 57,
        annualContribution: 0,
        assumedGrowthRate: 4,
        annualIncomeNeeded: 0,
        inflationRate: 0,
      })
      // Pot grows for 1 year at 4%: (100k + 200k) * 1.04 = 312k
      expect(result.projectedPotAtAccess).toBeCloseTo(312_000, 0)
    })

    it('applies per-pot growth rates during accumulation', () => {
      const result = projectPensionPotAdvanced({
        currentAge: 56,
        currentPotValue: 0,
        pensionPots: [
          { id: '1', name: 'Equities', value: 100_000, growthRateOverride: 6 },
          { id: '2', name: 'Bonds', value: 100_000, growthRateOverride: 2 },
        ],
        pensionAccessAge: 57,
        annualContribution: 0,
        assumedGrowthRate: 4, // not used when all pots have overrides
        annualIncomeNeeded: 0,
        inflationRate: 0,
      })
      // Equities: 100k * 1.06 = 106k, Bonds: 100k * 1.02 = 102k → total 208k
      expect(result.projectedPotAtAccess).toBeCloseTo(208_000, 0)
    })
  })

  describe('platform fees', () => {
    it('reduces effective growth rate by fee percentage', () => {
      const withFees = projectPensionPotAdvanced({
        currentAge: 30,
        currentPotValue: 100_000,
        pensionAccessAge: 57,
        annualContribution: 0,
        assumedGrowthRate: 4,
        annualIncomeNeeded: 0,
        inflationRate: 0,
        annualFeeRate: 0.5,
      })

      const withoutFees = projectPensionPotAdvanced({
        currentAge: 30,
        currentPotValue: 100_000,
        pensionAccessAge: 57,
        annualContribution: 0,
        assumedGrowthRate: 4,
        annualIncomeNeeded: 0,
        inflationRate: 0,
      })

      expect(withFees.projectedPotAtAccess).toBeLessThan(withoutFees.projectedPotAtAccess)
    })

    it('fee of 0.5% with 4% growth gives net 3.5% growth', () => {
      const withFee = projectPensionPotAdvanced({
        currentAge: 56,
        currentPotValue: 100_000,
        pensionAccessAge: 57,
        annualContribution: 0,
        assumedGrowthRate: 4,
        annualIncomeNeeded: 0,
        inflationRate: 0,
        annualFeeRate: 0.5,
      })

      const atNetRate = projectPensionPotAdvanced({
        currentAge: 56,
        currentPotValue: 100_000,
        pensionAccessAge: 57,
        annualContribution: 0,
        assumedGrowthRate: 3.5,
        annualIncomeNeeded: 0,
        inflationRate: 0,
      })

      expect(withFee.projectedPotAtAccess).toBeCloseTo(atNetRate.projectedPotAtAccess, 0)
    })
  })

  describe('drawdown income tax', () => {
    it('estimates income tax on retirement income', () => {
      const result = projectPensionPotAdvanced({
        currentAge: 56,
        currentPotValue: 500_000,
        pensionAccessAge: 57,
        annualContribution: 0,
        assumedGrowthRate: 4,
        annualIncomeNeeded: 30000,
        inflationRate: 0,
        personalAllowance: 12570,
        incomeTaxBands: [
          { from: 0, to: 37700, rate: 0.20 },
          { from: 37700, to: 112570, rate: 0.40 },
          { from: 112570, to: Infinity, rate: 0.45 },
        ],
      })
      // DC withdrawal of 30k, taxable = 30k - 12570 = 17430, tax = 17430 * 0.20 = 3486
      expect(result.firstYearTax).toBeCloseTo(3486, 0)
      expect(result.firstYearNetIncome).toBeCloseTo(30000 - 3486, 0)
    })

    it('applies PA taper for high retirement income', () => {
      const result = projectPensionPotAdvanced({
        currentAge: 56,
        currentPotValue: 5_000_000,
        pensionAccessAge: 57,
        annualContribution: 0,
        assumedGrowthRate: 0,
        annualIncomeNeeded: 150000,
        inflationRate: 0,
        personalAllowance: 12570,
        personalAllowanceTaperThreshold: 100000,
        incomeTaxBands: [
          { from: 0, to: 37700, rate: 0.20 },
          { from: 37700, to: 112570, rate: 0.40 },
          { from: 112570, to: Infinity, rate: 0.45 },
        ],
      })
      // Income of £150k: PA tapers by (150k - 100k) / 2 = £25k, effective PA = £0 (12570 - 25000 < 0)
      // Tax: 37700 * 0.20 + (112570 - 37700) * 0.40 + (150000 - 112570) * 0.45
      //     = 7540 + 29948 + 16843.50 = 54331.50
      expect(result.firstYearTax).toBeCloseTo(54331.5, 0)
    })

    it('State Pension uses part of personal allowance', () => {
      const result = projectPensionPotAdvanced({
        currentAge: 56,
        currentPotValue: 500_000,
        pensionAccessAge: 67,
        annualContribution: 0,
        assumedGrowthRate: 0,
        annualIncomeNeeded: 30000,
        inflationRate: 0,
        qualifyingNIYears: 35,
        statePensionFullAnnual: 11973,
        statePensionAge: 67,
        personalAllowance: 12570,
        incomeTaxBands: [
          { from: 0, to: 37700, rate: 0.20 },
          { from: 37700, to: 112570, rate: 0.40 },
          { from: 112570, to: Infinity, rate: 0.45 },
        ],
      })
      // Total gross = DC withdrawal (30k - 11973 = 18027) + SP (11973) = 30000
      // Tax = (30000 - 12570) * 0.20 = 3486
      // Same tax whether income comes from DC or SP
      expect(result.firstYearTax).toBeCloseTo(3486, 0)
    })
  })
})
