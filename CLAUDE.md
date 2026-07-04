# UK Budget Tracker

Client-side UK tax planning PWA. No backend, no env vars — all state lives in localStorage.

## Commands

- `npm run dev` — Vite dev server (auto-picks port)
- `npm run build` — tsc + Vite build + prerender script
- `npm run preview` — preview build at localhost:4173 (use this to install as PWA)
- `npm run test` — run vitest once
- `npm run test:watch` — vitest watch mode
- `npm run lint` — ESLint check (needs `@babel/core` devDependency — required by eslint-plugin-react-hooks v7)

## Stack

- React 19, TypeScript 5.9 (strict), Vite 7
- Tailwind CSS 4 (via `@tailwindcss/vite`, no separate config file)
- shadcn/ui + Radix UI primitives + lucide-react icons
- Recharts for charts
- Vitest for testing
- Deployed on Vercel, PWA via `vite-plugin-pwa`

## Architecture

### State management
- **React Context + useReducer** — two providers:
  - `ProfilesContext` — manages profile list + active profile
  - `AppProvider` — per-profile state via reducer
- **Custom hooks** (`useBudget`, `useIncomeSources`, `useExpenses`, etc.) provide memoised selectors
- **localStorage persistence** — debounced 300ms save, flushed on unmount/page-hide. Keys: `uk_budget_tracker_profiles`, `uk_budget_tracker_state_{profileId}`
- **Undo** (no redo) — snapshot stack (max 10) for data-modifying actions; rapid consecutive settings updates coalesce into one step

### Routing
- Hash-based (`window.location.hash`); prerendered paths (`/guide/*`, `/about`, …) are mapped onto the hash at boot in `main.tsx`
- Valid tabs: summary, income, gains, expenses, planning, settings, help, guide
- Legal pages: disclaimer, privacy, terms

### Tax engine
- `src/utils/taxCalculations.ts` — central `calculateTax()` function
- LRU cache (max 512 entries) to avoid recalculation in planning loops
- Tax year rules in `src/taxRules/` — currently supports 2025-26 and 2026-27; retired years are migrated to the default in `mergeWithDefaults`

## Project structure

```
src/
  components/
    ui/          — shadcn/ui primitives (button, card, dialog, input, select, etc.)
    layout/      — AppShell, Header, ProfileSwitcher, TabNav
    income/      — IncomeView, IncomeCard, IncomeFormDialog
    expenses/    — ExpensesView, ExpenseCard, ExpenseFormDialog, CategoryManagerDialog
    gains/       — GainsView, GainCard, GainFormDialog
    planning/    — PensionOptimiser, WhatIfCalculator, PayslipReconciliation, etc.
    summary/     — SummaryView, IncomeAndTaxCharts
    guide/       — GuideView + 13 individual guide components
    settings/    — SettingsView
    help/        — HelpView
    legal/       — LegalView
    search/      — SearchDialog, searchIndex
    tour/        — TourContext, TourOverlay, tourSteps
    welcome/     — WelcomeGuide
  store/         — AppContext, ProfilesContext, reducer, actions, selectors
  hooks/         — useBudget, useAppSettings, useIncomeSources, useExpenses, etc.
  taxRules/      — Tax year configs (types, per-year rules)
  types/         — Core TypeScript interfaces and enums
  utils/         — taxCalculations, formatting, planningUtils, pensionProjection, exportUtils
  services/      — localStorage persistence + migration
  lib/           — cn() helper (clsx + tailwind-merge)
  constants/     — expenseCategories
scripts/
  prerender.mjs  — SEO static HTML generation for guide pages
```

## Conventions

- **Components**: PascalCase files (`IncomeView.tsx`). Feature-grouped folders.
- **Hooks**: `use` prefix, camelCase (`useBudget.ts`)
- **shadcn/ui components**: lowercase with hyphens (`confirm-dialog.tsx`)
- **Styling**: Tailwind utilities + `cn()` for conditional classes. CSS variables in `src/index.css` using oklch(). Light/dark theme.
- **Lazy loading**: SummaryView and PlanningView are lazy-loaded in App.tsx
- **Path alias**: `@/*` maps to `src/*`
- **Unused vars**: prefix with `_` to suppress lint errors

## Important notes

- **No Puppeteer** — prerender script uses pure string manipulation. Vercel's build env lacks Chrome.
- **Split expenses** — synced across profiles via `syncSplitToOtherProfiles()`
- **No Prettier config** — uses editor defaults
- **No .env files** — fully client-side app
- **Browser testing** — MCP Playwright is available for interactive browser testing if needed (e.g. verifying UI behaviour, testing flows end-to-end)
