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

export function StudentLoanGuide() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">
          Student Loan Repayment Guide UK
        </h1>
        <p className="text-muted-foreground">
          A complete guide to UK student loan repayment thresholds, rates, and plans for
          the 2024/25, 2025/26, and 2026/27 tax years. Covers Plan 1, Plan 2, Plan 4,
          Plan 5, and Postgraduate Loan repayments.
        </p>
      </div>

      {/* How repayments work */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">How Student Loan Repayments Work</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Student loan repayments are deducted automatically from your salary once you
            earn above the repayment threshold for your plan type. They are collected
            through PAYE alongside income tax and National Insurance.
          </p>
          <p>
            Repayments are calculated on income <strong>above</strong> the threshold, not
            on your total salary. If you are self-employed, you repay through your
            Self Assessment tax return.
          </p>
          <p>
            Student loan repayments are <strong>not</strong> a tax &mdash; they do not
            reduce your taxable income. However, they do reduce your take-home pay and
            should be factored into your budget planning.
          </p>
        </CardContent>
      </Card>

      {/* Plan types */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Repayment Plan Types</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <Table
            headers={['Plan', 'Who has it', 'Repayment rate']}
            rows={[
              ['Plan 1', 'English/Welsh students who started before Sept 2012, or NI students', '9%'],
              ['Plan 2', 'English/Welsh students who started after Sept 2012', '9%'],
              ['Plan 4', 'Scottish students', '9%'],
              ['Plan 5', 'English/Welsh students starting from Sept 2023', '9%'],
              ['Postgraduate Loan', 'Postgraduate Master\'s or Doctoral Loan', '6%'],
            ]}
          />
          <p>
            If you have both an undergraduate and postgraduate loan, both are repaid
            simultaneously &mdash; meaning you could pay 9% + 6% = 15% on income above
            the relevant thresholds.
          </p>
        </CardContent>
      </Card>

      {/* Thresholds */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Repayment Thresholds</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">2024/25</p>
          <Table
            headers={['Plan', 'Annual threshold', 'Monthly threshold']}
            rows={[
              ['Plan 1', '£24,990', '£2,082'],
              ['Plan 2', '£27,295', '£2,274'],
              ['Plan 4', '£31,395', '£2,616'],
              ['Plan 5', '£25,000', '£2,083'],
              ['Postgraduate', '£21,000', '£1,750'],
            ]}
          />

          <p className="font-medium text-foreground">2025/26</p>
          <Table
            headers={['Plan', 'Annual threshold', 'Monthly threshold']}
            rows={[
              ['Plan 1', '£26,065', '£2,172'],
              ['Plan 2', '£28,470', '£2,372'],
              ['Plan 4', '£32,745', '£2,728'],
              ['Plan 5', '£25,000', '£2,083'],
              ['Postgraduate', '£21,000', '£1,750'],
            ]}
          />

          <p className="font-medium text-foreground">2026/27</p>
          <Table
            headers={['Plan', 'Annual threshold', 'Monthly threshold']}
            rows={[
              ['Plan 1', '£26,900', '£2,241'],
              ['Plan 2', '£29,385', '£2,448'],
              ['Plan 4', '£33,795', '£2,816'],
              ['Plan 5', '£25,000', '£2,083'],
              ['Postgraduate', '£21,000', '£1,750'],
            ]}
          />
        </CardContent>
      </Card>

      {/* Worked example */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Worked Example</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            You earn £35,000 in 2025/26 and have a Plan 2 student loan plus a
            Postgraduate Loan.
          </p>
          <Table
            headers={['Loan', 'Threshold', 'Amount above', 'Rate', 'Annual repayment']}
            rows={[
              ['Plan 2', '£28,470', '£6,530', '9%', '£588'],
              ['Postgraduate', '£21,000', '£14,000', '6%', '£840'],
              ['Total', '', '', '', '£1,428'],
            ]}
          />
          <p>
            That&rsquo;s £119/month in student loan repayments on top of your income tax
            and National Insurance. Your actual take-home pay is reduced accordingly.
          </p>
        </CardContent>
      </Card>

      {/* Write-off */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">When Is Your Loan Written Off?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <Table
            headers={['Plan', 'Written off after']}
            rows={[
              ['Plan 1', '25 years after the April you were first due to repay'],
              ['Plan 2', '30 years after the April you were first due to repay'],
              ['Plan 4', '30 years after the April you were first due to repay'],
              ['Plan 5', '40 years after graduation'],
              ['Postgraduate', '30 years after the April you were first due to repay'],
            ]}
          />
          <p>
            Any remaining balance is written off after the relevant period. You do not
            have to pay anything further. The write-off is not treated as income and has
            no tax implications.
          </p>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Should You Overpay Your Student Loan?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            For most Plan 2 and Plan 5 borrowers, the answer is <strong>no</strong>.
            Since the loan is written off after 30&ndash;40 years and the interest rate
            is linked to RPI, most graduates will never repay the full amount. Overpaying
            just means paying more overall.
          </p>
          <p>
            Overpaying may make sense if you have a <strong>Plan 1</strong> loan with a
            small remaining balance, or if you are a high earner who would fully repay
            before the write-off date. In these cases, voluntary repayments reduce the
            total interest you pay.
          </p>
          <p>
            Salary sacrifice pension contributions reduce your gross pay, which can lower
            your student loan repayments &mdash; since repayments are based on income
            above the threshold.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 text-sm text-muted-foreground space-y-2">
          <p>
            See how student loan repayments affect your take-home pay.{' '}
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
            <a href="#guide/salary-sacrifice-guide" className="text-emerald-600 font-medium hover:underline">
              Salary Sacrifice
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
