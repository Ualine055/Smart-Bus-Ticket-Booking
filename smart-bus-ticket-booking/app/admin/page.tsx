"use client"

import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"
import { SiteShell } from "@/components/site-shell"
import { AdminDashboard } from "@/components/admin-dashboard"
import { cn } from "@/lib/utils"

export default function AdminPage() {
  const { user, userData, loading } = useAuth()

  if (loading) {
    return (
      <SiteShell>
        <div className="container mx-auto px-4 py-16 text-center text-muted-foreground">Loading…</div>
      </SiteShell>
    )
  }

  if (!user || !userData) {
    return (
      <SiteShell>
        <div className="container mx-auto px-4 py-16 max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">Admin area</h1>
          <p className="text-muted-foreground">Sign in with an admin account to open the dashboard.</p>
          <Link
            href="/"
            className={cn(
              "inline-flex h-10 items-center justify-center rounded-md px-4 py-2 font-medium",
              "bg-primary text-primary-foreground hover:bg-primary/90 transition-colors",
            )}
          >
            Back to home
          </Link>
        </div>
      </SiteShell>
    )
  }

  if (userData.role !== "admin") {
    return (
      <SiteShell>
        <div className="container mx-auto px-4 py-16 max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">Access denied</h1>
          <p className="text-muted-foreground">
            This page is only for administrators. Your Firestore user document must have{" "}
            <code className="text-xs bg-muted px-1 rounded">role: &quot;admin&quot;</code>.
          </p>
          <Link
            href="/"
            className={cn(
              "inline-flex h-10 items-center justify-center rounded-md px-4 py-2 font-medium",
              "bg-primary text-primary-foreground hover:bg-primary/90 transition-colors",
            )}
          >
            Back to home
          </Link>
        </div>
      </SiteShell>
    )
  }

  return (
    <SiteShell>
      <AdminDashboard />
    </SiteShell>
  )
}
