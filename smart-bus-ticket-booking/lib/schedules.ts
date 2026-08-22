import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  doc,
  Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'

/**
 * A recurring daily departure published by a bus operator.
 *
 * One schedule describes a trip that runs every day at a fixed time, e.g.
 * "Volcano Express, Kigali → Musanze, 06:00, 45 seats, 3500 RWF". Searching for
 * a date turns each matching schedule into one bookable bus for that date.
 */
export interface Schedule {
  id?: string
  companyId: string
  /** Stored alongside the id so bookings and search results can show it directly. */
  companyName: string
  busPlate: string
  busType: string
  from: string
  to: string
  /** 24-hour "HH:MM". */
  departureTime: string
  durationMinutes: number
  price: number
  totalSeats: number
  amenities: string[]
  active: boolean
  createdAt: Date
}

export type ScheduleInput = Omit<Schedule, 'id' | 'createdAt'>

function toDate(value: unknown): Date {
  if (value instanceof Date) return value
  if (value && typeof value === 'object' && 'toDate' in value) {
    return (value as { toDate: () => Date }).toDate()
  }
  return new Date(0)
}

function toSchedule(id: string, data: Record<string, unknown>): Schedule {
  return {
    ...(data as unknown as Schedule),
    id,
    createdAt: toDate(data.createdAt),
  }
}

/** Sort by departure time, so a company's day reads top to bottom. */
function byDeparture(a: Schedule, b: Schedule) {
  return a.departureTime.localeCompare(b.departureTime)
}

export const createSchedule = async (input: ScheduleInput) => {
  try {
    const docRef = await addDoc(collection(db, 'schedules'), {
      ...input,
      createdAt: Timestamp.now(),
    })
    return { success: true, scheduleId: docRef.id }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

export const updateSchedule = async (scheduleId: string, input: Partial<ScheduleInput>) => {
  try {
    await updateDoc(doc(db, 'schedules', scheduleId), input)
    return { success: true }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

export const deleteSchedule = async (scheduleId: string) => {
  try {
    await deleteDoc(doc(db, 'schedules', scheduleId))
    return { success: true }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

/** Every schedule belonging to one operator. */
export const getCompanySchedules = async (companyId: string) => {
  try {
    const snapshot = await getDocs(
      query(collection(db, 'schedules'), where('companyId', '==', companyId)),
    )
    const schedules = snapshot.docs
      .map((entry) => toSchedule(entry.id, entry.data()))
      .sort(byDeparture)

    return { success: true, schedules }
  } catch (error) {
    return { success: false, error: (error as Error).message, schedules: [] as Schedule[] }
  }
}

/** Every schedule in the system, for admin views. */
export const getAllSchedules = async () => {
  try {
    const snapshot = await getDocs(collection(db, 'schedules'))
    const schedules = snapshot.docs
      .map((entry) => toSchedule(entry.id, entry.data()))
      .sort(byDeparture)

    return { success: true, schedules }
  } catch (error) {
    return { success: false, error: (error as Error).message, schedules: [] as Schedule[] }
  }
}

/**
 * Active schedules serving a route. Matching is done in memory so operators can
 * write "kigali" or "Kigali" and passengers still find the trip; a single
 * `active` equality filter keeps this free of composite indexes.
 */
export const searchSchedules = async (from: string, to: string) => {
  try {
    const snapshot = await getDocs(
      query(collection(db, 'schedules'), where('active', '==', true)),
    )

    const wanted = (value: string) => value.trim().toLowerCase()
    const fromTerm = wanted(from)
    const toTerm = wanted(to)

    const schedules = snapshot.docs
      .map((entry) => toSchedule(entry.id, entry.data()))
      .filter((schedule) => {
        const matchesFrom = !fromTerm || wanted(schedule.from) === fromTerm
        const matchesTo = !toTerm || wanted(schedule.to) === toTerm
        return matchesFrom && matchesTo
      })
      .sort(byDeparture)

    return { success: true, schedules }
  } catch (error) {
    return { success: false, error: (error as Error).message, schedules: [] as Schedule[] }
  }
}

/**
 * Headline figures for the home page, counted from published schedules.
 *
 * Only the schedules collection is publicly readable - bookings and companies
 * require sign-in - so every figure here is derived from it. That keeps the
 * numbers real without loosening any security rule.
 */
export const getNetworkStats = async () => {
  const result = await getAllSchedules()
  const active = result.schedules.filter((schedule) => schedule.active)

  const routes = new Set<string>()
  const operators = new Set<string>()
  const cities = new Set<string>()

  for (const schedule of active) {
    routes.add(`${schedule.from.toLowerCase()}|${schedule.to.toLowerCase()}`)
    operators.add(schedule.companyName)
    cities.add(schedule.from.toLowerCase())
    cities.add(schedule.to.toLowerCase())
  }

  return {
    success: result.success,
    stats: {
      departures: active.length,
      routes: routes.size,
      operators: operators.size,
      cities: cities.size,
    },
  }
}

/** Distinct routes currently offered, for the passenger-facing routes list. */
export const getActiveRoutes = async () => {
  const result = await getAllSchedules()

  const routes = new Map<string, { from: string; to: string; operators: Set<string>; fromPrice: number }>()

  for (const schedule of result.schedules) {
    if (!schedule.active) continue

    const key = `${schedule.from}|${schedule.to}`
    const entry = routes.get(key) ?? {
      from: schedule.from,
      to: schedule.to,
      operators: new Set<string>(),
      fromPrice: schedule.price,
    }

    entry.operators.add(schedule.companyName)
    entry.fromPrice = Math.min(entry.fromPrice, schedule.price)
    routes.set(key, entry)
  }

  return {
    success: result.success,
    routes: [...routes.values()].map((route) => ({
      from: route.from,
      to: route.to,
      operators: route.operators.size,
      fromPrice: route.fromPrice,
    })),
  }
}
