import { StaticSitePage } from "@/components/static-site-page"
import { SiteShell } from "@/components/site-shell"
import { RoleGuard } from "@/components/role-guard"

export default function PricingPage() {
  return (
    <SiteShell>
      <RoleGuard
        allowedRoles={["company", "admin"]}
        title="Business pricing area"
        unauthenticatedMessage="Sign in with a company or admin account to view partner pricing."
        unauthorizedMessage="Partner pricing is available to company operators and admins only."
      >
        <StaticSitePage title="Pricing">
          <p>
            Passenger booking may include a small platform fee depending on payment method. Operators can choose a
            subscription or per-ticket model in a full deployment.
          </p>
          <p>
            This academic build focuses on the booking and ticketing flow; commercial pricing would be agreed with
            transport partners separately.
          </p>
        </StaticSitePage>
      </RoleGuard>
    </SiteShell>
  )
}
