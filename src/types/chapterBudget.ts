/** Chapter semester budget — treasurer allotments per exec position */

export type BudgetEntryKind = 'income' | 'expense'

/** Treasurer-set allotment for one chapter position */
export interface PositionAllotment {
  positionId: string
  allottedAmount: number
}

export interface BudgetLineItem {
  id: string
  /** Position whose allotment this spends against (expenses). Optional for chapter income. */
  positionId?: string
  label: string
  kind: BudgetEntryKind
  amount: number
  date: string
  notes?: string
}

export interface BudgetState {
  semester: string
  allotments: PositionAllotment[]
  lineItems: BudgetLineItem[]
}
