"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  X, CheckCircle, XCircle, AlertTriangle, Loader2, Search,
  MapPin, Calendar, Clock, User, Ticket as TicketIcon,
} from "lucide-react"
import { getBookingByTicketId, markBookingAsBoarded, type Booking } from "@/lib/bookings"
import { useAuth } from "@/contexts/AuthContext"
import { todayIso, toDate } from "@/lib/dates"

interface TicketValidatorProps {
  /**
   * The operator running this gate. A ticket sold by anyone else is refused,
   * so one company cannot inspect or board another company's passengers.
   * Admins pass nothing and may check any ticket.
   */
  companyName?: string | null
  onClose: () => void
}

type LookupState =
  | { status: "idle" }
  | { status: "searching" }
  | { status: "notFound"; ticketId: string }
  | { status: "error"; message: string }
  | { status: "found"; booking: Booking }

/** Why a ticket may or may not admit its holder, in priority order. */
type Verdict = "otherOperator" | "cancelled" | "unpaid" | "alreadyUsed" | "wrongDay" | "valid"

function verdictFor(booking: Booking, companyName?: string | null): Verdict {
  // Checked first: staff should be told it is not their passenger before
  // being shown anything about the trip.
  if (companyName && booking.busCompany !== companyName) return "otherOperator"
  if (booking.bookingStatus === "cancelled") return "cancelled"
  if (booking.paymentStatus !== "completed") return "unpaid"
  if (booking.bookingStatus === "used") return "alreadyUsed"
  if (booking.travelDate !== todayIso()) return "wrongDay"
  return "valid"
}

const VERDICTS: Record<Verdict, { tone: "good" | "warn" | "bad"; title: string; detail: string }> = {
  otherOperator: {
    tone: "bad",
    title: "Another operator's ticket",
    detail: "This ticket was sold by a different bus company. Do not admit.",
  },
  valid: {
    tone: "good",
    title: "Valid ticket",
    detail: "Paid and confirmed for today. Admit the passenger.",
  },
  wrongDay: {
    tone: "warn",
    title: "Wrong travel date",
    detail: "This ticket is paid and confirmed, but not for today's trip.",
  },
  alreadyUsed: {
    tone: "warn",
    title: "Already boarded",
    detail: "This ticket was scanned before. Do not admit twice.",
  },
  unpaid: {
    tone: "bad",
    title: "Payment not completed",
    detail: "Do not admit. The booking exists but was never paid for.",
  },
  cancelled: {
    tone: "bad",
    title: "Booking cancelled",
    detail: "Do not admit. This booking was cancelled.",
  },
}

const TONE_STYLES = {
  good: { ring: "bg-primary/20", icon: "text-primary", Icon: CheckCircle },
  warn: { ring: "bg-amber-500/20", icon: "text-amber-500", Icon: AlertTriangle },
  bad: { ring: "bg-destructive/20", icon: "text-destructive", Icon: XCircle },
} as const

