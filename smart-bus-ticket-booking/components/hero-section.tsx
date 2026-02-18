"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MapPin, Calendar, ArrowRight, Search, Users } from "lucide-react"

interface HeroSectionProps {
  onSearch: (from: string, to: string, date: string, passengers: number) => void
  isLoggedIn: boolean
  onAuthRequired: () => void
}

export function HeroSection({ onSearch, isLoggedIn, onAuthRequired }: HeroSectionProps) {
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [date, setDate] = useState("")
  const [passengers, setPassengers] = useState(1)

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0]

  const handleSearch = () => {
    if (!isLoggedIn) {
      onAuthRequired()
      return
    }
    
    // Validate date is not in the past
    if (date && date < today) {
      alert("Please select a date from today onwards")
      return
    }
    
    onSearch(from, to, date, passengers)
  }

  return (
    <section id="search-section" className="relative py-20 md:py-32 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(59,130,246,0.05),transparent_50%)]" />
      </div>

      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            Rwanda's Digital Transport Solution
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 text-balance">
            Book your bus ticket{" "}
            <span className="text-primary">anytime, anywhere</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
            Skip the queues. Search buses, select your seat, pay online, and receive digital tickets with QR codes instantly.
          </p>
        </div>

        {/* Search Form */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-xl shadow-black/20">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <div className="space-y-2">
                <Label htmlFor="from" className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  From
                </Label>
                <Input
                  id="from"
                  placeholder="Kigali"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="bg-secondary border-border h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="to" className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  To
                </Label>
                <Input
                  id="to"
                  placeholder="Musanze"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="bg-secondary border-border h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date" className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  Date
                </Label>
                <Input
                  id="date"
                  type="date"
                  min={today}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="bg-secondary border-border h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="passengers" className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  Passengers
                </Label>
                <Input
                  id="passengers"
                  type="number"
                  min={1}
                  max={10}
                  value={passengers}
                  onChange={(e) => setPassengers(Number(e.target.value))}
                  className="bg-secondary border-border h-12"
                />
              </div>
            </div>

            <Button
              onClick={handleSearch}
              size="lg"
              className="w-full mt-6 h-14 text-base font-semibold gap-2"
            >
              <Search className="h-5 w-5" />
              Find Available Buses
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="max-w-4xl mx-auto mt-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: "50K+", label: "Happy Passengers" },
              { value: "100+", label: "Routes Available" },
              { value: "24/7", label: "Customer Support" },
              { value: "98%", label: "On-time Arrivals" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-primary">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
