# Firebase Backend Setup Guide

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name: `travelo-bus-booking`
4. Disable Google Analytics (optional)
5. Click "Create project"

## Step 2: Enable Authentication

1. In Firebase Console, go to **Authentication**
2. Click "Get started"
3. Enable **Email/Password** sign-in method
4. Click "Save"

## Step 3: Create Firestore Database

1. Go to **Firestore Database**
2. Click "Create database"
3. Choose **Start in test mode** (for development)
4. Select location: `us-central` or closest to Rwanda
5. Click "Enable"

## Step 4: Get Firebase Configuration

1. Go to **Project Settings** (gear icon)
2. Scroll to "Your apps"
3. Click **Web** icon (</>)
4. Register app name: `travelo-web`
5. Copy the `firebaseConfig` object

## Step 5: Set Up Environment Variables

1. Create `.env.local` file in project root
2. Copy from `.env.local.example`
3. Paste your Firebase config values:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=travelo-bus-booking.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=travelo-bus-booking
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=travelo-bus-booking.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

## Step 6: Set Up Firestore Security Rules

In Firestore Database > Rules, paste:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
    
    // Bookings collection
    match /bookings/{bookingId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null && 
        (request.auth.uid == resource.data.userId || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }
    
    // Routes collection (read-only for passengers)
    match /routes/{routeId} {
      allow read: if true;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['company', 'admin'];
    }
    
    // Companies collection
    match /companies/{companyId} {
      allow read: if true;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

## Step 7: Create Initial Collections

In Firestore, manually create these collections:

### 1. `users` collection
- Auto-created when users sign up

### 2. `routes` collection
Add sample route:
```json
{
  "from": "Kigali",
  "to": "Musanze",
  "companyId": "company1",
  "busId": "bus1",
  "departureTime": "06:00",
  "arrivalTime": "08:30",
  "duration": "2h 30m",
  "price": 3500,
  "totalSeats": 45,
  "amenities": ["wifi", "ac", "charging"],
  "busType": "Luxury Coach",
  "status": "active"
}
```

### 3. `companies` collection
Add sample company:
```json
{
  "name": "Volcano Express",
  "email": "info@volcanoexpress.rw",
  "phone": "+250 788 000 000",
  "status": "approved",
  "createdAt": "2024-01-01"
}
```

### 4. `bookings` collection
- Auto-created when users book tickets

## Step 8: Test the Setup

1. Restart your dev server: `npm run dev`
2. Try signing up a new user
3. Check Firebase Console > Authentication (user should appear)
4. Check Firestore > users collection (user data should be there)

## Step 9: Deploy (Optional)

### Deploy to Vercel:
```bash
npm install -g vercel
vercel
```

Add environment variables in Vercel dashboard.

## Troubleshooting

### Error: "Firebase not initialized"
- Check `.env.local` file exists
- Restart dev server

### Error: "Permission denied"
- Check Firestore security rules
- Make sure user is authenticated

### Error: "Network error"
- Check Firebase project is active
- Check internet connection

## Next Steps

1. ✅ Authentication working
2. ✅ User data stored in Firestore
3. ⏳ Connect booking flow to Firebase
4. ⏳ Add payment integration
5. ⏳ Add email notifications

## Support

- Firebase Docs: https://firebase.google.com/docs
- Next.js Docs: https://nextjs.org/docs
