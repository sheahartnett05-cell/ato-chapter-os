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
import type { BudgetLineItem, ChapterBudget } from '../types/budget'

const STORAGE_KEY = 'chapter-os-budgets'

function readBudgets(): ChapterBudget[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as ChapterBudget[]
  } catch {
    /* ignore */
  }
  return allowDemoData() ? DEMO_BUDGETS : []
}

function writeBudgets(budgets: ChapterBudget[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(budgets))
  } catch {
    /* storage unavailable */
  }
}

function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}

interface CreateBudgetInput {
  name: string
  description: string
  semester: string
  createdBy: string
  lineItems: { label: string; allocated: number; spent?: number }[]
}

interface BudgetContextValue {
  budgets: ChapterBudget[]
  getBudget: (id: string) => ChapterBudget | undefined
  addBudget: (input: CreateBudgetInput) => ChapterBudget
  updateBudget: (id: string, patch: Partial<Pick<ChapterBudget, 'name' | 'description' | 'semester'>>) => void
  addLineItem: (budgetId: string, item: Omit<BudgetLineItem, 'id'>) => void
  updateLineItem: (budgetId: string, itemId: string, patch: Partial<BudgetLineItem>) => void
  removeLineItem: (budgetId: string, itemId: string) => void
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
          spent: item.spent ?? 0,
        })),
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
            ? { ...b, lineItems: b.lineItems.filter((li) => li.id !== itemId) }
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
      deleteBudget,
    }),
    [budgets, getBudget, addBudget, updateBudget, addLineItem, updateLineItem, removeLineItem, deleteBudget]
  )

  return <BudgetContext.Provider value={value}>{children}</BudgetContext.Provider>
}

export function useBudgets(): BudgetContextValue {
  const ctx = useContext(BudgetContext)
  if (!ctx) throw new Error('useBudgets must be used within BudgetProvider')
  return ctx
}
