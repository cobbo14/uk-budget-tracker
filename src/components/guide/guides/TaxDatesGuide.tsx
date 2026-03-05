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

export function TaxDatesGuide() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">
          UK Tax Year Dates &amp; Deadlines
        </h1>
        <p className="text-muted-foreground">
          Key dates for the UK tax year, Self Assessment deadlines, payment dates,
          penalties for late filing and payment, and a month-by-month calendar of
          important tax events.
        </p>
      </div>

      {/* Tax year basics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">The UK Tax Year</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            The UK tax year runs from <strong>6 April</strong> to{' '}
            <strong>5 April</strong> the following year. For example, the 2025/26 tax
            year runs from 6 April 2025 to 5 April 2026.
          </p>
          <p>
            This unusual start date is a historical quirk dating back to 1752 when
            Britain switched from the Julian to Gregorian calendar. Most tax planning
            revolves around these dates &mdash; using allowances before 5 April and
            meeting filing deadlines after the year ends.
          </p>
        </CardContent>
      </Card>

      {/* Self Assessment deadlines */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Self Assessment Deadlines</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            If you need to file a Self Assessment tax return (self-employed, rental
            income, income over £150,000, etc.), these are the key dates:
          </p>
          <Table
            headers={['Deadline', 'Date', 'Details']}
            rows={[
              ['Register for SA', '5 October', 'Register by 5 Oct after the tax year you need to file for'],
              ['Paper return', '31 October', 'File paper return for the previous tax year'],
              ['Online return', '31 January', 'File online return for the previous tax year'],
              ['Pay tax owed', '31 January', 'Pay any tax due for the previous tax year'],
              ['2nd payment on account', '31 July', 'Second instalment towards current year\'s tax'],
            ]}
          />
          <p>
            For example, for the 2025/26 tax year (ending 5 April 2026):
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Online filing deadline: 31 January 2027</li>
            <li>Payment deadline: 31 January 2027</li>
            <li>2nd payment on account: 31 July 2027</li>
          </ul>
        </CardContent>
      </Card>

      {/* Penalties */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Late Filing &amp; Payment Penalties</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Late Filing Penalties</p>
          <Table
            headers={['How late', 'Penalty']}
            rows={[
              ['1 day late', '£100 fixed penalty'],
              ['3 months late', '£10/day for up to 90 days (max £900)'],
              ['6 months late', '5% of tax due or £300 (whichever is higher)'],
              ['12 months late', '5% of tax due or £300 (higher), or up to 100% in serious cases'],
            ]}
          />

          <p className="font-medium text-foreground">Late Payment Penalties</p>
          <Table
            headers={['How late', 'Penalty']}
            rows={[
              ['30 days late', '5% of tax unpaid'],
              ['6 months late', 'Further 5% of tax still unpaid'],
              ['12 months late', 'Further 5% of tax still unpaid'],
            ]}
          />
          <p>
            Interest is also charged on any late payments at the HMRC late payment
            interest rate (Bank of England base rate + 2.5%).
          </p>
        </CardContent>
      </Card>

      {/* PAYE dates */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">PAYE &amp; Employment Dates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <Table
            headers={['Event', 'Date']}
            rows={[
              ['New tax codes take effect', '6 April'],
              ['P60 issued by employer', 'By 31 May'],
              ['P11D (benefits in kind) filed', 'By 6 July'],
              ['Tax code adjustments', 'Can happen at any time during the year'],
            ]}
          />
          <p>
            If you are a PAYE employee with no other income, you generally do not need
            to file a Self Assessment return. HMRC collects tax through your pay as you
            earn.
          </p>
        </CardContent>
      </Card>

      {/* Month-by-month calendar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tax Calendar: Key Dates Month by Month</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <Table
            headers={['Month', 'Key events']}
            rows={[
              ['April', 'New tax year starts (6 April). New rates, bands, and allowances take effect. Use ISA allowance before 5 April.'],
              ['May', 'Employers issue P60s (by 31 May). Check your tax code.'],
              ['July', 'P11D deadline (6 July). 2nd payment on account due (31 July).'],
              ['October', 'Paper Self Assessment deadline (31 Oct). Register for SA by 5 Oct.'],
              ['January', 'Online SA filing deadline (31 Jan). Pay tax owed (31 Jan). 1st payment on account due (31 Jan).'],
              ['March', 'Year-end tax planning. Maximise pension, ISA, and gift allowances before 5 April.'],
            ]}
          />
        </CardContent>
      </Card>

      {/* Year-end planning */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Year-End Tax Planning Checklist</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>Before 5 April each year, consider:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>ISA allowance</strong> &mdash; contribute up to £20,000 before it
              resets.
            </li>
            <li>
              <strong>Pension contributions</strong> &mdash; use your Annual Allowance
              (£60,000). Carry forward unused allowance from the previous 3 years.
            </li>
            <li>
              <strong>Capital gains</strong> &mdash; use your £3,000 Annual Exempt Amount.
              Harvest losses before year-end.
            </li>
            <li>
              <strong>Gift Aid</strong> &mdash; make charitable donations to extend your
              basic rate band or reduce income below £100,000.
            </li>
            <li>
              <strong>Marriage Allowance</strong> &mdash; claim if eligible (can backdate
              4 years).
            </li>
            <li>
              <strong>Review your tax code</strong> &mdash; ensure HMRC has the correct
              information to avoid over- or under-paying tax.
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 text-sm text-muted-foreground space-y-2">
          <p>
            Plan your year-end tax strategy.{' '}
            <a href="#planning" className="text-emerald-600 font-medium hover:underline">
              Go to Tax Planning &rarr;
            </a>
          </p>
          <p>
            <strong>Related guides:</strong>{' '}
            <a href="#guide/uk-income-tax-rates" className="text-emerald-600 font-medium hover:underline">
              Income Tax Rates &amp; Bands
            </a>
            {' · '}
            <a href="#guide/self-employment-tax-guide" className="text-emerald-600 font-medium hover:underline">
              Self-Employment Tax Guide
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
