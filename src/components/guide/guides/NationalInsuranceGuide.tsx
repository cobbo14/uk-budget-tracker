import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table } from '@/components/guide/GuideTable'


export function NationalInsuranceGuide() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">
          National Insurance Rates &amp; Thresholds UK 2024&ndash;27
        </h1>
        <p className="text-muted-foreground">
          A complete guide to UK National Insurance &mdash; employee, employer, and
          self-employed rates, NI thresholds, voluntary contributions, the Employment
          Allowance, and how NI relates to your State Pension.
        </p>
      </div>

      {/* What is NI */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">What Is National Insurance?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            National Insurance (NI) is a tax on earnings and self-employed profits that funds
            the State Pension, NHS, and other benefits. There are several classes:
          </p>
          <Table
            headers={['Class', 'Who Pays', 'Purpose']}
            rows={[
              ['Class 1 Employee', 'Employees', 'Deducted from wages via PAYE'],
              ['Class 1 Employer', 'Employers', 'Paid on top of employee wages'],
              ['Class 2', 'Self-employed', 'Flat weekly rate for NI record'],
              ['Class 3', 'Voluntary', 'Fill gaps in NI record'],
              ['Class 4', 'Self-employed', 'Percentage of profits'],
            ]}
          />
        </CardContent>
      </Card>

      {/* Employee NI */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Class 1 Employee NI Rates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <Table
            headers={['Tax Year', 'Rate (PT to UEL)', 'Rate (above UEL)', 'Primary Threshold', 'Upper Earnings Limit']}
            rows={[
              ['2024/25', '8%', '2%', '£12,570/year', '£50,270/year'],
              ['2025/26', '8%', '2%', '£12,570/year', '£50,270/year'],
              ['2026/27', '8%', '2%', '£12,570/year', '£50,270/year'],
            ]}
          />
          <p>
            You pay <strong>0%</strong> NI on earnings up to the Primary Threshold (£12,570),{' '}
            <strong>8%</strong> on earnings between the Primary Threshold and Upper Earnings
            Limit (£50,270), and <strong>2%</strong> on earnings above the UEL.
          </p>
          <p>
            You start building NI credits from the Lower Earnings Limit (£6,396/year for
            2025/26), even though you don&rsquo;t pay NI until the Primary Threshold.
          </p>
        </CardContent>
      </Card>

      {/* Employer NI */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Class 1 Employer NI</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Employers pay NI on employee earnings above the Secondary Threshold. From April
            2025, the rate increased and the threshold decreased:
          </p>
          <Table
            headers={['Tax Year', 'Rate', 'Secondary Threshold']}
            rows={[
              ['2024/25', '13.8%', '£9,100/year'],
              ['2025/26', '15%', '£5,000/year'],
              ['2026/27', '15%', '£5,000/year'],
            ]}
          />
          <p>
            The increase from 13.8% to <strong>15%</strong> and the reduction in the Secondary
            Threshold from £9,100 to £5,000 significantly increased employment costs from
            April 2025. There is no upper limit &mdash; employers pay 15% on all earnings
            above £5,000.
          </p>
        </CardContent>
      </Card>

      {/* Self-Employed NI */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Self-Employed NI: Class 2 &amp; Class 4</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Class 2 NI</p>
          <Table
            headers={['Tax Year', 'Weekly Rate', 'Small Profits Threshold']}
            rows={[
              ['2024/25', '£3.45', '£6,725'],
              ['2025/26', '£3.50', '£6,725'],
              ['2026/27', '£3.50', '£6,725'],
            ]}
          />
          <p>
            Class 2 is a flat-rate contribution that counts towards your State Pension. If
            profits are below the Small Profits Threshold you are not required to pay but
            can choose to voluntarily.
          </p>

          <p className="font-medium text-foreground">Class 4 NI</p>
          <Table
            headers={['Tax Year', 'Lower Profits Limit', 'Upper Profits Limit', 'Main Rate', 'Additional Rate']}
            rows={[
              ['2024/25', '£12,570', '£50,270', '6%', '2%'],
              ['2025/26', '£12,570', '£50,270', '6%', '2%'],
              ['2026/27', '£12,570', '£50,270', '6%', '2%'],
            ]}
          />
          <p>
            Class 4 NI is calculated on your self-employed profits. You pay <strong>6%</strong>{' '}
            on profits between £12,570 and £50,270, and <strong>2%</strong> on profits above
            £50,270. Both Class 2 and Class 4 are collected via Self Assessment.
          </p>
        </CardContent>
      </Card>

      {/* NI Thresholds */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">NI Thresholds at a Glance (2025/26)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <Table
            headers={['Threshold', 'Annual', 'Weekly', 'Purpose']}
            rows={[
              ['Lower Earnings Limit (LEL)', '£6,396', '£123', 'Start earning NI credits'],
              ['Primary Threshold (PT)', '£12,570', '£242', 'Start paying employee NI'],
              ['Secondary Threshold (ST)', '£5,000', '£96', 'Start paying employer NI'],
              ['Upper Earnings Limit (UEL)', '£50,270', '£967', 'Rate drops from 8% to 2%'],
            ]}
          />
        </CardContent>
      </Card>

      {/* Voluntary Class 3 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Voluntary Class 3 Contributions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            If you have gaps in your NI record (e.g. from time abroad, career breaks, or low
            earnings), you can make voluntary Class 3 contributions to fill them. The rate is{' '}
            <strong>£17.45 per week</strong> (2025/26).
          </p>
          <p>
            Each qualifying year of NI adds approximately <strong>£328</strong> per year to
            your State Pension (full rate £11,502/year ÷ 35 years). Since the cost of buying
            a year (£907) is recouped in under 3 years of pension payments, it is usually
            excellent value.
          </p>
          <p>
            You can typically fill gaps from the previous <strong>6 tax years</strong>.
            Check your NI record at{' '}
            <span className="text-emerald-600 font-medium">gov.uk/check-national-insurance-record</span>{' '}
            to see if you have gaps worth filling.
          </p>
        </CardContent>
      </Card>

      {/* State Pension */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">NI &amp; State Pension Qualification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            You need <strong>35 qualifying years</strong> of NI contributions or credits to
            receive the full new State Pension (£11,502/year in 2025/26). You need a minimum
            of <strong>10 qualifying years</strong> to receive any State Pension at all.
          </p>
          <p>
            A qualifying year is one where you:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Earned above the Lower Earnings Limit and paid NI</li>
            <li>Received NI credits (e.g. while claiming Child Benefit, Universal Credit, or Carer&rsquo;s Allowance)</li>
            <li>Made voluntary Class 2 or Class 3 contributions</li>
          </ul>
        </CardContent>
      </Card>

      {/* Employment Allowance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Employment Allowance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Eligible employers can claim the <strong>Employment Allowance</strong> to reduce
            their employer NI bill. From April 2025, this increased to{' '}
            <strong>£10,500</strong> per year (up from £5,000).
          </p>
          <p>
            To qualify, your employer NI liability in the previous tax year must have been
            under <strong>£100,000</strong>. Most small and medium businesses qualify.
          </p>
          <p>
            The allowance means many small employers &mdash; especially those with a single
            employee earning up to around £75,000 &mdash; pay no employer NI at all.
          </p>
        </CardContent>
      </Card>

      {/* CTA */}
      <Card>
        <CardContent className="pt-6 text-sm text-muted-foreground space-y-2">
          <p>
            See how NI affects your take-home pay.{' '}
            <a href="#income" className="text-emerald-600 font-medium hover:underline">
              Try the income calculator &rarr;
            </a>
          </p>
          <p>
            <strong>Related guides:</strong>{' '}
            <a href="#guide/uk-income-tax-rates" className="text-emerald-600 font-medium hover:underline">
              UK Income Tax Rates &rarr;
            </a>
            {' · '}
            <a href="#guide/salary-sacrifice-guide" className="text-emerald-600 font-medium hover:underline">
              Salary Sacrifice &rarr;
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
