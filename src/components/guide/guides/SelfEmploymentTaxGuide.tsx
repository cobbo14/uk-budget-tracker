import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr>
            {headers.map(h => (
              <th key={h} className="border px-3 py-2 text-left bg-muted font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j} className="border px-3 py-2">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function SelfEmploymentTaxGuide() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">
          Self-Employment Tax Guide UK
        </h1>
        <p className="text-muted-foreground">
          How self-employment tax works in the UK &mdash; trading allowance, allowable
          expenses, Class 2 and Class 4 National Insurance, payments on account, and tips
          to reduce your tax bill. Covers 2024/25, 2025/26, and 2026/27.
        </p>
      </div>

      {/* How SE tax works */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">How Self-Employment Tax Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Self-employed individuals pay income tax on their trading profits, plus
            National Insurance contributions. Unlike employees, tax is not deducted at
            source &mdash; you must register for <strong>Self Assessment</strong> and
            file a tax return each year.
          </p>
          <p>
            Your taxable profit is your total business income minus allowable expenses.
            The same income tax rates and bands apply as for employment income.
          </p>
          <p>
            The tax return deadline is <strong>31 January</strong> following the end of
            the tax year (online filing). Paper returns must be filed by 31 October.
          </p>
        </CardContent>
      </Card>

      {/* Trading Allowance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Trading Allowance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            If your total self-employment income is <strong>£1,000 or less</strong> per
            year, it is tax-free under the trading allowance. You do not need to register
            for Self Assessment or report it.
          </p>
          <p>
            If your income exceeds £1,000, you can choose either to:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Deduct the £1,000 trading allowance instead of actual expenses, or</li>
            <li>Deduct your actual allowable expenses (if they exceed £1,000)</li>
          </ul>
          <p>
            You cannot use both the trading allowance and claim actual expenses.
          </p>
        </CardContent>
      </Card>

      {/* Allowable expenses */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Allowable Business Expenses</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            You can deduct costs that are &ldquo;wholly and exclusively&rdquo; for
            business purposes:
          </p>
          <Table
            headers={['Category', 'Examples']}
            rows={[
              ['Office & premises', 'Rent, business rates, utilities, insurance'],
              ['Travel', 'Business mileage (45p/mile first 10,000 miles), public transport, parking'],
              ['Staff', 'Salaries, subcontractor costs, employer NI'],
              ['Equipment', 'Tools, computers, software, office furniture'],
              ['Professional fees', 'Accountant, solicitor, professional subscriptions'],
              ['Marketing', 'Advertising, website hosting, business cards'],
              ['Working from home', 'Simplified expenses: £6/week (£26/month) flat rate'],
              ['Financial', 'Bank charges, business loan interest, bad debts'],
            ]}
          />
          <p>
            You <strong>cannot</strong> deduct: personal expenses, fines, entertainment
            costs for clients, or the cost of your own labour.
          </p>
        </CardContent>
      </Card>

      {/* National Insurance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">National Insurance for the Self-Employed</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Class 2 NI</p>
          <p>
            A flat weekly rate (approximately £3.45&ndash;£3.65 per week depending on tax
            year) if your profits exceed the Small Profits Threshold (£6,725). This
            contribution qualifies you for the State Pension and certain benefits.
          </p>

          <p className="font-medium text-foreground">Class 4 NI (all years 2024&ndash;27)</p>
          <Table
            headers={['Profits band', 'Rate']}
            rows={[
              ['Up to £12,570', '0%'],
              ['£12,571 – £50,270', '6%'],
              ['Above £50,270', '2%'],
            ]}
          />
          <p>
            Class 4 NI is calculated on your taxable profits (after expenses) and is paid
            through Self Assessment alongside your income tax.
          </p>
        </CardContent>
      </Card>

      {/* Payments on Account */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Payments on Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            If your Self Assessment tax bill is <strong>£1,000 or more</strong> (and less
            than 80% was collected at source through PAYE), you must make payments on
            account. These are advance payments towards next year&rsquo;s tax bill.
          </p>
          <Table
            headers={['Payment', 'When', 'Amount']}
            rows={[
              ['1st payment on account', '31 January', '50% of previous year\'s bill'],
              ['2nd payment on account', '31 July', '50% of previous year\'s bill'],
              ['Balancing payment', '31 January (following year)', 'Remaining balance'],
            ]}
          />
          <p>
            In your first year of Self Assessment, this means paying 150% of your tax
            bill in January (the full year&rsquo;s tax plus the first payment on account
            for the following year). Plan your cash flow accordingly.
          </p>
        </CardContent>
      </Card>

      {/* Worked example */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Worked Example</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            You are a freelance designer with £50,000 turnover and £8,000 in allowable
            expenses in 2025/26.
          </p>
          <Table
            headers={['Component', 'Calculation', 'Amount']}
            rows={[
              ['Turnover', '', '£50,000'],
              ['Less: expenses', '', '−£8,000'],
              ['Taxable profit', '', '£42,000'],
              ['Personal Allowance', '', '−£12,570'],
              ['Taxable income', '', '£29,430'],
              ['Income Tax (20%)', '£29,430 × 20%', '£5,886'],
              ['Class 4 NI (6%)', '(£42,000 − £12,570) × 6%', '£1,766'],
              ['Class 2 NI', '52 × ~£3.50', '£182'],
              ['Total tax & NI', '', '£7,834'],
            ]}
          />
        </CardContent>
      </Card>

      {/* Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tips to Reduce Your Tax Bill</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Claim all allowable expenses</strong> &mdash; keep receipts and
              records for everything. Many self-employed people under-claim.
            </li>
            <li>
              <strong>Pension contributions</strong> &mdash; reduce your taxable income
              and build retirement savings. Particularly effective if you are near the
              £50,270 higher-rate threshold.
            </li>
            <li>
              <strong>Consider incorporating</strong> &mdash; if profits exceed
              ~£40,000&ndash;£50,000, operating through a limited company and paying
              yourself via salary + dividends may be more tax-efficient.
            </li>
            <li>
              <strong>Flat-rate expenses</strong> &mdash; HMRC simplified expenses can be
              used for working from home, vehicles, and living on business premises
              without keeping detailed records.
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 text-sm text-muted-foreground space-y-2">
          <p>
            Track your self-employment income and expenses.{' '}
            <a href="#income" className="text-emerald-600 font-medium hover:underline">
              Add self-employment income &rarr;
            </a>
          </p>
          <p>
            <strong>Related guides:</strong>{' '}
            <a href="#guide/uk-income-tax-rates" className="text-emerald-600 font-medium hover:underline">
              Income Tax Rates &amp; Bands
            </a>
            {' · '}
            <a href="#guide/reduce-tax-above-100k" className="text-emerald-600 font-medium hover:underline">
              How to Reduce Tax Above £100k
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
