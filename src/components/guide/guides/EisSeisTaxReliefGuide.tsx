import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table } from '@/components/guide/GuideTable'


export function EisSeisTaxReliefGuide() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">
          EIS, SEIS &amp; VCT Tax Relief Guide UK
        </h1>
        <p className="text-muted-foreground">
          How the Enterprise Investment Scheme (EIS), Seed Enterprise Investment Scheme
          (SEIS), and Venture Capital Trusts (VCT) work, the tax reliefs available, and
          the risks involved.
        </p>
      </div>

      {/* Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            EIS, SEIS, and VCTs are government-backed schemes designed to encourage
            investment in small, high-risk UK companies. In return for the risk, investors
            receive generous income tax relief, capital gains tax benefits, and loss
            relief.
          </p>
          <p>
            These reliefs can significantly reduce your overall tax bill, but the
            investments themselves carry <strong>substantial risk</strong> &mdash; many
            qualifying companies are early-stage startups with a high failure rate.
          </p>
        </CardContent>
      </Card>

      {/* Comparison table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">EIS vs SEIS vs VCT at a Glance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <Table
            headers={['Feature', 'EIS', 'SEIS', 'VCT']}
            rows={[
              ['Income tax relief', '30%', '50%', '30%'],
              ['Annual investment limit', '£1,000,000 (£2m for knowledge-intensive)', '£200,000', '£200,000'],
              ['Minimum holding period', '3 years', '3 years', '5 years'],
              ['CGT exemption on gains', 'Yes (after 3 years)', 'Yes (after 3 years)', 'Yes'],
              ['CGT deferral relief', 'Yes', 'Yes (reinvestment of gains)', 'No'],
              ['Loss relief', 'Yes', 'Yes', 'No'],
              ['Tax-free dividends', 'No', 'No', 'Yes'],
              ['Carry back to previous year', 'Yes (1 year)', 'Yes (1 year)', 'No'],
            ]}
          />
        </CardContent>
      </Card>

      {/* EIS details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Enterprise Investment Scheme (EIS)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            EIS provides <strong>30% income tax relief</strong> on investments up to
            £1 million per year (£2 million if investing in knowledge-intensive
            companies). This means investing £50,000 reduces your income tax bill by
            £15,000.
          </p>
          <p>
            To keep the relief, you must hold the shares for at least 3 years. If you
            sell early, the relief is clawed back.
          </p>
          <p className="font-medium text-foreground">CGT Deferral</p>
          <p>
            You can defer capital gains from any asset by reinvesting the gain into
            EIS-qualifying shares. The deferred gain becomes chargeable when the EIS
            shares are disposed of.
          </p>
          <p className="font-medium text-foreground">Loss Relief</p>
          <p>
            If the company fails, you can offset the loss (minus the income tax relief
            received) against your income tax or capital gains tax. For a higher-rate
            taxpayer, this means the effective downside is around 38.5p per £1 invested.
          </p>
        </CardContent>
      </Card>

      {/* SEIS details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Seed Enterprise Investment Scheme (SEIS)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            SEIS targets very early-stage companies and offers a higher income tax relief
            of <strong>50%</strong> on investments up to £200,000 per year. Investing
            £20,000 gives you £10,000 off your tax bill.
          </p>
          <p>
            SEIS also provides <strong>CGT reinvestment relief</strong>: if you reinvest
            a capital gain into SEIS shares, 50% of that gain is exempt from CGT
            (regardless of whether the SEIS shares themselves are profitable).
          </p>
          <p>
            The qualifying companies must be less than 3 years old, have fewer than 25
            employees, and have gross assets under £350,000.
          </p>
        </CardContent>
      </Card>

      {/* VCT details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Venture Capital Trusts (VCT)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            VCTs are listed funds that invest in a portfolio of small companies. They
            offer <strong>30% income tax relief</strong> on new shares (up to £200,000
            per year), <strong>tax-free dividends</strong>, and <strong>CGT-free
            gains</strong> on disposal.
          </p>
          <p>
            Unlike EIS/SEIS, VCTs are managed funds, so you do not choose individual
            companies. The minimum holding period for income tax relief is 5 years.
          </p>
          <p>
            VCTs do <strong>not</strong> offer loss relief or CGT deferral. However, the
            tax-free dividends make them attractive for income-seeking investors.
          </p>
        </CardContent>
      </Card>

      {/* Worked example */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Worked Example: EIS Investment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            You are a higher-rate taxpayer with a £50,000 capital gain to defer. You
            invest £50,000 into an EIS-qualifying company.
          </p>
          <Table
            headers={['Benefit', 'Amount']}
            rows={[
              ['Income tax relief (30%)', '£15,000 off your tax bill'],
              ['CGT deferred', '£50,000 gain deferred (saves £12,000 at 24%)'],
              ['Total immediate tax benefit', '£27,000'],
            ]}
          />
          <p>
            If the investment doubles after 3 years, the gain on EIS shares is CGT-free.
            If the company fails, you claim loss relief on the remaining £35,000
            (£50,000 minus £15,000 income tax relief already received), saving a further
            £14,000 at 40% income tax.
          </p>
        </CardContent>
      </Card>

      {/* Risks */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Key Risks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Company failure</strong> &mdash; many qualifying companies are
              early-stage and may fail entirely. Loss relief mitigates but does not
              eliminate this risk.
            </li>
            <li>
              <strong>Illiquidity</strong> &mdash; EIS/SEIS shares are typically unlisted
              and difficult to sell. VCT shares are listed but often trade at a discount.
            </li>
            <li>
              <strong>Clawback</strong> &mdash; selling before the minimum holding period
              means losing the income tax relief.
            </li>
            <li>
              <strong>Tax tail wagging the investment dog</strong> &mdash; never invest
              purely for the tax relief. The underlying investment must make sense on its
              own merits.
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 text-sm text-muted-foreground space-y-2">
          <p>
            Track your EIS, SEIS, and VCT tax reliefs.{' '}
            <a href="#settings" className="text-emerald-600 font-medium hover:underline">
              Configure in Settings &rarr;
            </a>
          </p>
          <p>
            <strong>Related guides:</strong>{' '}
            <a href="#guide/capital-gains-tax-guide" className="text-emerald-600 font-medium hover:underline">
              Capital Gains Tax Guide
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
