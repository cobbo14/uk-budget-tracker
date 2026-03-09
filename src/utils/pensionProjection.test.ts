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

  describe('ISA projection', () => {
    it('projects ISA growth during accumulation', () => {
      const result = projectPensionPotAdvanced({
        currentAge: 30,
        currentPotValue: 50_000,
        pensionAccessAge: 57,
        annualContribution: 10_000,
        assumedGrowthRate: 4,
        annualIncomeNeeded: 0,
        inflationRate: 0,
        isaPots: [
          { id: '1', name: 'S&S ISA', type: 'stocksAndShares', currentValue: 20_000, annualContribution: 10_000 },
        ],
      })
      expect(result.projectedIsaAtAccess).toBeGreaterThan(20_000)
      expect(result.totalIsaContributions).toBe(10_000 * 27)
      expect(result.totalRetirementWealth).toBe(result.projectedPotAtAccess + result.projectedIsaAtAccess)
    })

    it('applies LISA 25% government bonus during accumulation', () => {
      const result = projectPensionPotAdvanced({
        currentAge: 25,
        currentPotValue: 0,
        pensionAccessAge: 57,
        annualContribution: 0,
        assumedGrowthRate: 0,
        annualIncomeNeeded: 0,
        inflationRate: 0,
        annualFeeRate: 0,
        isaPots: [
          { id: '1', name: 'LISA', type: 'lifetime', currentValue: 0, annualContribution: 4000, growthRateOverride: 0 },
        ],
      })
      // LISA contributions stop at age 50: £4k/yr for 25 years (age 25-49)
      // Bonus: 25 years × £1k = £25k total
      expect(result.totalLisaBonus).toBe(25_000)
      // Total ISA value: (4000 * 25) + 25000 bonus = 125,000
      expect(result.projectedIsaAtAccess).toBe(125_000)
    })

    it('caps LISA contributions at £4,000', () => {
      const result = projectPensionPotAdvanced({
        currentAge: 40,
        currentPotValue: 0,
        pensionAccessAge: 41,
        annualContribution: 0,
        assumedGrowthRate: 0,
        annualIncomeNeeded: 0,
        inflationRate: 0,
        isaPots: [
          { id: '1', name: 'LISA', type: 'lifetime', currentValue: 0, annualContribution: 10_000, growthRateOverride: 0 },
        ],
      })
      // Only £4k contributed (LISA cap) even though £10k was set, bonus = £1k
      expect(result.projectedIsaAtAccess).toBe(5_000) // 4k contribution + 1k bonus
      expect(result.totalLisaBonus).toBe(1_000)
    })

    it('uses ISA in tax-optimised drawdown to reduce tax', () => {
      const bands = [
        { from: 0, to: 37700, rate: 0.20 },
        { from: 37700, to: 112570, rate: 0.40 },
        { from: 112570, to: Infinity, rate: 0.45 },
      ]

      // Pension-only: £40k income needed, all from pension
      const pensionOnly = projectPensionPotAdvanced({
        currentAge: 56,
        currentPotValue: 1_000_000,
        pensionAccessAge: 57,
        annualContribution: 0,
        assumedGrowthRate: 0,
        annualIncomeNeeded: 40_000,
        inflationRate: 0,
        personalAllowance: 12570,
        incomeTaxBands: bands,
      })

      // With ISA (tax-optimised): pension draws up to PA, ISA covers the rest
      const withIsa = projectPensionPotAdvanced({
        currentAge: 56,
        currentPotValue: 500_000,
        pensionAccessAge: 57,
        annualContribution: 0,
        assumedGrowthRate: 0,
        annualIncomeNeeded: 40_000,
        inflationRate: 0,
        personalAllowance: 12570,
        incomeTaxBands: bands,
        isaPots: [
          { id: '1', name: 'S&S ISA', type: 'stocksAndShares', currentValue: 500_000, annualContribution: 0 },
        ],
        isaDrawdownStrategy: 'tax-optimised',
      })

      // Pension-only tax: (40000 - 12570) * 0.20 = 5486
      expect(pensionOnly.firstYearTax).toBeCloseTo(5486, 0)

      // Tax-optimised: pension draws only up to PA (£12,570), ISA covers rest (£27,430)
      // Tax = 0 (pension within PA)
      expect(withIsa.firstYearTaxWithIsa).toBe(0)
      expect(withIsa.firstYearNetIncomeWithIsa).toBeCloseTo(40_000, 0)
    })

    it('combined years of income includes ISA extending retirement', () => {
      const result = projectPensionPotAdvanced({
        currentAge: 56,
        currentPotValue: 100_000,
        pensionAccessAge: 57,
        annualContribution: 0,
        assumedGrowthRate: 0,
        annualIncomeNeeded: 20_000,
        inflationRate: 0,
        isaPots: [
          { id: '1', name: 'S&S ISA', type: 'stocksAndShares', currentValue: 100_000, annualContribution: 0 },
        ],
        isaDrawdownStrategy: 'pension-first',
      })
      // Pension lasts ~5 years (100k / 20k), ISA extends it further
      expect(result.combinedYearsOfIncome).toBeGreaterThan(result.yearsOfIncome)
    })

    it('pension-first strategy exhausts pension before ISA', () => {
      const result = projectPensionPotAdvanced({
        currentAge: 56,
        currentPotValue: 60_000,
        pensionAccessAge: 57,
        annualContribution: 0,
        assumedGrowthRate: 0,
        annualIncomeNeeded: 20_000,
        inflationRate: 0,
        isaPots: [
          { id: '1', name: 'S&S ISA', type: 'stocksAndShares', currentValue: 100_000, annualContribution: 0, growthRateOverride: 0 },
        ],
        isaDrawdownStrategy: 'pension-first',
      })
      // Pot = 60k, 25% tax-free lump sum = 15k, drawdown pot = 45k
      // Year 1: pension 20k, ISA 0
      expect(result.drawdownYears[0].withdrawal).toBeCloseTo(20_000, 0)
      expect(result.drawdownYears[0].isaWithdrawal).toBe(0)
      // Year 2: pension 20k (25k left), ISA 0
      expect(result.drawdownYears[1].withdrawal).toBeCloseTo(20_000, 0)
      expect(result.drawdownYears[1].isaWithdrawal).toBe(0)
      // Year 3: pension has 5k left, draws 5k, ISA covers remaining 15k
      expect(result.drawdownYears[2].withdrawal).toBeCloseTo(5_000, 0)
      expect(result.drawdownYears[2].isaWithdrawal).toBeCloseTo(15_000, 0)
    })

    it('returns zero ISA fields when no ISA pots configured', () => {
      const result = projectPensionPotAdvanced({
        currentAge: 30,
        currentPotValue: 50_000,
        pensionAccessAge: 57,
        annualContribution: 10_000,
        assumedGrowthRate: 4,
        annualIncomeNeeded: 30_000,
        inflationRate: 3,
      })
      expect(result.projectedIsaAtAccess).toBe(0)
      expect(result.totalIsaContributions).toBe(0)
      expect(result.totalLisaBonus).toBe(0)
      expect(result.totalRetirementWealth).toBe(result.projectedPotAtAccess)
    })
  })

  describe('ISA drawdown growth rate (balance-weighted)', () => {
    it('weights ISA growth rate by balance, not equally', () => {
      // Large cash ISA (2%) and small S&S ISA (8%) — growth should be closer to 2%
      const result = projectPensionPotAdvanced({
        currentAge: 56,
        currentPotValue: 500_000,
        pensionAccessAge: 57,
        annualContribution: 0,
        assumedGrowthRate: 0,
        annualIncomeNeeded: 10_000,
        inflationRate: 0,
        annualFeeRate: 0,
        isaPots: [
          { id: '1', name: 'Cash ISA', type: 'cash', currentValue: 90_000, annualContribution: 0, growthRateOverride: 2 },
          { id: '2', name: 'S&S ISA', type: 'stocksAndShares', currentValue: 10_000, annualContribution: 0, growthRateOverride: 8 },
        ],
        isaDrawdownStrategy: 'isa-first',
      })
      // After 1yr accumulation: Cash = 91800 (90k*1.02), S&S = 10800 (10k*1.08), total = 102600
      // Weighted rate: (91800*0.02 + 10800*0.08) / 102600 = 2700 / 102600 ≈ 2.63%
      // Growth should be ~2700 (dominated by cash ISA's rate), NOT unweighted avg of (2+8)/2 = 5%
      expect(result.drawdownYears[0].isaGrowthAmount).toBeCloseTo(2700, 0)
    })
  })

  describe('LISA penalty shortfall recovery', () => {
    it('recovers LISA penalty shortfall from pension', () => {
      const result = projectPensionPotAdvanced({
        currentAge: 56,
        currentPotValue: 500_000,
        pensionAccessAge: 57,
        annualContribution: 0,
        assumedGrowthRate: 0,
        annualIncomeNeeded: 20_000,
        inflationRate: 0,
        isaPots: [
          { id: '1', name: 'LISA', type: 'lifetime', currentValue: 50_000, annualContribution: 0, growthRateOverride: 0 },
        ],
        isaDrawdownStrategy: 'isa-first',
      })
      // Age 57 < 60, so LISA withdrawal incurs 25% penalty
      // ISA-first: tries to draw 20k from LISA, penalty = 20k * 0.25 = 5k, effective = 15k
      // Shortfall = 5k, recovered from pension
      // Total pension withdrawal should include the 5k recovery
      const yr1 = result.drawdownYears[0]
      expect(yr1.withdrawal).toBeGreaterThan(0) // pension covers shortfall
      // Combined net income should meet the target
      expect(yr1.combinedNetIncome).toBeCloseTo(20_000, 0)
    })
  })

  describe('LISA balance tracking (order-aware)', () => {
    it('draws non-LISA first, LISA penalties only after non-LISA exhausted', () => {
      const result = projectPensionPotAdvanced({
        currentAge: 56,
        currentPotValue: 500_000,
        pensionAccessAge: 57,
        annualContribution: 0,
        assumedGrowthRate: 0,
        annualIncomeNeeded: 10_000,
        inflationRate: 0,
        isaPots: [
          { id: '1', name: 'S&S ISA', type: 'stocksAndShares', currentValue: 30_000, annualContribution: 0, growthRateOverride: 0 },
          { id: '2', name: 'LISA', type: 'lifetime', currentValue: 20_000, annualContribution: 0, growthRateOverride: 0 },
        ],
        isaDrawdownStrategy: 'isa-first',
      })
      // Year 1 (age 57): draws 10k from non-LISA (30k available), no penalty
      expect(result.drawdownYears[0].isaWithdrawal).toBeCloseTo(10_000, 0) // no penalty reduction
      // Year 3 (age 59): non-LISA should be exhausted (30k - 10k - 10k = 10k),
      // draws 10k from remaining non-LISA, still no penalty
      expect(result.drawdownYears[2].isaWithdrawal).toBeCloseTo(10_000, 0)
      // Year 4 (age 60): LISA is now penalty-free (age >= 60)
      expect(result.drawdownYears[3].isaWithdrawal).toBeCloseTo(10_000, 0)
    })
  })

  describe('drawdown tax band inflation', () => {
    it('inflates tax bands during drawdown to prevent bracket creep', () => {
      const bands = [
        { from: 0, to: 37700, rate: 0.20 },
        { from: 37700, to: 112570, rate: 0.40 },
        { from: 112570, to: Infinity, rate: 0.45 },
      ]

      // With inflation, income grows but so do tax bands — tax rate should stay proportional
      const result = projectPensionPotAdvanced({
        currentAge: 56,
        currentPotValue: 5_000_000,
        pensionAccessAge: 57,
        annualContribution: 0,
        assumedGrowthRate: 5,
        annualIncomeNeeded: 30_000,
        inflationRate: 3,
        personalAllowance: 12570,
        incomeTaxBands: bands,
      })

      // First year tax rate
      const yr1 = result.drawdownYears[0]
      const yr1EffectiveRate = yr1.incomeTaxOnWithdrawal / yr1.totalGrossIncome

      // Year 20 tax rate — with band inflation, effective rate should be similar
      const yr20 = result.drawdownYears[19]
      if (yr20.totalGrossIncome > 0 && yr20.incomeTaxOnWithdrawal > 0) {
        const yr20EffectiveRate = yr20.incomeTaxOnWithdrawal / yr20.totalGrossIncome
        // Effective tax rates should be close (within 2 percentage points)
        expect(Math.abs(yr20EffectiveRate - yr1EffectiveRate)).toBeLessThan(0.02)
      }
    })
  })

  describe('DB pension start age', () => {
    it('delays DB income until specified start age', () => {
      const result = projectPensionPotAdvanced({
        currentAge: 50,
        currentPotValue: 500_000,
        pensionAccessAge: 57,
        annualContribution: 0,
        assumedGrowthRate: 0,
        annualIncomeNeeded: 30_000,
        inflationRate: 0,
        dbPensionAnnualIncome: 10_000,
        dbPensionStartAge: 65,
      })
      // Ages 57-64: no DB income
      for (let i = 0; i < 8; i++) {
        expect(result.drawdownYears[i].dbPensionIncome).toBe(0)
      }
      // Age 65: DB income kicks in
      expect(result.drawdownYears[8].dbPensionIncome).toBeGreaterThan(0)
    })

    it('defaults DB start age to pension access age', () => {
      const result = projectPensionPotAdvanced({
        currentAge: 56,
        currentPotValue: 500_000,
        pensionAccessAge: 57,
        annualContribution: 0,
        assumedGrowthRate: 0,
        annualIncomeNeeded: 30_000,
        inflationRate: 0,
        dbPensionAnnualIncome: 10_000,
      })
      // DB income available from year 1 (age 57 = access age)
      expect(result.drawdownYears[0].dbPensionIncome).toBe(10_000)
    })
  })

  describe('DB pension inflation cap', () => {
    it('inflates DB pension at custom rate instead of global inflation', () => {
      const result = projectPensionPotAdvanced({
        currentAge: 30,
        currentPotValue: 100_000,
        pensionAccessAge: 57,
        annualContribution: 0,
        assumedGrowthRate: 4,
        annualIncomeNeeded: 30_000,
        inflationRate: 3,
        dbPensionAnnualIncome: 10_000,
        dbInflationRate: 2,
      })
      // DB income at access should be inflated by 27 years of 2% (not 3%)
      const expectedDbAtAccess = 10_000 * Math.pow(1.02, 27)
      expect(result.dbPensionAnnualAtAccess).toBeCloseTo(expectedDbAtAccess, 0)
    })

    it('DB income grows slower than income needs when capped', () => {
      const result = projectPensionPotAdvanced({
        currentAge: 56,
        currentPotValue: 5_000_000,
        pensionAccessAge: 57,
        annualContribution: 0,
        assumedGrowthRate: 5,
        annualIncomeNeeded: 50_000,
        inflationRate: 3,
        dbPensionAnnualIncome: 20_000,
        dbInflationRate: 2,
      })
      // After 20 years, DB pension should lag behind income needs
      const yr20 = result.drawdownYears[19]
      const yr1 = result.drawdownYears[0]
      const dbGrowthRatio = yr20.dbPensionIncome / yr1.dbPensionIncome
      // DB grows at ~2%, should be about 1.02^19 ≈ 1.46
      expect(dbGrowthRatio).toBeCloseTo(Math.pow(1.02, 19), 1)
    })
  })

  describe('tax-optimised drawdown with drawdownTaxFreeFirst', () => {
    it('prefers pension while tax-free allowance lasts', () => {
      const bands = [
        { from: 0, to: 37700, rate: 0.20 },
        { from: 37700, to: 112570, rate: 0.40 },
        { from: 112570, to: Infinity, rate: 0.45 },
      ]

      const result = projectPensionPotAdvanced({
        currentAge: 56,
        currentPotValue: 200_000,
        pensionAccessAge: 57,
        annualContribution: 0,
        assumedGrowthRate: 0,
        annualIncomeNeeded: 20_000,
        inflationRate: 0,
        personalAllowance: 12570,
        incomeTaxBands: bands,
        drawdownTaxFreeFirst: true,
        isaPots: [
          { id: '1', name: 'S&S ISA', type: 'stocksAndShares', currentValue: 200_000, annualContribution: 0, growthRateOverride: 0 },
        ],
        isaDrawdownStrategy: 'tax-optimised',
      })
      // Tax-free allowance = min(200k * 0.25, 268275) = 50k
      // Year 1: 20k from pension (all tax-free from allowance), no ISA needed
      // Tax-free remaining = 50k, pension withdrawal = 20k (within PA + tax-free allowance)
      expect(result.drawdownYears[0].withdrawal).toBe(20_000) // all from pension
      expect(result.drawdownYears[0].isaWithdrawal).toBe(0)   // no ISA needed
      // Year 1 should be tax-free
      expect(result.drawdownYears[0].incomeTaxOnWithdrawal).toBe(0)
    })
  })

  describe('mid-year contribution timing', () => {
    it('contributions get half-year growth', () => {
      const result = projectPensionPotAdvanced({
        currentAge: 56,
        currentPotValue: 100_000,
        pensionAccessAge: 57,
        annualContribution: 10_000,
        assumedGrowthRate: 10,
        annualIncomeNeeded: 0,
        inflationRate: 0,
      })
      // Old: (100k + 10k) * 0.10 = 11k growth → 121k
      // New: 100k * 0.10 + 10k * 0.10 * 0.5 = 10.5k growth → 120.5k
      expect(result.projectedPotAtAccess).toBeCloseTo(120_500, 0)
    })
  })

  describe('ISA growth rate clamped at 0%', () => {
    it('does not decrease ISA balance when fees exceed growth', () => {
      const result = projectPensionPotAdvanced({
        currentAge: 56,
        currentPotValue: 0,
        pensionAccessAge: 57,
        annualContribution: 0,
        assumedGrowthRate: 0,
        annualIncomeNeeded: 0,
        inflationRate: 0,
        annualFeeRate: 3,
        isaPots: [
          { id: '1', name: 'Cash ISA', type: 'cash', currentValue: 10_000, annualContribution: 0, growthRateOverride: 2 },
        ],
      })
      // Growth rate = max(0, 2 - 3) = 0%, so balance should stay flat
      expect(result.projectedIsaAtAccess).toBe(10_000)
    })
  })

  describe('ISA contribution growth with salary', () => {
    it('grows ISA contributions with inflation + salary growth', () => {
      const result = projectPensionPotAdvanced({
        currentAge: 55,
        currentPotValue: 0,
        pensionAccessAge: 57,
        annualContribution: 0,
        assumedGrowthRate: 0,
        annualIncomeNeeded: 0,
        inflationRate: 3,
        salaryGrowthRate: 1,
        isaPots: [
          { id: '1', name: 'S&S ISA', type: 'stocksAndShares', currentValue: 0, annualContribution: 10_000, growthRateOverride: 0 },
        ],
      })
      // Year 1 (age 55): contributes £10,000
      // Year 2 (age 56): contributes £10,000 * 1.04 = £10,400
      // Total contributions: 10000 + 10400 = 20400
      expect(result.totalIsaContributions).toBeCloseTo(20_400, 0)
      // With 0% growth, ISA value should equal total contributions
      expect(result.projectedIsaAtAccess).toBeCloseTo(20_400, 0)
    })
  })
})
