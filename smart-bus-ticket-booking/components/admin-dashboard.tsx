"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Shield, Building2, MapPin, Users, TrendingUp,
  CheckCircle, XCircle, FileText, Search, Loader2, Inbox,
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { getCompanies, approveCompany, rejectCompany, type Company } from "@/lib/companies"
import { getAllBookings, type Booking } from "@/lib/bookings"
import { countUsers } from "@/lib/auth"

/** Firestore may hand back a Timestamp, a Date, or nothing at all. */
function toDate(value: unknown): Date | null {
  if (!value) return null
  if (value instanceof Date) return value
  if (typeof value === "object" && "toDate" in value) {
    return (value as { toDate: () => Date }).toDate()
  }
  return null
}

/** Wrap a CSV field: double any quotes, then quote the whole value. */
function csvCell(value: unknown) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`
}

function downloadCsv(filename: string, headers: string[], rows: unknown[][]) {
  const csv = [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n")
  // The BOM makes Excel read the file as UTF-8, so "→" and accents survive.
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function AdminDashboard() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<"overview" | "companies" | "routes" | "reports">("overview")

  const [companies, setCompanies] = useState<Company[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [userCount, setUserCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [search, setSearch] = useState("")

  /** id of the company currently being approved/rejected, so only its row shows a spinner */
  const [actingOn, setActingOn] = useState<string | null>(null)
  const [actionError, setActionError] = useState("")

  const loadData = useCallback(async () => {
    setLoading(true)
    setLoadError("")

    const [companyResult, bookingResult, userResult] = await Promise.all([
      getCompanies(),
      getAllBookings(),
      countUsers(),
    ])

    if (!companyResult.success) {
      setLoadError(companyResult.error ?? "Could not load companies.")
    }

    setCompanies(companyResult.companies)
    setBookings(bookingResult.bookings)
    setUserCount(userResult.count)
    setLoading(false)
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const pendingCompanies = useMemo(
    () => companies.filter((company) => company.status === "pending"),
    [companies],
  )

  const approvedCompanies = useMemo(
    () => companies.filter((company) => company.status === "approved"),
    [companies],
  )

  const visibleCompanies = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return companies
    return companies.filter((company) =>
      [company.name, company.email, company.licenseNumber].some((field) =>
        field?.toLowerCase().includes(term),
      ),
    )
  }, [companies, search])

  const paidBookings = useMemo(
    () => bookings.filter((booking) => booking.paymentStatus === "completed"),
    [bookings],
  )

  const stats = {
    totalCompanies: approvedCompanies.length,
    pendingApprovals: pendingCompanies.length,
    totalUsers: userCount,
    totalBookings: bookings.length,
    revenue: paidBookings.reduce((sum, booking) => sum + (booking.totalPrice || 0), 0),
  }

  /** Routes the system has actually sold tickets for, busiest first. */
  const routes = useMemo(() => {
    const byRoute = new Map<
      string,
      { from: string; to: string; trips: number; companies: Set<string>; revenue: number }
    >()

    for (const booking of bookings) {
      if (!booking.route) continue
      const key = `${booking.route.from}→${booking.route.to}`
      const entry = byRoute.get(key) ?? {
        from: booking.route.from,
        to: booking.route.to,
        trips: 0,
        companies: new Set<string>(),
        revenue: 0,
      }
      entry.trips += 1
      if (booking.busCompany) entry.companies.add(booking.busCompany)
      if (booking.paymentStatus === "completed") entry.revenue += booking.totalPrice || 0
      byRoute.set(key, entry)
    }

    return [...byRoute.entries()]
      .map(([key, entry]) => ({ id: key, ...entry, companies: entry.companies.size }))
      .sort((a, b) => b.trips - a.trips)
  }, [bookings])

  /** This month vs last month, from booking creation dates. */
  const monthly = useMemo(() => {
    const now = new Date()
    const thisMonth = { count: 0, revenue: 0 }
    const lastMonth = { count: 0, revenue: 0 }

    for (const booking of paidBookings) {
      const created = toDate(booking.createdAt)
      if (!created) continue

      const monthsAgo =
        (now.getFullYear() - created.getFullYear()) * 12 + (now.getMonth() - created.getMonth())

      if (monthsAgo === 0) {
        thisMonth.count += 1
        thisMonth.revenue += booking.totalPrice || 0
      } else if (monthsAgo === 1) {
        lastMonth.count += 1
        lastMonth.revenue += booking.totalPrice || 0
      }
    }

    const growth =
      lastMonth.revenue > 0
        ? Math.round(((thisMonth.revenue - lastMonth.revenue) / lastMonth.revenue) * 100)
        : null

    return { thisMonth, lastMonth, growth }
  }, [paidBookings])

  const downloadBookingReport = () => {
    downloadCsv(
      "bus-connect-bookings.csv",
      ["Ticket ID", "Passenger", "Phone", "Company", "From", "To", "Travel date",
       "Departure", "Seats", "Amount (RWF)", "Payment", "Status", "Booked on"],
      bookings.map((booking) => [
        booking.ticketId,
        booking.passengerName,
        booking.passengerPhone,
        booking.busCompany,
        booking.route?.from,
        booking.route?.to,
        booking.travelDate,
        booking.route?.departureTime,
        booking.seats?.join(" "),
        booking.totalPrice,
        booking.paymentStatus,
        booking.bookingStatus,
        toDate(booking.createdAt)?.toLocaleDateString() ?? "",
      ]),
    )
  }

  const downloadRouteReport = () => {
    downloadCsv(
      "bus-connect-routes.csv",
      ["From", "To", "Operators", "Bookings", "Revenue (RWF)"],
      routes.map((route) => [route.from, route.to, route.companies, route.trips, route.revenue]),
    )
  }

  const downloadCompanyReport = () => {
    downloadCsv(
      "bus-connect-companies.csv",
      ["Company", "Email", "Phone", "License", "Fleet size", "Status", "Applied", "Reviewed"],
      companies.map((company) => [
        company.name,
        company.email,
        company.phone,
        company.licenseNumber,
        company.fleetSize,
        company.status,
        company.appliedAt.toLocaleDateString(),
        company.reviewedAt?.toLocaleDateString() ?? "",
      ]),
    )
  }

  /** Newest real events across companies and bookings, for the overview feed. */
  const activity = useMemo(() => {
    const entries: { id: string; label: string; at: Date; Icon: typeof Building2 }[] = []

    for (const company of companies) {
      entries.push({
        id: `company-${company.id}`,
        label: `${company.name} applied to operate`,
        at: company.appliedAt,
        Icon: Building2,
      })
      if (company.reviewedAt) {
        entries.push({
          id: `review-${company.id}`,
          label: `${company.name} was ${company.status}`,
          at: company.reviewedAt,
          Icon: company.status === "approved" ? CheckCircle : XCircle,
        })
      }
    }

    for (const booking of bookings) {
      const created = toDate(booking.createdAt)
      if (!created) continue
      entries.push({
        id: `booking-${booking.id}`,
        label: `${booking.passengerName} booked ${booking.route?.from} → ${booking.route?.to}`,
        at: created,
        Icon: MapPin,
      })
    }

    return entries.sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, 6)
  }, [companies, bookings])

  const handleApprove = async (companyId: string) => {
    if (!user) return

    setActingOn(companyId)
    setActionError("")

    const result = await approveCompany(companyId, user.uid)

    if (result.success) {
      await loadData()
    } else {
      setActionError(result.error ?? "Could not approve this company.")
    }

    setActingOn(null)
  }

  const handleReject = async (companyId: string) => {
    if (!user) return

    const reason = window.prompt("Reason for rejection (shown to the applicant):")
    if (reason === null) return

    setActingOn(companyId)
    setActionError("")

    const result = await rejectCompany(companyId, user.uid, reason.trim() || "No reason given.")

    if (result.success) {
      await loadData()
    } else {
      setActionError(result.error ?? "Could not reject this company.")
    }

    setActingOn(null)
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
            <Shield className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">System management and oversight</p>
          </div>
        </div>

        {loadError && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center justify-between gap-4">
            <p className="text-sm text-destructive">{loadError}</p>
            <Button variant="outline" size="sm" onClick={loadData}>
              Retry
            </Button>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-card border border-border rounded-xl p-4">
            <Building2 className="h-6 w-6 text-primary mb-2" />
            <div className="text-2xl font-bold">{stats.totalCompanies}</div>
            <div className="text-xs text-muted-foreground">Total Companies</div>
          </div>

          <div className="bg-card border border-border rounded-xl p-4">
            <div className="h-6 w-6 rounded-full bg-destructive/20 flex items-center justify-center mb-2">
              <span className="text-xs font-bold text-destructive">{stats.pendingApprovals}</span>
            </div>
            <div className="text-2xl font-bold">{stats.pendingApprovals}</div>
            <div className="text-xs text-muted-foreground">Pending Approvals</div>
          </div>

          <div className="bg-card border border-border rounded-xl p-4">
            <Users className="h-6 w-6 text-primary mb-2" />
            <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Registered Users</div>
          </div>

          <div className="bg-card border border-border rounded-xl p-4">
            <TrendingUp className="h-6 w-6 text-primary mb-2" />
            <div className="text-2xl font-bold">{stats.totalBookings.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Total Bookings</div>
          </div>

          <div className="bg-card border border-border rounded-xl p-4">
            <FileText className="h-6 w-6 text-primary mb-2" />
            <div className="text-xl font-bold">{(stats.revenue / 1000000).toFixed(1)}M</div>
            <div className="text-xs text-muted-foreground">Revenue (RWF)</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-border">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "overview" ? "text-primary border-b-2 border-primary" : "text-muted-foreground"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("companies")}
            className={`px-4 py-2 font-medium transition-colors relative ${
              activeTab === "companies" ? "text-primary border-b-2 border-primary" : "text-muted-foreground"
            }`}
          >
            Companies
            {stats.pendingApprovals > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
                {stats.pendingApprovals}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("routes")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "routes" ? "text-primary border-b-2 border-primary" : "text-muted-foreground"
            }`}
          >
            Routes
          </button>
          <button
            onClick={() => setActiveTab("reports")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "reports" ? "text-primary border-b-2 border-primary" : "text-muted-foreground"
            }`}
          >
            Reports
          </button>
        </div>

        {/* Companies Tab */}
        {activeTab === "companies" && (
          <div className="space-y-6">
            {actionError && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl">
                <p className="text-sm text-destructive">{actionError}</p>
              </div>
            )}

            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4">Pending Approvals</h2>

              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : pendingCompanies.length === 0 ? (
                <div className="text-center py-10">
                  <Inbox className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No applications waiting for review.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingCompanies.map((company) => (
                    <div
                      key={company.id}
                      className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 border border-border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-lg">{company.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {company.email} • License: {company.licenseNumber}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {company.phone} • {company.fleetSize} buses • {company.address}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Applied by {company.ownerName} on {company.appliedAt.toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button
                          onClick={() => handleApprove(company.id!)}
                          size="sm"
                          className="gap-2"
                          disabled={actingOn !== null}
                        >
                          {actingOn === company.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle className="h-4 w-4" />
                          )}
                          Approve
                        </Button>
                        <Button
                          onClick={() => handleReject(company.id!)}
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          disabled={actingOn !== null}
                        >
                          <XCircle className="h-4 w-4" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <h2 className="text-xl font-bold">All Companies</h2>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search name, email, license..."
                    className="pl-9"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : visibleCompanies.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">
                  {companies.length === 0
                    ? "No bus companies have registered yet."
                    : "No companies match your search."}
                </p>
              ) : (
                <div className="space-y-3">
                  {visibleCompanies.map((company) => (
                    <div
                      key={company.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border border-border rounded-lg"
                    >
                      <div>
                        <div className="font-medium">{company.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {company.email} • License: {company.licenseNumber}
                        </div>
                        {company.status === "rejected" && company.rejectionReason && (
                          <div className="text-xs text-destructive mt-1">
                            Rejected: {company.rejectionReason}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <Badge
                          className={
                            company.status === "approved"
                              ? "bg-primary/20 text-primary hover:bg-primary/20"
                              : company.status === "pending"
                              ? "bg-amber-500/20 text-amber-500 hover:bg-amber-500/20"
                              : "bg-destructive/20 text-destructive hover:bg-destructive/20"
                          }
                        >
                          {company.status}
                        </Badge>
                        {company.status === "approved" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReject(company.id!)}
                            disabled={actingOn !== null}
                          >
                            Suspend
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Routes Tab */}
        {activeTab === "routes" && (
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold">Routes in use</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Derived from bookings made through the system, busiest first.
              </p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : routes.length === 0 ? (
              <div className="text-center py-10">
                <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No tickets have been booked yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {routes.map((route) => (
                  <div
                    key={route.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border border-border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-lg">
                        {route.from} → {route.to}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {route.companies} {route.companies === 1 ? "operator" : "operators"} •{" "}
                        {route.trips} {route.trips === 1 ? "booking" : "bookings"}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{route.revenue.toLocaleString()} RWF</div>
                      <div className="text-xs text-muted-foreground">revenue</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === "reports" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="font-bold mb-4">System Usage</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Registered Users</span>
                    <span className="font-medium">{stats.totalUsers.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Bookings</span>
                    <span className="font-medium">{stats.totalBookings.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tickets Boarded</span>
                    <span className="font-medium">
                      {bookings.filter((b) => b.bookingStatus === "used").length.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Approved Operators</span>
                    <span className="font-medium">{stats.totalCompanies}</span>
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="font-bold mb-4">Revenue Report</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">This Month</span>
                    <span className="font-medium">
                      {monthly.thisMonth.revenue.toLocaleString()} RWF
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Month</span>
                    <span className="font-medium">
                      {monthly.lastMonth.revenue.toLocaleString()} RWF
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Growth</span>
                    <span
                      className={`font-medium ${
                        monthly.growth === null
                          ? ""
                          : monthly.growth >= 0
                          ? "text-primary"
                          : "text-destructive"
                      }`}
                    >
                      {monthly.growth === null
                        ? "No prior month"
                        : `${monthly.growth >= 0 ? "+" : ""}${monthly.growth}%`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">All-time Revenue</span>
                    <span className="font-medium">{stats.revenue.toLocaleString()} RWF</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-bold mb-4">Generate Reports</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Downloads a CSV of live system data, openable in Excel.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Button
                  variant="outline"
                  className="justify-start gap-2"
                  onClick={downloadBookingReport}
                  disabled={bookings.length === 0}
                >
                  <FileText className="h-4 w-4" />
                  Booking Report
                </Button>
                <Button
                  variant="outline"
                  className="justify-start gap-2"
                  onClick={downloadRouteReport}
                  disabled={routes.length === 0}
                >
                  <FileText className="h-4 w-4" />
                  Route Revenue Report
                </Button>
                <Button
                  variant="outline"
                  className="justify-start gap-2"
                  onClick={downloadCompanyReport}
                  disabled={companies.length === 0}
                >
                  <FileText className="h-4 w-4" />
                  Company Report
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Button variant="outline" className="h-24 flex-col gap-2" onClick={() => setActiveTab("companies")}>
                  <Building2 className="h-6 w-6" />
                  Approve Companies
                  {stats.pendingApprovals > 0 && (
                    <Badge className="bg-destructive text-destructive-foreground">{stats.pendingApprovals} pending</Badge>
                  )}
                </Button>
                <Button variant="outline" className="h-24 flex-col gap-2" onClick={() => setActiveTab("routes")}>
                  <MapPin className="h-6 w-6" />
                  Manage Routes
                </Button>
                <Button variant="outline" className="h-24 flex-col gap-2">
                  <Users className="h-6 w-6" />
                  View Users
                </Button>
                <Button variant="outline" className="h-24 flex-col gap-2" onClick={() => setActiveTab("reports")}>
                  <FileText className="h-6 w-6" />
                  Generate Reports
                </Button>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4">Recent Activity</h2>

              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : activity.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">
                  Nothing has happened in the system yet.
                </p>
              ) : (
                <div className="space-y-3 text-sm">
                  {activity.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg"
                    >
                      <entry.Icon className="h-4 w-4 text-primary shrink-0" />
                      <span>{entry.label}</span>
                      <span className="ml-auto text-muted-foreground shrink-0">
                        {entry.at.toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
