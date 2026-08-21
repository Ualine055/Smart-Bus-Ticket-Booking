"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  X, Ticket, MapPin, Calendar, Clock, Loader2, RefreshCw,
  CheckCircle, XCircle, AlertTriangle, Search,
} from "lucide-react"
import { findTicket, getTicketState, type Booking, type TicketState } from "@/lib/bookings"
import { RescheduleModal } from "@/components/reschedule-modal"

interface MyTicketsModalProps {
  onClose: () => void
}

const STATE_STYLES: Record<
  TicketState,
  { label: string; detail: string; badge: string; Icon: typeof CheckCircle; tone: string }
> = {
  valid: {
    label: "Valid",
    detail: "This ticket has not been used yet and can still be scanned at the gate.",
    badge: "bg-primary/20 text-primary hover:bg-primary/20",
    Icon: CheckCircle,
    tone: "text-primary",
  },
  used: {
    label: "Used",
    detail: "This ticket was scanned and the passenger has boarded.",
    badge: "bg-primary/20 text-primary hover:bg-primary/20",
    Icon: CheckCircle,
    tone: "text-primary",
  },
  expired: {
    label: "Expired",
    detail: "The departure time has passed and this ticket was never used.",
    badge: "bg-amber-500/20 text-amber-500 hover:bg-amber-500/20",
    Icon: AlertTriangle,
    tone: "text-amber-500",
  },
  cancelled: {
    label: "Cancelled",
    detail: "This booking was cancelled and cannot be used.",
    badge: "bg-destructive/20 text-destructive hover:bg-destructive/20",
    Icon: XCircle,
    tone: "text-destructive",
  },
}

export function MyTicketsModal({ onClose }: MyTicketsModalProps) {
  const [ticketId, setTicketId] = useState("")
  const [pin, setPin] = useState("")
  const [ticket, setTicket] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [rescheduling, setRescheduling] = useState(false)

  const handleFind = async () => {
    if (!ticketId.trim() || !pin.trim()) return

    setLoading(true)
    setError("")

    const result = await findTicket(ticketId, pin)

    setLoading(false)

    if (result.success && result.booking) {
      setTicket(result.booking)
      return
    }

    // Both failures give the same message so the form cannot be used to test
    // which ticket references exist.
    setError(
      result.error === "notFound" || result.error === "wrongPin"
        ? "No ticket matches that ID and PIN. Check both and try again."
        : "Could not look up your ticket. Please try again.",
    )
  }

  const reset = () => {
    setTicket(null)
    setTicketId("")
    setPin("")
    setError("")
  }

  const state = ticket ? getTicketState(ticket) : null
  const style = state ? STATE_STYLES[state] : null

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-bold">My Tickets</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {!ticket ? (
            <div className="max-w-md mx-auto space-y-5 py-4">
              <div className="text-center">
                <Ticket className="h-12 w-12 mx-auto text-primary mb-3" />
                <h3 className="text-lg font-medium mb-1">Find your ticket</h3>
                <p className="text-sm text-muted-foreground">
                  Enter the ticket ID and PIN from the ticket you received after paying.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lookup-id">Ticket ID</Label>
                <Input
                  id="lookup-id"
                  placeholder="TRV-XXXXXXXX"
                  value={ticketId}
                  onChange={(e) => {
                    setTicketId(e.target.value)
                    if (error) setError("")
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleFind()}
                  className="font-mono"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lookup-pin">PIN</Label>
                <Input
                  id="lookup-pin"
                  placeholder="0000"
                  inputMode="numeric"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value)
                    if (error) setError("")
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleFind()}
                  className="font-mono tracking-widest"
                />
              </div>

              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <Button
                onClick={handleFind}
                className="w-full gap-2"
                disabled={loading || !ticketId.trim() || !pin.trim()}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    Find my ticket
                  </>
                )}
              </Button>
            </div>
          ) : (
            style &&
            state && (
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 rounded-xl bg-secondary/50">
                  <style.Icon className={`h-6 w-6 shrink-0 ${style.tone}`} />
                  <div>
                    <div className="font-medium">{style.label}</div>
                    <p className="text-sm text-muted-foreground">{style.detail}</p>
                  </div>
                </div>

                <div className="border border-border rounded-xl p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-medium text-sm text-muted-foreground">
                        Ticket #{ticket.ticketId}
                      </div>
                      <div className="text-lg font-bold mt-1">{ticket.busCompany}</div>
                      <div className="text-sm text-muted-foreground">{ticket.passengerName}</div>
                    </div>
                    <Badge className={style.badge}>{state}</Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <div className="flex items-center gap-1 text-muted-foreground text-sm mb-1">
                        <MapPin className="h-3 w-3" />
                        Route
                      </div>
                      <div className="font-medium">
                        {ticket.route.from} → {ticket.route.to}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-1 text-muted-foreground text-sm mb-1">
                        <Calendar className="h-3 w-3" />
                        Date
                      </div>
                      <div className="font-medium">{ticket.travelDate}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span>{ticket.route.departureTime}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Ticket className="h-3 w-3 text-muted-foreground" />
                        <span>Seats: {ticket.seats.join(", ")}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-semibold text-primary">
                        {ticket.totalPrice.toLocaleString()} RWF
                      </div>
                      {state === "valid" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 gap-1.5 text-xs"
                          onClick={() => setRescheduling(true)}
                        >
                          <RefreshCw className="h-3 w-3" />
                          Reschedule
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                <Button variant="outline" onClick={reset} className="w-full">
                  Look up another ticket
                </Button>
              </div>
            )
          )}
        </div>

        <div className="p-6 border-t border-border">
          <Button onClick={onClose} variant="outline" className="w-full">
            Close
          </Button>
        </div>
      </div>

      {rescheduling && ticket && (
        <RescheduleModal
          booking={ticket}
          onClose={() => setRescheduling(false)}
          onSuccess={(updated) => {
            setTicket(updated)
            setRescheduling(false)
          }}
        />
      )}
    </div>
  )
}
