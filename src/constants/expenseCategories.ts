import type { CustomExpenseCategory } from '@/types'

export interface ExpenseCategoryMeta {
  label: string
  icon: string // Lucide icon name
  color: string // Tailwind colour class for badges
}

export const EXPENSE_CATEGORIES: Record<string, ExpenseCategoryMeta> = {
  housing: { label: 'Housing', icon: 'Home', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  food: { label: 'Food & Groceries', icon: 'ShoppingCart', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  transport: { label: 'Transport', icon: 'Car', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
  utilities: { label: 'Utilities', icon: 'Zap', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' },
  entertainment: { label: 'Entertainment', icon: 'Tv', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
  subscriptions: { label: 'Subscriptions', icon: 'RefreshCw', color: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200' },
  clothing: { label: 'Clothing', icon: 'Shirt', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200' },
  healthcare: { label: 'Healthcare', icon: 'Heart', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
  personal: { label: 'Personal Care', icon: 'User', color: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200' },
  savings: { label: 'Savings & Investments', icon: 'PiggyBank', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' },
  other: { label: 'Other', icon: 'MoreHorizontal', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200' },
}

export const EXPENSE_CATEGORY_LIST: string[] = Object.keys(EXPENSE_CATEGORIES)

export const CUSTOM_CATEGORY_COLORS = [
  'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
  'bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-200',
  'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200',
  'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200',
  'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
]

export function getCategoryMeta(
  cat: string,
  customCategories: CustomExpenseCategory[],
): ExpenseCategoryMeta {
  if (EXPENSE_CATEGORIES[cat]) return EXPENSE_CATEGORIES[cat]
  const idx = customCategories.findIndex(c => c.id === cat)
  const custom = customCategories[idx]
  return {
    label: custom?.label ?? cat,
    icon: 'Tag',
    color: CUSTOM_CATEGORY_COLORS[idx % CUSTOM_CATEGORY_COLORS.length] ?? CUSTOM_CATEGORY_COLORS[0],
  }
}
