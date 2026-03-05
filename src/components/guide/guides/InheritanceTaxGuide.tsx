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

export function InheritanceTaxGuide() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">
          Inheritance Tax Guide UK 2024&ndash;27
        </h1>
        <p className="text-muted-foreground">
          A comprehensive guide to UK Inheritance Tax &mdash; nil-rate bands, the residence
          nil-rate band, exemptions, the 7-year rule for gifts, trusts, and planning
          strategies to reduce your IHT liability.
        </p>
      </div>

      {/* What is IHT? */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">What Is Inheritance Tax?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Inheritance Tax (IHT) is a tax on the estate (property, money, and possessions)
            of someone who has died. It is charged at <strong>40%</strong> on the value of an
            estate above the <strong>nil-rate band</strong> of £325,000.
          </p>
          <p>
            If you leave at least 10% of your net estate to charity, the IHT rate is reduced
            to <strong>36%</strong>.
          </p>
          <p>
            IHT may also apply to certain lifetime transfers, particularly gifts into trusts
            and gifts made within 7 years of death.
          </p>
        </CardContent>
      </Card>

      {/* Thresholds Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">IHT Thresholds &amp; Allowances</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <Table
            headers={['Allowance', 'Amount', 'Notes']}
            rows={[
              ['Nil-Rate Band (NRB)', '£325,000', 'Frozen until at least April 2030'],
              ['Residence Nil-Rate Band (RNRB)', '£175,000', 'For main home passed to direct descendants'],
              ['Transferable NRB (married/CP)', '£325,000', 'Unused NRB from deceased spouse'],
              ['Transferable RNRB (married/CP)', '£175,000', 'Unused RNRB from deceased spouse'],
              ['Maximum combined (couple)', '£1,000,000', 'NRB + RNRB × 2'],
            ]}
          />
          <p>
            The RNRB is tapered for estates worth over £2 million &mdash; reduced by £1 for
            every £2 above that threshold.
          </p>
        </CardContent>
      </Card>

      {/* Residence Nil-Rate Band */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Residence Nil-Rate Band (RNRB)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            The RNRB provides an additional <strong>£175,000</strong> allowance when you pass
            your main home to <strong>direct descendants</strong> (children, grandchildren,
            stepchildren). Combined with the standard NRB, a single person can pass on up to
            £500,000 tax-free.
          </p>
          <p>
            For married couples and civil partners, unused RNRB can be transferred to the
            surviving spouse, giving a combined allowance of up to <strong>£1,000,000</strong>.
          </p>
          <p>
            If the estate exceeds <strong>£2 million</strong>, the RNRB is reduced by £1 for
            every £2 above £2m. It is fully withdrawn at an estate value of £2.35 million
            (for a single person).
          </p>
        </CardContent>
      </Card>

      {/* Exemptions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">IHT Exemptions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Several exemptions can reduce or eliminate IHT:
          </p>
          <Table
            headers={['Exemption', 'Detail']}
            rows={[
              ['Spouse / civil partner', 'Unlimited — transfers between spouses are fully exempt'],
              ['Charity', 'Gifts to qualifying charities are fully exempt'],
              ['Annual exemption', '£3,000 per tax year (can carry forward 1 unused year)'],
              ['Small gifts', '£250 per recipient per year (unlimited recipients)'],
              ['Wedding gifts', '£5,000 (parent), £2,500 (grandparent), £1,000 (others)'],
              ['Normal expenditure out of income', 'Regular gifts from surplus income — no limit'],
              ['Business Property Relief', '50% or 100% relief on qualifying business assets'],
              ['Agricultural Property Relief', '50% or 100% relief on qualifying agricultural land'],
            ]}
          />
        </CardContent>
      </Card>

      {/* 7-Year Rule */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">The 7-Year Rule &amp; Taper Relief</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Gifts made more than <strong>7 years</strong> before death are completely exempt
            from IHT. These are known as Potentially Exempt Transfers (PETs).
          </p>
          <p>
            If you die within 7 years of making a gift, the gift may be subject to IHT.
            However, <strong>taper relief</strong> reduces the tax rate on gifts made between
            3 and 7 years before death:
          </p>
          <Table
            headers={['Years before death', 'Taper relief', 'Effective IHT rate']}
            rows={[
              ['0–3 years', '0%', '40%'],
              ['3–4 years', '20%', '32%'],
              ['4–5 years', '40%', '24%'],
              ['5–6 years', '60%', '16%'],
              ['6–7 years', '80%', '8%'],
              ['7+ years', '100%', '0% (exempt)'],
            ]}
          />
          <p>
            Note: taper relief only reduces the <em>tax rate</em> on the gift, not the value.
            It only applies where the cumulative value of gifts exceeds the nil-rate band.
          </p>
        </CardContent>
      </Card>

      {/* Trusts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Trusts &amp; IHT</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Gifts into most trusts are <strong>chargeable lifetime transfers</strong> (CLTs)
            and may trigger an immediate IHT charge of <strong>20%</strong> on any amount
            exceeding the nil-rate band.
          </p>
          <p>
            Relevant property trusts (discretionary trusts) are also subject to periodic
            charges of up to <strong>6%</strong> of the trust&rsquo;s value every 10 years,
            and proportionate exit charges when assets leave the trust.
          </p>
          <p>
            Bare trusts and interest-in-possession trusts created before March 2006 may have
            different treatment. Professional advice is recommended for trust planning.
          </p>
        </CardContent>
      </Card>

      {/* Planning Strategies */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">IHT Planning Strategies</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Make gifts early:</strong> use PETs and annual exemptions to reduce your
              estate over time. The earlier you gift, the more likely the 7-year rule exempts
              it entirely.
            </li>
            <li>
              <strong>Pension contributions:</strong> pensions sit outside your estate for IHT
              purposes. Maximising pension savings is one of the most effective IHT strategies.
            </li>
            <li>
              <strong>Life insurance in trust:</strong> a whole-of-life policy written in trust
              can provide funds to pay the IHT bill without adding to the estate.
            </li>
            <li>
              <strong>Business Property Relief:</strong> investing in qualifying AIM shares or
              unquoted businesses can attract 100% BPR after 2 years of ownership.
            </li>
            <li>
              <strong>Charitable giving:</strong> leaving 10%+ of your net estate to charity
              reduces the IHT rate from 40% to 36%.
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* CTA */}
      <Card>
        <CardContent className="pt-6 text-sm text-muted-foreground space-y-2">
          <p>
            <strong>Related guides:</strong>{' '}
            <a href="#guide/eis-seis-vct-guide" className="text-emerald-600 font-medium hover:underline">
              EIS, SEIS &amp; VCT Tax Relief &rarr;
            </a>
            {' · '}
            <a href="#guide/isa-guide" className="text-emerald-600 font-medium hover:underline">
              ISA Guide &rarr;
            </a>
            {' · '}
            <a href="#guide/tax-dates-guide" className="text-emerald-600 font-medium hover:underline">
              Tax Dates &amp; Deadlines &rarr;
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
