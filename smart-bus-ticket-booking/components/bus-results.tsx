"use client"

import React from "react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, MapPin, Users, Wifi, Zap, Wind } from "lucide-react"

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
  if (buses.length === 0) {
    return null
  }

  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold">Available Buses</h2>
            <p className="text-muted-foreground mt-1">{buses.length} buses found</p>
          </div>
        </div>

        <div className="space-y-4">
          {buses.map((bus) => (
            <div
              key={bus.id}
              className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-colors"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                {/* Bus Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-12 w-12 rounded-lg bg-secondary flex items-center justify-center">
                      <span className="font-bold text-primary">{bus.company.charAt(0)}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold">{bus.company}</h3>
                      <Badge variant="secondary" className="text-xs mt-1">
                        {bus.busType}
                      </Badge>
                    </div>
                  </div>

                  {/* Route & Time */}
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{bus.departureTime}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {bus.from}
                      </div>
                    </div>

                    <div className="flex-1 flex items-center gap-2 px-4">
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
                      <div className="text-2xl font-bold">{bus.arrivalTime}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {bus.to}
                      </div>
                    </div>
                  </div>

                  {/* Amenities */}
                  <div className="flex items-center gap-3 mt-4">
                    {bus.amenities.map((amenity) => (
                      <div
                        key={amenity}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary px-2 py-1 rounded"
                      >
                        {amenityIcons[amenity]}
                        <span className="capitalize">{amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Price & Book */}
                <div className="flex lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-4 lg:gap-2 lg:text-right border-t lg:border-t-0 lg:border-l border-border pt-4 lg:pt-0 lg:pl-6">
                  <div>
                    <div className="text-3xl font-bold text-primary">
                      {bus.price.toLocaleString()} <span className="text-base font-normal text-muted-foreground">RWF</span>
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <Users className="h-3.5 w-3.5" />
                      {bus.availableSeats} seats left
                    </div>
                  </div>
                  <Button
                    onClick={() => onSelectBus(bus)}
                    className="min-w-[140px]"
                    disabled={bus.availableSeats === 0}
                  >
                    Select Seats
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
