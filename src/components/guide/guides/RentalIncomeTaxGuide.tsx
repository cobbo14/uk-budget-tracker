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

export function RentalIncomeTaxGuide() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">
          Rental Income Tax Guide UK 2024&ndash;27
        </h1>
        <p className="text-muted-foreground">
          How UK rental income is taxed, allowable expenses, mortgage interest restrictions
          under Section 24, Rent-a-Room relief, the property allowance, and reporting
          requirements for buy-to-let landlords.
        </p>
      </div>

      {/* How Rental Income is Taxed */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">How Rental Income Is Taxed</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Rental income from UK property is added to your other income (employment, pensions,
            etc.) and taxed at your marginal income tax rate. The same tax bands apply:
          </p>
          <Table
            headers={['Tax Band', 'Rate on Rental Profits']}
            rows={[
              ['Basic Rate (up to £50,270)', '20%'],
              ['Higher Rate (£50,271–£125,140)', '40%'],
              ['Additional Rate (over £125,140)', '45%'],
            ]}
          />
          <p>
            You are taxed on your <strong>rental profit</strong> &mdash; gross rental income
            minus allowable expenses. If you own property jointly, you are each taxed on your
            share of the profits.
          </p>
        </CardContent>
      </Card>

      {/* Property Allowance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Property Allowance (£1,000)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            If your total property income is <strong>£1,000 or less</strong> per tax year, it
            is completely tax-free under the property allowance. You do not need to report it
            to HMRC.
          </p>
          <p>
            If your property income exceeds £1,000, you can choose to either:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Deduct the £1,000 allowance instead of your actual expenses, or</li>
            <li>Deduct your actual allowable expenses (see below)</li>
          </ul>
          <p>
            The property allowance is useful if your expenses are minimal. You cannot claim
            both the £1,000 allowance and actual expenses.
          </p>
        </CardContent>
      </Card>

      {/* Allowable Expenses */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Allowable Expenses</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            You can deduct the following expenses from your rental income:
          </p>
          <Table
            headers={['Expense', 'Detail']}
            rows={[
              ['Letting agent fees', 'Management fees, tenant finding, rent collection'],
              ['Repairs & maintenance', 'Like-for-like repairs (not improvements)'],
              ['Insurance', 'Buildings, contents, and landlord insurance'],
              ['Council tax & utilities', 'If paid by you (not the tenant)'],
              ['Ground rent & service charges', 'Leasehold property charges'],
              ['Accountancy fees', 'Costs of preparing rental accounts'],
              ['Legal fees', 'For renewing leases (under 50 years) or evicting tenants'],
              ['Travel costs', 'Journeys to inspect or manage the property'],
              ['Replacement of domestic items', 'Replacing furniture, appliances on a like-for-like basis'],
            ]}
          />
          <p>
            You <strong>cannot</strong> deduct the cost of property improvements (e.g.
            extensions, new kitchens that upgrade the property). These are capital costs
            and may reduce your Capital Gains Tax liability when you sell.
          </p>
        </CardContent>
      </Card>

      {/* Section 24 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Section 24: Mortgage Interest Restriction</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Since April 2020, individual landlords can no longer deduct mortgage interest as
            an expense from rental income. Instead, you receive a <strong>basic rate (20%)
            tax credit</strong> on your mortgage interest payments.
          </p>
          <p>
            This means higher and additional rate taxpayers pay significantly more tax on
            rental income than before Section 24 was introduced.
          </p>
          <div className="rounded-lg border p-4 bg-muted/50">
            <p className="font-medium mb-2">Worked Example: Section 24 Impact</p>
            <Table
              headers={['', 'Before Section 24', 'After Section 24']}
              rows={[
                ['Rental income', '£20,000', '£20,000'],
                ['Mortgage interest', '£8,000', '£8,000'],
                ['Taxable profit', '£12,000', '£20,000'],
                ['Tax at 40% (higher rate)', '£4,800', '£8,000'],
                ['Less 20% tax credit on interest', '—', '−£1,600'],
                ['Net tax payable', '£4,800', '£6,400'],
              ]}
            />
            <p className="mt-2">
              A higher-rate taxpayer pays <strong>£1,600 more</strong> per year under
              Section 24 in this example.
            </p>
          </div>
          <p>
            Section 24 does <strong>not</strong> apply to limited companies, which can still
            deduct mortgage interest in full. This is one reason many landlords have
            incorporated.
          </p>
        </CardContent>
      </Card>

      {/* Furnished Holiday Let */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Furnished Holiday Lettings (FHL)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            The special FHL tax regime &mdash; which allowed full mortgage interest deduction,
            capital allowances, and pension-relevant earnings treatment &mdash; was{' '}
            <strong>abolished from April 2025</strong>.
          </p>
          <p>
            From 2025/26, furnished holiday lets are taxed in the same way as other rental
            income. This means Section 24 mortgage interest restrictions apply, and FHL income
            no longer counts as relevant earnings for pension contributions.
          </p>
          <p>
            Transitional rules allow capital allowances claims made before April 2025 to
            continue until fully written down.
          </p>
        </CardContent>
      </Card>

      {/* Rent-a-Room */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Rent-a-Room Relief</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            If you let a furnished room in your main home, you can earn up to{' '}
            <strong>£7,500</strong> per tax year tax-free under Rent-a-Room relief. This
            is automatic &mdash; you do not need to claim it.
          </p>
          <p>
            If your income exceeds £7,500, you can either:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Deduct the £7,500 allowance from your gross income and pay tax on the rest, or</li>
            <li>Calculate your taxable profit using actual expenses instead</li>
          </ul>
          <p>
            Rent-a-Room relief applies to lodgers in your own home. It does not apply to
            separate self-contained flats or properties you do not live in.
          </p>
        </CardContent>
      </Card>

      {/* Reporting Requirements */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Reporting Requirements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            If your property income exceeds £1,000 (or £2,500 for total gross income from
            property), you must register for <strong>Self Assessment</strong> and file a tax
            return each year.
          </p>
          <p>
            Rental income is reported on the <strong>UK Property pages (SA105)</strong> of
            the Self Assessment form. The deadline is 31 January following the end of the tax
            year.
          </p>
          <p>
            You should keep records of all rental income and expenses for at least{' '}
            <strong>5 years</strong> after the Self Assessment deadline.
          </p>
        </CardContent>
      </Card>

      {/* CTA */}
      <Card>
        <CardContent className="pt-6 text-sm text-muted-foreground space-y-2">
          <p>
            Model your total income including rental profits.{' '}
            <a href="#income" className="text-emerald-600 font-medium hover:underline">
              Try the income calculator &rarr;
            </a>
          </p>
          <p>
            <strong>Related guides:</strong>{' '}
            <a href="#guide/uk-income-tax-rates" className="text-emerald-600 font-medium hover:underline">
              UK Income Tax Rates &rarr;
            </a>
            {' · '}
            <a href="#guide/self-employment-tax-guide" className="text-emerald-600 font-medium hover:underline">
              Self-Employment Tax &rarr;
            </a>
            {' · '}
            <a href="#guide/capital-gains-tax-guide" className="text-emerald-600 font-medium hover:underline">
              Capital Gains Tax &rarr;
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
