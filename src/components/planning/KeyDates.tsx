import { useMemo, useState } from 'react'
import { useBudget } from '@/hooks/useBudget'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface KeyDate {
  date: Date
  label: string
  description: string
  /** Only shown when first year trading */
  firstYearOnly?: boolean
  /** Hidden when first year trading (no previous SA bill) */
  hideFirstYear?: boolean
  /** MTD quarterly reporting date */
  isMTD?: boolean
  /** Hidden when MTD applies (e.g. paper return not relevant) */
  hideForMTD?: boolean
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function KeyDates() {
  const { incomeSources, settings, taxSummary } = useBudget()
  const [firstYear, setFirstYear] = useState(false)

  const hasSelfEmployment = incomeSources.some(s => s.type === 'self-employment')

  // MTD for ITSA: from 2026-27 for income >£50k, from 2027-28 for income >£30k
  // Qualifying income = gross self-employment + property (rental) income before expenses
  const startYear = hasSelfEmployment ? parseInt(settings.taxYear.split('-')[0]) : 0
  const mtdQualifyingIncome = taxSummary.selfEmploymentGross + taxSummary.rentalGross
  const mtdApplies = hasSelfEmployment && (
    (startYear >= 2026 && mtdQualifyingIncome > 50000) ||
    (startYear >= 2027 && mtdQualifyingIncome > 30000)
  )
  const mtdThreshold = startYear >= 2027 ? '£30,000' : '£50,000'

  const dates = useMemo(() => {
    if (!hasSelfEmployment) return []

    const endYear = startYear + 1

    const allDates: KeyDate[] = [
      {
        date: new Date(startYear, 3, 6), // 6 April
        label: 'Tax year starts',
        description: `Start of the ${settings.taxYear} tax year`,
      },
      // MTD quarterly update deadlines
      {
        date: new Date(startYear, 7, 7), // 7 August
        label: 'MTD Q1 update due',
        description: `Quarterly update for 6 Apr – 5 Jul ${startYear} via MTD-compatible software`,
        isMTD: true,
      },
      {
        date: new Date(startYear, 10, 7), // 7 November
        label: 'MTD Q2 update due',
        description: `Quarterly update for 6 Jul – 5 Oct ${startYear} via MTD-compatible software`,
        isMTD: true,
      },
      {
        date: new Date(endYear, 0, 31), // 31 January (during tax year)
        label: '1st Payment on Account due',
        description: `Advance payment towards your ${settings.taxYear} tax bill (50% of previous year's SA bill)`,
        hideFirstYear: true,
      },
      {
        date: new Date(endYear, 1, 7), // 7 February
        label: 'MTD Q3 update due',
        description: `Quarterly update for 6 Oct ${startYear} – 5 Jan ${endYear} via MTD-compatible software`,
        isMTD: true,
      },
      {
        date: new Date(endYear, 3, 5), // 5 April
        label: 'Tax year ends',
        description: `End of the ${settings.taxYear} tax year — finalise your records`,
      },
      {
        date: new Date(endYear, 4, 7), // 7 May
        label: 'MTD Q4 update due',
        description: `Quarterly update for 6 Jan – 5 Apr ${endYear} via MTD-compatible software`,
        isMTD: true,
      },
      {
        date: new Date(endYear, 6, 31), // 31 July
        label: '2nd Payment on Account due',
        description: `Second advance payment towards your ${settings.taxYear} tax bill`,
        hideFirstYear: true,
      },
      {
        date: new Date(endYear, 9, 5), // 5 October
        label: 'Register for Self Assessment',
        description: 'Deadline to register with HMRC for Self Assessment — you\'ll need your UTR before filing',
        firstYearOnly: true,
      },
      {
        date: new Date(endYear, 9, 31), // 31 October
        label: 'Paper return deadline',
        description: `Deadline to file a paper tax return for ${settings.taxYear}`,
        hideForMTD: true,
      },
      {
        date: new Date(endYear + 1, 0, 31), // 31 January (following year)
        label: mtdApplies
          ? (firstYear ? 'Final declaration + full payment' : 'Final declaration + balancing payment')
          : (firstYear ? 'Online return + full payment' : 'Online return + balancing payment'),
        description: mtdApplies
          ? (firstYear
            ? `Submit your MTD final declaration and pay your full tax bill for ${settings.taxYear}`
            : `Submit your MTD final declaration, pay any remaining tax for ${settings.taxYear}, and 1st PoA for ${endYear}-${(endYear + 1).toString().slice(2)}`)
          : (firstYear
            ? `File your online return and pay your full tax bill for ${settings.taxYear}`
            : `File your online return, pay any remaining tax for ${settings.taxYear}, and 1st PoA for ${endYear}-${(endYear + 1).toString().slice(2)}`),
      },
    ]

    return allDates.filter(d => {
      if (firstYear && d.hideFirstYear) return false
      if (!firstYear && d.firstYearOnly) return false
      if (d.isMTD && !mtdApplies) return false
      if (d.hideForMTD && mtdApplies) return false
      return true
    })
  }, [hasSelfEmployment, settings.taxYear, firstYear, startYear, mtdApplies])

  if (!hasSelfEmployment || dates.length === 0) return null

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Find the next upcoming date
  const nextIdx = dates.findIndex(d => d.date >= today)

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-base font-semibold">Key Reporting Dates</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Important HMRC deadlines for self-employed taxpayers in the {settings.taxYear} tax year.
        </p>
      </div>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Tax year {settings.taxYear} timeline</CardTitle>
            <div className="flex items-center gap-2">
              <Label htmlFor="first-year-toggle" className="text-xs text-muted-foreground cursor-pointer">
                First year trading
              </Label>
              <Switch
                id="first-year-toggle"
                checked={firstYear}
                onCheckedChange={setFirstYear}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative space-y-0">
            {dates.map((d, i) => {
              const isPast = d.date < today
              const isNext = i === nextIdx
              const daysUntil = isNext ? Math.ceil((d.date.getTime() - today.getTime()) / 86400000) : 0

              return (
                <div key={i} className="flex gap-3 relative">
                  {/* Timeline line */}
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      'w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 z-10',
                      isPast && 'bg-muted-foreground/40',
                      isNext && 'bg-primary ring-2 ring-primary/30',
                      !isPast && !isNext && 'bg-muted-foreground/20',
                    )} />
                    {i < dates.length - 1 && (
                      <div className={cn(
                        'w-px flex-1 min-h-6',
                        isPast ? 'bg-muted-foreground/20' : 'bg-border',
                      )} />
                    )}
                  </div>

                  {/* Content */}
                  <div className={cn('pb-4 -mt-0.5', isPast && 'opacity-50')}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn(
                        'text-sm font-medium',
                        isNext && 'text-primary',
                      )}>
                        {d.label}
                      </span>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {formatDate(d.date)}
                      </span>
                      {d.isMTD && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
                          MTD
                        </span>
                      )}
                      {isPast && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                          Passed
                        </span>
                      )}
                      {isNext && daysUntil <= 90 && (
                        <span className={cn(
                          'text-[10px] font-medium px-1.5 py-0.5 rounded-full',
                          daysUntil <= 30
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                            : 'bg-primary/10 text-primary',
                        )}>
                          {daysUntil === 0 ? 'Today' : `${daysUntil} day${daysUntil === 1 ? '' : 's'}`}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{d.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
          {mtdApplies && (
            <div className="rounded-md bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800/40 px-3 py-2 mt-3">
              <p className="text-xs font-medium text-violet-800 dark:text-violet-300">Making Tax Digital for Income Tax</p>
              <p className="text-xs text-violet-700 dark:text-violet-400 mt-0.5">
                Your self-employment income exceeds {mtdThreshold}, so you must submit quarterly updates using MTD-compatible software from {settings.taxYear}.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
