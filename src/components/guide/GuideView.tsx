import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, PoundSterling, Briefcase, AlertTriangle, BarChart3 } from 'lucide-react'
import { UkIncomeTaxRates } from './guides/UkIncomeTaxRates'
import { SalarySacrificeGuide } from './guides/SalarySacrificeGuide'
import { ReduceTaxAbove100k } from './guides/ReduceTaxAbove100k'
import { CapitalGainsTaxGuide } from './guides/CapitalGainsTaxGuide'
import type { LucideIcon } from 'lucide-react'

interface GuideEntry {
  slug: string
  title: string
  description: string
  pageTitle: string
  icon: LucideIcon
  component: React.ComponentType
}

const GUIDES: GuideEntry[] = [
  {
    slug: 'uk-income-tax-rates',
    title: 'UK Income Tax Rates & Bands 2024–27',
    description:
      'Full rate tables for all 3 tax years, personal allowance, Scottish rates, National Insurance, and worked examples at £30k, £50k, £80k, and £100k.',
    pageTitle: 'UK Income Tax Rates & Bands 2024/25, 2025/26, 2026/27 — UK Budget Tracker',
    icon: PoundSterling,
    component: UkIncomeTaxRates,
  },
  {
    slug: 'salary-sacrifice-guide',
    title: 'Salary Sacrifice: Is It Worth It?',
    description:
      'How salary sacrifice works, NI savings, pension vs cycle-to-work vs EV schemes, worked examples, and who benefits most.',
    pageTitle: 'Salary Sacrifice Pension UK — Is It Worth It? — UK Budget Tracker',
    icon: Briefcase,
    component: SalarySacrificeGuide,
  },
  {
    slug: 'reduce-tax-above-100k',
    title: 'How to Reduce Tax Above £100k',
    description:
      'The 60% tax trap explained, personal allowance taper, pension contributions to avoid it, and practical strategies.',
    pageTitle: 'How to Reduce Tax Above £100k — 60% Tax Trap Explained — UK Budget Tracker',
    icon: AlertTriangle,
    component: ReduceTaxAbove100k,
  },
  {
    slug: 'capital-gains-tax-guide',
    title: 'Capital Gains Tax Guide UK',
    description:
      'CGT rates, annual exempt amount, Business Asset Disposal Relief, interaction with income tax, loss relief, and worked examples.',
    pageTitle: 'Capital Gains Tax Guide UK 2024–27 — Rates, Reliefs & Examples — UK Budget Tracker',
    icon: BarChart3,
    component: CapitalGainsTaxGuide,
  },
]

function getSlugFromHash(): string | null {
  const hash = window.location.hash.slice(1)
  if (hash.startsWith('guide/')) {
    return hash.slice('guide/'.length) || null
  }
  return null
}

function GuideIndex() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">UK Tax Guides</h1>
        <p className="text-muted-foreground">
          In-depth guides covering UK income tax, pension planning, and capital gains
          tax for the 2024/25, 2025/26, and 2026/27 tax years.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {GUIDES.map(guide => {
          const Icon = guide.icon
          return (
            <a key={guide.slug} href={`#guide/${guide.slug}`} className="block group">
              <Card className="h-full transition-colors group-hover:border-emerald-600/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Icon className="h-5 w-5 text-emerald-600" />
                    {guide.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{guide.description}</p>
                </CardContent>
              </Card>
            </a>
          )
        })}
      </div>
    </div>
  )
}

export function GuideView() {
  const [slug, setSlug] = useState<string | null>(getSlugFromHash)

  useEffect(() => {
    function handleHashChange() {
      setSlug(getSlugFromHash())
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  // Update document title and meta description for SEO
  useEffect(() => {
    const guide = slug ? GUIDES.find(g => g.slug === slug) : null
    const meta = document.querySelector('meta[name="description"]')
    if (guide) {
      document.title = guide.pageTitle
      if (meta) meta.setAttribute('content', guide.description)
    } else {
      document.title = 'UK Tax Guides — Income Tax, Pension, CGT — UK Budget Tracker'
      if (meta) meta.setAttribute('content', 'In-depth UK tax guides covering income tax rates, salary sacrifice, the £100k tax trap, and capital gains tax for 2024/25, 2025/26, and 2026/27.')
    }
  }, [slug])

  if (!slug) return <GuideIndex />

  const guide = GUIDES.find(g => g.slug === slug)
  if (!guide) return <GuideIndex />

  const GuideComponent = guide.component

  return (
    <div className="space-y-6">
      <a
        href="#guide"
        className="inline-flex items-center gap-1 text-sm text-emerald-600 font-medium hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        All Guides
      </a>
      <GuideComponent />
    </div>
  )
}
