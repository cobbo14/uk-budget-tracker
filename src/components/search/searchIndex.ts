import type { TabId } from '@/components/layout/TabNav'

export interface SearchItem {
  id: string
  label: string
  description?: string
  keywords: string[]
  tab: TabId
  hash?: string
  targetSelector?: string
  budgetingModeHidden?: boolean
}

export const SEARCH_INDEX: SearchItem[] = [
  // ── Summary ──
  { id: 'summary-dashboard', label: 'Summary Dashboard', description: 'Overview of income, tax, and leftover', keywords: ['overview', 'headline', 'dashboard', 'summary'], tab: 'summary' },
  { id: 'tax-breakdown', label: 'Tax Breakdown', description: 'Detailed income tax and NI breakdown', keywords: ['income tax', 'ni', 'national insurance', 'deductions', 'breakdown'], tab: 'summary' },
  { id: 'budget-summary', label: 'Budget Summary', description: 'Net income minus expenses', keywords: ['budget', 'expenses', 'leftover', 'net income'], tab: 'summary' },
  { id: 'budget-bar', label: 'Budget Bar', description: 'Visual expenses vs leftover bar', keywords: ['bar', 'visual', 'spending', 'chart'], tab: 'summary' },
  { id: 'upcoming-renewals', label: 'Upcoming Renewals', description: 'Bills and subscriptions renewing soon', keywords: ['renewal', 'expiry', 'bills', 'subscription'], tab: 'summary' },

  // ── Income ──
  { id: 'income-employment', label: 'Employment Income (PAYE)', description: 'Add salary, wages, or employment income', keywords: ['salary', 'paye', 'employment', 'wages', 'job', 'bonus'], tab: 'income' },
  { id: 'income-self-employment', label: 'Self-Employment Income', description: 'Freelance or sole trader income', keywords: ['freelance', 'self employed', 'sole trader', 'business', 'self-employment'], tab: 'income' },
  { id: 'income-rental', label: 'Rental Income', description: 'Property and landlord income', keywords: ['property', 'landlord', 'rent', 'rental'], tab: 'income' },
  { id: 'income-dividends', label: 'Dividend Income', description: 'Dividends from shares or a company', keywords: ['dividends', 'shares', 'company director'], tab: 'income' },
  { id: 'income-savings', label: 'Savings / Bond Interest', description: 'Interest from savings or bonds', keywords: ['interest', 'bonds', 'savings', 'bank'], tab: 'income' },
  { id: 'add-income', label: 'Add Income Source', description: 'Add a new income source', keywords: ['add', 'new income', 'create'], tab: 'income', targetSelector: '[data-tour="add-income-btn"]' },

  // ── Expenses ──
  { id: 'expenses', label: 'Expense Tracking', description: 'Track monthly and annual expenses', keywords: ['bills', 'spending', 'outgoings', 'costs', 'expenses'], tab: 'expenses' },
  { id: 'add-expense', label: 'Add Expense', description: 'Add a new expense', keywords: ['add', 'new expense', 'create'], tab: 'expenses', targetSelector: '[data-tour="add-expense-btn"]' },
  { id: 'energy-comparison', label: 'Energy Comparison', description: 'Compare energy costs', keywords: ['energy', 'electricity', 'gas', 'utility', 'switch'], tab: 'expenses', targetSelector: '[data-search="energy-comparison"]' },
  { id: 'broadband-comparison', label: 'Broadband Comparison', description: 'Compare broadband deals', keywords: ['broadband', 'internet', 'wifi'], tab: 'expenses', targetSelector: '[data-search="broadband-comparison"]' },
  { id: 'category-manager', label: 'Category Manager', description: 'Manage expense categories', keywords: ['categories', 'custom category', 'manage'], tab: 'expenses', targetSelector: '[data-search="category-manager"]' },

  // ── Planning ──
  { id: 'threshold-warnings', label: 'Threshold Warnings', description: 'Alerts for PA taper, Higher Rate, HICBC', keywords: ['personal allowance', 'higher rate', 'hicbc', 'threshold', 'warning'], tab: 'planning', targetSelector: '[data-tour="threshold-warnings"]', budgetingModeHidden: true },
  { id: 'annual-allowance', label: 'Annual Allowance Panel', description: 'Pension Annual Allowance check with carry-forward', keywords: ['pension', 'annual allowance', 'carry forward', 'aa'], tab: 'planning', targetSelector: '[data-search="annual-allowance"]', budgetingModeHidden: true },
  { id: 'pension-optimiser', label: 'Pension Optimiser', description: 'See tax saved at different contribution levels', keywords: ['pension', 'optimiser', 'optimise', 'contribution', 'chart'], tab: 'planning', targetSelector: '[data-tour="pension-optimiser"]', budgetingModeHidden: true },
  { id: 'tax-year-comparison', label: 'Tax Year Comparison', description: "Compare next year's rules against current", keywords: ['compare', 'year', 'next year', 'previous year', 'comparison'], tab: 'planning', targetSelector: '[data-search="tax-year-comparison"]', budgetingModeHidden: true },
  { id: 'payslip-reconciliation', label: 'Payslip Reconciliation', description: 'Compare calculated vs actual take-home pay', keywords: ['payslip', 'reconcile', 'actual', 'take home', 'pay'], tab: 'planning', targetSelector: '[data-search="payslip-reconciliation"]', budgetingModeHidden: true },
  { id: 'partner-panel', label: 'Partner / Household Panel', description: 'Combined household income overview', keywords: ['partner', 'spouse', 'household', 'combined'], tab: 'planning', targetSelector: '[data-search="partner-panel"]', budgetingModeHidden: true },
  { id: 'what-if', label: 'What-If Calculator', description: 'Model income adjustments and scenarios', keywords: ['what if', 'scenario', 'model', 'bonus', 'pay rise'], tab: 'planning', targetSelector: '[data-search="what-if"]', budgetingModeHidden: true },

  // ── Gains ──
  { id: 'capital-gains', label: 'Capital Gains Tracking', description: 'Track disposals and CGT', keywords: ['cgt', 'capital gains', 'disposal', 'shares', 'property'], tab: 'gains', budgetingModeHidden: true },
  { id: 'add-gain', label: 'Add Capital Gain', description: 'Add a new disposal', keywords: ['add gain', 'new gain', 'disposal'], tab: 'gains', targetSelector: '[data-tour="add-gain-btn"]', budgetingModeHidden: true },
  { id: 'isa-tracker', label: 'ISA Allowance Tracker', description: 'Track ISA contributions against the £20k limit', keywords: ['isa', 'stocks and shares', 'lifetime isa', 'lisa', 'cash isa', 'allowance'], tab: 'gains', targetSelector: '[data-search="isa-tracker"]', budgetingModeHidden: true },
  { id: 'badr-summary', label: 'BADR Summary', description: "Business Asset Disposal Relief summary", keywords: ['badr', 'business asset disposal', 'entrepreneurs relief'], tab: 'gains', targetSelector: '[data-search="badr-summary"]', budgetingModeHidden: true },
  { id: 'carried-forward-losses', label: 'Carried-Forward Losses', description: 'Capital losses from previous years', keywords: ['losses', 'carry forward', 'capital loss'], tab: 'gains', targetSelector: '[data-search="carried-forward-losses"]', budgetingModeHidden: true },

  // ── Settings ──
  { id: 'settings-tax-year', label: 'Tax Year Setting', description: 'Select tax year for calculations', keywords: ['tax year', '2024', '2025', '2026', '2027'], tab: 'settings', targetSelector: '[data-search="settings-tax-year"]' },
  { id: 'settings-scottish', label: 'Scottish Taxpayer', description: 'Toggle Scottish income tax rates', keywords: ['scotland', 'scottish rates', 'scottish taxpayer'], tab: 'settings', targetSelector: '[data-search="settings-scottish"]' },
  { id: 'settings-pension', label: 'Pension Contributions', description: 'Employee, employer, and SIPP pension setup', keywords: ['pension', 'employee', 'employer', 'sipp', 'contribution'], tab: 'settings', targetSelector: '[data-search="settings-pension"]' },
  { id: 'settings-student-loan', label: 'Student Loan Plan', description: 'Select repayment plan (1, 2, 4, Postgrad)', keywords: ['student loan', 'plan 1', 'plan 2', 'plan 4', 'postgrad', 'repayment'], tab: 'settings', targetSelector: '[data-search="settings-student-loan"]' },
  { id: 'settings-gift-aid', label: 'Gift Aid Donations', description: 'Annual Gift Aid donations', keywords: ['gift aid', 'charity', 'donations'], tab: 'settings', targetSelector: '[data-search="settings-gift-aid"]' },
  { id: 'settings-marriage', label: 'Marriage Allowance', description: 'Transfer or receive personal allowance', keywords: ['marriage', 'civil partner', 'spouse', 'transfer allowance'], tab: 'settings', targetSelector: '[data-search="settings-marriage"]' },
  { id: 'settings-child-benefit', label: 'Child Benefit / HICBC', description: 'Child Benefit claiming and HICBC', keywords: ['child benefit', 'hicbc', 'children', 'high income'], tab: 'settings', targetSelector: '[data-search="settings-child-benefit"]' },
  { id: 'settings-eis', label: 'EIS / SEIS / VCT Relief', description: 'Investment tax relief settings', keywords: ['eis', 'seis', 'vct', 'investment relief', 'venture capital'], tab: 'settings', targetSelector: '[data-search="settings-eis"]' },
  { id: 'settings-blind', label: "Blind Person's Allowance", description: 'Additional personal allowance for registered blind', keywords: ['blind', 'disability', 'allowance'], tab: 'settings', targetSelector: '[data-search="settings-blind"]' },
  { id: 'settings-tax-code', label: 'Tax Code', description: 'Enter your PAYE tax code', keywords: ['tax code', '1257l', 'paye code', 'payslip'], tab: 'settings', targetSelector: '[data-search="settings-tax-code"]' },
  { id: 'settings-badr', label: 'BADR Lifetime Allowance', description: "Business Asset Disposal Relief used", keywords: ['badr', 'entrepreneurs relief', 'business asset', 'lifetime'], tab: 'settings', targetSelector: '[data-search="settings-badr"]' },
  { id: 'settings-basis-period', label: 'Basis Period Reform', description: 'Transitional profit spread for self-employed', keywords: ['basis period', 'transitional profit', 'sole trader'], tab: 'settings', targetSelector: '[data-search="settings-basis-period"]' },
  { id: 'settings-household', label: 'Household / Partner Income', description: "Partner's gross income for household overview", keywords: ['partner', 'household', 'partner income', 'spouse'], tab: 'settings', targetSelector: '[data-search="settings-household"]' },
  { id: 'settings-data', label: 'Data Management', description: 'Export, import, and back up your data', keywords: ['export', 'import', 'backup', 'json', 'csv', 'data'], tab: 'settings', targetSelector: '[data-search="settings-data"]' },

  // ── Help ──
  { id: 'help-getting-started', label: 'Getting Started', description: 'How to use UK Budget Tracker', keywords: ['getting started', 'install', 'pwa', 'how to', 'begin', 'tutorial'], tab: 'help' },
  { id: 'help-all', label: 'Help & Guide', description: 'Full help documentation', keywords: ['help', 'guide', 'documentation', 'faq'], tab: 'help' },

  // ── Guides ──
  { id: 'guide-income-tax', label: 'Income Tax Rates & Bands Guide', description: 'Full rate tables, Personal Allowance, Scottish rates', keywords: ['income tax', 'rates', 'bands', 'personal allowance', 'tax tables'], tab: 'guide', hash: 'guide/uk-income-tax-rates' },
  { id: 'guide-salary-sacrifice', label: 'Salary Sacrifice Guide', description: 'How salary sacrifice works, NI savings', keywords: ['salary sacrifice', 'pension sacrifice', 'ni savings'], tab: 'guide', hash: 'guide/salary-sacrifice-guide' },
  { id: 'guide-100k', label: 'Reduce Tax Above £100k', description: '60% tax trap and strategies to avoid it', keywords: ['100k', '60%', 'tax trap', 'personal allowance taper', 'reduce tax'], tab: 'guide', hash: 'guide/reduce-tax-above-100k' },
  { id: 'guide-cgt', label: 'Capital Gains Tax Guide', description: 'CGT rates, annual exempt amount, reliefs', keywords: ['cgt', 'capital gains tax', 'disposal', 'annual exempt'], tab: 'guide', hash: 'guide/capital-gains-tax-guide' },
  { id: 'guide-student-loan', label: 'Student Loan Repayment Guide', description: 'Thresholds, rates, and write-off rules', keywords: ['student loan', 'repayment', 'plan 1', 'plan 2', 'write off'], tab: 'guide', hash: 'guide/student-loan-guide' },
  { id: 'guide-isa', label: 'ISA Guide', description: 'Types, allowances, LISA, and strategies', keywords: ['isa', 'cash isa', 'stocks shares', 'lifetime isa', 'lisa'], tab: 'guide', hash: 'guide/isa-guide' },
  { id: 'guide-dividends', label: 'Dividend Tax Guide', description: 'Dividend rates, allowances, director strategies', keywords: ['dividend', 'dividend tax', 'company director', 'shares'], tab: 'guide', hash: 'guide/dividend-tax-guide' },
  { id: 'guide-marriage', label: 'Marriage Allowance Guide', description: 'Eligibility, how to claim, transfer rules', keywords: ['marriage allowance', 'civil partner', 'transfer'], tab: 'guide', hash: 'guide/marriage-allowance-guide' },
  { id: 'guide-child-benefit', label: 'Child Benefit & HICBC Guide', description: 'Rates, HICBC taper, whether to claim', keywords: ['child benefit', 'hicbc', 'high income charge'], tab: 'guide', hash: 'guide/child-benefit-guide' },
  { id: 'guide-self-employment', label: 'Self-Employment Tax Guide', description: 'Expenses, Class 2 & 4 NI, payments on account', keywords: ['self employment', 'sole trader', 'class 2', 'class 4', 'self assessment'], tab: 'guide', hash: 'guide/self-employment-tax-guide' },
  { id: 'guide-eis', label: 'EIS, SEIS & VCT Guide', description: 'Investment tax relief schemes', keywords: ['eis', 'seis', 'vct', 'venture capital', 'tax relief'], tab: 'guide', hash: 'guide/eis-seis-vct-guide' },
  { id: 'guide-tax-dates', label: 'Tax Year Dates & Deadlines', description: 'Self Assessment deadlines, payment dates', keywords: ['tax dates', 'deadlines', 'self assessment', 'penalties', 'filing'], tab: 'guide', hash: 'guide/tax-dates-guide' },
  { id: 'guide-pension-aa', label: 'Pension Annual Allowance Guide', description: 'Limits, taper, MPAA, carry forward', keywords: ['pension', 'annual allowance', 'taper', 'mpaa', 'carry forward'], tab: 'guide', hash: 'guide/pension-annual-allowance-guide' },
  { id: 'guide-inheritance', label: 'Inheritance Tax Guide', description: 'IHT rates, nil-rate band, 7-year rule', keywords: ['inheritance tax', 'iht', 'nil rate band', 'estate', '7 year'], tab: 'guide', hash: 'guide/inheritance-tax-guide' },
  { id: 'guide-rental', label: 'Rental Income Tax Guide', description: 'Section 24, expenses, Rent-a-Room', keywords: ['rental income', 'landlord', 'section 24', 'mortgage interest', 'property tax'], tab: 'guide', hash: 'guide/rental-income-tax-guide' },
  { id: 'guide-crypto', label: 'Crypto Tax Guide', description: 'HMRC crypto rules, CGT, staking, mining', keywords: ['crypto', 'bitcoin', 'ethereum', 'nft', 'staking', 'mining'], tab: 'guide', hash: 'guide/crypto-tax-guide' },
  { id: 'guide-ni', label: 'National Insurance Rates Guide', description: 'Employee, employer, self-employed NI rates', keywords: ['national insurance', 'ni', 'class 1', 'class 2', 'class 4', 'state pension'], tab: 'guide', hash: 'guide/national-insurance-guide' },
]
