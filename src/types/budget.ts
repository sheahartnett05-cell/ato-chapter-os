export interface BudgetLineItem {
  id: string
  label: string
  allocated: number
}

export interface BudgetExpense {
  id: string
  lineItemId: string
  amount: number
  description: string
  date: string
  loggedBy: string
}

export interface ChapterBudget {
  id: string
  name: string
  description: string
  semester: string
  createdAt: string
  createdBy: string
  lineItems: BudgetLineItem[]
  expenses: BudgetExpense[]
}

export type BudgetLineItemWithSpent = BudgetLineItem & { spent: number }

export function lineItemSpent(budget: ChapterBudget, lineItemId: string): number {
  return budget.expenses
    .filter((e) => e.lineItemId === lineItemId)
    .reduce((sum, e) => sum + e.amount, 0)
}

export function lineItemsWithSpent(budget: ChapterBudget): BudgetLineItemWithSpent[] {
  return budget.lineItems.map((item) => ({
    ...item,
    spent: lineItemSpent(budget, item.id),
  }))
}

export function budgetTotals(budget: ChapterBudget) {
  const allocated = budget.lineItems.reduce((s, i) => s + i.allocated, 0)
  const spent = budget.expenses.reduce((s, e) => s + e.amount, 0)
  return { allocated, spent, remaining: allocated - spent }
}

export function expenseLineLabel(budget: ChapterBudget, lineItemId: string): string {
  return budget.lineItems.find((li) => li.id === lineItemId)?.label ?? 'Unknown category'
}
