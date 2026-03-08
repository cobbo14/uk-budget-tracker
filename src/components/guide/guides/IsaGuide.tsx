import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table } from '@/components/guide/GuideTable'


export function IsaGuide() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">
          ISA Guide UK &mdash; Types, Allowances &amp; Rules
        </h1>
        <p className="text-muted-foreground">
          Everything you need to know about Individual Savings Accounts (ISAs) in the UK.
          Covers Cash ISAs, Stocks &amp; Shares ISAs, Lifetime ISAs, and Innovative
          Finance ISAs for the 2024/25, 2025/26, and 2026/27 tax years.
        </p>
      </div>

      {/* What is an ISA */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">What Is an ISA?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            An Individual Savings Account (ISA) is a tax-free wrapper for your savings
            and investments. Any interest, dividends, or capital gains earned within an
            ISA are <strong>completely free from UK tax</strong>.
          </p>
          <p>
            You can contribute up to <strong>£20,000</strong> per tax year across all
            your ISA accounts combined. This is the annual ISA allowance and has remained
            unchanged since 2017/18.
          </p>
          <p>
            You must be a UK resident and at least 18 years old to open a Stocks &amp;
            Shares, Cash, or Innovative Finance ISA (16 for Cash ISAs with some
            providers). Lifetime ISAs are available to those aged 18&ndash;39.
          </p>
        </CardContent>
      </Card>

      {/* ISA types */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Types of ISA</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <Table
            headers={['ISA Type', 'What it holds', 'Key features']}
            rows={[
              ['Cash ISA', 'Cash savings', 'Easy access or fixed-rate. No risk to capital.'],
              ['Stocks & Shares ISA', 'Funds, shares, bonds, ETFs', 'Higher potential returns. Capital at risk.'],
              ['Lifetime ISA (LISA)', 'Cash or investments', '25% government bonus up to £1,000/year. For first home or retirement.'],
              ['Innovative Finance ISA', 'Peer-to-peer loans', 'Higher interest rates. Higher risk. Capital not guaranteed.'],
            ]}
          />
          <p>
            You can split your £20,000 allowance across any combination of ISA types in
            a single tax year. For example, £10,000 in a Cash ISA and £10,000 in a
            Stocks &amp; Shares ISA.
          </p>
        </CardContent>
      </Card>

      {/* LISA details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Lifetime ISA (LISA)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            The LISA has a sub-limit of <strong>£4,000 per year</strong> (which counts
            towards your £20,000 overall ISA allowance). The government adds a
            25% bonus on contributions, up to £1,000 per year.
          </p>
          <p>
            Funds can only be withdrawn penalty-free for:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Purchasing your first home (up to £450,000)</li>
            <li>After age 60</li>
            <li>Terminal illness</li>
          </ul>
          <p>
            Withdrawing for any other reason incurs a <strong>25% penalty</strong> on
            the amount withdrawn, which effectively means you lose your bonus and some of
            your own contributions.
          </p>
        </CardContent>
      </Card>

      {/* Tax benefits */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">ISA Tax Benefits</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <Table
            headers={['Tax', 'Outside ISA', 'Inside ISA']}
            rows={[
              ['Income Tax on interest', 'Taxable (above PSA)', 'Tax-free'],
              ['Dividend Tax', 'Taxable (above £500 allowance)', 'Tax-free'],
              ['Capital Gains Tax', 'Taxable (above £3,000 AEA)', 'Tax-free'],
            ]}
          />
          <p>
            The tax advantages compound over time. For higher and additional-rate
            taxpayers, the savings are particularly significant &mdash; dividends that
            would be taxed at 33.75% or 39.35% are completely free within an ISA.
          </p>
        </CardContent>
      </Card>

      {/* ISA strategies */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">ISA Strategy Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Use it or lose it</strong> &mdash; the £20,000 allowance does not
              carry forward. Unused allowance from one tax year is gone forever.
            </li>
            <li>
              <strong>Prioritise growth assets in ISAs</strong> &mdash; put investments
              with the highest expected growth (and therefore the most tax to shelter)
              inside your ISA first.
            </li>
            <li>
              <strong>Bed and ISA</strong> &mdash; sell investments held outside an ISA
              and repurchase them inside your ISA. This uses your annual ISA allowance
              but shelters future growth from tax.
            </li>
            <li>
              <strong>Couples: double the allowance</strong> &mdash; each partner has
              their own £20,000 ISA allowance. A couple can shelter up to £40,000 per
              tax year between them.
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Key numbers */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Key ISA Numbers 2024&ndash;27</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <Table
            headers={['Limit', 'Amount']}
            rows={[
              ['Annual ISA allowance', '£20,000'],
              ['LISA annual sub-limit', '£4,000'],
              ['LISA government bonus', '25% (up to £1,000/year)'],
              ['LISA withdrawal penalty', '25% of amount withdrawn'],
              ['LISA property price cap', '£450,000'],
              ['Minimum age (Cash ISA)', '16'],
              ['Minimum age (other ISAs)', '18'],
              ['LISA age range', '18–39 to open, contribute until 50'],
            ]}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 text-sm text-muted-foreground space-y-2">
          <p>
            Track your ISA contributions and remaining allowance.{' '}
            <a href="#summary" className="text-emerald-600 font-medium hover:underline">
              Go to ISA Tracker &rarr;
            </a>
          </p>
          <p>
            <strong>Related guides:</strong>{' '}
            <a href="#guide/capital-gains-tax-guide" className="text-emerald-600 font-medium hover:underline">
              Capital Gains Tax Guide
            </a>
            {' · '}
            <a href="#guide/dividend-tax-guide" className="text-emerald-600 font-medium hover:underline">
              Dividend Tax Guide
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
