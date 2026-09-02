import type { StudyHoursLog, StudyHoursResetConfig, StudyHoursRequirementsConfig } from '../types/chapterOps'
import { localTodayIso } from './liveAlerts'

function defaultReference(): Date {
  return new Date(`${localTodayIso()}T12:00:00`)
}

export function parseResetTime(time: string): { hours: number; minutes: number } {
  const [h, m] = time.split(':').map(Number)
  return { hours: h || 0, minutes: m || 0 }
}

/** Start of the current tracking period (null = semester / all-time). */
export function getStudyPeriodStart(
  config: StudyHoursResetConfig,
  reference = defaultReference()
): Date | null {
  if (config.frequency === 'semester') return null

  const { hours, minutes } = parseResetTime(config.resetTime)

  if (config.frequency === 'weekly') {
    const start = new Date(reference)
    start.setHours(hours, minutes, 0, 0)
    const dayDiff = (start.getDay() - config.resetDay + 7) % 7
    start.setDate(start.getDate() - dayDiff)
    if (start > reference) start.setDate(start.getDate() - 7)
    return start
  }

  const start = new Date(reference)
  const day = Math.min(Math.max(config.resetDay, 1), 28)
  start.setDate(day)
  start.setHours(hours, minutes, 0, 0)
  if (start > reference) {
    start.setMonth(start.getMonth() - 1)
    start.setDate(day)
  }
  return start
}

export function logInCurrentPeriod(
  log: StudyHoursLog,
  config: StudyHoursResetConfig,
  reference = defaultReference()
): boolean {
  const start = getStudyPeriodStart(config, reference)
  if (!start) return true
  const logDate = new Date(`${log.date}T12:00:00`)
  return logDate >= start
}

export function memberVerifiedHours(
  logs: StudyHoursLog[],
  memberId: string,
  config: StudyHoursResetConfig,
  reference = defaultReference()
): number {
  return logs
    .filter(
      (log) =>
        log.memberId === memberId &&
        log.verified &&
        logInCurrentPeriod(log, config, reference)
    )
    .reduce((sum, log) => sum + log.hours, 0)
}

export function memberStudyHoursRequired(
  config: StudyHoursRequirementsConfig,
  memberId: string
): number | null {
  if (config.mode === 'all') return config.defaultHours
  const hours = config.memberHours[memberId]
  return hours !== undefined ? hours : null
}

export function resetFrequencyLabel(frequency: StudyHoursResetConfig['frequency']): string {
  if (frequency === 'weekly') return 'Weekly'
  if (frequency === 'monthly') return 'Monthly'
  return 'Semester (no auto-reset)'
}

export function resetDayLabel(config: StudyHoursResetConfig): string {
  if (config.frequency === 'semester') return '—'
  if (config.frequency === 'weekly') {
    return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][
      config.resetDay
    ]
  }
  return `Day ${config.resetDay}`
}

export function nextResetLabel(config: StudyHoursResetConfig, reference = defaultReference()): string {
  if (config.frequency === 'semester') return 'Hours accumulate for the full term'
  const start = getStudyPeriodStart(config, reference)
  if (!start) return ''
  const next = new Date(start)
  if (config.frequency === 'weekly') next.setDate(next.getDate() + 7)
  else next.setMonth(next.getMonth() + 1)
  return next.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}
