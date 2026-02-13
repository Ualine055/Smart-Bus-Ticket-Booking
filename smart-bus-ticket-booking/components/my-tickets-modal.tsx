"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, Ticket, MapPin, Calendar, Clock } from "lucide-react"

interface MyTicketsModalProps {
  onClose: () => void
}

export function MyTicketsModal({ onClose }: MyTicketsModalProps) {
  // Mock tickets data - in real app, fetch from database
  const tickets = [
    {
      id: "TRV-ABC123",
      from: "Kigali",
      to: "Musanze",
      date: "Mon, 15 Jan 2024",
      time: "06:00",
      company: "Volcano Express",
      seats: ["A1", "A2"],
      status: "confirmed",
    },
  ]

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-2xl overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-bold">My Tickets</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6">
          {tickets.length === 0 ? (
            <div className="text-center py-12">
              <Ticket className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No tickets yet</h3>
              <p className="text-muted-foreground">Book your first bus ticket to see it here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tickets.map((ticket) => (
                <div key={ticket.id} className="border border-border rounded-xl p-4 hover:bg-secondary/50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-medium text-sm text-muted-foreground">Ticket #{ticket.id}</div>
                      <div className="text-lg font-bold mt-1">{ticket.company}</div>
                    </div>
                    <Badge className="bg-primary/20 text-primary hover:bg-primary/20">
                      {ticket.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <div className="flex items-center gap-1 text-muted-foreground text-sm mb-1">
                        <MapPin className="h-3 w-3" />
                        Route
                      </div>
                      <div className="font-medium">{ticket.from} → {ticket.to}</div>
                    </div>
                    <div>
                      <div className="flex items-center gap-1 text-muted-foreground text-sm mb-1">
                        <Calendar className="h-3 w-3" />
                        Date
                      </div>
                      <div className="font-medium">{ticket.date}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span>{ticket.time}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Ticket className="h-3 w-3 text-muted-foreground" />
                        <span>Seats: {ticket.seats.join(", ")}</span>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">View Details</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-border">
          <Button onClick={onClose} variant="outline" className="w-full">
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
