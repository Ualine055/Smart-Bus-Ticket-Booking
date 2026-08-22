import { StaticSitePage } from "@/components/static-site-page"

export default function TermsPage() {
  return (
    <StaticSitePage title="Terms of service">
      <p className="text-foreground">
        BUS CONNECT is an academic project that connects passengers with registered bus operators.
        Payment is simulated, so no ticket bought here entitles anyone to travel.
      </p>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-2">Your ticket</h2>
        <p>
          Each booking produces a ticket reference and a PIN. Together they are the proof that the
          ticket is yours, and they are the only way to open it again - nothing is emailed or sent
          by SMS. Save or share your ticket as soon as you receive it. We cannot recover a ticket
          for someone who has lost both the reference and the PIN.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-2">Changes and cancellation</h2>
        <p>
          A ticket may be rescheduled from My Tickets while it has not been used and its departure
          has not passed. Cancellation and refunds are not implemented in this version. Once a
          ticket has been scanned at the gate it is marked used and cannot be reused.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-2">Boarding</h2>
        <p>
          Show your ticket reference or QR code to the operator&apos;s staff. A ticket is valid for
          the date and departure printed on it. Staff may refuse a ticket that has already been
          used, was never paid for, or was cancelled.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-2">Bus operators</h2>
        <p>
          Operators are responsible for the schedules they publish, for the accuracy of their fares
          and seat capacity, and for running the trips they list. Registration requires a valid
          operating licence number and administrator approval before any schedule can be published.
          An administrator may suspend an operator, which withdraws their access.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-foreground mb-2">Liability</h2>
        <p>
          The platform lists trips and issues tickets; it does not operate buses. Delays,
          cancellations, and conduct during a journey are matters for the bus operator. In a
          commercial deployment these terms would be reviewed against Rwandan consumer and
          transport law before launch.
        </p>
      </section>
    </StaticSitePage>
  )
}
