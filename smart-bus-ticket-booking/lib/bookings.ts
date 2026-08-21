import {
  collection,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  doc,
  updateDoc,
  runTransaction,
  Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'

export interface Booking {
  id?: string
  /** Set only when an operator or admin made the booking; passengers buy as guests. */
  userId?: string | null
  busId: string
  routeId: string
  /** Also the Firestore document id, so a ticket can be fetched without a query. */
  ticketId: string
  /** Short code printed on the ticket and required to open it again. */
  pin: string
  passengerName: string
  passengerPhone: string
  travelDate: string
  seats: string[]
  totalPrice: number
  paymentMethod: 'mtn' | 'airtel' | 'card'
  paymentStatus: 'pending' | 'completed' | 'failed'
  bookingStatus: 'confirmed' | 'cancelled' | 'used'
  busCompany: string
  route: {
    from: string
    to: string
    departureTime: string
    arrivalTime: string
  }
  createdAt: Date
  rescheduledAt?: Date
  rescheduleFee?: number
  originalDepartureTime?: string
  originalArrivalTime?: string
  boardedAt?: Date
  boardedBy?: string
}

/** Excludes look-alike characters (0/O, 1/I) so codes can be read off a screen aloud. */
const CODE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'

/** Cryptographically random string; falls back to Math.random only if unavailable. */
function randomCode(length: number, alphabet = CODE_ALPHABET) {
  const cryptoApi = typeof globalThis !== 'undefined' ? globalThis.crypto : undefined

  if (cryptoApi?.getRandomValues) {
    const bytes = new Uint8Array(length)
    cryptoApi.getRandomValues(bytes)
    return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join('')
  }

  return Array.from({ length }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('')
}

/**
 * A ticket reference such as `TRV-7K3M9QP2`.
 *
 * Passengers do not have accounts, so this id is the only thing proving a
 * ticket belongs to them - it must be unguessable. A timestamp-based id would
 * let anyone walk through nearby values and read other passengers' details.
 */
export function generateTicketId() {
  return `TRV-${randomCode(8)}`
}

/** Second factor shown on the ticket, so a shared screenshot alone is not enough. */
export function generateTicketPin() {
  return randomCode(4, '0123456789')
}

/**
 * What state a ticket is in, for the "My ticket" view and the gate validator.
 *
 * - `used`      already scanned and boarded
 * - `cancelled` booking was cancelled
 * - `expired`   never used and its departure has passed
 * - `valid`     still good to travel
 */
export type TicketState = 'used' | 'cancelled' | 'expired' | 'valid'

export function getTicketState(booking: Booking, now = new Date()): TicketState {
  if (booking.bookingStatus === 'used') return 'used'
  if (booking.bookingStatus === 'cancelled') return 'cancelled'

  const [hours, minutes] = (booking.route?.departureTime ?? '00:00').split(':').map(Number)
  const [year, month, day] = booking.travelDate.split('-').map(Number)
  const departure = new Date(year, (month ?? 1) - 1, day ?? 1, hours ?? 0, minutes ?? 0)

  return departure.getTime() < now.getTime() ? 'expired' : 'valid'
}

/**
 * Which seats are already sold on a given travel date, keyed by bus.
 *
 * Filters on `travelDate` alone and groups by bus in memory: a single equality
 * query needs no composite index, which keeps Firestore setup to zero. Cancelled
 * bookings are skipped so their seats return to the pool.
 */
export const getSeatsTakenOn = async (travelDate: string) => {
  try {
    const querySnapshot = await getDocs(
      query(collection(db, 'bookings'), where('travelDate', '==', travelDate)),
    )

    const seatsByBus: Record<string, string[]> = {}

    querySnapshot.forEach((entry) => {
      const booking = entry.data() as Booking
      if (booking.bookingStatus === 'cancelled') return

      const taken = seatsByBus[booking.busId] ?? []
      seatsByBus[booking.busId] = taken.concat(booking.seats ?? [])
    })

    return { success: true, seatsByBus }
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
      seatsByBus: {} as Record<string, string[]>,
    }
  }
}

/** Seats already sold on one specific bus for one date. */
export const getTakenSeats = async (busId: string, travelDate: string) => {
  const result = await getSeatsTakenOn(travelDate)
  return {
    success: result.success,
    error: result.error,
    seats: result.seatsByBus[busId] ?? [],
  }
}

/**
 * Create a booking, re-checking seat availability immediately beforehand so two
 * passengers choosing the same seat cannot both complete a purchase.
 *
 * Note: Firestore transactions work on documents, not queries, so a very small
 * race window remains between this check and the write. Closing it completely
 * would need a per-bus seat-lock document or a server-side function.
 */
export const createBooking = async (bookingData: Omit<Booking, 'id' | 'createdAt'>) => {
  try {
    const taken = await getTakenSeats(bookingData.busId, bookingData.travelDate)
    const clash = bookingData.seats.filter((seat) => taken.seats.includes(seat))

    if (clash.length > 0) {
      return {
        success: false,
        error: `Seat ${clash.join(', ')} was just booked by someone else. Please choose another.`,
        seatsTaken: clash,
      }
    }

    return await writeBooking(bookingData)
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

const writeBooking = async (bookingData: Omit<Booking, 'id' | 'createdAt'>) => {
  try {
    // The ticket id is the document id, so a passenger with no account can fetch
    // their ticket directly instead of running a query over the collection.
    await setDoc(doc(db, 'bookings', bookingData.ticketId), {
      ...bookingData,
      createdAt: Timestamp.now(),
    })
    return { success: true, bookingId: bookingData.ticketId }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

/**
 * Look up a ticket the way a passenger without an account does: the reference
 * printed on their ticket, plus the PIN beside it.
 *
 * The PIN is compared here in the browser, so the real protection is the
 * unguessable ticket id - the PIN adds friction, not cryptographic security.
 * Enforcing it properly would need a Cloud Function holding the comparison
 * server-side, which this build does not deploy.
 */
export const findTicket = async (ticketId: string, pin: string) => {
  try {
    const reference = ticketId.trim().toUpperCase()
    const snapshot = await getDoc(doc(db, 'bookings', reference))

    if (!snapshot.exists()) {
      return { success: false, error: 'notFound' as const, booking: null }
    }

    const booking = { id: snapshot.id, ...snapshot.data() } as Booking

    if (booking.pin && booking.pin !== pin.trim()) {
      return { success: false, error: 'wrongPin' as const, booking: null }
    }

    return { success: true, booking }
  } catch (error) {
    return { success: false, error: (error as Error).message, booking: null }
  }
}

// Get bookings made while signed in (operator or admin accounts)
export const getUserBookings = async (userId: string) => {
  try {
    const q = query(collection(db, 'bookings'), where('userId', '==', userId))
    const querySnapshot = await getDocs(q)

    const bookings: Booking[] = []
    querySnapshot.forEach((doc) => {
      bookings.push({ id: doc.id, ...doc.data() } as Booking)
    })
    
    return { success: true, bookings }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

/** Every booking in the system. Admin-only view; fine at project scale, would need paging in production. */
export const getAllBookings = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'bookings'))

    const bookings: Booking[] = []
    querySnapshot.forEach((doc) => {
      bookings.push({ id: doc.id, ...doc.data() } as Booking)
    })

    return { success: true, bookings }
  } catch (error) {
    return { success: false, error: (error as Error).message, bookings: [] as Booking[] }
  }
}

// Get booking by ticket ID (the ticket id is the document id)
export const getBookingByTicketId = async (ticketId: string) => {
  try {
    const snapshot = await getDoc(doc(db, 'bookings', ticketId.trim().toUpperCase()))

    if (!snapshot.exists()) {
      return { success: false, error: 'Ticket not found' }
    }

    return { success: true, booking: { id: snapshot.id, ...snapshot.data() } as Booking }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

// Update booking status
export const updateBookingStatus = async (bookingId: string, status: Booking['bookingStatus']) => {
  try {
    await updateDoc(doc(db, 'bookings', bookingId), {
      bookingStatus: status,
    })
    return { success: true }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

// Reschedule booking to a new time slot
export const rescheduleBooking = async (
  bookingId: string,
  newDepartureTime: string,
  newArrivalTime: string,
  rescheduleFee: number
) => {
  try {
    const bookingRef = doc(db, 'bookings', bookingId)
    await updateDoc(bookingRef, {
      'route.departureTime': newDepartureTime,
      'route.arrivalTime': newArrivalTime,
      rescheduleFee,
      rescheduledAt: Timestamp.now(),
    })
    return { success: true }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

/**
 * Mark a ticket as boarded at the gate.
 *
 * Uses a transaction so two staff members scanning the same ticket at the same
 * time cannot both succeed: the second read sees `bookingStatus === 'used'` and
 * is rejected. `boardedBy` records which staff account admitted the passenger.
 */
export const markBookingAsBoarded = async (bookingId: string, boardedBy: string) => {
  try {
    const bookingRef = doc(db, 'bookings', bookingId)

    const boardedAt = await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(bookingRef)

      if (!snapshot.exists()) {
        throw new Error('This booking no longer exists.')
      }

      const booking = snapshot.data() as Booking

      if (booking.bookingStatus === 'used') {
        throw new Error('This ticket has already been used.')
      }

      if (booking.bookingStatus === 'cancelled') {
        throw new Error('This booking was cancelled.')
      }

      const now = Timestamp.now()
      transaction.update(bookingRef, {
        bookingStatus: 'used',
        boardedAt: now,
        boardedBy,
      })

      return now.toDate()
    })

    return { success: true, boardedAt }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

// Update payment status
export const updatePaymentStatus = async (bookingId: string, status: Booking['paymentStatus']) => {
  try {
    await updateDoc(doc(db, 'bookings', bookingId), {
      paymentStatus: status,
    })
    return { success: true }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}
