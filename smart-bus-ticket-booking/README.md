# BUS CONNECT

An online bus ticket booking system for Rwanda. Passengers search routes,
choose their seats, pay, and receive a digital ticket with a scannable QR
code. Bus operators publish their schedules and validate tickets at the gate.
Administrators approve operators and monitor the system.

Built with **Next.js 16**, **React 19**, **Tailwind CSS v4**, and **Firebase**
(Authentication + Cloud Firestore).

---

## Who uses it

**Passengers book without an account.** They enter their name and phone at
payment and receive a ticket reference and PIN, which is how they find the
ticket again later - the same model airlines use with booking references.

**Bus operators** register with their operating licence, wait for an
administrator to approve them, then publish daily departures and see their own
bookings and revenue.

**Administrators** approve or suspend operators, view system-wide figures, and
export reports as CSV.

---

## Getting started

```bash
npm install
npm run dev
```

Then open <http://localhost:3000>.

Firebase configuration is required before anything will save. Copy
`.env.local.example` to `.env.local` and fill in your Firebase web app config:

```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
```

`FIREBASE_SETUP.md` walks through the console steps, including the security
rules, which are what actually enforce who may do what.

---

## Trying the whole flow

1. Sign up, then apply at `/register-company`
2. As an administrator, approve the application at `/admin`
3. Sign out and back in - the account now has operator access
4. Add a schedule from the company dashboard
5. As a passenger, search that route and book a seat
6. Note the ticket reference and PIN, then open My Tickets and enter them
7. Validate the ticket from the company dashboard and watch it become **Used**

The first administrator has to be created by hand: in the Firebase console,
open your `users` document and set `role` to `admin`. Nothing in the
application can create one, which is intentional.

Search reads real schedules, so an empty database shows no buses. Add at least
one schedule first.

---

## Project layout

```
app/           routes (booking, dashboards, informational pages)
components/    UI components; ui/ holds the shared primitives
contexts/      authentication, language, and theme providers
lib/           Firebase access: auth, bookings, companies, schedules
```

---

## Documentation

| File | Contents |
|---|---|
| `STATUS.md` | What works, what is simulated, and known limitations |
| `DATABASE_SCHEMA.md` | The four Firestore collections and their fields |
| `FIREBASE_SETUP.md` | Firebase console setup and security rules |

**Payment is simulated.** Choosing MTN Mobile Money, Airtel Money, or card
records the method and marks the booking paid, but no money moves - real
collection needs merchant credentials and a server-side callback. `STATUS.md`
lists this and the other limitations in full.
