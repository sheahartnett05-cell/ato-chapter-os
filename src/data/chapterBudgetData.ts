import type { BudgetState } from '../types/chapterBudget'

/** Demo allotments keyed to DEMO_CHAPTER_POSITIONS ids in featureData */
export const DEMO_BUDGET: BudgetState = {
  semester: 'Fall 2025',
  allotments: [
    { positionId: 'p1', allottedAmount: 1500 }, // President
    { positionId: 'p2', allottedAmount: 800 }, // Vice President
    { positionId: 'p3', allottedAmount: 500 }, // Treasurer (ops)
    { positionId: 'p4', allottedAmount: 4500 }, // Recruitment
    { positionId: 'p5', allottedAmount: 400 }, // Secretary
    { positionId: 'p6', allottedAmount: 600 }, // Scholarship
    { positionId: 'p6b', allottedAmount: 300 }, // Standards
    { positionId: 'p7', allottedAmount: 12000 }, // Social
    { positionId: 'p8', allottedAmount: 3500 }, // Philanthropy
  ],
  lineItems: [
    {
      id: 'bli-1',
      label: 'Fall dues collection (Aug)',
      kind: 'income',
      amount: 18700,
      date: '2025-08-28',
    },
    {
      id: 'bli-2',
      label: 'Fall dues collection (Sep)',
      kind: 'income',
      amount: 14250,
      date: '2025-09-15',
    },
    {
      id: 'bli-3',
      label: 'Homecoming alumni gift',
      kind: 'income',
      amount: 2500,
      date: '2025-10-04',
      notes: 'Class of 2012',
    },
    {
      id: 'bli-4',
      positionId: 'p7',
      label: 'Date night deposit',
      kind: 'expense',
      amount: 1800,
      date: '2025-09-02',
    },
    {
      id: 'bli-5',
      positionId: 'p7',
      label: 'Fall Formal venue hold',
      kind: 'expense',
      amount: 4500,
      date: '2025-09-20',
    },
    {
      id: 'bli-6',
      positionId: 'p4',
      label: 'Rush shirts',
      kind: 'expense',
      amount: 980,
      date: '2025-08-18',
    },
    {
      id: 'bli-7',
      positionId: 'p4',
      label: 'Open house catering',
      kind: 'expense',
      amount: 1200,
      date: '2025-09-05',
    },
    {
      id: 'bli-8',
      positionId: 'p8',
      label: 'Philanthropy supplies',
      kind: 'expense',
      amount: 750,
      date: '2025-09-10',
    },
    {
      id: 'bli-9',
      positionId: 'p1',
      label: 'National conference travel',
      kind: 'expense',
      amount: 620,
      date: '2025-09-22',
    },
    {
      id: 'bli-10',
      positionId: 'p6',
      label: 'Study snacks & library cards',
      kind: 'expense',
      amount: 180,
      date: '2025-09-08',
    },
  ],
}

export const EMPTY_BUDGET: BudgetState = {
  semester: 'Fall 2025',
  allotments: [],
  lineItems: [],
}
