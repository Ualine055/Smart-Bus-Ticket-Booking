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

This is the step that actually enforces who may do what. The React app hides
pages by role for convenience, but anyone can call the database directly using
the project's public API key - these rules are checked on Google's servers,
where the user cannot interfere.

In **Firestore Database > Rules**, delete what is there (test mode allows the
whole internet to read and write your data) and paste this, then **Publish**:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    function isSignedIn() {
      return request.auth != null;
    }

    // The caller's own user document, which is where their role lives.
    function callerRole() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role;
    }

    function callerCompanyId() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.companyId;
    }

    function isAdmin() {
      return isSignedIn() && callerRole() == 'admin';
    }

    function isCompany() {
      return isSignedIn() && callerRole() == 'company';
    }

    match /users/{userId} {
      allow read: if isSignedIn() && (request.auth.uid == userId || isAdmin());

      // Signing up creates your own document, and it must start as a
      // passenger. This stops someone registering themselves as an admin.
      allow create: if isSignedIn()
                    && request.auth.uid == userId
                    && request.resource.data.role == 'passenger';

      // You may edit only your name and phone. Because 'role' is not in this
      // list, nobody can promote themselves to company or admin.
      allow update: if isSignedIn()
                    && request.auth.uid == userId
                    && request.resource.data.diff(resource.data)
                         .affectedKeys().hasOnly(['name', 'phone']);

      // Only an admin changes roles - this is what company approval does.
      allow update: if isAdmin();

      allow delete: if false;
    }

    match /companies/{companyId} {
      allow read: if isSignedIn();

      // You apply as yourself, and it must start as pending - otherwise an
      // applicant could submit themselves already approved.
      allow create: if isSignedIn()
                    && request.resource.data.ownerId == request.auth.uid
                    && request.resource.data.status == 'pending';

      allow update, delete: if isAdmin();
    }

    match /schedules/{scheduleId} {
      // Anyone may read - passengers search for buses without signing in.
      allow read: if true;

      // An operator may only publish schedules under their own company.
      allow create: if isCompany()
                    && request.resource.data.companyId == callerCompanyId();

      allow update, delete: if isAdmin()
                            || (isCompany() && resource.data.companyId == callerCompanyId());
    }

    match /bookings/{ticketId} {
      // A passenger holding the reference can open their own ticket. Reading
      // one requires knowing the exact random id; listing is denied below.
      allow get: if true;

      // Only staff may browse or search all bookings.
      allow list: if isCompany() || isAdmin();

      // Passengers buy without an account, so this must allow unauthenticated
      // writes - but only well-formed ones, and never onto an existing ticket.
      allow create: if request.resource.data.keys().hasAll(
                         ['ticketId', 'pin', 'passengerName', 'passengerPhone',
                          'busId', 'travelDate', 'seats', 'totalPrice'])
                    && request.resource.data.ticketId == ticketId
                    && request.resource.data.passengerName is string
                    && request.resource.data.passengerName.size() > 0
                    && request.resource.data.totalPrice is number
                    && request.resource.data.totalPrice >= 0
                    && request.resource.data.bookingStatus == 'confirmed';

      // Rescheduling by passengers, and marking boarded by staff.
      allow update: if true;

      allow delete: if isAdmin();
    }
  }
}
```

Two of these decisions are worth being able to explain:

**`allow get: if true` on bookings is intentional.** The ticket reference works
like an airline booking reference or an unlisted share link - holding it is the
proof of ownership. `allow list` stays restricted to staff, so nobody can
enumerate the collection; they would have to guess a random 8-character code.

**`allow update: if true` on bookings is the weak point.** Passengers reschedule
and staff mark tickets boarded, and neither has a verifiable identity at that
moment. Tightening it would require Cloud Functions. This is listed as a known
limitation in `STATUS.md`.

## Step 7: Create the First Administrator

Collections create themselves on first write, so there is nothing to set up by
hand - except the first admin, because nothing in the application can create
one.

1. Sign up in the app with your own email
2. In **Firestore Database > Data**, open `users` and find your document
3. Change `role` from `passenger` to `admin`
4. Sign out and back in so the app re-reads your role

Console edits bypass security rules, which is exactly why the first admin has
to be made here.

## Step 8: Test the Setup

1. Restart your dev server: `npm run dev`
2. Sign up a new user
3. Check **Authentication** - the user should appear
4. Check **Firestore > users** - their document should be there with
   `role: "passenger"`
5. Book a ticket as a passenger (no sign-in needed) and confirm a document
   appears in `bookings`, keyed by the ticket reference

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

### Error: "Missing or insufficient permissions"
- Confirm the rules from Step 6 are published, not just typed in the editor
- Publishing takes about a minute to take effect
- Saving a schedule fails if your account is not `company` with a `companyId`,
  which is set when an admin approves your application

### Error: "Network error"
- Check Firebase project is active
- Check internet connection

### Password reset emails never arrive
- Check **Authentication > Templates > Password reset** is enabled
- Check the spam folder

### Search shows no buses
- Search reads real schedules, so an empty database returns nothing
- Add a schedule from the company dashboard first

## Next Steps

Not built, and each needs work beyond the browser:

1. Real payment collection - needs MTN MoMo / Airtel Money merchant
   credentials and a server-side callback to confirm settlement
2. Email and SMS notifications - needs a provider such as SendGrid, Twilio,
   or Africa's Talking, triggered server-side
3. Firebase App Check - mitigates scripted fake bookings, which the rules
   cannot prevent on their own

See `STATUS.md` for the full list of limitations.

## Support

- Firebase Docs: https://firebase.google.com/docs
- Next.js Docs: https://nextjs.org/docs
