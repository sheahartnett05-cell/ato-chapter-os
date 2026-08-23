/** Exec calendar color coding by event type */
export const EVENT_TYPE_COLORS: Record<string, string> = {
  Chapter: '#002147',
  Executive: '#1e3a5f',
  Social: '#c45c26',
  Brotherhood: '#5b4b8a',
  Recruitment: '#0d7377',
  Philanthropy: '#2d6a4f',
  Scholarship: '#1d4e89',
  Education: '#6b4f2c',
}

export const CALENDAR_EVENT_TYPES = [
  'Chapter',
  'Executive',
  'Social',
  'Brotherhood',
  'Recruitment',
  'Philanthropy',
  'Scholarship',
  'Education',
] as const

export function eventTypeColor(type: string): string {
  return EVENT_TYPE_COLORS[type] ?? '#6b6b6b'
}
