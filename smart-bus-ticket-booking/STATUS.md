# BUS CONNECT - System Status

An online bus ticket booking system for Rwanda, built with Next.js 16,
React 19, Tailwind CSS v4, and Firebase (Authentication + Cloud Firestore).

This document records what the system actually does, what is simulated, and
what is not built. It is deliberately conservative: a feature is only listed
as working if it reads or writes real data.

---

## The three actors

| Actor | How they are identified | What they can do |
|---|---|---|
| **Passenger** | No account. A ticket reference + PIN | Search, book, pay, view and reschedule their ticket |
| **Bus operator** | Account, approved by an admin | Publish schedules, see their bookings and revenue, validate tickets at the gate |
| **Administrator** | Account, role set directly in Firebase | Approve or suspend operators, monitor the system, export reports |

**Passengers deliberately have no accounts.** Requiring registration is a
well-documented cause of checkout abandonment, and a passenger making a
single trip has little reason to maintain a password. The ticket reference
and PIN follow the airline booking-reference model. The trade-off is weaker
recovery if the reference is lost - see *Known limitations*.

---

## Working end to end

These read and write real Firestore data.

### Booking
- Search by route and date against schedules operators have published
- Seat map showing seats genuinely sold for that bus on that date
- Seat selection capped by the passenger count from the search
- Passenger name and phone captured at payment
- Booking written with a cryptographically random ticket reference and PIN
- Double-booking rejected: availability is re-checked immediately before the write
- Digital ticket with a real, scannable QR code encoding the reference
- Download as a text file, or share via the device share sheet

### Finding a ticket again
- Lookup by ticket reference + PIN
- Ticket state shown as **Valid**, **Used**, **Expired**, or **Cancelled**
- Reschedule offered only while a ticket is still valid

### Operators
- Registration form capturing licence, fleet size, and contact details
- Duplicate licence numbers and duplicate applications rejected
- Applicant sees their status: pending, approved, or rejected with the reason
- Schedule management: create, edit, and delete departures
- Dashboard scoped to the operator's own bookings, revenue, and seat sales
- Gate validation: real lookup reporting valid / wrong day / already boarded /
  unpaid / cancelled, and recording boarding

### Administrators
- Approve an application, which promotes the owner to the operator role
- Reject or suspend an operator, which demotes them
- Live totals: registered users, bookings, revenue, approved operators
- Routes ranked by real booking volume
- Activity feed built from real applications, approvals, and bookings
- CSV export of bookings, route revenue, and companies

### Accounts
- Sign up, sign in, sign out (operators and admins)
- Password reset by real Firebase email
- Profile editing, restricted to name and phone

### Languages
- English, Kinyarwanda, and French across the whole passenger journey
- Sentences containing numbers are translated whole and filled in, so word
  order stays natural in each language
- A missing translation key fails the TypeScript build rather than silently
  falling back to English

---

## Simulated

**Payment.** Choosing MTN Mobile Money, Airtel Money, or card runs a two-second
delay and then marks the booking paid. No money moves. Real collection needs
merchant API credentials and a server-side callback to confirm settlement.
The method chosen *is* recorded correctly on the booking.

---

## Not built

- **Email and SMS notifications.** No booking confirmation or departure
  reminder is sent anywhere. Needs a provider and a server-side trigger.
- **In-app QR scanning.** The QR code is real and scannable, but staff scan it
  with a phone camera and read the reference into the validator. A built-in
  scanner needs a camera library and HTTPS.
- **Booking cancellation and refunds.** Rescheduling works; cancelling does not.
- **Dashboard translation.** The whole passenger journey - search, seat
  selection, payment, ticket, and ticket lookup - is available in English,
  Kinyarwanda, and French. The operator and administrator dashboards are
  English only, on the grounds that they are staff tools rather than
  passenger-facing screens.

---

## Security model

Role checks exist in two places, and the second one is what actually matters.

The React app hides pages by role for usability. Firestore security rules
re-check every read and write on Google's servers, where the user cannot
interfere. Specifically:

- A user may edit only their own `name` and `phone`; `role` and `companyId`
  are rejected, so nobody can promote themselves
- New accounts must be created with the `passenger` role
- Only admins may change roles or decide applications
- Operators may only write schedules under their own company
- Ticket documents can be fetched individually but not listed by the public,
  so the collection cannot be enumerated
- Approving a company and promoting its owner happen in one transaction
- Boarding a ticket happens in a transaction, so it cannot be scanned twice

The first administrator is created by editing a `users` document directly in
the Firebase console. Nothing in the application can create one, which is
intentional.

---

## Known limitations

Worth stating plainly rather than hiding.

1. **A lost ticket reference cannot be recovered.** Nothing is emailed or
   texted, so a passenger who loses the reference and PIN has no way back to
   their ticket. A production system would send it by SMS.

2. **Bookings accept unauthenticated writes.** Passengers are not signed in,
   so the rules must allow the public to create bookings. A script could
   create fake bookings and block seats. Firebase App Check plus rate limiting
   is the standard mitigation.

3. **Booking updates are loosely protected.** Passengers reschedule and staff
   mark tickets boarded, and neither has a verifiable identity at that point,
   so update rules are permissive. Tightening this needs Cloud Functions.

4. **The PIN is checked in the browser.** Real protection comes from the
   unguessable ticket reference; the PIN adds friction, not cryptographic
   security. Enforcing it properly requires a server.

5. **A small double-booking race remains.** Availability is re-checked
   immediately before writing, but Firestore transactions operate on
   documents rather than queries, so a narrow window exists. A per-bus
   seat-lock document or a server-side function would close it.

6. **Queries load whole collections.** Bookings are filtered and aggregated in
   the browser. This is fine at project scale but would need pagination and
   server-side aggregation with real traffic.

---

## Running the project

```bash
npm install
npm run dev
```

Copy `.env.local.example` to `.env.local` and fill in the Firebase web config.
See `FIREBASE_SETUP.md` for the console steps, and `DATABASE_SCHEMA.md` for
the collections.

### Demonstrating the full flow

1. Sign up, then apply at `/register-company`
2. As an admin, approve the application at `/admin`
3. Sign out and back in - the account now has operator access
4. Add a schedule from the company dashboard
5. As a passenger, search that route and book a seat
6. Note the ticket reference and PIN, then find the ticket under My Tickets
7. Validate the ticket from the company dashboard and watch it become **Used**

An empty database shows no buses, because search reads real schedules. Add at
least one schedule before demonstrating.
