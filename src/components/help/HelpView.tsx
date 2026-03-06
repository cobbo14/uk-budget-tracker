import {
  LayoutDashboard,
  Wallet,
  ShoppingCart,
  TrendingUp,
  Lightbulb,
  Settings,
  Download,
  Users,
  BookOpen,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function Section({
  icon: Icon,
  title,
  children,
  tabHash,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  children: React.ReactNode
  tabHash?: string
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Icon className="h-5 w-5 text-emerald-600" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        {children}
        {tabHash && (
          <p>
            <a
              href={`#${tabHash}`}
              className="text-emerald-600 font-medium hover:underline"
            >
              Go to {title} &rarr;
            </a>
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export function HelpView() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">
          UK Budget Tracker &mdash; Help &amp; Guide
        </h1>
        <p className="text-muted-foreground">
          A free UK tax calculator, pension optimiser, and budget planner covering
          the 2024/25, 2025/26, and 2026/27 tax years. Track your income, expenses,
          and capital gains &mdash; and see your tax position update in real time.
        </p>
      </div>

      <Section icon={Download} title="Getting Started">
        <p>
          UK Budget Tracker works in two ways: directly in your browser, or
          installed as an app on your device. Both offer the full set of
          features &mdash; the difference is in the experience.
        </p>
        <p>
          <strong>In the browser:</strong> Simply visit the site and start
          using it. Your data is saved automatically and will be there when you
          return, as long as you use the same browser and don&rsquo;t clear
          your browsing data. However, the browser toolbar and tabs remain
          visible, and if you close all tabs, you&rsquo;ll need to navigate
          back to the site to use it again.
        </p>
        <p>
          <strong>Installed as an app:</strong> UK Budget Tracker is a
          Progressive Web App (PWA), which means you can install it to your
          device for a native app experience. Once installed it gets its own
          window (no browser toolbar or tabs), its own icon in your dock,
          taskbar, or home screen, and it works fully offline. To install:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Chrome / Edge (desktop):</strong> Click the install icon in
            the address bar, or open the browser menu and select
            &ldquo;Install UK Budget Tracker&rdquo;.
          </li>
          <li>
            <strong>Chrome (Android):</strong> Tap the browser menu and select
            &ldquo;Add to Home screen&rdquo; or &ldquo;Install app&rdquo;.
          </li>
          <li>
            <strong>Safari (iOS / iPadOS):</strong> Tap the Share button, then
            &ldquo;Add to Home Screen&rdquo;.
          </li>
        </ul>
        <p>
          <strong>Your data:</strong> All data is stored locally on your
          device &mdash; nothing is ever sent to a server. Your information
          stays completely private. Data persists automatically between
          sessions whether you use the browser or the installed app. The only
          ways to lose your data are clearing your browser&rsquo;s storage,
          uninstalling the app, or switching to a different browser or device.
        </p>
      </Section>

      <Section icon={Users} title="Profiles">
        <p>
          Use profiles to maintain separate sets of data. For example, create one
          profile for the current tax year and another to model a different income
          scenario. Each profile has its own income, expenses, and settings.
          Switch profiles using the profile button in the header.
        </p>
      </Section>

      <Section icon={LayoutDashboard} title="Summary Dashboard" tabHash="summary">
        <p>
          The Summary tab is your dashboard. It shows your gross income, total
          tax liability, net income, and leftover budget at a glance. Below the
          headline figures you&rsquo;ll find a detailed breakdown of each tax
          component &mdash; Income Tax, National Insurance, Student Loan
          repayments, and more &mdash; along with interactive charts.
        </p>
        <p>
          Toggle between monthly and annual views to see figures in the format
          that&rsquo;s most useful to you.
        </p>
      </Section>

      <Section icon={Wallet} title="Income Tracking" tabHash="income">
        <p>
          Track all your UK income sources: employment (PAYE), self-employment,
          rental income, dividends, and savings interest. Each income type has
          its own set of allowable deductions and reliefs.
        </p>
        <p>
          <strong>Employment income</strong> supports salary sacrifice (pension,
          cycle-to-work, electric vehicle schemes) and benefits in kind.{' '}
          <strong>Self-employment income</strong> lets you enter allowable
          business expenses. The app automatically calculates Class 2 and Class 4
          National Insurance contributions.
        </p>
        <p>
          Click &ldquo;Add Income&rdquo; to record a new source. The form adapts
          based on the income type you select.
        </p>
      </Section>

      <Section icon={ShoppingCart} title="Expenses &amp; Budgeting" tabHash="expenses">
        <p>
          Log your regular outgoings by category &mdash; housing, transport,
          food, utilities, and more. Enter amounts as weekly, monthly, or annual
          figures and the app converts them automatically.
        </p>
        <p>
          The expenses view also includes tools to model energy and broadband
          switching, helping you find potential savings on household bills.
        </p>
      </Section>

      <Section icon={Lightbulb} title="Tax Planning &amp; Pension Optimiser" tabHash="planning">
        <p>
          The Planning tab unlocks powerful UK tax optimisation tools once you
          have added income. Features include:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Threshold warnings</strong> &mdash; alerts when you&rsquo;re
            approaching the Personal Allowance taper (£100k), Higher Rate band,
            or High Income Child Benefit Charge, with pension contribution
            suggestions to stay below each threshold.
          </li>
          <li>
            <strong>Pension optimiser chart</strong> &mdash; shows how increasing
            pension contributions affects your take-home pay, highlighting where
            contributions unlock extra tax relief.
          </li>
          <li>
            <strong>What-If calculator</strong> &mdash; experiment with pay
            rises, bonus scenarios, or different pension contribution levels.
          </li>
          <li>
            <strong>Payments on Account</strong> &mdash; estimate your
            self-assessment payments on account for the following tax year.
          </li>
        </ul>
      </Section>

      <Section icon={TrendingUp} title="Capital Gains Tax" tabHash="gains">
        <p>
          Record disposals of shares, property, or business assets. The app
          automatically applies the Annual Exempt Amount (£3,000 for 2024/25
          onwards), carry-forward losses, and the correct Capital Gains Tax
          rate based on your total taxable income.
        </p>
        <p>
          Business Asset Disposal Relief (BADR), formerly Entrepreneurs&rsquo;
          Relief, is supported for qualifying disposals at the reduced 10% rate.
        </p>
      </Section>

      <Section icon={Settings} title="Settings &amp; Configuration" tabHash="settings">
        <p>
          Configure your personal tax details: tax year, Scottish taxpayer
          status, pension contributions (relief at source or salary sacrifice),
          student loan plan, Gift Aid donations, Marriage Allowance, Child
          Benefit, and more. All settings feed directly into the tax
          calculations across every tab.
        </p>
      </Section>

      <Section icon={BookOpen} title="Tax Guides" tabHash="guide">
        <p>
          In-depth guides to help you understand and optimise your UK tax position:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <a href="#guide/uk-income-tax-rates" className="text-emerald-600 font-medium hover:underline">
              UK Income Tax Rates &amp; Bands 2024&ndash;27
            </a>{' '}
            &mdash; full rate tables, personal allowance, Scottish rates, and worked examples.
          </li>
          <li>
            <a href="#guide/salary-sacrifice-guide" className="text-emerald-600 font-medium hover:underline">
              Salary Sacrifice: Is It Worth It?
            </a>{' '}
            &mdash; NI savings, pension vs other schemes, and who benefits most.
          </li>
          <li>
            <a href="#guide/reduce-tax-above-100k" className="text-emerald-600 font-medium hover:underline">
              How to Reduce Tax Above &pound;100k
            </a>{' '}
            &mdash; the 60% tax trap explained and strategies to avoid it.
          </li>
          <li>
            <a href="#guide/capital-gains-tax-guide" className="text-emerald-600 font-medium hover:underline">
              Capital Gains Tax Guide UK
            </a>{' '}
            &mdash; CGT rates, annual exempt amount, loss relief, and examples.
          </li>
          <li>
            <a href="#guide/student-loan-guide" className="text-emerald-600 font-medium hover:underline">
              Student Loan Repayment Guide
            </a>{' '}
            &mdash; thresholds, rates, and write-off rules for all plan types.
          </li>
          <li>
            <a href="#guide/isa-guide" className="text-emerald-600 font-medium hover:underline">
              ISA Guide
            </a>{' '}
            &mdash; types, allowances, LISA rules, and tax benefits.
          </li>
          <li>
            <a href="#guide/dividend-tax-guide" className="text-emerald-600 font-medium hover:underline">
              Dividend Tax Guide
            </a>{' '}
            &mdash; rates, allowances, and strategies for company directors.
          </li>
          <li>
            <a href="#guide/marriage-allowance-guide" className="text-emerald-600 font-medium hover:underline">
              Marriage Allowance
            </a>{' '}
            &mdash; eligibility, how to claim, and when it is not worth it.
          </li>
          <li>
            <a href="#guide/child-benefit-guide" className="text-emerald-600 font-medium hover:underline">
              Child Benefit &amp; HICBC
            </a>{' '}
            &mdash; payment rates, the income taper, and whether to claim or opt out.
          </li>
          <li>
            <a href="#guide/self-employment-tax-guide" className="text-emerald-600 font-medium hover:underline">
              Self-Employment Tax Guide
            </a>{' '}
            &mdash; expenses, NI, payments on account, and tips to reduce your bill.
          </li>
          <li>
            <a href="#guide/eis-seis-vct-guide" className="text-emerald-600 font-medium hover:underline">
              EIS, SEIS &amp; VCT Tax Relief
            </a>{' '}
            &mdash; income tax relief, CGT exemptions, and key risks.
          </li>
          <li>
            <a href="#guide/tax-dates-guide" className="text-emerald-600 font-medium hover:underline">
              UK Tax Year Dates &amp; Deadlines
            </a>{' '}
            &mdash; Self Assessment calendar, penalties, and year-end planning.
          </li>
        </ul>
      </Section>

      <Card>
        <CardContent className="pt-6 text-sm text-muted-foreground space-y-2">
          <p>
            <strong>Interactive tour:</strong> Click the{' '}
            <span className="inline-flex items-center justify-center rounded-full border w-5 h-5 text-xs align-text-bottom">?</span>{' '}
            button in the header at any time for a guided walkthrough of the app.
          </p>
          <p>
            UK Budget Tracker is free and open source.{' '}
            <a
              href="https://github.com/cobbo14/uk-budget-tracker"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-600 font-medium hover:underline"
            >
              View on GitHub
            </a>
          </p>
          <p>
            If you find this tool useful, consider{' '}
            <a
              href="https://ko-fi.com/cobbo14"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-600 font-medium hover:underline"
            >
              supporting the project on Ko-fi
            </a>
            . It helps keep the app free and maintained.
          </p>
          <p>
            Found a bug or have a suggestion?{' '}
            <a
              href="https://github.com/cobbo14/uk-budget-tracker/issues/new"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-600 font-medium hover:underline"
            >
              Give Feedback
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
