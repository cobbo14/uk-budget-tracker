import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

const DIST = join(import.meta.dirname, '..', 'dist')
const BASE_URL = 'https://uk-budget-tracker.com'
const TODAY = new Date().toISOString().slice(0, 10)

// FAQ data mirrors src/components/guide/GuideView.tsx GUIDES array — keep in sync
const PAGES = [
  { hash: 'about', path: 'about', title: 'About — UK Budget Tracker', description: 'Built by an ACA and CTA qualified accountant. Learn how UK Budget Tracker calculates your tax using official HMRC rates for 2024/25, 2025/26, and 2026/27.' },
  { hash: 'contact', path: 'contact', title: 'Contact — UK Budget Tracker', description: 'Get in touch with the UK Budget Tracker team. Report bugs, suggest features, or flag incorrect tax calculations.' },
  { hash: 'guide', path: 'guide', title: 'UK Tax Guides — Income Tax, Pension, CGT — UK Budget Tracker', description: 'In-depth UK tax guides covering income tax rates, salary sacrifice, the £100k tax trap, and capital gains tax for 2024/25, 2025/26, and 2026/27.' },
  { hash: 'guide/uk-income-tax-rates', path: 'guide/uk-income-tax-rates', title: 'UK Income Tax Rates & Bands 2024/25, 2025/26, 2026/27 — UK Budget Tracker', description: 'Full rate tables for all 3 tax years, personal allowance, Scottish rates, National Insurance, and worked examples at £30k, £50k, £80k, and £100k.', faqs: [
    { question: 'What is the UK personal allowance for 2024/25, 2025/26, and 2026/27?', answer: 'The personal allowance is £12,570 for all three tax years. It is reduced by £1 for every £2 of income above £100,000, meaning it reaches zero at £125,140.' },
    { question: 'What are the current UK National Insurance rates?', answer: 'For 2025/26, employees pay 8% on earnings between £12,570 and £50,270, and 2% above that. Employers pay 15% above £5,000. Self-employed pay Class 4 NI at 6% (basic) and 2% (higher).' },
    { question: 'How do Scottish income tax rates differ from the rest of the UK?', answer: 'Scotland has six income tax bands instead of three: Starter (19%), Basic (20%), Intermediate (21%), Higher (42%), Advanced (45%), and Top (48%). The thresholds differ from rUK, meaning Scottish taxpayers on middle incomes generally pay slightly more.' },
  ] },
  { hash: 'guide/salary-sacrifice-guide', path: 'guide/salary-sacrifice-guide', title: 'Salary Sacrifice Pension UK — Is It Worth It? — UK Budget Tracker', description: 'How salary sacrifice works, NI savings, pension vs cycle-to-work vs EV schemes, worked examples, and who benefits most.', faqs: [
    { question: 'How much can I save with salary sacrifice?', answer: 'Savings depend on your tax band. A basic-rate taxpayer sacrificing £5,000 saves around £600 in NI (8%) plus £1,000 in income tax. Higher-rate taxpayers save more — up to 42% combined tax and NI on each pound sacrificed.' },
    { question: 'Do I save National Insurance with salary sacrifice?', answer: 'Yes. Unlike relief-at-source pension contributions, salary sacrifice reduces your gross pay before NI is calculated, so you save employee NI (8% in 2025/26) on the sacrificed amount. Your employer also saves 15% employer NI.' },
    { question: 'Who benefits most from salary sacrifice?', answer: 'Higher and additional-rate taxpayers benefit most due to larger tax relief. Those earning just above £100,000 benefit enormously because sacrificing income below £125,140 restores the personal allowance, avoiding the 60% effective tax rate.' },
  ] },
  { hash: 'guide/reduce-tax-above-100k', path: 'guide/reduce-tax-above-100k', title: 'How to Reduce Tax Above £100k — 60% Tax Trap Explained — UK Budget Tracker', description: 'The 60% tax trap explained, personal allowance taper, pension contributions to avoid it, and practical strategies.', faqs: [
    { question: 'Why is there a 60% tax rate above £100k?', answer: 'For every £2 of income above £100,000, your £12,570 personal allowance is reduced by £1. This means you lose £1 of allowance (taxed at 40%) on top of the normal 40% rate — giving an effective 60% marginal rate on income between £100,000 and £125,140.' },
    { question: 'What strategies reduce tax above £100k?', answer: 'The most effective strategy is making pension contributions to bring adjusted net income below £100,000, restoring the full personal allowance. Other options include Gift Aid donations, salary sacrifice arrangements, and timing bonuses across tax years.' },
    { question: 'How much pension contribution do I need to avoid the 60% trap?', answer: 'You need to contribute enough to bring your adjusted net income to £100,000. For example, if you earn £120,000, a gross pension contribution of £20,000 (relief at source) or equivalent salary sacrifice would restore your full personal allowance.' },
  ] },
  { hash: 'guide/capital-gains-tax-guide', path: 'guide/capital-gains-tax-guide', title: 'Capital Gains Tax Guide UK 2024–27 — Rates, Reliefs & Examples — UK Budget Tracker', description: 'CGT rates, annual exempt amount, Business Asset Disposal Relief, interaction with income tax, loss relief, and worked examples.', faqs: [
    { question: 'What are the UK Capital Gains Tax rates?', answer: 'From 2024/25, basic-rate taxpayers pay 10% on most assets and 18% on residential property. Higher-rate taxpayers pay 20% on most assets and 24% on residential property. Business Asset Disposal Relief qualifies for a 10% rate up to a £1m lifetime limit.' },
    { question: 'What is the Capital Gains Tax annual exempt amount?', answer: 'The annual exempt amount (AEA) is £3,000 for 2024/25 onwards, down from £6,000 in 2023/24 and £12,300 in 2022/23. This means the first £3,000 of gains each tax year is tax-free.' },
    { question: 'Can I use capital losses to reduce my CGT bill?', answer: 'Yes. Capital losses from the same tax year are automatically offset against gains. Unused losses can be carried forward indefinitely and used in future years, but only to reduce gains above the annual exempt amount.' },
  ] },
  { hash: 'guide/student-loan-guide', path: 'guide/student-loan-guide', title: 'Student Loan Repayment Guide UK — Thresholds & Rates — UK Budget Tracker', description: 'Repayment thresholds, rates, and write-off rules for Plan 1, 2, 4, 5, and Postgraduate Loans across the 2024/25–2026/27 tax years.', faqs: [
    { question: 'What is the student loan repayment threshold for Plan 2?', answer: 'The Plan 2 repayment threshold is £27,295 per year for 2024/25, 2025/26, and 2026/27. You repay 9% of income above this threshold.' },
    { question: 'When is my student loan written off?', answer: 'Plan 1 loans are written off 25 years after you were first due to repay. Plan 2 and Postgraduate loans are written off after 30 years. Plan 5 loans are written off 40 years after graduation.' },
    { question: 'Should I overpay my student loan?', answer: 'For most Plan 2 borrowers, no — the loan is written off after 30 years and most graduates will never repay in full. Overpaying may make sense for Plan 1 borrowers with small balances or high earners who would repay before write-off.' },
  ] },
  { hash: 'guide/isa-guide', path: 'guide/isa-guide', title: 'ISA Guide UK — Types, Allowances & Rules 2024–27 — UK Budget Tracker', description: 'Cash ISA, Stocks & Shares ISA, Lifetime ISA, and IFISA explained. Allowances, tax benefits, LISA rules, and strategies for 2024–27.', faqs: [
    { question: 'What is the ISA allowance for 2024/25, 2025/26, and 2026/27?', answer: 'The annual ISA allowance is £20,000 per tax year. You can split this across Cash ISA, Stocks & Shares ISA, Lifetime ISA (max £4,000), and Innovative Finance ISA.' },
    { question: 'What is a Lifetime ISA and how does it work?', answer: 'A Lifetime ISA (LISA) lets you save up to £4,000/year towards your first home or retirement. The government adds a 25% bonus (up to £1,000/year). Withdrawing for other purposes incurs a 25% penalty.' },
    { question: 'Do I pay tax on ISA investments?', answer: 'No. All interest, dividends, and capital gains within an ISA are completely tax-free. This makes ISAs one of the most tax-efficient ways to save and invest in the UK.' },
  ] },
  { hash: 'guide/dividend-tax-guide', path: 'guide/dividend-tax-guide', title: 'Dividend Tax Guide UK 2024–27 — Rates & Allowances — UK Budget Tracker', description: 'Dividend tax rates, allowances, how dividends stack on income, strategies for company directors, and worked examples.', faqs: [
    { question: 'What is the UK dividend allowance?', answer: 'The dividend allowance is £500 for 2024/25 onwards, reduced from £1,000 in 2023/24 and £2,000 in 2022/23. The first £500 of dividends is taxed at 0% regardless of your tax band.' },
    { question: 'What are the UK dividend tax rates?', answer: 'Basic-rate taxpayers pay 8.75% on dividends above the £500 allowance. Higher-rate taxpayers pay 33.75%, and additional-rate taxpayers pay 39.35%. These rates are lower than income tax because companies have already paid Corporation Tax.' },
    { question: 'Is it more tax-efficient to take dividends or salary?', answer: 'Dividends are generally more tax-efficient because they are not subject to National Insurance. Many company directors pay a small salary up to the Personal Allowance (£12,570) and take remaining profits as dividends.' },
  ] },
  { hash: 'guide/marriage-allowance-guide', path: 'guide/marriage-allowance-guide', title: 'Marriage Allowance Guide UK — Eligibility & How to Claim — UK Budget Tracker', description: 'How Marriage Allowance works, eligibility rules, how much you save (up to £252/year), how to claim, and when it is not worth it.', faqs: [
    { question: 'What is Marriage Allowance and how much can I save?', answer: 'Marriage Allowance lets you transfer £1,260 of your Personal Allowance to your spouse or civil partner, saving them up to £252 per year in income tax. You can backdate claims by 4 years.' },
    { question: 'Who is eligible for Marriage Allowance?', answer: 'The lower earner must earn less than £12,570 (not paying income tax) and the higher earner must be a basic-rate taxpayer (earning between £12,571 and £50,270). Higher and additional-rate taxpayers are not eligible.' },
    { question: 'When is Marriage Allowance not worth claiming?', answer: 'It is not worth it if the lower earner has income above £12,570, if the recipient is a higher-rate taxpayer, or if the lower earner has savings/dividend income that uses their Personal Allowance.' },
  ] },
  { hash: 'guide/child-benefit-guide', path: 'guide/child-benefit-guide', title: 'Child Benefit & HICBC Guide UK — Rates & Thresholds — UK Budget Tracker', description: 'Child Benefit payment rates, the High Income Child Benefit Charge taper (£60k–£80k), worked examples, and whether to claim or opt out.', faqs: [
    { question: 'What is the High Income Child Benefit Charge?', answer: 'HICBC is a tax charge that claws back Child Benefit when either parent earns above £60,000. You lose 1% of the benefit for every £200 above £60,000, meaning it is fully clawed back at £80,000.' },
    { question: 'How much is Child Benefit per child?', answer: 'In 2025/26, the eldest or only child receives £26.05/week (£1,354.60/year) and each additional child receives £17.25/week (£897/year).' },
    { question: 'Should I claim Child Benefit even if I earn over £80,000?', answer: 'Yes — claim but opt out of payments. The claiming parent still receives National Insurance credits towards their State Pension, which is especially valuable if they are not working or earning below the NI threshold.' },
  ] },
  { hash: 'guide/self-employment-tax-guide', path: 'guide/self-employment-tax-guide', title: 'Self-Employment Tax Guide UK — Expenses, NI & Payments on Account — UK Budget Tracker', description: 'How self-employment tax works — trading allowance, allowable expenses, Class 2 & 4 NI, payments on account, and tips to reduce your bill.', faqs: [
    { question: 'What expenses can I claim as self-employed?', answer: 'You can claim costs wholly and exclusively for business: office rent, travel (45p/mile), equipment, professional fees, marketing, and working-from-home costs (£6/week flat rate). You cannot claim personal expenses or entertainment.' },
    { question: 'What National Insurance do self-employed people pay?', answer: 'Self-employed pay Class 2 NI (flat rate ~£3.50/week if profits exceed £6,725) and Class 4 NI (6% on profits between £12,570–£50,270, 2% above £50,270).' },
    { question: 'What are payments on account for self-assessment?', answer: 'If your tax bill exceeds £1,000, you make two advance payments: 50% by 31 January and 50% by 31 July. A balancing payment follows the next January. In your first year, this means paying 150% of your tax bill in January.' },
  ] },
  { hash: 'guide/eis-seis-vct-guide', path: 'guide/eis-seis-vct-guide', title: 'EIS, SEIS & VCT Tax Relief Guide UK — UK Budget Tracker', description: 'How EIS, SEIS, and VCT schemes work — income tax relief, CGT exemption, deferral, loss relief, and key risks.', faqs: [
    { question: 'What tax relief do EIS investments offer?', answer: 'EIS provides 30% income tax relief on up to £1m invested per year, CGT exemption on gains after 3 years, CGT deferral on reinvested gains, and loss relief if the company fails.' },
    { question: 'What is the difference between EIS and SEIS?', answer: 'SEIS targets earlier-stage companies and offers 50% income tax relief (vs 30% for EIS) on up to £200,000/year. SEIS also provides 50% CGT reinvestment relief. The qualifying companies must be under 3 years old with fewer than 25 employees.' },
    { question: 'Are EIS and SEIS investments risky?', answer: 'Yes — many qualifying companies are early-stage startups with high failure rates. However, loss relief limits downside: a higher-rate taxpayer effectively risks only ~38.5p per £1 invested after income tax relief and loss relief.' },
  ] },
  { hash: 'guide/tax-dates-guide', path: 'guide/tax-dates-guide', title: 'UK Tax Year Dates & Deadlines — Self Assessment Calendar — UK Budget Tracker', description: 'Key UK tax dates — Self Assessment deadlines, payment dates, late filing penalties, PAYE dates, and a year-end planning checklist.', faqs: [
    { question: 'When does the UK tax year start and end?', answer: 'The UK tax year runs from 6 April to 5 April the following year. For example, the 2025/26 tax year runs from 6 April 2025 to 5 April 2026.' },
    { question: 'What is the Self Assessment deadline?', answer: 'Online Self Assessment returns must be filed by 31 January following the end of the tax year. Paper returns are due by 31 October. Tax owed must be paid by 31 January.' },
    { question: 'What are the penalties for late Self Assessment filing?', answer: 'Filing 1 day late incurs a £100 penalty. After 3 months, a £10/day penalty applies (up to £900). At 6 months and 12 months, further penalties of 5% of tax due (or £300, whichever is higher) apply.' },
  ] },
  { hash: 'guide/pension-annual-allowance-guide', path: 'guide/pension-annual-allowance-guide', title: 'Pension Annual Allowance Guide UK 2024–27 — Limits & Taper — UK Budget Tracker', description: 'Annual Allowance limits, tapered allowance for high earners, MPAA, carry forward rules, and the Annual Allowance Tax Charge explained.', faqs: [
    { question: 'What is the pension Annual Allowance?', answer: 'The Annual Allowance is the maximum amount of pension savings you can make each tax year with tax relief. It is £60,000 for 2024/25, 2025/26, and 2026/27. Contributions above this limit trigger an Annual Allowance Tax Charge at your marginal rate.' },
    { question: 'How does the tapered Annual Allowance work?', answer: 'If your threshold income exceeds £200,000 and your adjusted income exceeds £260,000, the Annual Allowance is reduced by £1 for every £2 of adjusted income above £260,000. The minimum tapered allowance is £10,000, reached at £360,000 adjusted income.' },
    { question: 'What are the carry forward rules for pension contributions?', answer: 'You can carry forward unused Annual Allowance from the previous 3 tax years, provided you were a member of a registered pension scheme in those years. Current year allowance is used first, then unused allowance from the earliest year.' },
  ] },
  { hash: 'guide/inheritance-tax-guide', path: 'guide/inheritance-tax-guide', title: 'Inheritance Tax Guide UK — Rates, Nil-Rate Band & Planning — UK Budget Tracker', description: 'IHT rates, nil-rate band, residence nil-rate band, exemptions, the 7-year rule, taper relief, trusts, and planning strategies.', faqs: [
    { question: 'What is the nil-rate band for Inheritance Tax?', answer: 'The nil-rate band (NRB) is £325,000 — the amount you can pass on tax-free. The residence nil-rate band adds £175,000 when passing your main home to direct descendants. Married couples can combine both, giving up to £1,000,000 tax-free.' },
    { question: 'How does the 7-year rule work for gifts?', answer: 'Gifts made more than 7 years before death are fully exempt from IHT. Gifts within 7 years may be taxed, but taper relief reduces the rate for gifts made 3–7 years before death, from 32% down to 8%.' },
    { question: 'Are transfers between spouses exempt from Inheritance Tax?', answer: 'Yes. Transfers between married couples and civil partners are completely exempt from IHT, with no limit. Any unused nil-rate band can also be transferred to the surviving spouse.' },
  ] },
  { hash: 'guide/rental-income-tax-guide', path: 'guide/rental-income-tax-guide', title: 'Rental Income Tax Guide UK — Section 24, Expenses & Relief — UK Budget Tracker', description: 'How rental income is taxed, Section 24 mortgage interest restriction, allowable expenses, Rent-a-Room relief, and reporting requirements.', faqs: [
    { question: 'How does the Section 24 mortgage interest restriction work?', answer: 'Individual landlords cannot deduct mortgage interest from rental income. Instead, they receive a 20% tax credit on interest payments. This means higher-rate taxpayers pay more tax than under the old rules, as they are taxed on gross rental income but only receive basic-rate relief on interest.' },
    { question: 'What is the property allowance?', answer: 'The property allowance lets you earn up to £1,000 per year from property income tax-free. If income exceeds £1,000, you can deduct the £1,000 allowance instead of actual expenses, or claim actual expenses — whichever is more beneficial.' },
    { question: 'What is Rent-a-Room relief?', answer: 'Rent-a-Room relief lets you earn up to £7,500 per year tax-free from letting a furnished room in your main home. It applies automatically and covers income from lodgers, but not from separate self-contained properties.' },
  ] },
  { hash: 'guide/crypto-tax-guide', path: 'guide/crypto-tax-guide', title: 'Crypto Tax Guide UK — HMRC Rules, CGT & Record Keeping — UK Budget Tracker', description: 'How HMRC taxes crypto — CGT on disposals, income tax on staking and mining, pooled cost basis, DeFi, NFTs, and record-keeping.', faqs: [
    { question: 'How is cryptocurrency taxed in the UK?', answer: 'HMRC treats crypto as property. Capital Gains Tax applies when you sell, swap, spend, or gift crypto. Income Tax applies to mining rewards, staking income, and airdrops. The CGT annual exempt amount is £3,000 from 2024/25.' },
    { question: 'What counts as a crypto disposal for CGT?', answer: 'Selling crypto for fiat currency, swapping one crypto for another, spending crypto on goods or services, and gifting crypto are all disposals. Transferring between your own wallets is not a disposal. Spouse transfers are at no gain/no loss.' },
    { question: 'What records do I need to keep for crypto tax?', answer: 'HMRC requires records of every transaction: date, type, number of tokens, GBP value at the time, fees, and running pool calculations. Records must be kept for at least 5 years after the Self Assessment deadline.' },
  ] },
  { hash: 'guide/national-insurance-guide', path: 'guide/national-insurance-guide', title: 'National Insurance Rates & Thresholds UK 2024–27 — UK Budget Tracker', description: 'Employee, employer, and self-employed NI rates, thresholds, voluntary Class 3 contributions, Employment Allowance, and State Pension qualification.', faqs: [
    { question: 'What are the employee National Insurance rates?', answer: 'Employees pay 8% NI on earnings between £12,570 and £50,270 (Primary Threshold to Upper Earnings Limit), and 2% on earnings above £50,270. These rates apply for 2024/25, 2025/26, and 2026/27.' },
    { question: 'What NI do self-employed people pay?', answer: 'Self-employed pay Class 2 NI (flat rate ~£3.50/week) and Class 4 NI (6% on profits between £12,570 and £50,270, 2% above £50,270). Both are collected via Self Assessment.' },
    { question: 'How many NI qualifying years do I need for the full State Pension?', answer: 'You need 35 qualifying years for the full new State Pension (£11,502/year in 2025/26) and a minimum of 10 qualifying years to receive any State Pension. Gaps can be filled with voluntary Class 3 contributions.' },
  ] },
]

