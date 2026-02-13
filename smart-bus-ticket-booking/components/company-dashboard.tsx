"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Bus, Users, DollarSign, Calendar, Plus, Edit, Trash2 } from "lucide-react"

export function CompanyDashboard() {
  const [activeTab, setActiveTab] = useState<"overview" | "schedules" | "bookings">("overview")

  // Mock data
  const stats = {
    totalBuses: 12,
    todayBookings: 45,
    revenue: 125000,
    upcomingTrips: 8,
  }

  const schedules = [
    { id: "1", route: "Kigali → Musanze", time: "06:00", bus: "RW-001", seats: "12/45", status: "active" },
    { id: "2", route: "Kigali → Musanze", time: "09:00", bus: "RW-002", seats: "8/32", status: "active" },
  ]

  const bookings = [
    { id: "TRV-ABC123", passenger: "John Doe", route: "Kigali → Musanze", date: "2024-01-15", seats: "A1, A2", amount: 7000, status: "confirmed" },
    { id: "TRV-DEF456", passenger: "Jane Smith", route: "Kigali → Musanze", date: "2024-01-15", seats: "B3", amount: 3500, status: "confirmed" },
  ]

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Company Dashboard</h1>
          <p className="text-muted-foreground">Manage your bus schedules and bookings</p>
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
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Schedule
              </Button>
            </div>

            <div className="space-y-3">
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
                    <Button variant="ghost" size="icon">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
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
              <Button variant="outline" className="h-24 flex-col gap-2">
                <Plus className="h-6 w-6" />
                Add New Schedule
              </Button>
              <Button variant="outline" className="h-24 flex-col gap-2">
                <Bus className="h-6 w-6" />
                Manage Buses
              </Button>
              <Button variant="outline" className="h-24 flex-col gap-2">
                <Users className="h-6 w-6" />
                View All Bookings
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
