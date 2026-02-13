"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Shield, Building2, MapPin, Users, TrendingUp, 
  CheckCircle, XCircle, FileText, Search 
} from "lucide-react"

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"overview" | "companies" | "routes" | "reports">("overview")

  // Mock data
  const stats = {
    totalCompanies: 15,
    pendingApprovals: 3,
    activeRoutes: 45,
    totalUsers: 1250,
    monthlyBookings: 3420,
    revenue: 8500000,
  }

  const pendingCompanies = [
    { id: "1", name: "Express Rwanda", email: "info@expressrw.com", license: "RW-BUS-2024-001", date: "2024-01-10", status: "pending" },
    { id: "2", name: "City Transit", email: "contact@citytransit.rw", license: "RW-BUS-2024-002", date: "2024-01-12", status: "pending" },
    { id: "3", name: "Swift Travel", email: "hello@swifttravel.rw", license: "RW-BUS-2024-003", date: "2024-01-14", status: "pending" },
  ]

  const routes = [
    { id: "1", from: "Kigali", to: "Musanze", companies: 5, trips: 120, status: "active" },
    { id: "2", from: "Kigali", to: "Huye", companies: 3, trips: 85, status: "active" },
    { id: "3", from: "Kigali", to: "Rubavu", companies: 4, trips: 95, status: "active" },
  ]

  const handleApprove = (companyId: string) => {
    alert(`Company ${companyId} approved!`)
  }

  const handleReject = (companyId: string) => {
    alert(`Company ${companyId} rejected!`)
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

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
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
            <MapPin className="h-6 w-6 text-primary mb-2" />
            <div className="text-2xl font-bold">{stats.activeRoutes}</div>
            <div className="text-xs text-muted-foreground">Active Routes</div>
          </div>

          <div className="bg-card border border-border rounded-xl p-4">
            <Users className="h-6 w-6 text-primary mb-2" />
            <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Total Users</div>
          </div>

          <div className="bg-card border border-border rounded-xl p-4">
            <TrendingUp className="h-6 w-6 text-primary mb-2" />
            <div className="text-2xl font-bold">{stats.monthlyBookings.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Monthly Bookings</div>
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
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4">Pending Approvals</h2>
              <div className="space-y-3">
                {pendingCompanies.map((company) => (
                  <div key={company.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-lg">{company.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {company.email} • License: {company.license}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">Applied: {company.date}</div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => handleApprove(company.id)} size="sm" className="gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Approve
                      </Button>
                      <Button onClick={() => handleReject(company.id)} variant="outline" size="sm" className="gap-2">
                        <XCircle className="h-4 w-4" />
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">All Companies</h2>
                <div className="flex gap-2">
                  <Input placeholder="Search companies..." className="w-64" />
                  <Button variant="outline" size="icon">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                {stats.totalCompanies} approved companies
              </div>
            </div>
          </div>
        )}

        {/* Routes Tab */}
        {activeTab === "routes" && (
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Manage Routes</h2>
              <Button className="gap-2">
                <MapPin className="h-4 w-4" />
                Add Route
              </Button>
            </div>

            <div className="space-y-3">
              {routes.map((route) => (
                <div key={route.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-lg">{route.from} → {route.to}</div>
                    <div className="text-sm text-muted-foreground">
                      {route.companies} companies • {route.trips} trips/month
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className="bg-primary/20 text-primary hover:bg-primary/20">{route.status}</Badge>
                    <Button variant="outline" size="sm">Manage</Button>
                  </div>
                </div>
              ))}
            </div>
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
                    <span className="text-muted-foreground">Daily Active Users</span>
                    <span className="font-medium">450</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Avg. Bookings/Day</span>
                    <span className="font-medium">114</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Peak Hours</span>
                    <span className="font-medium">6AM - 9AM</span>
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="font-bold mb-4">Revenue Report</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">This Month</span>
                    <span className="font-medium">8.5M RWF</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Month</span>
                    <span className="font-medium">7.2M RWF</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Growth</span>
                    <span className="font-medium text-primary">+18%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-bold mb-4">Generate Reports</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Button variant="outline" className="justify-start gap-2">
                  <FileText className="h-4 w-4" />
                  Booking Report
                </Button>
                <Button variant="outline" className="justify-start gap-2">
                  <FileText className="h-4 w-4" />
                  Revenue Report
                </Button>
                <Button variant="outline" className="justify-start gap-2">
                  <FileText className="h-4 w-4" />
                  User Activity Report
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
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span>New company "Express Rwanda" registered</span>
                  <span className="ml-auto text-muted-foreground">2 hours ago</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span>Route "Kigali → Musanze" updated</span>
                  <span className="ml-auto text-muted-foreground">5 hours ago</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                  <Users className="h-4 w-4 text-primary" />
                  <span>50 new users registered today</span>
                  <span className="ml-auto text-muted-foreground">Today</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
