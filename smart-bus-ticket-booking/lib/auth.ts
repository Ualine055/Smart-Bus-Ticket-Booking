import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  User
} from 'firebase/auth'
import { doc, setDoc, getDoc, updateDoc, collection, getCountFromServer } from 'firebase/firestore'
import { auth, db } from './firebase'

export interface UserData {
  name: string
  email: string
  phone: string
  role: 'passenger' | 'company' | 'admin'
  createdAt: Date
  /** Set when an admin approves the user's operator application. */
  companyId?: string | null
}

// Sign up new user
export const signUp = async (email: string, password: string, name: string, phone: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    // Store user data in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      name,
      email,
      phone,
      role: 'passenger',
      createdAt: new Date(),
    })

    return { success: true, user }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Sign in existing user
export const signIn = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    // Get user data from Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid))
    const userData = userDoc.data() as UserData

    return { success: true, user, userData }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Sign out
export const logOut = async () => {
  try {
    await signOut(auth)
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Password reset
export const resetPassword = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email)
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Update the signed-in user's own profile.
 *
 * Only name and phone are writable: the security rules reject any update that
 * touches other fields, so a user cannot promote their own role here.
 */
export const updateUserProfile = async (uid: string, name: string, phone: string) => {
  try {
    await updateDoc(doc(db, 'users', uid), { name, phone })
    return { success: true }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

/**
 * Number of registered users, for the admin dashboard.
 * Uses an aggregation query so the whole collection is not downloaded to be counted.
 */
export const countUsers = async () => {
  try {
    const snapshot = await getCountFromServer(collection(db, 'users'))
    return { success: true, count: snapshot.data().count }
  } catch (error) {
    return { success: false, error: (error as Error).message, count: 0 }
  }
}

// Get current user data
export const getCurrentUserData = async (user: User) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', user.uid))
    return userDoc.data() as UserData
  } catch (error) {
    return null
  }
}
