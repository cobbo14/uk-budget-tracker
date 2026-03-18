import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type LegalPage = 'disclaimer' | 'privacy' | 'terms' | 'about' | 'contact'

interface LegalViewProps {
  page: LegalPage
}

export function LegalView({ page }: LegalViewProps) {
  if (page === 'privacy') return <PrivacyPolicy />
  if (page === 'terms') return <TermsOfService />
  if (page === 'about') return <AboutPage />
  if (page === 'contact') return <ContactPage />
  return <Disclaimer />
}

function Disclaimer() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Disclaimer</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Not Financial or Tax Advice</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            UK Budget Tracker is a free educational tool designed to help you
            understand your UK tax position. It is <strong>not</strong> a
            substitute for professional financial, tax, or legal advice.
          </p>
          <p>
            While we make every effort to keep tax rates, thresholds, and
            calculations accurate and up to date, we cannot guarantee that all
            information is correct, complete, or current. HMRC rules are complex
            and subject to change &mdash; your personal circumstances may affect
            your tax position in ways this tool cannot account for.
          </p>
          <p>
            <strong>You should:</strong>
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              Consult a qualified tax adviser or accountant before making
              financial decisions based on information from this tool.
            </li>
            <li>
              Verify figures against{' '}
              <a
                href="https://www.gov.uk/government/organisations/hm-revenue-customs"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-600 hover:underline"
              >
                HMRC&rsquo;s official guidance
              </a>{' '}
              before filing returns or making payments.
            </li>
            <li>
              Not rely solely on this tool for tax planning, pension decisions,
              or investment choices.
            </li>
          </ul>
          <p>
            The creators of UK Budget Tracker accept no liability for any loss
            or damage arising from the use of this tool or reliance on its
            calculations.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

function PrivacyPolicy() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Privacy Policy</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your Data Stays on Your Device</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            <strong>Last updated:</strong> 5 March 2026
          </p>
          <p>
            UK Budget Tracker is designed with privacy in mind. All financial
            data you enter &mdash; income, expenses, settings, and profiles
            &mdash; is stored exclusively in your browser&rsquo;s local storage.
            <strong> None of your financial data is ever sent to our servers
            or any third party.</strong>
          </p>

          <h3 className="text-foreground font-medium pt-2">Data We Store Locally</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Income sources, expenses, capital gains, and tax settings you enter</li>
            <li>Profile data (if you use multiple profiles)</li>
            <li>Display preferences (dark mode, monthly/annual toggle)</li>
          </ul>
          <p>
            This data is stored in your browser&rsquo;s <code>localStorage</code> and
            is never transmitted over the network. Clearing your browser data or
            uninstalling the app will permanently delete this data.
          </p>

          <h3 className="text-foreground font-medium pt-2">Third-Party Services</h3>
          <p>
            UK Budget Tracker does not use any third-party services. All
            processing happens locally in your browser.
          </p>

          <h3 className="text-foreground font-medium pt-2">Cookies</h3>
          <p>
            UK Budget Tracker does not set any cookies.
          </p>

          <h3 className="text-foreground font-medium pt-2">Your Rights</h3>
          <p>
            Since all data is stored locally on your device, you have full
            control. You can view, modify, or delete your data at any time by
            clearing your browser storage. No account or request to us is
            needed.
          </p>

          <h3 className="text-foreground font-medium pt-2">Contact</h3>
          <p>
            If you have questions about this policy, please{' '}
            <a
              href="https://github.com/cobbo14/uk-budget-tracker/issues/new"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-600 hover:underline"
            >
              open an issue on GitHub
            </a>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

