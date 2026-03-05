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

export function ReduceTaxAbove100k() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">
          How to Reduce Tax Above £100k
        </h1>
        <p className="text-muted-foreground">
          If you earn between £100,000 and £125,140 you face an effective 60% marginal tax
          rate &mdash; one of the highest in the UK tax system. This guide explains why it
          happens and the most effective strategies to reduce it.
        </p>
      </div>

      {/* The 60% trap */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">The 60% Tax Trap Explained</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            The Personal Allowance of £12,570 is reduced by £1 for every £2 of adjusted net
            income above £100,000. This means that for every additional £1 you earn between
            £100,000 and £125,140:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>You pay <strong>40% income tax</strong> on the extra £1</li>
            <li>You lose 50p of Personal Allowance, which was tax-free</li>
            <li>That 50p is now taxed at 40%, costing you an extra <strong>20p</strong></li>
            <li>Total marginal rate: <strong>60%</strong> (plus 2% employee NI = 62%)</li>
          </ul>
          <p>
            This means someone earning £125,140 takes home barely more than someone earning
            £100,000 &mdash; despite earning £25,140 more gross.
          </p>
        </CardContent>
      </Card>

      {/* Marginal rate table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Marginal Tax Rates by Income Band</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <Table
            headers={['Income band', 'Income Tax', 'Employee NI', 'Effective marginal rate']}
            rows={[
              ['£12,571 – £50,270', '20%', '8%', '28%'],
              ['£50,271 – £100,000', '40%', '2%', '42%'],
              ['£100,001 – £125,140', '40% + 20% taper', '2%', '62%'],
              ['£125,141 – £150,000', '40%', '2%', '42%'],
              ['Over £150,000', '45%', '2%', '47%'],
            ]}
          />
          <p>
            Notice the &ldquo;hump&rdquo;: you pay a higher marginal rate between £100k and
            £125k than at any other income level, including incomes above £150,000.
          </p>
        </CardContent>
      </Card>

      {/* Strategy 1: Pension */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Strategy 1: Pension Contributions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            The single most effective strategy. Pension contributions reduce your adjusted
            net income, which can keep you below the £100,000 threshold and preserve your
            full Personal Allowance.
          </p>
          <p className="font-medium text-foreground">Worked Example: £120,000 Salary</p>
          <Table
            headers={['', 'No pension', 'With £20k sacrifice']}
            rows={[
              ['Gross salary', '£120,000', '£100,000'],
              ['Personal Allowance', '£2,570*', '£12,570'],
              ['Income Tax', '£35,796', '£22,432'],
              ['Employee NI', '£4,794', '£3,194'],
              ['Take-home pay', '£79,410', '£74,374'],
              ['Pension pot', '£0', '£20,000'],
              ['Take-home + pension', '£79,410', '£94,374'],
            ]}
          />
          <p className="text-xs">
            * At £120,000, the Personal Allowance is reduced to £2,570 (£12,570 &minus;
            (£120,000 &minus; £100,000) &divide; 2).
          </p>
          <p>
            By sacrificing £20,000 into a pension, the take-home only drops by £5,036 &mdash;
            but the pension receives the full £20,000. The net benefit is{' '}
            <strong>£14,964</strong>, driven by the restoration of the Personal Allowance and
            NI savings.
          </p>
          <p>
            <a href="#guide/salary-sacrifice-guide" className="text-emerald-600 font-medium hover:underline">
              Read more about salary sacrifice &rarr;
            </a>
          </p>
        </CardContent>
      </Card>

      {/* Strategy 2: Gift Aid */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Strategy 2: Gift Aid Donations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Charitable donations made under Gift Aid extend your basic rate band and reduce
            your adjusted net income. If you donate £10,000 (gross) under Gift Aid, your
            adjusted net income drops by £10,000 for Personal Allowance taper purposes.
          </p>
          <p>
            This is most effective if you were going to donate anyway. The charity receives
            the basic rate tax top-up, and you reclaim the difference between your marginal
            rate (60% in the taper zone) and basic rate (20%) through self-assessment.
          </p>
        </CardContent>
      </Card>

      {/* Strategy 3: Timing */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Strategy 3: Income Timing &amp; Structuring</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Defer bonuses</strong> &mdash; if your employer allows it, deferring a
              bonus into the next tax year can keep this year&rsquo;s income below £100,000.
            </li>
            <li>
              <strong>Use ISAs</strong> &mdash; savings and investment income within ISAs
              does not count towards adjusted net income, so shifting savings into ISAs can
              help stay below the threshold.
            </li>
            <li>
              <strong>Trading income allowance</strong> &mdash; if you have small
              self-employment income alongside your salary, you may be able to use the £1,000
              trading allowance to reduce adjusted income.
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Key numbers */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Key Numbers to Remember</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <Table
            headers={['Threshold', 'Amount', 'Why it matters']}
            rows={[
              ['Personal Allowance taper starts', '£100,000', 'Effective 60% tax rate begins'],
              ['Personal Allowance fully lost', '£125,140', '60% trap ends, rate drops to 40%'],
              ['Pension Annual Allowance', '£60,000', 'Max pension contribution per year'],
              ['Pension AA taper starts', '£260,000', 'Allowance reduces above this'],
              ['Child Benefit charge starts', '£60,000', 'HICBC taper begins'],
            ]}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 text-sm text-muted-foreground space-y-2">
          <p>
            See exactly how much pension you need to contribute to avoid the 60% trap.{' '}
            <a href="#planning" className="text-emerald-600 font-medium hover:underline">
              Use the pension optimiser &rarr;
            </a>
          </p>
          <p>
            <strong>Related guides:</strong>{' '}
            <a href="#guide/capital-gains-tax-guide" className="text-emerald-600 font-medium hover:underline">
              Capital Gains Tax Guide
            </a>
            {' · '}
            <a href="#guide/uk-income-tax-rates" className="text-emerald-600 font-medium hover:underline">
              Income Tax Rates &amp; Bands
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
