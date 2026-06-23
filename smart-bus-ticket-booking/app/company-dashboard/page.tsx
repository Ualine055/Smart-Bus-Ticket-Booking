"use client"

import { SiteShell } from "@/components/site-shell"
import { CompanyDashboard } from "@/components/company-dashboard"
import { RoleGuard } from "@/components/role-guard"

export default function CompanyDashboardPage() {
  return (
    <SiteShell>
      <RoleGuard
        allowedRoles={["company", "admin"]}
        title="Company area"
        unauthenticatedMessage="Sign in with a company or admin account to open the dashboard."
        unauthorizedMessage="This dashboard is only for company operators and administrators."
      >
        <div className="container mx-auto px-4 py-8">
          <CompanyDashboard />
        </div>
      </RoleGuard>
    </SiteShell>
  )
}
