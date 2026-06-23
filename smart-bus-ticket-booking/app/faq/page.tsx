import { StaticSitePage } from "@/components/static-site-page"

export default function FaqPage() {
  return (
    <StaticSitePage title="FAQ">
      <div className="space-y-6">
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">How do I book a ticket?</h2>
          <p>Search your route and date, pick a bus, choose seats, then complete payment.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">Can I change my trip?</h2>
          <p>
            Confirmed bookings may support reschedule from &quot;My tickets&quot; where implemented in the app.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">Is my payment secure?</h2>
          <p>
            This project demonstrates the flow; production would integrate a certified mobile-money or card
            provider and store payment status securely.
          </p>
        </section>
      </div>
    </StaticSitePage>
  )
}
