"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Bus, Users, DollarSign, Calendar, Plus, Edit, Trash2, ScanLine } from "lucide-react"
import { TicketValidator } from "@/components/ticket-validator"
import { useAuth } from "@/contexts/AuthContext"
import { getAllBookings, type Booking } from "@/lib/bookings"
import { getCompanyById } from "@/lib/companies"
import { ScheduleModal } from "@/components/schedule-modal"
import {
  getCompanySchedules,
  getAllSchedules,
  deleteSchedule,
  type Schedule,
} from "@/lib/schedules"

/** Local calendar date as YYYY-MM-DD (toISOString is UTC and rolls over early). */
function todayIso() {
  const now = new Date()
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-")
}

function toDate(value: unknown): Date | null {
  if (!value) return null
  if (value instanceof Date) return value
  if (typeof value === "object" && "toDate" in value) {
    return (value as { toDate: () => Date }).toDate()
  }
  return null
}

export function CompanyDashboard() {
  const { userData } = useAuth()
  const [activeTab, setActiveTab] = useState<"overview" | "schedules" | "bookings">("overview")
  const [showValidator, setShowValidator] = useState(false)

  const [allBookings, setAllBookings] = useState<Booking[]>([])
  const [publishedSchedules, setPublishedSchedules] = useState<Schedule[]>([])
  const [companyName, setCompanyName] = useState<string | null>(null)
  const [fleetSize, setFleetSize] = useState(0)
  const [loading, setLoading] = useState(true)

  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [scheduleError, setScheduleError] = useState("")

  const companyId = userData?.companyId ?? null

  const loadData = useCallback(async () => {
    // Admins have no companyId and see every operator's data.
    const company = companyId ? await getCompanyById(companyId) : null

    const [bookingResult, scheduleResult] = await Promise.all([
      getAllBookings(),
      companyId ? getCompanySchedules(companyId) : getAllSchedules(),
    ])

    setCompanyName(company?.company?.name ?? null)
    setFleetSize(company?.company?.fleetSize ?? 0)
    setAllBookings(bookingResult.bookings)
    setPublishedSchedules(scheduleResult.schedules)
    setLoading(false)
  }, [companyId])

  const handleDeleteSchedule = async (schedule: Schedule) => {
    const label = `${schedule.from} → ${schedule.to} at ${schedule.departureTime}`
    if (!window.confirm(`Delete the ${label} schedule? Existing bookings are not affected.`)) return

    setScheduleError("")
    const result = await deleteSchedule(schedule.id!)

    if (result.success) {
      await loadData()
    } else {
      setScheduleError(result.error ?? "Could not delete this schedule.")
    }
  }

  useEffect(() => {
    loadData()
  }, [loadData])

  /** Only this operator's bookings; an admin sees all of them. */
  const companyBookings = useMemo(
    () =>
      companyName
        ? allBookings.filter((booking) => booking.busCompany === companyName)
        : allBookings,
    [allBookings, companyName],
  )

  const today = todayIso()

  const stats = useMemo(() => {
    const paid = companyBookings.filter((booking) => booking.paymentStatus === "completed")
    const now = new Date()

    const bookedToday = companyBookings.filter((booking) => {
      const created = toDate(booking.createdAt)
      if (!created) return false
      return (
        created.getFullYear() === now.getFullYear() &&
        created.getMonth() === now.getMonth() &&
        created.getDate() === now.getDate()
      )
    })

    const revenue = paid
      .filter((booking) => {
        const created = toDate(booking.createdAt)
        return (
          created &&
          created.getFullYear() === now.getFullYear() &&
          created.getMonth() === now.getMonth()
        )
      })
      .reduce((sum, booking) => sum + (booking.totalPrice || 0), 0)

    const upcoming = new Set(
      companyBookings
        .filter((booking) => booking.travelDate >= today && booking.bookingStatus === "confirmed")
        .map((booking) => `${booking.busId}|${booking.travelDate}`),
    )

    return {
      totalBuses: fleetSize,
      todayBookings: bookedToday.length,
      revenue,
      upcomingTrips: upcoming.size,
    }
  }, [companyBookings, fleetSize, today])

  /** Published schedules, with today's seat sales merged in. */
  const schedules = useMemo(
    () =>
      publishedSchedules.map((schedule) => {
        const bookedToday = companyBookings
          .filter(
            (booking) =>
              booking.busId === schedule.id &&
              booking.travelDate === today &&
              booking.bookingStatus !== "cancelled",
          )
          .reduce((sum, booking) => sum + (booking.seats?.length ?? 0), 0)

        return {
          id: schedule.id!,
          route: `${schedule.from} → ${schedule.to}`,
          time: schedule.departureTime,
          bus: schedule.busPlate,
          // Rendered below as "{seats} seats booked".
          seats: `${bookedToday}/${schedule.totalSeats}`,
          status: schedule.active ? "active" : "paused",
          source: schedule,
        }
      }),
    [publishedSchedules, companyBookings, today],
  )

  /** Newest bookings first, in the shape the table below expects. */
  const bookings = useMemo(
    () =>
      [...companyBookings]
        .sort((a, b) => (toDate(b.createdAt)?.getTime() ?? 0) - (toDate(a.createdAt)?.getTime() ?? 0))
        .map((booking) => ({
          id: booking.ticketId,
          passenger: booking.passengerName,
          route: `${booking.route?.from} → ${booking.route?.to}`,
          date: booking.travelDate,
          seats: booking.seats?.join(", ") ?? "",
          amount: booking.totalPrice,
          status: booking.bookingStatus,
        })),
    [companyBookings],
  )

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Company Dashboard</h1>
            <p className="text-muted-foreground">Manage your bus schedules and bookings</p>
          </div>
          <Button onClick={() => setShowValidator(true)} className="gap-2 shrink-0">
            <ScanLine className="h-4 w-4" />
            Validate Ticket
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <Bus className="h-8 w-8 text-primary" />
            </div>
            <div className="text-2xl font-bold">{stats.totalBuses}</div>
            <div className="text-sm text-muted-foreground">Total Buses</div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <div className="text-2xl font-bold">{stats.todayBookings}</div>
            <div className="text-sm text-muted-foreground">Today's Bookings</div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
            <div className="text-2xl font-bold">{stats.revenue.toLocaleString()} RWF</div>
            <div className="text-sm text-muted-foreground">Monthly Revenue</div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="h-8 w-8 text-primary" />
            </div>
            <div className="text-2xl font-bold">{stats.upcomingTrips}</div>
            <div className="text-sm text-muted-foreground">Upcoming Trips</div>
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
            onClick={() => setActiveTab("schedules")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "schedules" ? "text-primary border-b-2 border-primary" : "text-muted-foreground"
            }`}
          >
            Schedules
          </button>
          <button
            onClick={() => setActiveTab("bookings")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "bookings" ? "text-primary border-b-2 border-primary" : "text-muted-foreground"
            }`}
          >
            Bookings
          </button>
        </div>

        {/* Content */}
        {activeTab === "schedules" && (
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Bus Schedules</h2>
              <Button
                className="gap-2"
                onClick={() => {
                  setEditingSchedule(null)
                  setShowScheduleModal(true)
                }}
                disabled={!companyId}
              >
                <Plus className="h-4 w-4" />
                Add Schedule
              </Button>
            </div>

            {scheduleError && (
              <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <p className="text-sm text-destructive">{scheduleError}</p>
              </div>
            )}

            <div className="space-y-3">
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading schedules...</p>
              ) : schedules.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {companyId
                    ? "No schedules published yet. Add one so passengers can find and book your trips."
                    : "No operator has published a schedule yet."}
                </p>
              ) : null}
              {schedules.map((schedule) => (
                <div key={schedule.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-secondary/50">
                  <div className="flex-1">
                    <div className="font-medium">{schedule.route}</div>
                    <div className="text-sm text-muted-foreground">
                      {schedule.time} • Bus {schedule.bus} • {schedule.seats} seats booked
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className="bg-primary/20 text-primary hover:bg-primary/20">{schedule.status}</Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditingSchedule(schedule.source)
                        setShowScheduleModal(true)
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteSchedule(schedule.source)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "bookings" && (
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-xl font-bold mb-6">Recent Bookings</h2>

            <div className="space-y-3">
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading bookings...</p>
              ) : bookings.length === 0 ? (
                <p className="text-sm text-muted-foreground">No bookings yet.</p>
              ) : null}
              {bookings.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{booking.passenger}</div>
                    <div className="text-sm text-muted-foreground">
                      {booking.route} • {booking.date} • Seats: {booking.seats}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-medium">{booking.amount.toLocaleString()} RWF</div>
                      <div className="text-xs text-muted-foreground">{booking.id}</div>
                    </div>
                    <Badge className="bg-primary/20 text-primary hover:bg-primary/20">{booking.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "overview" && (
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="h-24 flex-col gap-2"
                onClick={() => {
                  setEditingSchedule(null)
                  setShowScheduleModal(true)
                }}
                disabled={!companyId}
              >
                <Plus className="h-6 w-6" />
                Add New Schedule
              </Button>
              <Button
                variant="outline"
                className="h-24 flex-col gap-2"
                onClick={() => setActiveTab("schedules")}
              >
                <Bus className="h-6 w-6" />
                Manage Buses
              </Button>
              <Button
                variant="outline"
                className="h-24 flex-col gap-2"
                onClick={() => setActiveTab("bookings")}
              >
                <Users className="h-6 w-6" />
                View All Bookings
              </Button>
            </div>
          </div>
        )}
      </div>

      {showValidator && <TicketValidator onClose={() => setShowValidator(false)} />}

      {showScheduleModal && companyId && companyName && (
        <ScheduleModal
          schedule={editingSchedule}
          companyId={companyId}
          companyName={companyName}
          onClose={() => setShowScheduleModal(false)}
          onSaved={async () => {
            setShowScheduleModal(false)
            await loadData()
          }}
        />
      )}
    </div>
  )
}