function prerender() {
  const template = readFileSync(join(DIST, 'index.html'), 'utf-8')

  for (const page of PAGES) {
    let html = template
    const canonicalUrl = `${BASE_URL}/${page.path}/`

    // Update <title>
    html = html.replace(/<title>[^<]*<\/title>/, `<title>${page.title}</title>`)

    // Update or insert meta description
    if (html.includes('name="description"')) {
      html = html.replace(
        /<meta\s+name="description"\s+content="[^"]*"/,
        `<meta name="description" content="${page.description}"`
      )
    } else {
      html = html.replace('</head>', `<meta name="description" content="${page.description}">\n</head>`)
    }

    // Update or insert canonical link
    if (html.includes('rel="canonical"')) {
      html = html.replace(
        /<link\s+rel="canonical"\s+href="[^"]*"/,
        `<link rel="canonical" href="${canonicalUrl}"`
      )
    } else {
      html = html.replace('</head>', `<link rel="canonical" href="${canonicalUrl}">\n</head>`)
    }

    // Update or insert OG tags
    const ogTags = [
      { property: 'og:title', content: page.title },
      { property: 'og:description', content: page.description },
      { property: 'og:url', content: canonicalUrl },
      { property: 'og:type', content: 'article' },
    ]
    for (const tag of ogTags) {
      const regex = new RegExp(`<meta\\s+property="${tag.property}"\\s+content="[^"]*"`)
      if (regex.test(html)) {
        html = html.replace(regex, `<meta property="${tag.property}" content="${tag.content}"`)
      } else {
        html = html.replace('</head>', `<meta property="${tag.property}" content="${tag.content}">\n</head>`)
      }
    }

    // Update Twitter card tags with page-specific content
    const twitterTags = [
      { name: 'twitter:title', content: page.title },
      { name: 'twitter:description', content: page.description },
    ]
    for (const tag of twitterTags) {
      const regex = new RegExp(`<meta\\s+name="${tag.name}"\\s+content="[^"]*"`)
      if (regex.test(html)) {
        html = html.replace(regex, `<meta name="${tag.name}" content="${tag.content}"`)
      } else {
        html = html.replace('</head>', `<meta name="${tag.name}" content="${tag.content}">\n</head>`)
      }
    }

    // Inject BreadcrumbList and Article schemas only for guide pages
    const isGuidePage = page.path === 'guide' || page.path.startsWith('guide/')
    const isGuideIndex = page.path === 'guide'

    if (isGuidePage) {
      const breadcrumbItems = [
        { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL + '/' },
        { '@type': 'ListItem', position: 2, name: 'Guides', item: BASE_URL + '/guide/' },
      ]
      if (!isGuideIndex) {
        breadcrumbItems.push({ '@type': 'ListItem', position: 3, name: page.title.split(' — ')[0], item: canonicalUrl })
      }
      const breadcrumbSchema = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbItems,
      })
      html = html.replace('</head>', `<script type="application/ld+json">${breadcrumbSchema}</script>\n</head>`)
    }

    // Inject Article schema for individual guide pages
    if (isGuidePage && !isGuideIndex) {
      const articleSchema = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: page.title.split(' — ')[0],
        description: page.description,
        url: canonicalUrl,
        datePublished: '2025-04-06',
        dateModified: TODAY,
        author: { '@type': 'Organization', name: 'UK Budget Tracker' },
        publisher: { '@type': 'Organization', name: 'UK Budget Tracker', url: BASE_URL + '/' },
        mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalUrl },
      })
      html = html.replace('</head>', `<script type="application/ld+json">${articleSchema}</script>\n</head>`)

      // Inject FAQPage schema for individual guide pages
      if (page.faqs && page.faqs.length > 0) {
        const faqSchema = JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: page.faqs.map(faq => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: { '@type': 'Answer', text: faq.answer },
          })),
        })
        html = html.replace('</head>', `<script type="application/ld+json">${faqSchema}</script>\n</head>`)
      }
    }

    // Inject hash-sync script so the React app picks up the route when real users visit
    const syncScript = `<script>if(!window.location.hash)window.location.hash='${page.hash}'</script>`
    html = html.replace('</head>', `${syncScript}\n</head>`)

    // Write to dist/<path>/index.html
    const outDir = join(DIST, page.path)
    mkdirSync(outDir, { recursive: true })
    const outFile = join(outDir, 'index.html')
    writeFileSync(outFile, html)
    console.log(`  → ${outFile}`)
  }

  console.log('Prerendering complete!')
}

prerender()
