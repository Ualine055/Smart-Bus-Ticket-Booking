"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { SiteShell } from "@/components/site-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Building2, CheckCircle, Clock, Loader2, XCircle } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { applyForCompany, getCompanyByOwner, type Company } from "@/lib/companies"

type FormState = {
  name: string
  email: string
  phone: string
  licenseNumber: string
  address: string
  fleetSize: string
}

const EMPTY_FORM: FormState = {
  name: "",
  email: "",
  phone: "",
  licenseNumber: "",
  address: "",
  fleetSize: "",
}

function validate(form: FormState) {
  const errors: Partial<Record<keyof FormState, string>> = {}

  if (!form.name.trim()) errors.name = "Company name is required"
  if (!form.email.trim()) {
    errors.email = "Business email is required"
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = "Enter a valid email address"
  }
  if (!form.phone.trim()) errors.phone = "Phone number is required"
  if (!form.licenseNumber.trim()) errors.licenseNumber = "Operating license number is required"
  if (!form.address.trim()) errors.address = "Office address is required"

  const fleet = Number(form.fleetSize)
  if (!form.fleetSize.trim()) {
    errors.fleetSize = "Fleet size is required"
  } else if (!Number.isInteger(fleet) || fleet < 1) {
    errors.fleetSize = "Enter the number of buses (1 or more)"
  }

  return errors
}

