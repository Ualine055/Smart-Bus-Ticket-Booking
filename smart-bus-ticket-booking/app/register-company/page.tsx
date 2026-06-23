import { StaticSitePage } from "@/components/static-site-page"
import Link from "next/link"

export default function RegisterCompanyPage() {
  return (
    <StaticSitePage title="Register your company">
      <p>
        Bus operators can partner with BUS CONNECT to publish routes and manage bookings. This project currently
        includes a company dashboard prototype for demonstration.
      </p>
      <p>
        For production onboarding, you would collect legal and fleet details, verify the operator, then grant
        dashboard access.
      </p>
      <p>
        <Link href="/company-dashboard" className="text-primary underline underline-offset-4">
          Open company dashboard (demo)
        </Link>
      </p>
    </StaticSitePage>
  )
}
