import type { AppState, TaxSummary } from '@/types'
import { toAnnual } from '@/store/selectors'

function csvRow(...cells: (string | number)[]): string {
  return cells.map(cell => {
    const s = String(cell)
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s
  }).join(',')
}

function currency(n: number): string {
  return n.toFixed(2)
}

export function generateCSV(state: AppState, taxSummary: TaxSummary): string {
  const lines: string[] = []

  // --- Income Sources ---
  lines.push('Income Sources')
  lines.push(csvRow('Name', 'Type', 'Gross (£/yr)', 'Net of Expenses (£/yr)'))
  for (const src of state.incomeSources) {
    let net = src.grossAmount
    if (src.type === 'self-employment') {
      net = Math.max(0, src.grossAmount - (src.usesTradingAllowance ? Math.min(1000, src.grossAmount) : (src.allowableExpenses ?? 0)))
    } else if (src.type === 'rental') {
      net = Math.max(0, src.grossAmount - Math.max(src.rentalExpenses ?? 0, 1000))
    }
    lines.push(csvRow(src.name, src.type, currency(src.grossAmount), currency(net)))
  }
  lines.push('')

  // --- Expenses ---
  lines.push('Expenses')
  lines.push(csvRow('Name', 'Category', 'Frequency', 'Amount (£)', 'Annual (£)'))
  for (const exp of state.expenses) {
    lines.push(csvRow(
      exp.name,
      exp.category,
      exp.frequency,
      currency(exp.amount),
      currency(toAnnual(exp.amount, exp.frequency)),
    ))
  }
  lines.push('')

  // --- Capital Gains ---
  if (state.gainSources.length > 0) {
    lines.push('Capital Gains')
    lines.push(csvRow('Name', 'Gain (£)', 'Allowable Costs (£)', 'Net Gain (£)', 'Residential Property', 'BADR'))
    for (const g of state.gainSources) {
      const netGain = g.gainAmount - g.allowableCosts
      lines.push(csvRow(
        g.name,
        currency(g.gainAmount),
        currency(g.allowableCosts),
        currency(netGain),
        g.isResidentialProperty ? 'Yes' : 'No',
        g.isBADR ? 'Yes' : 'No',
      ))
    }
    lines.push('')
  }

  // --- Tax Summary ---
  lines.push('Tax Summary')
  lines.push(csvRow('Item', 'Amount (£)'))
  const summaryRows: Array<[string, number]> = [
    ['Gross income', taxSummary.grossIncome],
    ['Total deductions (pension)', taxSummary.totalDeductions],
    ['Adjusted net income', taxSummary.adjustedNetIncome],
    ['Effective personal allowance', taxSummary.effectivePersonalAllowance],
    ['Income tax', taxSummary.incomeTax],
    ['National Insurance', taxSummary.nationalInsurance],
    ['Dividend tax', taxSummary.dividendTax],
    ['Capital gains tax', taxSummary.capitalGainsTax],
    ['Student loan', taxSummary.studentLoan],
    ['Total tax', taxSummary.totalTax],
    ['Net income', taxSummary.netIncome],
    ['Effective tax rate (%)', taxSummary.effectiveTaxRate * 100],
  ]
  if (taxSummary.badrTax > 0) {
    summaryRows.push(['BADR gains', taxSummary.badrGains])
    summaryRows.push(['BADR tax', taxSummary.badrTax])
  }
  if (taxSummary.bondIncome > 0) {
    summaryRows.push(['Bond income', taxSummary.bondIncome])
    summaryRows.push(['Bond top-slicing relief', taxSummary.bondTopSlicingRelief])
  }
  for (const [label, value] of summaryRows) {
    lines.push(csvRow(label, currency(value)))
  }

  return lines.join('\n')
}
