"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, Check, User, Loader2, AlertTriangle } from "lucide-react"
import { getTakenSeats } from "@/lib/bookings"
import { useLanguage, format } from "@/contexts/LanguageContext"

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
  /** Travel date (YYYY-MM-DD); seats are only taken for the date being booked. */
  travelDate: string
  /** Cap on how many seats may be chosen, from the passenger count in the search. */
  maxSeats?: number
  /** Message shown above the map, e.g. when a seat was taken during payment. */
  notice?: string
  onClose: () => void
  onConfirm: (selectedSeats: string[]) => void
}

/**
 * Seat ids for a bus, laid out four to a row (A/B | aisle | C/D). The last row
 * is trimmed so a 45-seat bus shows 45 seats rather than rounding up to 48.
 */
function buildSeatIds(totalSeats: number) {
  const ids: { id: string; row: number; position: "A" | "B" | "C" | "D" }[] = []
  const rows = Math.ceil(totalSeats / 4)

  for (let row = 1; row <= rows; row++) {
    for (const position of ["A", "B", "C", "D"] as const) {
      if (ids.length >= totalSeats) break
      ids.push({ id: `${row}${position}`, row, position })
    }
  }

  return ids
}

export function SeatSelection({
  bus,
  travelDate,
  maxSeats,
  notice,
  onClose,
  onConfirm,
}: SeatSelectionProps) {
  const { t } = useLanguage()
  const [takenSeats, setTakenSeats] = useState<string[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")

  // Which seats are already sold, read from bookings rather than invented.
  // The modal is mounted per bus, so this runs once; `active` guards against a
  // response arriving after the passenger has closed it.
  useEffect(() => {
    let active = true

    getTakenSeats(bus.id, travelDate).then((result) => {
      if (!active) return
      if (!result.success) {
        setLoadError(t.seatCheckFailed)
      }
      setTakenSeats(result.seats)
      setLoading(false)
    })

    return () => {
      active = false
    }
  }, [bus.id, travelDate, t.seatCheckFailed])

  const seats: Seat[] = useMemo(
    () =>
      buildSeatIds(bus.totalSeats).map((seat) => ({
        ...seat,
        isAvailable: !takenSeats.includes(seat.id),
        isSelected: selected.includes(seat.id),
      })),
    [bus.totalSeats, takenSeats, selected],
  )

  const rows = Math.ceil(bus.totalSeats / 4)
  const selectedSeats = seats.filter((s) => s.isSelected)
  const totalPrice = selectedSeats.length * bus.price
  const availableCount = seats.filter((s) => s.isAvailable).length
  const limitReached = maxSeats !== undefined && selected.length >= maxSeats

  const toggleSeat = (seatId: string) => {
    setSelected((prev) => {
      if (prev.includes(seatId)) return prev.filter((id) => id !== seatId)
      if (maxSeats !== undefined && prev.length >= maxSeats) return prev
      return [...prev, seatId]
    })
  }

  const handleConfirm = () => {
    onConfirm(selected)
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-bold">{t.selectYourSeats}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {bus.company} • {bus.from} → {bus.to}
            </p>
            {!loading && (
              <p className="text-sm text-muted-foreground">
                {format(t.seatsAvailableOf, {
                  available: availableCount,
                  total: bus.totalSeats,
                })}
                {maxSeats !== undefined && ` • ${format(t.chooseUpTo, { max: maxSeats })}`}
              </p>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">{t.checkingSeats}</p>
          </div>
        ) : (
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {notice && (
            <div className="mb-6 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">{notice}</p>
            </div>
          )}

          {loadError && (
            <div className="mb-6 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-500">{loadError}</p>
            </div>
          )}

          {availableCount === 0 && (
            <div className="mb-6 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">
                {format(t.fullyBooked, { date: travelDate })}
              </p>
            </div>
          )}

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 mb-8">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-secondary border border-border" />
              <span className="text-sm text-muted-foreground">{t.seatAvailable}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <Check className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-sm text-muted-foreground">{t.seatSelected}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                <User className="h-4 w-4 text-muted-foreground" />
              </div>
              <span className="text-sm text-muted-foreground">{t.seatTaken}</span>
            </div>
          </div>

          {/* Bus Layout */}
          <div className="flex flex-col items-center gap-2">
            {/* Driver */}
            <div className="w-full max-w-[280px] flex justify-end mb-4 pr-2">
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                <span className="text-xs text-muted-foreground">{t.driver}</span>
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
        )}

        {/* Footer */}
        <div className="p-6 border-t border-border bg-secondary/30">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm text-muted-foreground">{t.selectedSeats}</div>
              <div className="flex items-center gap-2 mt-1">
                {selectedSeats.length > 0 ? (
                  selectedSeats.map((seat) => (
                    <Badge key={seat.id} className="bg-secondary text-secondary-foreground border-border">
                      {seat.id}
                    </Badge>
                  ))
                ) : (
                  <span className="text-muted-foreground text-sm">{t.noSeatsSelected}</span>
                )}
              </div>
              {limitReached && (
                <p className="text-xs text-muted-foreground mt-1">
                  {format(t.seatLimitReached, { max: maxSeats })}
                </p>
              )}
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">{t.totalPrice}</div>
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
            {t.proceedToPayment}
          </Button>
        </div>
      </div>
    </div>
  )
}
