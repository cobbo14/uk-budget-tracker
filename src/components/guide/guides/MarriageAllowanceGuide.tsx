import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table } from '@/components/guide/GuideTable'


export function MarriageAllowanceGuide() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">
          Marriage Allowance Guide UK
        </h1>
        <p className="text-muted-foreground">
          How Marriage Allowance works, who is eligible, how much you can save, how to
          claim, and when it might not be worth it. Covers the 2024/25, 2025/26, and
          2026/27 tax years.
        </p>
      </div>

      {/* What is it */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">What Is Marriage Allowance?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Marriage Allowance lets you transfer <strong>£1,260</strong> of your Personal
            Allowance to your spouse or civil partner. This can reduce their tax by up to
            £252 per year.
          </p>
          <p>
            The transfer is 10% of the Personal Allowance (£12,570 &times; 10% = £1,260),
            and is applied as a tax reduction (not a deduction from income) at the basic
            rate of 20%.
          </p>
        </CardContent>
      </Card>

      {/* Eligibility */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Who Is Eligible?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>Both of the following must be true:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              The <strong>transferor</strong> (the person giving up allowance) must earn
              less than the Personal Allowance (£12,570) &mdash; meaning they do not pay
              income tax.
            </li>
            <li>
              The <strong>recipient</strong> must be a basic-rate taxpayer in England,
              Wales, or Northern Ireland (earning between £12,571 and £50,270). Scottish
              taxpayers paying the starter, basic, or intermediate rate also qualify.
            </li>
          </ul>
          <p>
            The recipient <strong>cannot</strong> be a higher or additional-rate
            taxpayer. If they earn above the basic rate threshold, Marriage Allowance
            cannot be claimed.
          </p>
        </CardContent>
      </Card>

      {/* How much you save */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">How Much Can You Save?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <Table
            headers={['Detail', 'Amount']}
            rows={[
              ['Allowance transferred', '£1,260'],
              ['Tax reduction for recipient (20%)', '£252 per year'],
              ['Transferor\'s new Personal Allowance', '£11,310'],
              ['Recipient\'s effective allowance', '£13,830 equivalent'],
            ]}
          />
          <p>
            The maximum saving is <strong>£252 per year</strong>. The recipient gets this
            as a reduction in their tax bill, not as an increase in their Personal
            Allowance (this distinction matters for threshold calculations).
          </p>
          <p>
            You can backdate your claim by up to <strong>4 years</strong>, potentially
            saving up to £1,260 in total (5 years &times; £252).
          </p>
        </CardContent>
      </Card>

      {/* When it's not worth it */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">When Is It Not Worth It?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>Marriage Allowance is not beneficial if:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              The lower earner has income above £12,570 &mdash; they would lose more in
              tax (from losing £1,260 of allowance) than the recipient saves.
            </li>
            <li>
              The recipient is a higher or additional-rate taxpayer &mdash; they are not
              eligible.
            </li>
            <li>
              The lower earner has savings or dividend income that uses their Personal
              Allowance &mdash; transferring part of it could create a tax liability.
            </li>
            <li>
              Either partner receives the Blind Person&rsquo;s Allowance or Married
              Couple&rsquo;s Allowance (for those born before 6 April 1935) &mdash;
              these cannot be combined with Marriage Allowance.
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* How to claim */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">How to Claim</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Apply online at GOV.UK. The <strong>lower earner</strong> makes the
            application. You will need:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Both partners&rsquo; National Insurance numbers</li>
            <li>Proof of identity (passport, P60, or payslip details)</li>
          </ul>
          <p>
            Once approved, the transfer applies automatically each year through your
            tax code. HMRC adjusts both partners&rsquo; tax codes &mdash; you do not
            need to reapply each year.
          </p>
          <p>
            Remember to cancel if your circumstances change (e.g. the lower earner
            starts earning above £12,570, or the couple separates).
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 text-sm text-muted-foreground space-y-2">
          <p>
            Enable Marriage Allowance in your settings to see the tax impact.{' '}
            <a href="#settings" className="text-emerald-600 font-medium hover:underline">
              Go to Settings &rarr;
            </a>
          </p>
          <p>
            <strong>Related guides:</strong>{' '}
            <a href="#guide/uk-income-tax-rates" className="text-emerald-600 font-medium hover:underline">
              Income Tax Rates &amp; Bands
            </a>
            {' · '}
            <a href="#guide/child-benefit-guide" className="text-emerald-600 font-medium hover:underline">
              Child Benefit &amp; HICBC
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
