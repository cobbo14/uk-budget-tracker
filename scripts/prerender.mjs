import { createServer } from 'http'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { join, extname } from 'path'
import { launch } from 'puppeteer'

const DIST = join(import.meta.dirname, '..', 'dist')
const BASE_URL = 'https://uk-budget-tracker.com'

const PAGES = [
  { hash: 'guide', path: 'guide', title: 'UK Tax Guides — Income Tax, Pension, CGT — UK Budget Tracker', description: 'In-depth UK tax guides covering income tax rates, salary sacrifice, the £100k tax trap, and capital gains tax for 2024/25, 2025/26, and 2026/27.' },
  { hash: 'guide/uk-income-tax-rates', path: 'guide/uk-income-tax-rates', title: 'UK Income Tax Rates & Bands 2024/25, 2025/26, 2026/27 — UK Budget Tracker', description: 'Full rate tables for all 3 tax years, personal allowance, Scottish rates, National Insurance, and worked examples at £30k, £50k, £80k, and £100k.' },
  { hash: 'guide/salary-sacrifice-guide', path: 'guide/salary-sacrifice-guide', title: 'Salary Sacrifice Pension UK — Is It Worth It? — UK Budget Tracker', description: 'How salary sacrifice works, NI savings, pension vs cycle-to-work vs EV schemes, worked examples, and who benefits most.' },
  { hash: 'guide/reduce-tax-above-100k', path: 'guide/reduce-tax-above-100k', title: 'How to Reduce Tax Above £100k — 60% Tax Trap Explained — UK Budget Tracker', description: 'The 60% tax trap explained, personal allowance taper, pension contributions to avoid it, and practical strategies.' },
  { hash: 'guide/capital-gains-tax-guide', path: 'guide/capital-gains-tax-guide', title: 'Capital Gains Tax Guide UK 2024–27 — Rates, Reliefs & Examples — UK Budget Tracker', description: 'CGT rates, annual exempt amount, Business Asset Disposal Relief, interaction with income tax, loss relief, and worked examples.' },
  { hash: 'guide/student-loan-guide', path: 'guide/student-loan-guide', title: 'Student Loan Repayment Guide UK — Thresholds & Rates — UK Budget Tracker', description: 'Repayment thresholds, rates, and write-off rules for Plan 1, 2, 4, 5, and Postgraduate Loans across the 2024/25–2026/27 tax years.' },
  { hash: 'guide/isa-guide', path: 'guide/isa-guide', title: 'ISA Guide UK — Types, Allowances & Rules 2024–27 — UK Budget Tracker', description: 'Cash ISA, Stocks & Shares ISA, Lifetime ISA, and IFISA explained. Allowances, tax benefits, LISA rules, and strategies for 2024–27.' },
  { hash: 'guide/dividend-tax-guide', path: 'guide/dividend-tax-guide', title: 'Dividend Tax Guide UK 2024–27 — Rates & Allowances — UK Budget Tracker', description: 'Dividend tax rates, allowances, how dividends stack on income, strategies for company directors, and worked examples.' },
  { hash: 'guide/marriage-allowance-guide', path: 'guide/marriage-allowance-guide', title: 'Marriage Allowance Guide UK — Eligibility & How to Claim — UK Budget Tracker', description: 'How Marriage Allowance works, eligibility rules, how much you save (up to £252/year), how to claim, and when it is not worth it.' },
  { hash: 'guide/child-benefit-guide', path: 'guide/child-benefit-guide', title: 'Child Benefit & HICBC Guide UK — Rates & Thresholds — UK Budget Tracker', description: 'Child Benefit payment rates, the High Income Child Benefit Charge taper (£60k–£80k), worked examples, and whether to claim or opt out.' },
  { hash: 'guide/self-employment-tax-guide', path: 'guide/self-employment-tax-guide', title: 'Self-Employment Tax Guide UK — Expenses, NI & Payments on Account — UK Budget Tracker', description: 'How self-employment tax works — trading allowance, allowable expenses, Class 2 & 4 NI, payments on account, and tips to reduce your bill.' },
  { hash: 'guide/eis-seis-vct-guide', path: 'guide/eis-seis-vct-guide', title: 'EIS, SEIS & VCT Tax Relief Guide UK — UK Budget Tracker', description: 'How EIS, SEIS, and VCT schemes work — income tax relief, CGT exemption, deferral, loss relief, and key risks.' },
  { hash: 'guide/tax-dates-guide', path: 'guide/tax-dates-guide', title: 'UK Tax Year Dates & Deadlines — Self Assessment Calendar — UK Budget Tracker', description: 'Key UK tax dates — Self Assessment deadlines, payment dates, late filing penalties, PAYE dates, and a year-end planning checklist.' },
]

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.webmanifest': 'application/manifest+json',
  '.xml': 'application/xml',
  '.txt': 'text/plain',
}

function startServer(port) {
  return new Promise((resolve) => {
    const server = createServer((req, res) => {
      let filePath = join(DIST, req.url === '/' ? 'index.html' : req.url)
      if (!existsSync(filePath)) {
        filePath = join(DIST, 'index.html')
      }
      try {
        const content = readFileSync(filePath)
        const ext = extname(filePath)
        res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' })
        res.end(content)
      } catch {
        res.writeHead(404)
        res.end('Not found')
      }
    })
    server.listen(port, () => resolve(server))
  })
}

async function prerender() {
  const PORT = 4173 + Math.floor(Math.random() * 1000)
  const server = await startServer(PORT)
  console.log(`Prerender server running on port ${PORT}`)

  const browser = await launch({ headless: true, args: ['--no-sandbox'] })

  for (const page of PAGES) {
    const url = `http://localhost:${PORT}/#${page.hash}`
    console.log(`Rendering: ${url}`)

    const tab = await browser.newPage()
    await tab.goto(url, { waitUntil: 'networkidle0' })
    await tab.waitForSelector('h1', { timeout: 10000 })
    // Small delay for any post-render effects (JSON-LD injection etc.)
    await new Promise(r => setTimeout(r, 500))

    let html = await tab.content()

    // Update <title>
    html = html.replace(/<title>[^<]*<\/title>/, `<title>${page.title}</title>`)

    // Update or insert meta description
    if (html.includes('name="description"')) {
      html = html.replace(
        /<meta\s+name="description"\s+content="[^"]*"/,
        `<meta name="description" content="${page.description}"`
      )
    }

    // Update or insert canonical link
    const canonicalUrl = `${BASE_URL}/${page.path}/`
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

    // Inject hash-sync script so the React app picks up the route when real users visit
    const syncScript = `<script>if(!window.location.hash)window.location.hash='${page.hash}'</script>`
    html = html.replace('</head>', `${syncScript}\n</head>`)

    // Write to dist/<path>/index.html
    const outDir = join(DIST, page.path)
    mkdirSync(outDir, { recursive: true })
    const outFile = join(outDir, 'index.html')
    writeFileSync(outFile, html)
    console.log(`  → ${outFile}`)

    await tab.close()
  }

  await browser.close()
  server.close()
  console.log('Prerendering complete!')
}

prerender().catch((err) => {
  console.error('Prerender failed:', err)
  process.exit(1)
})
