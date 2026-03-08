import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table } from '@/components/guide/GuideTable'


export function ChildBenefitGuide() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">
          Child Benefit &amp; High Income Child Benefit Charge (HICBC)
        </h1>
        <p className="text-muted-foreground">
          How Child Benefit works, current payment rates, the High Income Child Benefit
          Charge taper, and whether you should claim or opt out. Covers the 2024/25,
          2025/26, and 2026/27 tax years.
        </p>
      </div>

      {/* What is Child Benefit */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">What Is Child Benefit?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Child Benefit is a tax-free payment from HMRC for each child you are
            responsible for. It is paid every 4 weeks and is available regardless of
            your income &mdash; although higher earners may have to repay some or all of
            it through the High Income Child Benefit Charge.
          </p>
          <p>
            You are eligible if you are responsible for a child under 16 (or under 20 if
            they are in approved education or training).
          </p>
        </CardContent>
      </Card>

      {/* Payment rates */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Child Benefit Rates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">2024/25</p>
          <Table
            headers={['Child', 'Weekly rate', 'Annual amount']}
            rows={[
              ['Eldest/only child', '£25.60', '£1,331.20'],
              ['Each additional child', '£16.95', '£881.40'],
            ]}
          />

          <p className="font-medium text-foreground">2025/26</p>
          <Table
            headers={['Child', 'Weekly rate', 'Annual amount']}
            rows={[
              ['Eldest/only child', '£26.05', '£1,354.60'],
              ['Each additional child', '£17.25', '£897.00'],
            ]}
          />

          <p>
            For example, a family with two children in 2025/26 receives £26.05 + £17.25
            = £43.30 per week, or approximately £2,251.60 per year.
          </p>
        </CardContent>
      </Card>

      {/* HICBC */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">High Income Child Benefit Charge (HICBC)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            If either parent (or their partner) has adjusted net income above
            <strong> £60,000</strong> (from 2024/25 onwards), a tax charge claws back
            some or all of the Child Benefit. This is the High Income Child Benefit
            Charge.
          </p>
          <Table
            headers={['Income range', 'HICBC charge']}
            rows={[
              ['Below £60,000', 'No charge — keep full benefit'],
              ['£60,000 – £80,000', '1% of benefit for every £200 above £60,000'],
              ['Above £80,000', '100% — full benefit clawed back'],
            ]}
          />
          <p>
            Before April 2024, the taper started at £50,000 and was fully clawed back
            at £60,000. The thresholds were raised significantly in the 2024 Spring
            Budget.
          </p>
          <p>
            The charge is based on the <strong>higher earner&rsquo;s</strong> individual
            income, not combined household income. It is reported through Self Assessment.
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
            You earn £70,000 in 2025/26 and have two children. Your total Child Benefit
            is £2,251.60 per year.
          </p>
          <Table
            headers={['Step', 'Calculation']}
            rows={[
              ['Income above £60,000', '£70,000 − £60,000 = £10,000'],
              ['Number of £200 bands', '£10,000 ÷ £200 = 50'],
              ['Percentage clawed back', '50 × 1% = 50%'],
              ['HICBC charge', '£2,251.60 × 50% = £1,125.80'],
              ['Net Child Benefit kept', '£2,251.60 − £1,125.80 = £1,125.80'],
            ]}
          />
          <p>
            At £70,000 income, you effectively keep half of your Child Benefit. You must
            register for Self Assessment to pay the HICBC.
          </p>
        </CardContent>
      </Card>

      {/* Should you claim */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Should You Claim or Opt Out?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Even if the HICBC claws back 100% of the benefit, you should still
            <strong> claim but opt out of payments</strong>. This is because:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              The claiming parent receives <strong>National Insurance credits</strong>,
              which count towards their State Pension. This is especially important for
              parents not working or earning below the NI threshold.
            </li>
            <li>
              Your child automatically gets a <strong>National Insurance number</strong>
              at 16 if Child Benefit is claimed.
            </li>
          </ul>
          <p>
            <strong>Reducing the charge:</strong> Pension contributions and Gift Aid
            donations reduce your adjusted net income. If you can bring your income below
            £60,000 through pension contributions, you avoid the HICBC entirely.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 text-sm text-muted-foreground space-y-2">
          <p>
            See how HICBC affects your tax position.{' '}
            <a href="#settings" className="text-emerald-600 font-medium hover:underline">
              Configure Child Benefit in Settings &rarr;
            </a>
          </p>
          <p>
            <strong>Related guides:</strong>{' '}
            <a href="#guide/reduce-tax-above-100k" className="text-emerald-600 font-medium hover:underline">
              How to Reduce Tax Above £100k
            </a>
            {' · '}
            <a href="#guide/marriage-allowance-guide" className="text-emerald-600 font-medium hover:underline">
              Marriage Allowance
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
