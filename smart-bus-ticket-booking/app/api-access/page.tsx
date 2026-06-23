import { StaticSitePage } from "@/components/static-site-page"
import { SiteShell } from "@/components/site-shell"
import { RoleGuard } from "@/components/role-guard"

export default function ApiAccessPage() {
  return (
    <SiteShell>
      <RoleGuard
        allowedRoles={["company", "admin"]}
        title="Business integration area"
        unauthenticatedMessage="Sign in with a company or admin account to view API integration details."
        unauthorizedMessage="API integration details are visible to company operators and admins only."
      >
        <StaticSitePage title="API access">
          <p>
            A production deployment would expose authenticated REST or GraphQL endpoints for partners (e.g. route
            inventory, booking webhooks, settlement reports).
          </p>
          <p>
            In this student project, integrations are not publicly exposed; Firebase security rules and server-side
            functions would govern access in a real release.
          </p>
        </StaticSitePage>
      </RoleGuard>
    </SiteShell>
  )
}