function TermsOfService() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Terms of Use</h1>
      <Card>
        <CardContent className="space-y-3 text-sm text-muted-foreground pt-6">
          <p>
            <strong>Last updated:</strong> 5 March 2026
          </p>
          <p>
            By using UK Budget Tracker you agree to the following terms.
          </p>

          <h3 className="text-foreground font-medium pt-2">Use of the Tool</h3>
          <p>
            UK Budget Tracker is provided free of charge for personal,
            educational use. It is intended to give a general indication of your
            UK tax position and should not be treated as professional advice.
          </p>

          <h3 className="text-foreground font-medium pt-2">No Warranty</h3>
          <p>
            The tool is provided &ldquo;as is&rdquo; without warranty of any
            kind, express or implied. We do not warrant that tax rates,
            thresholds, or calculations are accurate, complete, or up to date.
          </p>

          <h3 className="text-foreground font-medium pt-2">Limitation of Liability</h3>
          <p>
            To the fullest extent permitted by law, the creators of UK Budget
            Tracker shall not be liable for any direct, indirect, incidental, or
            consequential damages arising from your use of, or inability to use,
            this tool.
          </p>

          <h3 className="text-foreground font-medium pt-2">Tax Advice Disclaimer</h3>
          <p>
            This tool does not constitute tax, financial, or legal advice. You
            should always consult a qualified tax adviser or accountant before
            making financial decisions. Refer to{' '}
            <a
              href="https://www.gov.uk/government/organisations/hm-revenue-customs"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-600 hover:underline"
            >
              HMRC
            </a>{' '}
            for official guidance.
          </p>

          <h3 className="text-foreground font-medium pt-2">Changes</h3>
          <p>
            We may update these terms from time to time. Continued use of the
            tool after changes constitutes acceptance of the updated terms.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

function AboutPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">About UK Budget Tracker</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Who Built This</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            UK Budget Tracker was built by an{' '}
            <strong>ACA and CTA qualified accountant</strong> with a{' '}
            <strong>MEng in Mechanical and Electrical Engineering</strong>.
            The tool combines professional tax expertise with a software
            engineering background to deliver accurate, real-time UK tax
            calculations.
          </p>
          <p>
            The goal is simple: give everyone free access to the same tax
            planning tools that professionals use &mdash; no sign-ups, no
            ads, no data collection.
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Methodology &amp; Data Sources</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            All tax rates, thresholds, and allowances are sourced directly from
            official HMRC publications and legislation:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <a href="https://www.gov.uk/income-tax-rates" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">
                HMRC Income Tax rates and bands
              </a>
            </li>
            <li>
              <a href="https://www.gov.uk/national-insurance-rates-letters" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">
                National Insurance rates and thresholds
              </a>
            </li>
            <li>
              <a href="https://www.gov.uk/capital-gains-tax/rates" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">
                Capital Gains Tax rates
              </a>
            </li>
            <li>
              <a href="https://www.gov.uk/repaying-your-student-loan" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">
                Student loan repayment thresholds
              </a>
            </li>
          </ul>
          <p>
            Tax rules are reviewed and updated at the start of each new tax year
            (6 April). The calculator currently supports the 2024/25, 2025/26,
            and 2026/27 tax years.
          </p>
          <h3 className="text-foreground font-medium pt-2">Last Reviewed</h3>
          <p>
            March 2026. Tax rules are checked against HMRC guidance after each
            Budget and Autumn Statement.
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="space-y-3 text-sm text-muted-foreground pt-6">
          <h3 className="text-foreground font-medium">Privacy &amp; Trust</h3>
          <p>
            All calculations run entirely in your browser. No financial data is
            ever sent to a server. The project is{' '}
            <a href="https://github.com/cobbo14/uk-budget-tracker" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">
              open source on GitHub
            </a>
            , so you can inspect every line of code.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

function ContactPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Contact</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Get in Touch</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Found a bug, have a feature request, or spotted an incorrect tax
            calculation? We&rsquo;d love to hear from you.
          </p>
          <h3 className="text-foreground font-medium pt-2">Report an Issue</h3>
          <p>
            The best way to reach us is by{' '}
            <a
              href="https://github.com/cobbo14/uk-budget-tracker/issues/new"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-600 hover:underline"
            >
              opening an issue on GitHub
            </a>
            . This ensures your feedback is tracked and addressed. You can
            report bugs, suggest features, or flag incorrect calculations.
          </p>
          <h3 className="text-foreground font-medium pt-2">Response Time</h3>
          <p>
            We aim to respond to all issues within 48 hours. Bug reports
            related to incorrect tax calculations are treated as high priority.
          </p>
          <h3 className="text-foreground font-medium pt-2">Contributing</h3>
          <p>
            UK Budget Tracker is open source. If you&rsquo;d like to contribute
            code, fix a bug, or improve a guide, feel free to submit a pull
            request on{' '}
            <a
              href="https://github.com/cobbo14/uk-budget-tracker"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-600 hover:underline"
            >
              GitHub
            </a>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
