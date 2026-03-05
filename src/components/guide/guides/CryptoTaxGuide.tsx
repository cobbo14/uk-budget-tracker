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

export function CryptoTaxGuide() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">
          Crypto Tax Guide UK 2024&ndash;27
        </h1>
        <p className="text-muted-foreground">
          How HMRC taxes cryptocurrency in the UK &mdash; Capital Gains Tax on disposals,
          income tax on mining and staking, the pooled cost basis rules, DeFi treatment,
          and record-keeping requirements.
        </p>
      </div>

      {/* How HMRC Taxes Crypto */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">How HMRC Taxes Cryptocurrency</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            HMRC treats cryptocurrency as property, not currency. This means:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Capital Gains Tax (CGT)</strong> applies when you dispose of crypto
              assets at a profit
            </li>
            <li>
              <strong>Income Tax</strong> applies to crypto received as earnings, mining
              rewards, staking income, and airdrops
            </li>
          </ul>
          <p>
            You must report and pay tax on gains above the annual exempt amount (£3,000 for
            2024/25 onwards). Losses can be offset against gains.
          </p>
        </CardContent>
      </Card>

      {/* What Counts as a Disposal */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">What Counts as a Disposal?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            A disposal triggers CGT. HMRC considers all of the following as disposals:
          </p>
          <Table
            headers={['Action', 'CGT Disposal?', 'Notes']}
            rows={[
              ['Selling crypto for GBP/USD', 'Yes', 'Most common taxable event'],
              ['Swapping one crypto for another', 'Yes', 'e.g. BTC → ETH is a disposal of BTC'],
              ['Spending crypto on goods/services', 'Yes', 'Market value at time of spending'],
              ['Gifting crypto', 'Yes', 'Market value at time of gift (unless to spouse)'],
              ['Transferring between your own wallets', 'No', 'No change in beneficial ownership'],
              ['Buying crypto with GBP', 'No', 'Acquisition, not disposal'],
            ]}
          />
          <p>
            Transfers to a <strong>spouse or civil partner</strong> are not disposals and
            happen at no gain/no loss. The recipient inherits your original cost basis.
          </p>
        </CardContent>
      </Card>

      {/* CGT Rates */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Capital Gains Tax Rates on Crypto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Cryptocurrency is taxed at the standard CGT rates for &ldquo;other assets&rdquo;
            (not the higher residential property rates):
          </p>
          <Table
            headers={['Tax Band', 'CGT Rate', 'Annual Exempt Amount']}
            rows={[
              ['Basic Rate', '10%', '£3,000 (2024/25 onwards)'],
              ['Higher / Additional Rate', '20%', '£3,000 (2024/25 onwards)'],
            ]}
          />
          <p>
            Your crypto gains are added on top of your income to determine which band they
            fall into. If your taxable income plus gains exceeds £50,270, the excess is taxed
            at 20%.
          </p>
        </CardContent>
      </Card>

      {/* Pooled Cost Basis */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pooled Cost Basis &amp; Matching Rules</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            HMRC uses <strong>Section 104 pooling</strong> to calculate your cost basis. All
            tokens of the same type are pooled together, and the average cost is used when
            calculating gains on disposal.
          </p>
          <p>
            However, two anti-avoidance rules take priority over the pool:
          </p>
          <Table
            headers={['Rule', 'Detail']}
            rows={[
              ['Same-day rule', 'Tokens bought and sold on the same day are matched first'],
              ['Bed & breakfast rule (30-day)', 'Tokens reacquired within 30 days are matched to the disposal'],
            ]}
          />
          <p>
            The matching order is: same-day acquisitions first, then 30-day acquisitions, then
            the Section 104 pool.
          </p>
        </CardContent>
      </Card>

      {/* Worked Example */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Worked Example: Pooled Cost Calculation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div className="rounded-lg border p-4 bg-muted/50">
            <p className="font-medium mb-2">Scenario: Multiple Buys and a Sell</p>
            <Table
              headers={['Date', 'Action', 'Tokens', 'Price per Token', 'Total']}
              rows={[
                ['Jan 2024', 'Buy', '2 BTC', '£30,000', '£60,000'],
                ['Jun 2024', 'Buy', '1 BTC', '£45,000', '£45,000'],
                ['Dec 2024', 'Sell', '1.5 BTC', '£50,000', '£75,000'],
              ]}
            />
            <Table
              headers={['Step', 'Calculation']}
              rows={[
                ['Pool: 3 BTC', 'Total cost: £60,000 + £45,000 = £105,000'],
                ['Average cost per BTC', '£105,000 ÷ 3 = £35,000'],
                ['Cost of 1.5 BTC sold', '1.5 × £35,000 = £52,500'],
                ['Proceeds', '£75,000'],
                ['Gain', '£75,000 − £52,500 = £22,500'],
                ['Less annual exempt amount', '£22,500 − £3,000 = £19,500 taxable'],
                ['Remaining pool', '1.5 BTC at cost of £52,500'],
              ]}
            />
          </div>
        </CardContent>
      </Card>

      {/* DeFi, Staking & Yield */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">DeFi, Staking &amp; Yield</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Income received from DeFi activities is generally taxed as follows:
          </p>
          <Table
            headers={['Activity', 'Tax Treatment']}
            rows={[
              ['Staking rewards', 'Income Tax on market value when received'],
              ['Mining rewards', 'Income Tax (may also be self-employment income)'],
              ['Airdrops', 'Income Tax if received for a service; CGT on later disposal'],
              ['Lending interest (e.g. Aave)', 'Income Tax on interest received'],
              ['Liquidity pool fees', 'Income Tax on fees; CGT on disposal of LP tokens'],
            ]}
          />
          <p>
            When you later dispose of tokens received as income, you pay CGT on any gain
            above their value when first received (which becomes your acquisition cost).
          </p>
        </CardContent>
      </Card>

      {/* NFTs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">NFTs &amp; Tax Treatment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            NFTs are treated the same as other crypto assets for tax purposes. Selling, swapping,
            or gifting an NFT is a disposal subject to CGT. Creating and selling an NFT may be
            treated as trading income if done regularly.
          </p>
          <p>
            Each NFT is a separate asset (not pooled like fungible tokens) because they are
            unique. Your cost basis is the amount you paid to acquire or create the NFT,
            including gas fees.
          </p>
        </CardContent>
      </Card>

      {/* Record Keeping */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Record-Keeping Requirements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            HMRC requires you to keep records of all crypto transactions. For each transaction,
            record:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Date of the transaction</li>
            <li>Type of transaction (buy, sell, swap, gift, mining reward, etc.)</li>
            <li>Number of tokens involved</li>
            <li>Value in GBP at the time of the transaction</li>
            <li>Cumulative pool cost and quantity after each transaction</li>
            <li>Any fees or gas costs associated with the transaction</li>
          </ul>
          <p>
            You must keep these records for at least <strong>5 years</strong> after the Self
            Assessment deadline. HMRC can request records at any time during this period.
          </p>
        </CardContent>
      </Card>

      {/* CTA */}
      <Card>
        <CardContent className="pt-6 text-sm text-muted-foreground space-y-2">
          <p>
            Track your crypto gains alongside other capital gains.{' '}
            <a href="#gains" className="text-emerald-600 font-medium hover:underline">
              Use the gains tracker &rarr;
            </a>
          </p>
          <p>
            <strong>Related guides:</strong>{' '}
            <a href="#guide/capital-gains-tax-guide" className="text-emerald-600 font-medium hover:underline">
              Capital Gains Tax Guide &rarr;
            </a>
            {' · '}
            <a href="#guide/uk-income-tax-rates" className="text-emerald-600 font-medium hover:underline">
              UK Income Tax Rates &rarr;
            </a>
            {' · '}
            <a href="#guide/self-employment-tax-guide" className="text-emerald-600 font-medium hover:underline">
              Self-Employment Tax &rarr;
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
