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

function WorkedExample({ salary, tax, ni, net }: { salary: string; tax: string; ni: string; net: string }) {
  return (
    <div className="rounded-lg border p-4 bg-muted/50">
      <p className="font-medium mb-2">Salary: {salary}</p>
      <Table
        headers={['Component', 'Amount']}
        rows={[
          ['Income Tax', tax],
          ['Employee NI', ni],
          ['Take-home pay', net],
        ]}
      />
    </div>
  )
}

export function UkIncomeTaxRates() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">
          UK Income Tax Rates &amp; Bands 2024&ndash;27
        </h1>
        <p className="text-muted-foreground">
          A complete reference to UK income tax rates, National Insurance contributions,
          and personal allowance for the 2024/25, 2025/26, and 2026/27 tax years. Includes
          Scottish income tax rates and worked examples at common salary levels.
        </p>
      </div>

      {/* Personal Allowance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Personal Allowance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            The tax-free Personal Allowance is <strong>£12,570</strong> for all three tax
            years (2024/25, 2025/26, and 2026/27). You pay no income tax on earnings up to
            this amount.
          </p>
          <p>
            If your adjusted net income exceeds <strong>£100,000</strong>, the Personal
            Allowance is reduced by £1 for every £2 above that threshold. It is fully
            withdrawn at £125,140.
          </p>
        </CardContent>
      </Card>

      {/* England, Wales & NI Rates */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Income Tax Rates &mdash; England, Wales &amp; Northern Ireland</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            These rates apply to taxable income (after deducting the Personal Allowance) and
            are unchanged across all three tax years:
          </p>
          <Table
            headers={['Band', 'Taxable income', 'Rate']}
            rows={[
              ['Personal Allowance', '£0 – £12,570', '0%'],
              ['Basic Rate', '£12,571 – £50,270', '20%'],
              ['Higher Rate', '£50,271 – £125,140', '40%'],
              ['Additional Rate', 'Over £125,140', '45%'],
            ]}
          />
          <p>
            The Basic Rate band covers the first £37,700 of taxable income (i.e. above the
            Personal Allowance). The Higher Rate band extends up to £125,140 &mdash; the
            point at which the Personal Allowance is fully tapered away.
          </p>
        </CardContent>
      </Card>

      {/* Scottish Rates */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Scottish Income Tax Rates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            Scottish taxpayers pay income tax at different rates set by the Scottish
            Parliament. The Personal Allowance remains £12,570.
          </p>

          <p className="font-medium text-foreground">2024/25 &amp; 2025/26</p>
          <Table
            headers={['Band', 'Taxable income', 'Rate']}
            rows={[
              ['Starter', '£0 – £2,827', '19%'],
              ['Basic', '£2,828 – £14,921', '20%'],
              ['Intermediate', '£14,922 – £31,092', '21%'],
              ['Higher', '£31,093 – £62,430', '42%'],
              ['Advanced', '£62,431 – £112,570', '45%'],
              ['Top', 'Over £112,570', '48%'],
            ]}
          />

          <p className="font-medium text-foreground">2026/27</p>
          <Table
            headers={['Band', 'Taxable income', 'Rate']}
            rows={[
              ['Starter', '£0 – £3,967', '19%'],
              ['Basic', '£3,968 – £16,956', '20%'],
              ['Intermediate', '£16,957 – £31,092', '21%'],
              ['Higher', '£31,093 – £62,430', '42%'],
              ['Advanced', '£62,431 – £112,570', '45%'],
              ['Top', 'Over £112,570', '48%'],
            ]}
          />
        </CardContent>
      </Card>

      {/* National Insurance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">National Insurance Contributions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Employee (Class 1) &mdash; All Years</p>
          <Table
            headers={['Earnings band', 'Rate']}
            rows={[
              ['Up to £12,570 (Primary Threshold)', '0%'],
              ['£12,571 – £50,270 (Upper Earnings Limit)', '8%'],
              ['Above £50,270', '2%'],
            ]}
          />

          <p className="font-medium text-foreground">Self-employed (Class 4) &mdash; All Years</p>
          <Table
            headers={['Profits band', 'Rate']}
            rows={[
              ['Up to £12,570', '0%'],
              ['£12,571 – £50,270', '6%'],
              ['Above £50,270', '2%'],
            ]}
          />

          <p>
            Self-employed individuals also pay Class 2 NI of approximately £3.45&ndash;£3.65
            per week (depending on tax year) if profits exceed the Small Profits Threshold.
          </p>
        </CardContent>
      </Card>

      {/* Dividend & Savings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dividend &amp; Savings Tax Rates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            The <strong>Dividend Allowance</strong> is £500 for all three tax years. Dividends
            above this are taxed at:
          </p>
          <Table
            headers={['Tax band', 'Dividend rate']}
            rows={[
              ['Basic Rate', '8.75%'],
              ['Higher Rate', '33.75%'],
              ['Additional Rate', '39.35%'],
            ]}
          />
          <p>
            The <strong>Personal Savings Allowance</strong> is £1,000 for basic rate taxpayers,
            £500 for higher rate, and £0 for additional rate taxpayers.
          </p>
        </CardContent>
      </Card>

      {/* Worked Examples */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Worked Examples (2025/26, England)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            These examples assume a single employment income with no pension contributions,
            no student loan, and no other deductions.
          </p>

          <WorkedExample
            salary="£30,000"
            tax="£3,486"
            ni="£1,394"
            net="£25,120"
          />

          <WorkedExample
            salary="£50,000"
            tax="£7,486"
            ni="£2,994"
            net="£39,520"
          />

          <WorkedExample
            salary="£80,000"
            tax="£19,486"
            ni="£3,594"
            net="£56,920"
          />

          <WorkedExample
            salary="£100,000"
            tax="£27,486"
            ni="£3,994"
            net="£68,520"
          />

          <p>
            Note: at £100,000 these figures assume the full Personal Allowance. In practice
            any income above £100,000 triggers the taper, which increases the effective
            marginal rate to 60%.{' '}
            <a href="#guide/reduce-tax-above-100k" className="text-emerald-600 font-medium hover:underline">
              Learn about the 60% tax trap &rarr;
            </a>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 text-sm text-muted-foreground space-y-2">
          <p>
            Model your own salary and see a full tax breakdown instantly.{' '}
            <a href="#income" className="text-emerald-600 font-medium hover:underline">
              Try the tax calculator &rarr;
            </a>
          </p>
          <p>
            <strong>Related guide:</strong>{' '}
            <a href="#guide/salary-sacrifice-guide" className="text-emerald-600 font-medium hover:underline">
              Salary Sacrifice: Is It Worth It? &rarr;
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
