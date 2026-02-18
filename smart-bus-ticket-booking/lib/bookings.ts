import { collection, addDoc, getDocs, query, where, doc, updateDoc } from 'firebase/firestore'
import { db } from './firebase'

export interface Booking {
  id?: string
  userId: string
  busId: string
  routeId: string
  ticketId: string
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
}

// Create new booking
export const createBooking = async (bookingData: Omit<Booking, 'id' | 'createdAt'>) => {
  try {
    const docRef = await addDoc(collection(db, 'bookings'), {
      ...bookingData,
      createdAt: new Date(),
    })
    return { success: true, bookingId: docRef.id }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Get user bookings
export const getUserBookings = async (userId: string) => {
  try {
    const q = query(collection(db, 'bookings'), where('userId', '==', userId))
    const querySnapshot = await getDocs(q)
    
    const bookings: Booking[] = []
    querySnapshot.forEach((doc) => {
      bookings.push({ id: doc.id, ...doc.data() } as Booking)
    })
    
    return { success: true, bookings }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Get booking by ticket ID
export const getBookingByTicketId = async (ticketId: string) => {
  try {
    const q = query(collection(db, 'bookings'), where('ticketId', '==', ticketId))
    const querySnapshot = await getDocs(q)
    
    if (querySnapshot.empty) {
      return { success: false, error: 'Ticket not found' }
    }
    
    const doc = querySnapshot.docs[0]
    const booking = { id: doc.id, ...doc.data() } as Booking
    
    return { success: true, booking }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Update booking status
export const updateBookingStatus = async (bookingId: string, status: Booking['bookingStatus']) => {
  try {
    await updateDoc(doc(db, 'bookings', bookingId), {
      bookingStatus: status,
    })
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Update payment status
export const updatePaymentStatus = async (bookingId: string, status: Booking['paymentStatus']) => {
  try {
    await updateDoc(doc(db, 'bookings', bookingId), {
      paymentStatus: status,
    })
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
