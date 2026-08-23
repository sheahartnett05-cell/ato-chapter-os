import type { ExecSlide } from './features'

export interface BylawsDocument {
  id: string
  fileName: string
  content: string
  importedAt: string
  importedBy: string
}

export type HouseTaskKind = 'cleanup' | 'maintenance'
export type HouseTaskStatus = 'open' | 'in_progress' | 'done'

export interface HouseTask {
  id: string
  kind: HouseTaskKind
  title: string
  area: string
  status: HouseTaskStatus
  priority: 'low' | 'medium' | 'high'
  assignedMemberId?: string
  dueDate?: string
  notes?: string
  createdAt: string
  completedAt?: string
}

export type { ExecSlide }
