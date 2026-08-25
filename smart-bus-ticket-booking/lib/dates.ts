/**
 * Date and time helpers shared across the app.
 *
 * These were previously copied into each component that needed them, which is
 * how one copy ended up using toISOString() and disagreeing with the others.
 */

/**
 * Today as YYYY-MM-DD in the viewer's own timezone.
 *
 * Deliberately not `toISOString().split("T")[0]`: that returns UTC, which is
 * two hours behind Rwanda, so late in the evening it reports yesterday.
 */
export function todayIso() {
  const now = new Date()
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-')
}

/** "06:30" -> 390 */
export function toMinutes(hhmm: string) {
  const [hours, minutes] = hhmm.split(':').map(Number)
  return (hours || 0) * 60 + (minutes || 0)
}

/** 390 -> "06:30", wrapping past midnight. */
export function toTime(totalMinutes: number) {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440
  const hours = Math.floor(normalized / 60)
  const minutes = normalized % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

/** 150 -> "2h 30m" */
export function toDurationLabel(durationMinutes: number) {
  const hours = Math.floor(durationMinutes / 60)
  const minutes = durationMinutes % 60
  return `${hours}h ${minutes}m`
}

/**
 * Firestore returns Timestamps, but a document written this session may still
 * hold a plain Date, and an optional field may hold nothing at all.
 */
export function toDate(value: unknown): Date | null {
  if (!value) return null
  if (value instanceof Date) return value
  if (typeof value === 'object' && 'toDate' in value) {
    return (value as { toDate: () => Date }).toDate()
  }
  return null
}

/** Minutes of notice a passenger needs before a departure to still board it. */
export const BOARDING_CUTOFF_MINUTES = 15

/**
 * Has a departure at `hhmm` on `travelDate` already gone?
 *
 * Schedules repeat daily, so a 06:00 trip is valid for tomorrow but not for
 * this afternoon. Only the current day is ever filtered.
 */
export function hasDeparted(travelDate: string, hhmm: string, now = new Date()) {
  if (travelDate !== todayIso()) return false

  const cutoff = now.getHours() * 60 + now.getMinutes() + BOARDING_CUTOFF_MINUTES
  return toMinutes(hhmm) <= cutoff
}
