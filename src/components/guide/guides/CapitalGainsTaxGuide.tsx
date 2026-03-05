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

export function CapitalGainsTaxGuide() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">
          Capital Gains Tax Guide UK
        </h1>
        <p className="text-muted-foreground">
          A comprehensive guide to Capital Gains Tax (CGT) in the UK for the 2024/25,
          2025/26, and 2026/27 tax years. Covers rates, the Annual Exempt Amount, Business
          Asset Disposal Relief, loss relief, and how CGT interacts with your income tax
          position.
        </p>
      </div>

      {/* What is CGT */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">What Is Capital Gains Tax?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Capital Gains Tax is charged on the profit (gain) you make when you dispose of
            an asset that has increased in value. &ldquo;Dispose&rdquo; includes selling,
            gifting, swapping, or receiving compensation for an asset.
          </p>
          <p>
            You only pay CGT on gains above the <strong>Annual Exempt Amount</strong> (AEA),
            also known as the tax-free allowance. The rate you pay depends on your total
            taxable income.
          </p>
          <p>
            CGT does <strong>not</strong> apply to: ISA investments, your main home
            (principal private residence), UK government gilts, or assets transferred between
            spouses/civil partners.
          </p>
        </CardContent>
      </Card>

      {/* Rates & AEA */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">CGT Rates &amp; Annual Exempt Amount</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <Table
            headers={['Tax year', 'Annual Exempt Amount']}
            rows={[
              ['2024/25', '£3,000'],
              ['2025/26', '£3,000'],
              ['2026/27', '£3,000'],
            ]}
          />
          <p>
            The AEA was reduced from £6,000 to £3,000 from April 2024 onwards. Gains up to
            this amount are tax-free each year. Unused AEA cannot be carried forward.
          </p>

          <p className="font-medium text-foreground">Standard CGT Rates (all three years)</p>
          <Table
            headers={['Your income tax band', 'CGT rate']}
            rows={[
              ['Basic Rate taxpayer', '18%'],
              ['Higher/Additional Rate taxpayer', '24%'],
            ]}
          />
          <p>
            The rate depends on your combined taxable income and gains. If your gains push
            you from basic rate into higher rate, part of the gain is taxed at 18% and the
            remainder at 24%.
          </p>
        </CardContent>
      </Card>

      {/* How CGT interacts with income */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">How CGT Interacts with Income Tax</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            To work out your CGT rate, HMRC adds your taxable gains (after the AEA) on top
            of your taxable income. If the combined total stays within the basic rate band
            (£37,700 of taxable income), you pay 18%. If it exceeds the band, the excess is
            taxed at 24%.
          </p>
          <p className="font-medium text-foreground">Example</p>
          <p>
            Taxable income: £40,000 (uses £27,430 of the basic rate band). Basic rate band
            remaining: £37,700 &minus; £27,430 = £10,270.
          </p>
          <p>
            If you have £15,000 in gains after the AEA: the first £10,270 is taxed at 18%
            (£1,849), and the remaining £4,730 at 24% (£1,135). Total CGT: £2,984.
          </p>
        </CardContent>
      </Card>

      {/* BADR */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Business Asset Disposal Relief (BADR)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Formerly known as Entrepreneurs&rsquo; Relief, BADR offers a reduced CGT rate on
            qualifying business disposals up to a lifetime limit of <strong>£1 million</strong>.
          </p>
          <Table
            headers={['Tax year', 'BADR rate']}
            rows={[
              ['2024/25', '10%'],
              ['2025/26', '14%'],
              ['2026/27', '18%'],
            ]}
          />
          <p>
            Note that the BADR rate is increasing year-on-year and will match the standard
            basic rate CGT rate of 18% by 2026/27.
          </p>
          <p>To qualify for BADR, you generally need to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Be a sole trader or business partner disposing of all or part of the business</li>
            <li>Or own at least 5% of shares and voting rights in a trading company, and be an officer or employee</li>
            <li>Have held the qualifying interest for at least 2 years before disposal</li>
          </ul>
        </CardContent>
      </Card>

      {/* Loss Relief */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Capital Losses &amp; Loss Relief</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            If you dispose of an asset at a loss, you can use that loss to reduce your gains
            in the same tax year. Losses must be offset against gains before applying the
            Annual Exempt Amount.
          </p>
          <p>
            Unused losses can be <strong>carried forward indefinitely</strong> and set
            against future gains. However, carried-forward losses are only used to reduce
            gains down to the AEA level &mdash; you cannot create or increase an overall
            loss for carry-forward using the AEA.
          </p>
          <p>
            You must report a loss to HMRC within <strong>4 years</strong> of the end of the
            tax year in which it arose to be able to carry it forward.
          </p>
        </CardContent>
      </Card>

      {/* Worked example */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Worked Example: Share Disposal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            You have a salary of £45,000 and sell shares in 2025/26 for a gain of £20,000.
            You also have a carried-forward loss of £2,000.
          </p>
          <Table
            headers={['Step', 'Amount']}
            rows={[
              ['Total gain', '£20,000'],
              ['Less: carried-forward loss', '−£2,000'],
              ['Net gain', '£18,000'],
              ['Less: Annual Exempt Amount', '−£3,000'],
              ['Taxable gain', '£15,000'],
            ]}
          />
          <p>
            Your taxable income of £45,000 uses £32,430 of the basic rate band. Remaining
            basic rate band: £37,700 &minus; £32,430 = £5,270.
          </p>
          <Table
            headers={['Portion', 'Rate', 'Tax']}
            rows={[
              ['First £5,270 (basic rate)', '18%', '£949'],
              ['Remaining £9,730 (higher rate)', '24%', '£2,335'],
              ['Total CGT', '', '£3,284'],
            ]}
          />
        </CardContent>
      </Card>

      {/* Reducing CGT */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Strategies to Reduce CGT</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Use your AEA every year</strong> &mdash; the £3,000 allowance cannot
              be carried forward, so consider spreading disposals across tax years.
            </li>
            <li>
              <strong>Transfer assets to your spouse</strong> &mdash; transfers between
              spouses are CGT-free, effectively doubling the AEA to £6,000 if your spouse
              then sells.
            </li>
            <li>
              <strong>Invest via ISAs</strong> &mdash; gains within ISAs are completely
              exempt from CGT.
            </li>
            <li>
              <strong>Pension contributions</strong> &mdash; increasing pension contributions
              can lower your taxable income, potentially keeping more of your gains in the
              basic rate band (18% rather than 24%).
            </li>
            <li>
              <strong>Harvest losses</strong> &mdash; sell loss-making investments before
              year-end to offset gains.
            </li>
            <li>
              <strong>EIS/SEIS deferral</strong> &mdash; investing gains into qualifying
              EIS or SEIS schemes can defer CGT liability.
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 text-sm text-muted-foreground">
          <p>
            Track your capital gains and see CGT calculated automatically.{' '}
            <a href="#gains" className="text-emerald-600 font-medium hover:underline">
              Go to Capital Gains &rarr;
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
