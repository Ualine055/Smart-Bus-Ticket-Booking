import Link from "next/link"
import { SiteShell } from "@/components/site-shell"
import { cn } from "@/lib/utils"

export default function UnauthorizedPage() {
  return (
    <SiteShell>
      <div className="container mx-auto px-4 py-16 max-w-xl text-center space-y-4">
        <h1 className="text-3xl font-bold text-foreground">Unauthorized access</h1>
        <p className="text-muted-foreground">
          You are signed in, but your account role does not allow this area. Use a company/admin account or request the
          proper role from the system administrator.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/"
            className={cn(
              "inline-flex h-10 items-center justify-center rounded-md px-4 py-2 font-medium",
              "bg-primary text-primary-foreground hover:bg-primary/90 transition-colors",
            )}
          >
            Back to home
          </Link>
          <Link
            href="/contact"
            className={cn(
              "inline-flex h-10 items-center justify-center rounded-md px-4 py-2 font-medium",
              "border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors",
            )}
          >
            Contact support
          </Link>
        </div>
      </div>
    </SiteShell>
  )
}
