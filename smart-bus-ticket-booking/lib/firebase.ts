import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getAnalytics } from 'firebase/analytics'

const firebaseConfig = {
  apiKey: "AIzaSyDTU9e5cirROXc0iH8HUq3LRHA-J3xH2zM",
  authDomain: "smart-bus-ticket-booking-f815a.firebaseapp.com",
  projectId: "smart-bus-ticket-booking-f815a",
  storageBucket: "smart-bus-ticket-booking-f815a.firebasestorage.app",
  messagingSenderId: "368729846613",
  appId: "1:368729846613:web:e560f9c7e26354a93b75dc",
  measurementId: "G-MCSC07YQ4Z"
}

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
const auth = getAuth(app)
const db = getFirestore(app)

// Initialize Analytics (only in browser environment)
let analytics
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app)
}

export { app, auth, db, analytics }
