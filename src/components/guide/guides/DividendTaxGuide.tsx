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

export function DividendTaxGuide() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">
          Dividend Tax Guide UK 2024&ndash;27
        </h1>
        <p className="text-muted-foreground">
          How UK dividend tax works, current rates and allowances, how dividends interact
          with your income tax bands, and strategies to minimise your dividend tax bill
          for the 2024/25, 2025/26, and 2026/27 tax years.
        </p>
      </div>

      {/* How dividend tax works */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">How Dividend Tax Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Dividends are taxed differently from employment income. They have their own
            tax-free allowance and their own rates. Dividends are treated as the
            &ldquo;top slice&rdquo; of your income &mdash; they are stacked on top of
            your other taxable income to determine which rate applies.
          </p>
          <p>
            Unlike employment income, there are <strong>no National Insurance
            contributions</strong> on dividend income. This is why company directors
            often pay themselves a small salary and take the rest as dividends.
          </p>
        </CardContent>
      </Card>

      {/* Dividend allowance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dividend Allowance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <Table
            headers={['Tax year', 'Dividend allowance']}
            rows={[
              ['2022/23', '£2,000'],
              ['2023/24', '£1,000'],
              ['2024/25 onwards', '£500'],
            ]}
          />
          <p>
            The first £500 of dividend income each year is tax-free, regardless of your
            tax band. This allowance has been significantly reduced from £2,000 in
            2022/23.
          </p>
          <p>
            The dividend allowance does <strong>not</strong> reduce your taxable income
            &mdash; it means the first £500 of dividends is taxed at 0%. The dividends
            still count towards determining your tax band.
          </p>
        </CardContent>
      </Card>

      {/* Rates */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dividend Tax Rates 2024&ndash;27</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <Table
            headers={['Tax band', 'Dividend rate', 'Equivalent income tax rate']}
            rows={[
              ['Basic Rate', '8.75%', '20%'],
              ['Higher Rate', '33.75%', '40%'],
              ['Additional Rate', '39.35%', '45%'],
            ]}
          />
          <p>
            Dividend rates are lower than income tax rates at every band. This is because
            companies pay Corporation Tax on profits before distributing dividends, so
            the lower rate partially accounts for the tax already paid at company level.
          </p>
        </CardContent>
      </Card>

      {/* How dividends stack */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">How Dividends Stack on Your Income</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Dividends are added on top of your other income to determine the tax band.
            The order is: non-savings income first, then savings income, then dividends
            last.
          </p>
          <p className="font-medium text-foreground">Example</p>
          <p>
            You have a salary of £40,000 and £15,000 in dividends (2025/26):
          </p>
          <Table
            headers={['Step', 'Calculation', 'Amount']}
            rows={[
              ['Salary after Personal Allowance', '£40,000 − £12,570', '£27,430 taxable'],
              ['Basic rate band remaining', '£50,270 − £40,000', '£10,270'],
              ['Dividend allowance', 'First £500 at 0%', '£0'],
              ['Dividends in basic rate band', '£10,270 − £500 = £9,770 at 8.75%', '£855'],
              ['Dividends in higher rate band', '£15,000 − £10,270 = £4,730 at 33.75%', '£1,596'],
              ['Total dividend tax', '', '£2,451'],
            ]}
          />
        </CardContent>
      </Card>

      {/* Ltd company directors */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dividends for Company Directors</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Many limited company directors pay themselves using a combination of a small
            salary and dividends. The optimal strategy for 2025/26 is typically:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Salary of £12,570</strong> &mdash; uses the full Personal
              Allowance, no income tax. Employee NI is zero below the Primary Threshold.
            </li>
            <li>
              <strong>Dividends up to the basic rate band</strong> &mdash; taxed at just
              8.75% (after the £500 allowance), with no NI.
            </li>
          </ul>
          <p>
            However, remember that Corporation Tax (25% for profits over £250,000, or
            the marginal rate between £50,000&ndash;£250,000) is paid on company profits
            before dividends can be distributed.
          </p>
        </CardContent>
      </Card>

      {/* Strategies */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Strategies to Reduce Dividend Tax</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Use your ISA allowance</strong> &mdash; dividends received within
              an ISA are completely tax-free. Transfer investments into ISAs where
              possible.
            </li>
            <li>
              <strong>Split with your spouse</strong> &mdash; if your partner is in a
              lower tax band, transferring shares to them can reduce the overall dividend
              tax bill.
            </li>
            <li>
              <strong>Pension contributions</strong> &mdash; increasing pension
              contributions can lower your taxable income, potentially keeping more
              dividends in the basic rate band.
            </li>
            <li>
              <strong>Timing</strong> &mdash; if you control when dividends are paid (as
              a director), spread them across tax years to maximise use of allowances.
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 text-sm text-muted-foreground space-y-2">
          <p>
            Add your dividend income and see the tax calculated instantly.{' '}
            <a href="#income" className="text-emerald-600 font-medium hover:underline">
              Try the tax calculator &rarr;
            </a>
          </p>
          <p>
            <strong>Related guides:</strong>{' '}
            <a href="#guide/uk-income-tax-rates" className="text-emerald-600 font-medium hover:underline">
              Income Tax Rates &amp; Bands
            </a>
            {' · '}
            <a href="#guide/isa-guide" className="text-emerald-600 font-medium hover:underline">
              ISA Guide
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
