"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"
import { cn } from "@/lib/utils"

type UserRole = "passenger" | "company" | "admin"

type RoleGuardProps = {
  allowedRoles: UserRole[]
  title?: string
  unauthenticatedMessage?: string
  unauthorizedMessage?: string
  children: ReactNode
}

export function RoleGuard({
  allowedRoles,
  title = "Restricted area",
  unauthenticatedMessage = "Sign in to continue.",
  unauthorizedMessage = "You don't have access to this page.",
  children,
}: RoleGuardProps) {
  const { user, userData, loading } = useAuth()

  if (loading) {
    return <div className="container mx-auto px-4 py-16 text-center text-muted-foreground">Loading...</div>
  }

  if (!user || !userData) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-md text-center space-y-4">
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        <p className="text-muted-foreground">{unauthenticatedMessage}</p>
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
    )
  }

  if (!allowedRoles.includes(userData.role)) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-md text-center space-y-4">
        <h1 className="text-2xl font-bold text-foreground">Access denied</h1>
        <p className="text-muted-foreground">{unauthorizedMessage}</p>
        <Link
          href="/unauthorized"
          className={cn(
            "inline-flex h-10 items-center justify-center rounded-md px-4 py-2 font-medium",
            "bg-primary text-primary-foreground hover:bg-primary/90 transition-colors",
          )}
        >
          Go to access help
        </Link>
      </div>
    )
  }

  return <>{children}</>
}
