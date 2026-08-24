import type { ChapterBudget } from '../types/budget'

export const DEMO_BUDGETS: ChapterBudget[] = [
  {
    id: 'bud-fall-formal',
    name: 'Fall Formal 2025',
    description: 'Venue, catering, DJ, decorations, and transportation for Fall Formal.',
    semester: 'Fall 2025',
    createdAt: '2025-08-01T12:00:00',
    createdBy: 'Ethan Walsh',
    lineItems: [
      { id: 'li-1', label: 'Venue deposit & rental', allocated: 3200, spent: 3200 },
      { id: 'li-2', label: 'Catering & bar package', allocated: 2800, spent: 1400 },
      { id: 'li-3', label: 'DJ & AV', allocated: 900, spent: 900 },
      { id: 'li-4', label: 'Decorations & florals', allocated: 650, spent: 275 },
      { id: 'li-5', label: 'Chapter van & rides', allocated: 450, spent: 0 },
      { id: 'li-6', label: 'Contingency', allocated: 500, spent: 0 },
    ],
  },
  {
    id: 'bud-rush',
    name: 'Recruitment Week',
    description: 'Cookouts, tabling supplies, PNM gifts, and rush apparel.',
    semester: 'Fall 2025',
    createdAt: '2025-08-10T09:00:00',
    createdBy: 'Jordan Hayes',
    lineItems: [
      { id: 'li-r1', label: 'Food & beverages', allocated: 1200, spent: 680 },
      { id: 'li-r2', label: 'Tabling & banners', allocated: 350, spent: 350 },
      { id: 'li-r3', label: 'PNM welcome gifts', allocated: 400, spent: 120 },
      { id: 'li-r4', label: 'Rush polos & stickers', allocated: 550, spent: 550 },
    ],
  },
  {
    id: 'bud-philanthropy',
    name: 'Philanthropy Week',
    description: 'Fundraising events, supplies, and donation matching.',
    semester: 'Fall 2025',
    createdAt: '2025-08-15T14:00:00',
    createdBy: 'Cameron Foster',
    lineItems: [
      { id: 'li-p1', label: 'Event supplies', allocated: 400, spent: 185 },
      { id: 'li-p2', label: 'Marketing & flyers', allocated: 150, spent: 90 },
      { id: 'li-p3', label: 'Donation match fund', allocated: 750, spent: 0 },
    ],
  },
]
