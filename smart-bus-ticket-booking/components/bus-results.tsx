"use client"

import React from "react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, MapPin, Users, Wifi, Zap, Wind, ChevronDown, ChevronRight } from "lucide-react"

interface Bus {
  id: string
  company: string
  departureTime: string
  arrivalTime: string
  duration: string
  from: string
  to: string
  price: number
  availableSeats: number
  totalSeats: number
  amenities: string[]
  busType: string
}

interface BusResultsProps {
  buses: Bus[]
  onSelectBus: (bus: Bus) => void
}

const amenityIcons: Record<string, React.ReactNode> = {
  wifi: <Wifi className="h-3.5 w-3.5" />,
  ac: <Wind className="h-3.5 w-3.5" />,
  charging: <Zap className="h-3.5 w-3.5" />,
}

export function BusResults({ buses, onSelectBus }: BusResultsProps) {
  const [expandedCompany, setExpandedCompany] = useState<string | null>(null)

  if (buses.length === 0) {
    return null
  }

  const groupedByCompany = buses.reduce<Record<string, Bus[]>>((groups, bus) => {
    if (!groups[bus.company]) {
      groups[bus.company] = []
    }
    groups[bus.company].push(bus)
    return groups
  }, {})

  const companyEntries = Object.entries(groupedByCompany)
    .map(([company, companyBuses]) => ({
      company,
      buses: [...companyBuses].sort((a, b) => a.departureTime.localeCompare(b.departureTime)),
    }))
    .sort((a, b) => a.company.localeCompare(b.company))

  return (
    <section id="bus-results" className="py-12">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold">Available Buses</h2>
            <p className="text-muted-foreground mt-1">{buses.length} schedule slots found across {companyEntries.length} bus lines</p>
          </div>
        </div>

        <div className="space-y-4">
          {companyEntries.map(({ company, buses: companyBuses }) => {
            const sampleBus = companyBuses[0]
            const isExpanded = expandedCompany === company

            return (
              <div key={company} className="bg-card border border-border rounded-xl p-6">
                <button
                  className="w-full flex items-center justify-between gap-4 text-left"
                  onClick={() => setExpandedCompany((prev) => (prev === company ? null : company))}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg bg-secondary flex items-center justify-center">
                      <span className="font-bold text-primary">{company.charAt(0)}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold">{company}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className="text-xs border-border bg-secondary text-secondary-foreground">
                          {sampleBus.busType}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{companyBuses.length} departures today</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">
                      {sampleBus.from} to {sampleBus.to}
                    </span>
                    {isExpanded ? <ChevronDown className="h-5 w-5 text-muted-foreground" /> : <ChevronRight className="h-5 w-5 text-muted-foreground" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="mt-5 pt-5 border-t border-border space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {sampleBus.amenities.map((amenity) => (
                        <div
                          key={amenity}
                          className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary px-2 py-1 rounded"
                        >
                          {amenityIcons[amenity]}
                          <span className="capitalize">{amenity}</span>
                        </div>
                      ))}
                    </div>

                    {companyBuses.map((bus) => (
                      <div
                        key={bus.id}
                        className="border border-border rounded-lg p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-4">
                            <div className="text-center">
                              <div className="text-xl font-bold">{bus.departureTime}</div>
                              <div className="text-sm text-muted-foreground flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {bus.from}
                              </div>
                            </div>

                            <div className="flex-1 flex items-center gap-2 px-2">
                              <div className="h-2 w-2 rounded-full bg-primary" />
                              <div className="flex-1 h-px bg-border relative">
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2">
                                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {bus.duration}
                                  </span>
                                </div>
                              </div>
                              <div className="h-2 w-2 rounded-full bg-primary" />
                            </div>

                            <div className="text-center">
                              <div className="text-xl font-bold">{bus.arrivalTime}</div>
                              <div className="text-sm text-muted-foreground flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {bus.to}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between lg:justify-end gap-4">
                          <div className="text-right">
                            <div className="text-xl font-bold text-primary">
                              {bus.price.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">RWF</span>
                            </div>
                            <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1 justify-end">
                              <Users className="h-3.5 w-3.5" />
                              {bus.availableSeats} seats left
                            </div>
                          </div>
                          <Button onClick={() => onSelectBus(bus)} disabled={bus.availableSeats === 0}>
                            Select Seats
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