export function TicketValidator({ companyName, onClose }: TicketValidatorProps) {
  const { user } = useAuth()
  const [ticketId, setTicketId] = useState("")
  const [lookup, setLookup] = useState<LookupState>({ status: "idle" })
  const [boarding, setBoarding] = useState(false)
  const [boardingError, setBoardingError] = useState("")

  const handleValidate = async () => {
    // A scanned QR gives "TRV-XXXXXXXX:1234"; typing the reference alone also works.
    const trimmed = ticketId.trim().toUpperCase().split(":")[0]
    if (!trimmed) return

    setBoardingError("")
    setLookup({ status: "searching" })

    const result = await getBookingByTicketId(trimmed)

    if (result.success && result.booking) {
      setLookup({ status: "found", booking: result.booking })
    } else if (result.error === "Ticket not found") {
      setLookup({ status: "notFound", ticketId: trimmed })
    } else {
      setLookup({ status: "error", message: result.error ?? "Lookup failed." })
    }
  }

  const handleBoard = async (booking: Booking) => {
    if (!booking.id || !user) return

    setBoarding(true)
    setBoardingError("")

    const result = await markBookingAsBoarded(booking.id, user.uid)

    setBoarding(false)

    if (result.success) {
      setLookup({
        status: "found",
        booking: { ...booking, bookingStatus: "used", boardedAt: result.boardedAt },
      })
    } else {
      setBoardingError(result.error ?? "Could not record boarding.")
    }
  }

  const reset = () => {
    setTicketId("")
    setLookup({ status: "idle" })
    setBoardingError("")
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-bold">Validate Ticket</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          {lookup.status === "idle" || lookup.status === "searching" ? (
            <>
              <div className="space-y-2">
                <label htmlFor="ticket-id" className="text-sm font-medium">
                  Ticket ID
                </label>
                <Input
                  id="ticket-id"
                  placeholder="TRV-ABC123"
                  value={ticketId}
                  onChange={(e) => setTicketId(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleValidate()}
                  autoFocus
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Type the reference from the passenger&apos;s ticket, or scan their QR code with
                  a barcode scanner and it will fill in here.
                </p>
              </div>

              <Button
                onClick={handleValidate}
                className="w-full gap-2"
                disabled={!ticketId.trim() || lookup.status === "searching"}
              >
                {lookup.status === "searching" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    Validate Ticket
                  </>
                )}
              </Button>
            </>
          ) : lookup.status === "notFound" || lookup.status === "error" ? (
            <>
              <div className="flex justify-center">
                <div className="h-24 w-24 rounded-full bg-destructive/20 flex items-center justify-center">
                  <XCircle className="h-12 w-12 text-destructive" />
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold mb-2">
                  {lookup.status === "notFound" ? "Ticket not found" : "Could not check ticket"}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {lookup.status === "notFound" ? (
                    <>
                      No booking exists with ID{" "}
                      <span className="font-mono text-foreground">{lookup.ticketId}</span>. Check the
                      ID and try again.
                    </>
                  ) : (
                    lookup.message
                  )}
                </p>
              </div>
              <Button onClick={reset} className="w-full">
                Check another ticket
              </Button>
            </>
          ) : (
            <ValidationResult
              booking={lookup.booking}
              companyName={companyName}
              boarding={boarding}
              boardingError={boardingError}
              onBoard={() => handleBoard(lookup.booking)}
              onReset={reset}
              onClose={onClose}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function ValidationResult({
  booking,
  companyName,
  boarding,
  boardingError,
  onBoard,
  onReset,
  onClose,
}: {
  booking: Booking
  companyName?: string | null
  boarding: boolean
  boardingError: string
  onBoard: () => void
  onReset: () => void
  onClose: () => void
}) {
  const verdict = verdictFor(booking, companyName)
  const { tone, title, detail } = VERDICTS[verdict]
  const { ring, icon, Icon } = TONE_STYLES[tone]
  const boardedAt = toDate(booking.boardedAt)

  // A ticket for another day is still genuine, so the gate can admit it as an
  // override — but never a cancelled, unpaid, or already-scanned one.
  const canBoard = verdict === "valid" || verdict === "wrongDay"

  return (
    <>
      <div className="flex justify-center">
        <div className={`h-24 w-24 rounded-full flex items-center justify-center ${ring}`}>
          <Icon className={`h-12 w-12 ${icon}`} />
        </div>
      </div>

      <div className="text-center">
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-muted-foreground text-sm">{detail}</p>
        {verdict === "wrongDay" && (
          <p className="text-sm mt-2">
            Booked for <span className="font-medium text-foreground">{booking.travelDate}</span>
          </p>
        )}
        {verdict === "alreadyUsed" && boardedAt && (
          <p className="text-sm mt-2">
            Boarded at{" "}
            <span className="font-medium text-foreground">
              {boardedAt.toLocaleString()}
            </span>
          </p>
        )}
      </div>

      <div className="space-y-3">
        <div className="bg-secondary/50 rounded-xl p-4">
          <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
            <User className="h-3 w-3" />
            Passenger
          </div>
          <div className="font-medium">{booking.passengerName}</div>
          {booking.passengerPhone && (
            <div className="text-sm text-muted-foreground">{booking.passengerPhone}</div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-secondary/50 rounded-xl p-4">
            <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
              <MapPin className="h-3 w-3" />
              Route
            </div>
            <div className="font-medium text-sm">
              {booking.route.from} → {booking.route.to}
            </div>
          </div>
          <div className="bg-secondary/50 rounded-xl p-4">
            <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
              <TicketIcon className="h-3 w-3" />
              Seats
            </div>
            <div className="font-medium">{booking.seats.join(", ")}</div>
          </div>
          <div className="bg-secondary/50 rounded-xl p-4">
            <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
              <Calendar className="h-3 w-3" />
              Travel date
            </div>
            <div className="font-medium text-sm">{booking.travelDate}</div>
          </div>
          <div className="bg-secondary/50 rounded-xl p-4">
            <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
              <Clock className="h-3 w-3" />
              Departure
            </div>
            <div className="font-medium text-sm">{booking.route.departureTime}</div>
          </div>
        </div>

        <div className="bg-secondary/50 rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-sm text-muted-foreground mb-1">Bus company</div>
            <div className="font-medium">{booking.busCompany}</div>
          </div>
          <Badge className="bg-primary/20 text-primary hover:bg-primary/20 font-mono">
            {booking.ticketId}
          </Badge>
        </div>
      </div>

      {boardingError && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
          <p className="text-sm text-destructive">{boardingError}</p>
        </div>
      )}

      {canBoard && (
        <Button onClick={onBoard} className="w-full gap-2" disabled={boarding}>
          {boarding ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Recording...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4" />
              {verdict === "wrongDay" ? "Board anyway (override)" : "Confirm boarding"}
            </>
          )}
        </Button>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={onReset} className="flex-1">
          Check another
        </Button>
        <Button variant={canBoard ? "outline" : "default"} onClick={onClose} className="flex-1">
          Done
        </Button>
      </div>
    </>
  )
}
