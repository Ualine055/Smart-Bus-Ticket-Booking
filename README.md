# BUS CONNECT

An online bus ticket booking system for Rwanda. Passengers search routes, pick
their seats, pay, and receive a digital ticket with a scannable QR code. Bus
operators publish their departures and validate tickets at the boarding gate.
Administrators approve operators and monitor the system.

Built with **Next.js 16**, **React 19**, **TypeScript**, **Tailwind CSS v4**,
and **Firebase** (Authentication + Cloud Firestore).

> Final-year project, BSc Business Information Technology.

---

## Why it works this way

**Passengers book without creating an account.** They enter a name and phone
number at payment and receive a ticket reference and PIN, which is how they
open the ticket again later — the same model airlines use with booking
references.

Requiring registration is a well-documented reason people abandon a purchase,
and someone making a single bus trip has little reason to maintain a password.
Accounts exist only for bus operators and administrators, who genuinely need
one.

---

## Features

### For passengers
- Search departures by route and date
- Interactive seat map showing seats that are genuinely sold
- Payment by MTN Mobile Money, Airtel Money, or card *(simulated — see Limitations)*
- Digital ticket with a real, scannable QR code
- Download or share the ticket
- Reopen a ticket with its reference and PIN, showing **Valid**, **Used**, **Expired** or **Cancelled**
- Move a ticket to another departure the same operator runs
- Full interface in **English, Kinyarwanda and French**

### For bus operators
- Register with an operating licence, fleet size and contact details
- Publish daily departures: route, time, fare, seat capacity, bus and amenities
- Dashboard scoped to their own bookings, revenue and seat sales
- Validate tickets at the gate and record boarding

### For administrators
- Approve, reject or suspend bus operators
- Live figures for users, bookings, revenue and operators
- Routes ranked by real booking volume
- Export bookings, route revenue and companies as CSV

---

## Screenshots

<!--
Add screenshots here so the project is visible without running it. Save images
under a docs/ folder in this repository, then reference them like:

![Home page](docs/home.png)
![Seat selection](docs/seats.png)
![Digital ticket](docs/ticket.png)
![Company dashboard](docs/company-dashboard.png)
-->

---

## Getting started

The application lives in the `smart-bus-ticket-booking/` folder.

```bash
git clone https://github.com/Ualine055/Smart-Bus-Ticket-Booking.git
cd Smart-Bus-Ticket-Booking/smart-bus-ticket-booking
npm install
npm run dev
```

Open <http://localhost:3000>.

### Firebase configuration

Nothing will save until Firebase is connected. Copy `.env.local.example` to
`.env.local` and fill in your Firebase web app config:

```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
```

Then publish the Firestore security rules from
[`FIREBASE_SETUP.md`](smart-bus-ticket-booking/FIREBASE_SETUP.md). They are not
optional: the rules are what actually enforce who may do what, and without them
guest bookings are rejected.

---

## Trying the whole flow

1. Sign up, then apply at `/register-company`
2. Make yourself an administrator: in the Firebase console open your `users`
   document and set `role` to `admin`, then sign out and back in
3. Approve the application at `/admin`
4. Sign in as the operator and add a schedule from the company dashboard
5. As a passenger, search that route and book a seat
6. Note the ticket reference and PIN, then open **My Tickets** and enter them
7. Validate the ticket from the company dashboard and watch it become **Used**

The first administrator has to be created by hand because nothing in the
application can create one — otherwise anyone could grant themselves control of
the system.

Search reads real schedules, so an empty database shows no buses. Publish at
least one schedule first.

---

## Security model

Role checks exist in the browser for usability, but the browser is not trusted.
Firestore security rules re-check every read and write on Google's servers:

- A user may edit only their own name and phone — `role` cannot be changed, so
  nobody can promote themselves
- New accounts must be created without elevated access
- Only administrators may change roles or decide applications
- Operators may only publish schedules under their own company
- Tickets can be fetched individually but not listed by the public, so the
  collection cannot be enumerated
- Approving a company and granting its owner access happen in one transaction
- Boarding a ticket happens in a transaction, so it cannot be scanned twice

---

## Limitations

Stated plainly rather than hidden. The full list is in
[`STATUS.md`](smart-bus-ticket-booking/STATUS.md).

- **Payment is simulated.** The method chosen is recorded, but no money moves.
  Real collection needs merchant API credentials and a server-side callback.
- **No email or SMS.** A passenger who loses both the ticket reference and PIN
  cannot recover the ticket.
- **Bookings accept unauthenticated writes,** because passengers are not signed
  in. Firebase App Check and rate limiting would mitigate scripted abuse.
- **No in-app camera scanning.** The QR code is real and scannable, but staff
  scan it with a phone camera and read the reference across.
- **No cancellation or refunds.** Rescheduling is implemented.
- **Operator and administrator dashboards are English only.**

---

## Documentation

| File | Contents |
|---|---|
| [`STATUS.md`](smart-bus-ticket-booking/STATUS.md) | What works, what is simulated, known limitations |
| [`DATABASE_SCHEMA.md`](smart-bus-ticket-booking/DATABASE_SCHEMA.md) | The four Firestore collections and their fields |
| [`FIREBASE_SETUP.md`](smart-bus-ticket-booking/FIREBASE_SETUP.md) | Firebase console setup and security rules |

---

## Project structure

```
smart-bus-ticket-booking/
├── app/           routes: booking, dashboards, informational pages
├── components/    UI components; ui/ holds the shared primitives
├── contexts/      authentication, language and theme providers
└── lib/           Firebase access: auth, bookings, companies, schedules
```
