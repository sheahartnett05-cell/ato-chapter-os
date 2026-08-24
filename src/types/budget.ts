export interface BudgetLineItem {
  id: string
  label: string
  allocated: number
  spent: number
}

export interface ChapterBudget {
  id: string
  name: string
  description: string
  semester: string
  createdAt: string
  createdBy: string
  lineItems: BudgetLineItem[]
}

export function budgetTotals(budget: ChapterBudget) {
  const allocated = budget.lineItems.reduce((s, i) => s + i.allocated, 0)
  const spent = budget.lineItems.reduce((s, i) => s + i.spent, 0)
  return { allocated, spent, remaining: allocated - spent }
}