export default function RegisterCompanyPage() {
  const { user, userData, loading: authLoading } = useAuth()

  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [submitError, setSubmitError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const [existing, setExisting] = useState<Company | null>(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      setChecking(false)
      return
    }

    getCompanyByOwner(user.uid).then((result) => {
      setExisting(result.company)
      setChecking(false)
    })
  }, [user, authLoading])

  // Prefill contact details from the signed-in account.
  useEffect(() => {
    if (userData) {
      setForm((prev) => ({
        ...prev,
        email: prev.email || userData.email || "",
        phone: prev.phone || userData.phone || "",
      }))
    }
  }, [userData])

  const update = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !userData) return

    const found = validate(form)
    setErrors(found)
    if (Object.keys(found).length > 0) return

    setSubmitting(true)
    setSubmitError("")

    const result = await applyForCompany({
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      licenseNumber: form.licenseNumber.trim().toUpperCase(),
      address: form.address.trim(),
      fleetSize: Number(form.fleetSize),
      ownerId: user.uid,
      ownerName: userData.name,
    })

    setSubmitting(false)

    if (result.success) {
      const refreshed = await getCompanyByOwner(user.uid)
      setExisting(refreshed.company)
      setForm(EMPTY_FORM)
    } else {
      setSubmitError(result.error ?? "Could not submit your application.")
    }
  }

  if (authLoading || checking) {
    return (
      <SiteShell>
        <div className="container mx-auto px-4 py-16 text-center text-muted-foreground">
          Loading...
        </div>
      </SiteShell>
    )
  }

  if (!user || !userData) {
    return (
      <SiteShell>
        <div className="container mx-auto px-4 py-16 max-w-md text-center space-y-4">
          <Building2 className="h-12 w-12 mx-auto text-primary" />
          <h1 className="text-2xl font-bold">Register your bus company</h1>
          <p className="text-muted-foreground">
            Sign in or create an account first — your application is linked to it, and that is the
            account that receives dashboard access once approved.
          </p>
          <Link
            href="/"
            className="inline-flex h-10 items-center justify-center rounded-md px-4 py-2 font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Back to home
          </Link>
        </div>
      </SiteShell>
    )
  }

  if (existing && existing.status !== "rejected") {
    return (
      <SiteShell>
        <div className="container mx-auto px-4 py-16 max-w-xl">
          <div className="bg-card border border-border rounded-2xl p-8 text-center space-y-4">
            {existing.status === "pending" ? (
              <>
                <div className="h-16 w-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto">
                  <Clock className="h-8 w-8 text-amber-500" />
                </div>
                <h1 className="text-2xl font-bold">Application under review</h1>
                <p className="text-muted-foreground">
                  We received your application for <strong>{existing.name}</strong> on{" "}
                  {existing.appliedAt.toLocaleDateString()}. An administrator will review your
                  operating license and approve your account.
                </p>
                <p className="text-sm text-muted-foreground">
                  Once approved, sign out and back in to load your company dashboard.
                </p>
              </>
            ) : (
              <>
                <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
                  <CheckCircle className="h-8 w-8 text-primary" />
                </div>
                <h1 className="text-2xl font-bold">{existing.name} is approved</h1>
                <p className="text-muted-foreground">
                  Your company is registered and can publish schedules and validate tickets.
                </p>
                <Link
                  href="/company-dashboard"
                  className="inline-flex h-10 items-center justify-center rounded-md px-4 py-2 font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Open company dashboard
                </Link>
              </>
            )}

            <div className="pt-4 border-t border-border text-left text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">License</span>
                <span className="font-medium">{existing.licenseNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fleet size</span>
                <span className="font-medium">{existing.fleetSize} buses</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge
                  className={
                    existing.status === "approved"
                      ? "bg-primary/20 text-primary hover:bg-primary/20"
                      : "bg-amber-500/20 text-amber-500 hover:bg-amber-500/20"
                  }
                >
                  {existing.status}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </SiteShell>
    )
  }

  return (
    <SiteShell>
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Register your bus company</h1>
          <p className="text-muted-foreground">
            Bus operators can partner with BUS CONNECT to publish routes and manage bookings. An
            administrator verifies your operating license before granting dashboard access.
          </p>
        </div>

        {existing?.status === "rejected" && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex gap-3">
            <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-destructive">
                Your previous application was not approved
              </p>
              <p className="text-sm text-muted-foreground mt-1">{existing.rejectionReason}</p>
              <p className="text-sm text-muted-foreground mt-1">
                You can correct the details and apply again below.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name">Company name</Label>
            <Input
              id="name"
              placeholder="Volcano Express Ltd"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              className={errors.name ? "border-destructive" : ""}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="email">Business email</Label>
              <Input
                id="email"
                type="email"
                placeholder="info@company.rw"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                className={errors.email ? "border-destructive" : ""}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Business phone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+250 7XX XXX XXX"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                className={errors.phone ? "border-destructive" : ""}
              />
              {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="license">Operating license number</Label>
              <Input
                id="license"
                placeholder="RW-BUS-2026-001"
                value={form.licenseNumber}
                onChange={(e) => update("licenseNumber", e.target.value)}
                className={errors.licenseNumber ? "border-destructive" : ""}
              />
              {errors.licenseNumber && (
                <p className="text-xs text-destructive">{errors.licenseNumber}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="fleet">Fleet size (buses)</Label>
              <Input
                id="fleet"
                type="number"
                min={1}
                placeholder="12"
                value={form.fleetSize}
                onChange={(e) => update("fleetSize", e.target.value)}
                className={errors.fleetSize ? "border-destructive" : ""}
              />
              {errors.fleetSize && <p className="text-xs text-destructive">{errors.fleetSize}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Office address</Label>
            <Input
              id="address"
              placeholder="Nyabugogo Bus Park, Kigali"
              value={form.address}
              onChange={(e) => update("address", e.target.value)}
              className={errors.address ? "border-destructive" : ""}
            />
            {errors.address && <p className="text-xs text-destructive">{errors.address}</p>}
          </div>

          {submitError && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">{submitError}</p>
            </div>
          )}

          <div className="pt-2 space-y-3">
            <Button type="submit" size="lg" className="w-full gap-2" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit application"
              )}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Submitting does not grant access. Your account stays a passenger account until an
              administrator approves the application.
            </p>
          </div>
        </form>
      </div>
    </SiteShell>
  )
}
