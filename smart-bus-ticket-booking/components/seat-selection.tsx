"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, Check, User } from "lucide-react"

interface Seat {
  id: string
  row: number
  position: "A" | "B" | "C" | "D"
  isAvailable: boolean
  isSelected: boolean
}

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

interface SeatSelectionProps {
  bus: Bus
  onClose: () => void
  onConfirm: (selectedSeats: string[]) => void
}

export function SeatSelection({ bus, onClose, onConfirm }: SeatSelectionProps) {
  const rows = Math.ceil(bus.totalSeats / 4)
  
  // Generate initial seats
  const generateSeats = (): Seat[] => {
    const seats: Seat[] = []
    const unavailableSeats = new Set<string>()
    
    // Randomly mark some seats as unavailable
    const takenCount = bus.totalSeats - bus.availableSeats
    while (unavailableSeats.size < takenCount) {
      const randomRow = Math.floor(Math.random() * rows) + 1
      const randomPos = ["A", "B", "C", "D"][Math.floor(Math.random() * 4)] as "A" | "B" | "C" | "D"
      unavailableSeats.add(`${randomRow}${randomPos}`)
    }

    for (let row = 1; row <= rows; row++) {
      for (const position of ["A", "B", "C", "D"] as const) {
        const id = `${row}${position}`
        seats.push({
          id,
          row,
          position,
          isAvailable: !unavailableSeats.has(id),
          isSelected: false,
        })
      }
    }
    return seats
  }

  const [seats, setSeats] = useState<Seat[]>(generateSeats)
  const selectedSeats = seats.filter((s) => s.isSelected)
  const totalPrice = selectedSeats.length * bus.price

  const toggleSeat = (seatId: string) => {
    setSeats((prev) =>
      prev.map((seat) =>
        seat.id === seatId && seat.isAvailable
          ? { ...seat, isSelected: !seat.isSelected }
          : seat
      )
    )
  }

  const handleConfirm = () => {
    onConfirm(selectedSeats.map((s) => s.id))
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-bold">Select Your Seats</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {bus.company} • {bus.from} → {bus.to}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Legend */}
          <div className="flex items-center justify-center gap-6 mb-8">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-secondary border border-border" />
              <span className="text-sm text-muted-foreground">Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <Check className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-sm text-muted-foreground">Selected</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                <User className="h-4 w-4 text-muted-foreground" />
              </div>
              <span className="text-sm text-muted-foreground">Taken</span>
            </div>
          </div>

          {/* Bus Layout */}
          <div className="flex flex-col items-center gap-2">
            {/* Driver */}
            <div className="w-full max-w-[280px] flex justify-end mb-4 pr-2">
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                <span className="text-xs text-muted-foreground">Driver</span>
              </div>
            </div>

            {/* Seats Grid */}
            <div className="space-y-2">
              {Array.from({ length: rows }).map((_, rowIndex) => {
                const rowNum = rowIndex + 1
                const rowSeats = seats.filter((s) => s.row === rowNum)
                const leftSeats = rowSeats.filter((s) => s.position === "A" || s.position === "B")
                const rightSeats = rowSeats.filter((s) => s.position === "C" || s.position === "D")

                return (
                  <div key={rowNum} className="flex items-center gap-8">
                    {/* Left side */}
                    <div className="flex gap-2">
                      {leftSeats.map((seat) => (
                        <button
                          key={seat.id}
                          onClick={() => toggleSeat(seat.id)}
                          disabled={!seat.isAvailable}
                          className={`h-10 w-10 rounded-lg flex items-center justify-center text-xs font-medium transition-all ${
                            seat.isSelected
                              ? "bg-primary text-primary-foreground"
                              : seat.isAvailable
                              ? "bg-secondary border border-border hover:border-primary cursor-pointer"
                              : "bg-muted cursor-not-allowed"
                          }`}
                        >
                          {seat.isSelected ? (
                            <Check className="h-4 w-4" />
                          ) : seat.isAvailable ? (
                            seat.id
                          ) : (
                            <User className="h-4 w-4 text-muted-foreground" />
                          )}
                        </button>
                      ))}
                    </div>

                    {/* Aisle */}
                    <div className="w-8 flex items-center justify-center">
                      <span className="text-xs text-muted-foreground">{rowNum}</span>
                    </div>

                    {/* Right side */}
                    <div className="flex gap-2">
                      {rightSeats.map((seat) => (
                        <button
                          key={seat.id}
                          onClick={() => toggleSeat(seat.id)}
                          disabled={!seat.isAvailable}
                          className={`h-10 w-10 rounded-lg flex items-center justify-center text-xs font-medium transition-all ${
                            seat.isSelected
                              ? "bg-primary text-primary-foreground"
                              : seat.isAvailable
                              ? "bg-secondary border border-border hover:border-primary cursor-pointer"
                              : "bg-muted cursor-not-allowed"
                          }`}
                        >
                          {seat.isSelected ? (
                            <Check className="h-4 w-4" />
                          ) : seat.isAvailable ? (
                            seat.id
                          ) : (
                            <User className="h-4 w-4 text-muted-foreground" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border bg-secondary/30">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm text-muted-foreground">Selected Seats</div>
              <div className="flex items-center gap-2 mt-1">
                {selectedSeats.length > 0 ? (
                  selectedSeats.map((seat) => (
                    <Badge key={seat.id} variant="secondary">
                      {seat.id}
                    </Badge>
                  ))
                ) : (
                  <span className="text-muted-foreground text-sm">No seats selected</span>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Total Price</div>
              <div className="text-2xl font-bold text-primary">
                {totalPrice.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">RWF</span>
              </div>
            </div>
          </div>
          <Button
            onClick={handleConfirm}
            className="w-full"
            size="lg"
            disabled={selectedSeats.length === 0}
          >
            Proceed to Payment
          </Button>
        </div>
      </div>
    </div>
  )
}
