import type { TabId } from '@/components/layout/TabNav'

export interface TourStep {
  id: string
  tab?: TabId
  targetSelector?: string
  scrollToTarget?: boolean
  title: string
  description: string
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'install-pwa',
    title: 'Download for the best experience',
    description:
      "This app works best when installed to your device. On Chrome or Edge, click the install icon (\u229A) in the address bar. On Safari (iOS), tap the Share button then \"Add to Home Screen\". Once installed, the app opens full-screen, works offline, and feels just like a native app.",
  },
  {
    id: 'welcome',
    title: 'Welcome to UK Budget Tracker!',
    description:
      "This tour will walk you through all the main features. The app helps you track income, expenses, and capital gains — and calculates your UK tax position in real time. Press Next to begin, or Skip to explore on your own.",
  },
  {
    id: 'tab-nav',
    targetSelector: '[data-tour="tab-nav"]',
    title: 'Navigation',
    description:
      'Use the navigation bar to switch between the six main sections: Summary, Income, Expenses, Planning, Gains, and Settings.',
  },
  {
    id: 'tab-summary',
    tab: 'summary',
    targetSelector: '[data-tour="tab-summary"]',
    title: 'Summary',
    description:
      'The Summary tab is your dashboard. It shows your gross income, total tax, net income, and leftover budget — plus a breakdown of each tax component and charts.',
  },
  {
    id: 'tab-income',
    tab: 'income',
    targetSelector: '[data-tour="tab-income"]',
    title: 'Income',
    description:
      'Track all your income sources here: employment (PAYE), self-employment, rental income, dividends, and bond gains. Each type has its own set of allowable deductions.',
  },
  {
    id: 'add-income',
    tab: 'income',
    targetSelector: '[data-tour="add-income-btn"]',
    scrollToTarget: true,
    title: 'Adding Income',
    description:
      'Click "Add Income" to record a new source. The form adapts based on the income type — for example, self-employment income lets you enter allowable expenses, and employment income supports salary sacrifice (pension, cycle-to-work, EV) and benefits in kind.',
  },
  {
    id: 'tab-expenses',
    tab: 'expenses',
    targetSelector: '[data-tour="tab-expenses"]',
    title: 'Expenses',
    description:
      'Log your regular outgoings by category. You can enter amounts as weekly, monthly, or annual figures. The app can also model energy and broadband switching to find savings.',
  },
  {
    id: 'tab-gains',
    tab: 'gains',
    targetSelector: '[data-tour="tab-gains"]',
    title: 'Capital Gains',
    description:
      'Record disposals of shares, property, or business assets. The app automatically applies the Annual Exempt Amount, carry-forward losses, and the correct CGT rate — including Business Asset Disposal Relief (BADR).',
  },
  {
    id: 'tab-planning',
    tab: 'planning',
    targetSelector: '[data-tour="tab-planning"]',
    title: 'Planning',
    description:
      'The Planning tab unlocks powerful tax optimisation tools once you have added income. It includes threshold warnings, pension optimiser, Ltd vs sole trader comparison, What-If calculator, and more.',
  },
  {
    id: 'threshold-warnings',
    tab: 'planning',
    targetSelector: '[data-tour="threshold-warnings"]',
    scrollToTarget: true,
    title: 'Tax Threshold Warnings',
    description:
      'These cards alert you when you are approaching key tax thresholds — such as the Personal Allowance taper, Higher Rate band, or HICBC — and suggest how much to contribute to a pension to stay below each threshold.',
  },
  {
    id: 'pension-optimiser',
    tab: 'planning',
    targetSelector: '[data-tour="pension-optimiser"]',
    scrollToTarget: true,
    title: 'Pension Optimiser',
    description:
      "The Pension Optimiser chart shows how increasing your pension contributions affects your take-home pay. It highlights the points where contributions unlock tax relief and push you below key thresholds — making it easy to spot the most efficient contribution level.",
  },
  {
    id: 'tab-settings',
    tab: 'settings',
    targetSelector: '[data-tour="tab-settings"]',
    title: 'Settings',
    description:
      'Configure your personal tax details: tax year, Scottish taxpayer status, pension contributions, student loan plan, Gift Aid, Marriage Allowance, Child Benefit, and more. All settings feed directly into the tax calculations.',
  },
  {
    id: 'profile-switcher',
    targetSelector: '[data-tour="profile-switcher"]',
    title: 'Profiles',
    description:
      'Use profiles to maintain separate sets of data — for example, one profile for the current tax year and another to model a different income scenario. Each profile has its own income, expenses, and settings.',
  },
  {
    id: 'done',
    title: "You're all set!",
    description:
      "You've seen all the main features. Start by adding your income sources in the Income tab, then work through the rest of the app. You can restart this tour at any time by clicking the ? button in the header.",
  },
]
