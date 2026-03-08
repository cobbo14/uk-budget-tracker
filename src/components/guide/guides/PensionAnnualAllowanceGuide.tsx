import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table } from '@/components/guide/GuideTable'


export function PensionAnnualAllowanceGuide() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">
          Pension Annual Allowance Guide UK 2024&ndash;27
        </h1>
        <p className="text-muted-foreground">
          Everything you need to know about the pension Annual Allowance &mdash; how much you
          can contribute tax-efficiently, the tapered allowance for high earners, the Money
          Purchase Annual Allowance, carry forward rules, and what happens if you exceed the limit.
        </p>
      </div>

      {/* What is the Annual Allowance? */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">What Is the Annual Allowance?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            The Annual Allowance is the maximum amount of pension savings you can make each
            tax year with tax relief. Contributions above this limit trigger an{' '}
            <strong>Annual Allowance Tax Charge</strong>.
          </p>
          <p>
            The standard Annual Allowance is <strong>£60,000</strong> for 2024/25, 2025/26,
            and 2026/27. This was increased from £40,000 in April 2023.
          </p>
          <p>
            The allowance covers the total of your own contributions, employer contributions,
            and any tax relief added by HMRC. It applies across all your pension schemes combined.
          </p>
        </CardContent>
      </Card>

      {/* Annual Allowance Rates Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Annual Allowance by Tax Year</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <Table
            headers={['Tax Year', 'Standard Annual Allowance', 'Money Purchase AA', 'Minimum Tapered AA']}
            rows={[
              ['2024/25', '£60,000', '£10,000', '£10,000'],
              ['2025/26', '£60,000', '£10,000', '£10,000'],
              ['2026/27', '£60,000', '£10,000', '£10,000'],
            ]}
          />
        </CardContent>
      </Card>

      {/* Tapered Annual Allowance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tapered Annual Allowance for High Earners</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            If you have a high income, your Annual Allowance may be reduced. The taper applies
            when <strong>both</strong> of the following conditions are met:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              Your <strong>threshold income</strong> (broadly, net income before pension
              contributions) exceeds <strong>£200,000</strong>
            </li>
            <li>
              Your <strong>adjusted income</strong> (threshold income plus employer pension
              contributions) exceeds <strong>£260,000</strong>
            </li>
          </ul>
          <p>
            For every £2 of adjusted income above £260,000, the Annual Allowance is reduced
            by £1. The minimum tapered Annual Allowance is <strong>£10,000</strong>, which
            applies at adjusted income of £360,000 or above.
          </p>
          <Table
            headers={['Adjusted Income', 'Annual Allowance']}
            rows={[
              ['Up to £260,000', '£60,000'],
              ['£280,000', '£50,000'],
              ['£300,000', '£40,000'],
              ['£320,000', '£30,000'],
              ['£340,000', '£20,000'],
              ['£360,000+', '£10,000 (minimum)'],
            ]}
          />
        </CardContent>
      </Card>

      {/* Money Purchase Annual Allowance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Money Purchase Annual Allowance (MPAA)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            If you have flexibly accessed your defined contribution pension (e.g. taken an
            income drawdown or uncrystallised funds pension lump sum), your Annual Allowance
            for further money purchase contributions is reduced to <strong>£10,000</strong>.
            This is the Money Purchase Annual Allowance.
          </p>
          <p>
            The MPAA is triggered by actions such as:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Taking income from flexi-access drawdown</li>
            <li>Taking an uncrystallised funds pension lump sum (UFPLS)</li>
            <li>Taking a small pot payment from a scheme with £10,000+</li>
          </ul>
          <p>
            The MPAA does <strong>not</strong> apply if you only take your 25% tax-free lump
            sum, purchase an annuity, or take a small pot from a scheme worth under £10,000.
          </p>
        </CardContent>
      </Card>

      {/* Carry Forward */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Carry Forward: Using Unused Allowance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            If you didn&rsquo;t use your full Annual Allowance in the previous 3 tax years,
            you can carry forward the unused amount. This lets you make larger contributions
            in a single year without triggering the Annual Allowance charge.
          </p>
          <p>
            To use carry forward:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>You must have been a member of a UK registered pension scheme in each year
              you want to carry forward from</li>
            <li>You must use the current year&rsquo;s allowance first</li>
            <li>Unused allowance from the earliest year is used first</li>
          </ul>
          <p>
            <strong>Example:</strong> if you contributed only £20,000 in each of the previous
            3 years (when the allowance was £60,000), you could have £120,000 of unused
            allowance to carry forward, allowing up to £180,000 total contributions this year
            (£60,000 current + £120,000 carry forward).
          </p>
        </CardContent>
      </Card>

      {/* Worked Example */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Worked Example: Tapering Calculation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div className="rounded-lg border p-4 bg-muted/50">
            <p className="font-medium mb-2">Scenario: £310,000 Adjusted Income</p>
            <Table
              headers={['Step', 'Detail']}
              rows={[
                ['Threshold income', '£270,000 (above £200,000 — taper applies)'],
                ['Adjusted income', '£310,000 (£270,000 + £40,000 employer contribution)'],
                ['Excess above £260,000', '£50,000'],
                ['Taper reduction (£1 per £2)', '£25,000'],
                ['Tapered Annual Allowance', '£60,000 − £25,000 = £35,000'],
                ['Total contributions made', '£40,000 (employer)'],
                ['Excess above allowance', '£40,000 − £35,000 = £5,000'],
                ['Tax charge at 45% marginal rate', '£2,250'],
              ]}
            />
          </div>
        </CardContent>
      </Card>

      {/* Annual Allowance Tax Charge */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Annual Allowance Tax Charge</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            If your total pension contributions (including employer contributions and tax
            relief) exceed your Annual Allowance, you must pay the Annual Allowance Tax
            Charge on the excess. The charge is at your marginal income tax rate.
          </p>
          <p>
            You report the excess on your Self Assessment tax return. If the charge exceeds
            £2,000, you can ask your pension scheme to pay it on your behalf using{' '}
            <strong>Scheme Pays</strong> &mdash; the scheme pays HMRC and reduces your pension
            benefits accordingly.
          </p>
          <p>
            The deadline to elect for Scheme Pays is 31 July in the year following the tax year
            (e.g. 31 July 2026 for 2024/25 excess).
          </p>
        </CardContent>
      </Card>

      {/* CTA */}
      <Card>
        <CardContent className="pt-6 text-sm text-muted-foreground space-y-2">
          <p>
            See how pension contributions can reduce your tax bill.{' '}
            <a href="#planning" className="text-emerald-600 font-medium hover:underline">
              Try the pension optimiser &rarr;
            </a>
          </p>
          <p>
            <strong>Related guides:</strong>{' '}
            <a href="#guide/salary-sacrifice-guide" className="text-emerald-600 font-medium hover:underline">
              Salary Sacrifice &rarr;
            </a>
            {' · '}
            <a href="#guide/reduce-tax-above-100k" className="text-emerald-600 font-medium hover:underline">
              Reduce Tax Above £100k &rarr;
            </a>
            {' · '}
            <a href="#guide/uk-income-tax-rates" className="text-emerald-600 font-medium hover:underline">
              UK Income Tax Rates &rarr;
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
