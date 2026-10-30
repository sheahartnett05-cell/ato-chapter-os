import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { DEMO_BUDGETS } from '../data/budgetData'
import { allowDemoData } from '../lib/demoSeed'
import { readJson, writeJson } from '../lib/persist'
import type { BudgetExpense, BudgetLineItem, ChapterBudget } from '../types/budget'

const STORAGE_KEY = 'chapter-os-budgets'

function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}

/** Migrate older budgets that stored spent on line items instead of expense logs. */
function normalizeBudget(raw: ChapterBudget & { lineItems?: Array<BudgetLineItem & { spent?: number }> }): ChapterBudget {
  const expenses = raw.expenses ?? []
  if (expenses.length > 0) {
    return {
      ...raw,
      expenses,
      lineItems: raw.lineItems.map(({ id, label, allocated }) => ({ id, label, allocated })),
    }
  }

  const migrated: BudgetExpense[] = []
  for (const item of raw.lineItems) {
    const legacySpent = 'spent' in item ? Number(item.spent) || 0 : 0
    if (legacySpent > 0) {
      migrated.push({
        id: uid('ex-mig'),
        lineItemId: item.id,
        amount: legacySpent,
        description: 'Previously logged spending',
        date: raw.createdAt.slice(0, 10),
        loggedBy: raw.createdBy,
      })
    }
  }

  return {
    ...raw,
    expenses: migrated,
    lineItems: raw.lineItems.map(({ id, label, allocated }) => ({ id, label, allocated })),
  }
}

function readBudgets(): ChapterBudget[] {
  const raw = readJson<ChapterBudget[] | null>(STORAGE_KEY, null)
  if (raw && Array.isArray(raw)) return raw.map(normalizeBudget)
  return allowDemoData() ? DEMO_BUDGETS : []
}

function writeBudgets(budgets: ChapterBudget[]) {
  writeJson(STORAGE_KEY, budgets)
}

interface CreateBudgetInput {
  name: string
  description: string
  semester: string
  createdBy: string
  lineItems: { label: string; allocated: number }[]
}

interface LogExpenseInput {
  lineItemId: string
  amount: number
  description: string
  date: string
  loggedBy: string
}

interface BudgetContextValue {
  budgets: ChapterBudget[]
  getBudget: (id: string) => ChapterBudget | undefined
  addBudget: (input: CreateBudgetInput) => ChapterBudget
  updateBudget: (id: string, patch: Partial<Pick<ChapterBudget, 'name' | 'description' | 'semester'>>) => void
  addLineItem: (budgetId: string, item: Omit<BudgetLineItem, 'id'>) => void
  updateLineItem: (budgetId: string, itemId: string, patch: Partial<BudgetLineItem>) => void
  removeLineItem: (budgetId: string, itemId: string) => void
  logExpense: (budgetId: string, input: LogExpenseInput) => void
  removeExpense: (budgetId: string, expenseId: string) => void
  deleteBudget: (id: string) => void
}

const BudgetContext = createContext<BudgetContextValue | null>(null)

export function BudgetProvider({ children }: { children: ReactNode }) {
  const [budgets, setBudgets] = useState<ChapterBudget[]>(readBudgets)

  const persist = useCallback((next: ChapterBudget[]) => {
    setBudgets(next)
    writeBudgets(next)
  }, [])

  const getBudget = useCallback((id: string) => budgets.find((b) => b.id === id), [budgets])

  const addBudget = useCallback(
    (input: CreateBudgetInput): ChapterBudget => {
      const budget: ChapterBudget = {
        id: uid('bud'),
        name: input.name.trim(),
        description: input.description.trim(),
        semester: input.semester.trim(),
        createdAt: new Date().toISOString(),
        createdBy: input.createdBy,
        lineItems: input.lineItems.map((item) => ({
          id: uid('li'),
          label: item.label.trim(),
          allocated: item.allocated,
        })),
        expenses: [],
      }
      persist([budget, ...budgets])
      return budget
    },
    [budgets, persist]
  )

  const updateBudget = useCallback(
    (id: string, patch: Partial<Pick<ChapterBudget, 'name' | 'description' | 'semester'>>) => {
      persist(budgets.map((b) => (b.id === id ? { ...b, ...patch } : b)))
    },
    [budgets, persist]
  )

  const addLineItem = useCallback(
    (budgetId: string, item: Omit<BudgetLineItem, 'id'>) => {
      persist(
        budgets.map((b) =>
          b.id === budgetId
            ? { ...b, lineItems: [...b.lineItems, { ...item, id: uid('li') }] }
            : b
        )
      )
    },
    [budgets, persist]
  )

  const updateLineItem = useCallback(
    (budgetId: string, itemId: string, patch: Partial<BudgetLineItem>) => {
      persist(
        budgets.map((b) =>
          b.id === budgetId
            ? {
                ...b,
                lineItems: b.lineItems.map((li) =>
                  li.id === itemId ? { ...li, ...patch } : li
                ),
              }
            : b
        )
      )
    },
    [budgets, persist]
  )

  const removeLineItem = useCallback(
    (budgetId: string, itemId: string) => {
      persist(
        budgets.map((b) =>
          b.id === budgetId
            ? {
                ...b,
                lineItems: b.lineItems.filter((li) => li.id !== itemId),
                expenses: b.expenses.filter((e) => e.lineItemId !== itemId),
              }
            : b
        )
      )
    },
    [budgets, persist]
  )

  const logExpense = useCallback(
    (budgetId: string, input: LogExpenseInput) => {
      const expense: BudgetExpense = {
        id: uid('ex'),
        lineItemId: input.lineItemId,
        amount: input.amount,
        description: input.description.trim(),
        date: input.date,
        loggedBy: input.loggedBy.trim(),
      }
      persist(
        budgets.map((b) =>
          b.id === budgetId ? { ...b, expenses: [expense, ...b.expenses] } : b
        )
      )
    },
    [budgets, persist]
  )

  const removeExpense = useCallback(
    (budgetId: string, expenseId: string) => {
      persist(
        budgets.map((b) =>
          b.id === budgetId
            ? { ...b, expenses: b.expenses.filter((e) => e.id !== expenseId) }
            : b
        )
      )
    },
    [budgets, persist]
  )

  const deleteBudget = useCallback(
    (id: string) => {
      persist(budgets.filter((b) => b.id !== id))
    },
    [budgets, persist]
  )

  const value = useMemo<BudgetContextValue>(
    () => ({
      budgets,
      getBudget,
      addBudget,
      updateBudget,
      addLineItem,
      updateLineItem,
      removeLineItem,
      logExpense,
      removeExpense,
      deleteBudget,
    }),
    [
      budgets,
      getBudget,
      addBudget,
      updateBudget,
      addLineItem,
      updateLineItem,
      removeLineItem,
      logExpense,
      removeExpense,
      deleteBudget,
    ]
  )

  return <BudgetContext.Provider value={value}>{children}</BudgetContext.Provider>
}

export function useBudgets(): BudgetContextValue {
  const ctx = useContext(BudgetContext)
  if (!ctx) throw new Error('useBudgets must be used within BudgetProvider')
  return ctx
}
