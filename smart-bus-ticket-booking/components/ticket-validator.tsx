"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { X, CheckCircle, XCircle, Scan } from "lucide-react"

interface TicketValidatorProps {
  onClose: () => void
}

export function TicketValidator({ onClose }: TicketValidatorProps) {
  const [ticketId, setTicketId] = useState("")
  const [validationResult, setValidationResult] = useState<{
    valid: boolean
    ticket?: {
      id: string
      passenger: string
      route: string
      date: string
      seats: string[]
      bus: string
    }
  } | null>(null)

  const handleValidate = () => {
    // Mock validation - in real app, check against database
    if (ticketId.startsWith("TRV-")) {
      setValidationResult({
        valid: true,
        ticket: {
          id: ticketId,
          passenger: "John Doe",
          route: "Kigali → Musanze",
          date: "Mon, 15 Jan 2024",
          seats: ["A1", "A2"],
          bus: "Volcano Express",
        },
      })
    } else {
      setValidationResult({ valid: false })
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-bold">Validate Ticket</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {!validationResult ? (
            <>
              <div className="flex justify-center">
                <div className="h-32 w-32 rounded-xl bg-secondary flex items-center justify-center">
                  <Scan className="h-16 w-16 text-muted-foreground" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Ticket ID or QR Code</label>
                <Input
                  placeholder="Enter ticket ID (e.g., TRV-ABC123)"
                  value={ticketId}
                  onChange={(e) => setTicketId(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleValidate()}
                />
              </div>

              <Button onClick={handleValidate} className="w-full" disabled={!ticketId}>
                Validate Ticket
              </Button>

              <div className="text-center">
                <Button variant="outline" className="gap-2">
                  <Scan className="h-4 w-4" />
                  Scan QR Code
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-center">
                {validationResult.valid ? (
                  <div className="h-24 w-24 rounded-full bg-primary/20 flex items-center justify-center">
                    <CheckCircle className="h-12 w-12 text-primary" />
                  </div>
                ) : (
                  <div className="h-24 w-24 rounded-full bg-destructive/20 flex items-center justify-center">
                    <XCircle className="h-12 w-12 text-destructive" />
                  </div>
                )}
              </div>

              <div className="text-center">
                <h3 className="text-xl font-bold mb-2">
                  {validationResult.valid ? "Valid Ticket" : "Invalid Ticket"}
                </h3>
                <p className="text-muted-foreground">
                  {validationResult.valid
                    ? "This ticket is confirmed and ready for boarding"
                    : "This ticket could not be verified"}
                </p>
              </div>

              {validationResult.valid && validationResult.ticket && (
                <div className="space-y-3">
                  <div className="bg-secondary/50 rounded-xl p-4">
                    <div className="text-sm text-muted-foreground mb-1">Passenger</div>
                    <div className="font-medium">{validationResult.ticket.passenger}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-secondary/50 rounded-xl p-4">
                      <div className="text-sm text-muted-foreground mb-1">Route</div>
                      <div className="font-medium text-sm">{validationResult.ticket.route}</div>
                    </div>
                    <div className="bg-secondary/50 rounded-xl p-4">
                      <div className="text-sm text-muted-foreground mb-1">Seats</div>
                      <div className="font-medium">{validationResult.ticket.seats.join(", ")}</div>
                    </div>
                  </div>

                  <div className="bg-secondary/50 rounded-xl p-4">
                    <div className="text-sm text-muted-foreground mb-1">Bus Company</div>
                    <div className="font-medium">{validationResult.ticket.bus}</div>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setValidationResult(null)} className="flex-1">
                  Scan Another
                </Button>
                <Button onClick={onClose} className="flex-1">
                  Done
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
