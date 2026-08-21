# Database Schema - BUS CONNECT

The system uses **Cloud Firestore**, a document database. There are four
collections. Passwords are not stored here: Firebase Authentication holds
credentials, and `users` documents are keyed by the Firebase Auth UID.

---

## 1. `users/{uid}`

One document per **bus operator or administrator**. Passengers do not have
accounts and therefore have no document here.

| Field | Type | Notes |
|---|---|---|
| `name` | string | Contact person's name |
| `email` | string | Also the sign-in identity |
| `phone` | string | |
| `role` | string | `passenger` \| `company` \| `admin` |
| `companyId` | string \| null | Set when an application is approved; points to `companies` |
| `createdAt` | timestamp | |

**On the `passenger` role.** Every new account is created as `passenger`,
meaning "registered but not yet granted operator access". An operator holds
this role between signing up and being approved. It is never chosen by the
user - the security rules reject any signup that tries to set another value.

---

## 2. `companies/{autoId}`

A bus operator's application to sell tickets on the platform.

| Field | Type | Notes |
|---|---|---|
| `name` | string | Trading name; copied onto bookings |
| `email`, `phone`, `address` | string | Business contact details |
| `licenseNumber` | string | Operating licence; must be unique |
| `fleetSize` | number | Buses owned |
| `ownerId` | string | UID of the applicant, promoted to `company` on approval |
| `ownerName` | string | Stored so admins see who applied without a second read |
| `status` | string | `pending` \| `approved` \| `rejected` |
| `appliedAt` | timestamp | |
| `reviewedAt` | timestamp? | When an admin decided |
| `reviewedBy` | string? | UID of the deciding admin |
| `rejectionReason` | string? | Shown back to the applicant |

Approving a company updates this document **and** the owner's `users`
document in a single transaction, so a company can never be approved without
its owner gaining access, or vice versa.

---

## 3. `schedules/{autoId}`

A recurring daily departure published by an operator. Searching for a date
turns each matching schedule into one bookable bus for that date.

| Field | Type | Notes |
|---|---|---|
| `companyId` | string | Owning operator |
| `companyName` | string | Denormalised so search results need one query, not two |
| `busPlate` | string | e.g. `RAB 123 A` |
| `busType` | string | Economy / Standard / Premium / Luxury Coach / VIP Express |
| `from`, `to` | string | Cities |
| `departureTime` | string | 24-hour `HH:MM` |
| `durationMinutes` | number | Arrival time is derived, not stored |
| `price` | number | Fare in RWF |
| `totalSeats` | number | Capacity, drives the seat map |
| `amenities` | string[] | `wifi`, `ac`, `charging` |
| `active` | boolean | Inactive schedules are hidden from search |
| `createdAt` | timestamp | |

---

## 4. `bookings/{ticketId}`

One purchased ticket. **The document ID is the ticket reference**, so a
passenger with no account can fetch their own ticket directly instead of
querying the collection - which the security rules forbid for the public.

| Field | Type | Notes |
|---|---|---|
| `ticketId` | string | e.g. `TRV-7K3M9QP2`; matches the document ID |
| `pin` | string | 4 digits, required alongside the reference to reopen the ticket |
| `userId` | string \| null | Only set if staff booked on someone's behalf |
| `passengerName`, `passengerPhone` | string | Collected at payment |
| `busId` | string | The `schedules` document booked |
| `routeId` | string | `from-to`, for grouping |
| `busCompany` | string | Copied from the schedule; scopes the operator dashboard |
| `travelDate` | string | `YYYY-MM-DD` |
| `seats` | string[] | e.g. `["3A", "3B"]` |
| `totalPrice` | number | RWF |
| `paymentMethod` | string | `mtn` \| `airtel` \| `card` |
| `paymentStatus` | string | `pending` \| `completed` \| `failed` |
| `bookingStatus` | string | `confirmed` \| `cancelled` \| `used` |
| `route` | map | `from`, `to`, `departureTime`, `arrivalTime` |
| `createdAt` | timestamp | |
| `boardedAt` | timestamp? | Set when scanned at the gate |
| `boardedBy` | string? | UID of the staff member who admitted the passenger |
| `rescheduledAt` | timestamp? | |
| `rescheduleFee` | number? | |
| `originalDepartureTime` | string? | Kept for audit after a reschedule |

### Why some fields are duplicated

`companyName`, `busCompany`, and the `route` map repeat data held elsewhere.
This is deliberate. Firestore has no joins, so a ticket that stored only a
`busId` would need a second read to display a route - and if the operator
later edited or deleted that schedule, the ticket would change or break.
Copying the values freezes the ticket as it was sold.

---

## Indexes

None required. Every query filters on a single field
(`travelDate`, `companyId`, `ownerId`, `active`, `status`) and sorts in
memory, so Firestore's automatic single-field indexes are sufficient and no
composite indexes need to be configured.

---

## Not implemented

There is no `notifications` collection. Booking confirmations and departure
reminders would need an email or SMS provider (SendGrid, Twilio, or
Africa's Talking) driven by a server-side function, which this build does
not deploy.
