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

export function SalarySacrificeGuide() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">
          Salary Sacrifice: Is It Worth It?
        </h1>
        <p className="text-muted-foreground">
          Salary sacrifice is one of the most effective ways to boost your pension and reduce
          your tax bill in the UK. This guide explains how it works, how much you can save,
          and when it makes sense to use it.
        </p>
      </div>

      {/* How it works */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">How Salary Sacrifice Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            In a salary sacrifice arrangement, you agree to give up part of your contractual
            salary in exchange for a non-cash benefit &mdash; most commonly an employer
            pension contribution. Because your gross salary is reduced <em>before</em> tax
            and National Insurance are calculated, you pay less of both.
          </p>
          <p>
            Unlike relief-at-source pension contributions (where you contribute from net pay
            and the pension provider reclaims 20% basic rate tax), salary sacrifice also
            saves you <strong>employee National Insurance at 8%</strong> and often saves your
            employer 13.8% employer NI too.
          </p>
          <p>
            Your employer pays the sacrificed amount directly into your pension. The total
            contribution is treated as an employer contribution for tax purposes.
          </p>
        </CardContent>
      </Card>

      {/* Tax & NI savings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tax &amp; NI Savings Compared</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            The savings depend on your marginal tax rate. Here&rsquo;s what you save for every
            £1,000 sacrificed into a pension:
          </p>
          <Table
            headers={['Tax band', 'Income Tax saved', 'Employee NI saved', 'Total saved', 'Cost to you']}
            rows={[
              ['Basic Rate (20%)', '£200', '£80', '£280', '£720'],
              ['Higher Rate (40%)', '£400', '£80', '£480', '£520'],
              ['Additional Rate (45%)', '£450', '£20*', '£470', '£530'],
            ]}
          />
          <p className="text-xs">
            * Above the Upper Earnings Limit (£50,270), employee NI is 2% rather than 8%.
          </p>
          <p>
            Compare this with a personal pension contribution (relief at source): you get
            income tax relief but <strong>no NI saving</strong>. Salary sacrifice consistently
            delivers better value, especially for higher-rate taxpayers.
          </p>
        </CardContent>
      </Card>

      {/* Worked example */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Worked Example: £50,000 Salary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            A basic-rate taxpayer on £50,000 sacrifices £5,000 into their pension:
          </p>
          <Table
            headers={['', 'Without sacrifice', 'With £5k sacrifice']}
            rows={[
              ['Gross salary', '£50,000', '£45,000'],
              ['Income Tax', '£7,486', '£6,486'],
              ['Employee NI', '£2,994', '£2,594'],
              ['Take-home pay', '£39,520', '£35,920'],
              ['Pension contribution', '£0', '£5,000'],
              ['Take-home + pension', '£39,520', '£40,920'],
            ]}
          />
          <p>
            The sacrifice costs £3,600 in reduced take-home pay but adds £5,000 to the
            pension &mdash; an effective gain of <strong>£1,400</strong> (£1,000 income tax
            + £400 NI saved).
          </p>
        </CardContent>
      </Card>

      {/* Types of sacrifice */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Types of Salary Sacrifice</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Pension is the most common use, but salary sacrifice can also be used for:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Cycle-to-work scheme</strong> &mdash; sacrifice spread over 12 months
              to lease a bicycle and accessories, saving tax and NI on the cost.
            </li>
            <li>
              <strong>Electric vehicle (EV) scheme</strong> &mdash; lease a new EV through
              your employer. The benefit-in-kind rate for electric cars is just 2% (2024/25),
              3% (2025/26), and 4% (2026/27), making this extremely tax-efficient compared
              to a personal lease.
            </li>
            <li>
              <strong>Childcare vouchers</strong> &mdash; legacy schemes (closed to new
              joiners since October 2018) still save tax and NI for existing members.
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Who benefits most */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Who Benefits Most?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Higher and additional rate taxpayers</strong> &mdash; the combined
              tax and NI saving is largest. At 40% tax + 8% NI, you save 48p for every £1
              sacrificed below the Upper Earnings Limit.
            </li>
            <li>
              <strong>Earners between £100,000 and £125,140</strong> &mdash; salary sacrifice
              can bring adjusted net income below £100,000, restoring the Personal Allowance
              and avoiding the{' '}
              <a href="#guide/reduce-tax-above-100k" className="text-emerald-600 font-medium hover:underline">
                60% tax trap
              </a>.
            </li>
            <li>
              <strong>Earners near £60,000</strong> &mdash; sacrificing enough to stay below
              £60,000 can avoid the High Income Child Benefit Charge if you or your partner
              claim Child Benefit.
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Watch outs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Things to Watch Out For</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>National Minimum Wage</strong> &mdash; your post-sacrifice salary
              must not fall below the NMW. Your employer should prevent this automatically.
            </li>
            <li>
              <strong>Pension Annual Allowance</strong> &mdash; total pension contributions
              (including employer contributions) are limited to £60,000 per year (or 100%
              of earnings, whichever is lower). Unused allowance can be carried forward up
              to 3 years.
            </li>
            <li>
              <strong>Mortgage applications</strong> &mdash; some lenders use contractual
              salary (post-sacrifice) rather than original salary when assessing affordability.
              Check with your lender before making large sacrifices.
            </li>
            <li>
              <strong>Salary-linked benefits</strong> &mdash; life insurance, income
              protection, and redundancy pay may be based on your reduced salary. Check your
              employer&rsquo;s policy.
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 text-sm text-muted-foreground space-y-2">
          <p>
            Model salary sacrifice and see the impact on your tax bill instantly.{' '}
            <a href="#income" className="text-emerald-600 font-medium hover:underline">
              Try the calculator &rarr;
            </a>
          </p>
          <p>
            <strong>Related guide:</strong>{' '}
            <a href="#guide/uk-income-tax-rates" className="text-emerald-600 font-medium hover:underline">
              UK Income Tax Rates &amp; Bands 2024&ndash;27 &rarr;
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
