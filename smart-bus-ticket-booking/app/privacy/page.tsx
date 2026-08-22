import { StaticSitePage } from "@/components/static-site-page"

export default function PrivacyPage() {
  return (
    <StaticSitePage title="Privacy policy">
      <p className="text-foreground">
        This describes the data BUS CONNECT actually collects and why. It is an academic project,
        not a commercial service.
      </p>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-2">What we collect from passengers</h2>
        <p>
          Booking a ticket does not require an account. When you pay, we record your name and phone
          number, the trip you booked, the seats you chose, the amount paid, and which payment
          method you selected. We do not collect card numbers: payment is simulated in this version
          of the system and no financial details are entered or stored.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-2">What we collect from bus operators</h2>
        <p>
          Operators and administrators hold accounts. We store a name, email address, phone number,
          and for operators the company details submitted when applying: trading name, operating
          licence number, office address, and fleet size. Passwords are handled by Firebase
          Authentication and are never visible to this application.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-2">Who can see your booking</h2>
        <p>
          The bus operator you booked with can see the name, phone number, seats, and travel date on
          your ticket, because their staff need it to check you aboard. Administrators can see all
          bookings in order to monitor the system. Other passengers cannot.
        </p>
        <p>
          Your ticket reference and PIN act like a boarding reference: anyone who has both can view
          that ticket. Treat them as you would a paper ticket, and be careful where you share a
          screenshot.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-2">Where it is stored</h2>
        <p>
          Data is held in Google Cloud Firestore. Access is restricted by security rules enforced on
          Google&apos;s servers, not only in the browser. Bookings are stored under an unguessable
          reference and cannot be listed by the public.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-2">Retention and your rights</h2>
        <p>
          Bookings are kept so operators can produce passenger and revenue records. To ask what is
          held about you, or to have a record removed, contact us using the details on the contact
          page. A production deployment would set a defined retention period and align these
          practices with Rwanda&apos;s Law No. 058/2021 on the protection of personal data.
        </p>
      </section>
    </StaticSitePage>
  )
}
