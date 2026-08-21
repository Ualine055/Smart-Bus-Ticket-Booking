"use client"

import { useEffect, useState } from "react"
import QRCode from "qrcode"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, Download, Share2, MapPin, Clock, Calendar, User, QrCode, Bus, ArrowRight } from "lucide-react"

interface TicketViewProps {
  bus: {
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
  selectedSeats: string[]
  ticketId: string
  /** Shown beside the reference; both are needed to reopen the ticket later. */
  pin?: string
  passengerName: string
  bookingDate: string
  onClose: () => void
  onDownload?: () => void
  onShare?: () => void
}

/**
 * A real, scannable QR code holding the ticket reference and PIN.
 *
 * Encoded as `TRV-XXXXXXXX:1234` so gate staff scanning with any phone camera
 * read back the exact reference to type into the validator. Rendered on a white
 * background regardless of theme, because scanners need the light/dark contrast
 * the QR standard assumes.
 */
const QRCodePattern = ({ value }: { value: string }) => {
  const [dataUrl, setDataUrl] = useState("")
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let active = true

    QRCode.toDataURL(value, { width: 256, margin: 1 })
      .then((url) => {
        if (active) setDataUrl(url)
      })
      .catch(() => {
        if (active) setFailed(true)
      })

    return () => {
      active = false
    }
  }, [value])

  if (failed) {
    return (
      <div className="h-32 w-32 rounded-lg bg-secondary flex items-center justify-center p-2">
        <span className="text-xs text-muted-foreground text-center">
          QR unavailable - use the ticket ID
        </span>
      </div>
    )
  }

  return (
    <div className="h-32 w-32 bg-white p-2 rounded-lg flex items-center justify-center">
      {dataUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={dataUrl} alt={`QR code for ticket ${value}`} className="h-full w-full" />
      )}
    </div>
  )
}

export function TicketView({ bus, selectedSeats, ticketId, pin, passengerName, bookingDate, onClose, onDownload, onShare }: TicketViewProps) {
  const totalPrice = selectedSeats.length * bus.price

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border bg-primary/5">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
              <Bus className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-bold">BUS CONNECT</h2>
              <p className="text-sm text-muted-foreground">Digital Bus Ticket</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6">
          {/* Ticket Status */}
          <div className="flex items-center justify-between mb-6">
            <Badge className="bg-primary/20 text-primary hover:bg-primary/20 px-3 py-1">
              Confirmed
            </Badge>
            <span className="text-sm text-muted-foreground">Ticket #{ticketId}</span>
          </div>

          {/* Route Info */}
          <div className="flex items-center justify-between mb-8">
            <div className="text-center">
              <div className="text-3xl font-bold">{bus.departureTime}</div>
              <div className="flex items-center gap-1 text-muted-foreground mt-1">
                <MapPin className="h-4 w-4" />
                <span>{bus.from}</span>
              </div>
            </div>

            <div className="flex-1 flex flex-col items-center px-4">
              <div className="flex items-center gap-2 w-full">
                <div className="h-3 w-3 rounded-full border-2 border-primary" />
                <div className="flex-1 h-0.5 bg-border relative">
                  <ArrowRight className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-5 w-5 text-primary bg-card" />
                </div>
                <div className="h-3 w-3 rounded-full bg-primary" />
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
                <Clock className="h-3 w-3" />
                {bus.duration}
              </div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold">{bus.arrivalTime}</div>
              <div className="flex items-center gap-1 text-muted-foreground mt-1">
                <MapPin className="h-4 w-4" />
                <span>{bus.to}</span>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-secondary/50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <User className="h-4 w-4" />
                Passenger
              </div>
              <div className="font-medium">{passengerName}</div>
            </div>
            <div className="bg-secondary/50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <Calendar className="h-4 w-4" />
                Travel Date
              </div>
              <div className="font-medium">{bookingDate}</div>
            </div>
            <div className="bg-secondary/50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <Bus className="h-4 w-4" />
                Bus Company
              </div>
              <div className="font-medium">{bus.company}</div>
            </div>
            <div className="bg-secondary/50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <QrCode className="h-4 w-4" />
                Seat(s)
              </div>
              <div className="font-medium">{selectedSeats.join(", ")}</div>
            </div>
          </div>

          {/* Ticket reference - the passenger has no account, so this is their key */}
          {pin && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Ticket ID</div>
                  <div className="font-mono font-bold text-lg">{ticketId}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground mb-1">PIN</div>
                  <div className="font-mono font-bold text-lg tracking-widest">{pin}</div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Save or share this ticket now. You need the ID and PIN to open it again under
                My Tickets.
              </p>
            </div>
          )}

          {/* QR Code */}
          <div className="flex flex-col items-center py-6 border-t border-dashed border-border">
            <QRCodePattern value={pin ? `${ticketId}:${pin}` : ticketId} />
            <p className="text-sm text-muted-foreground mt-4 text-center">
              Show this QR code at the station
            </p>
          </div>

          {/* Price */}
          <div className="flex items-center justify-between py-4 border-t border-border">
            <span className="text-muted-foreground">Total Paid</span>
            <span className="text-2xl font-bold text-primary">
              {totalPrice.toLocaleString()} RWF
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-border bg-secondary/30 flex gap-3">
          <Button variant="outline" className="flex-1 gap-2 bg-transparent" onClick={onDownload}>
            <Download className="h-4 w-4" />
            Download
          </Button>
          <Button variant="outline" className="flex-1 gap-2 bg-transparent" onClick={onShare}>
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        </div>
      </div>
    </div>
  )
}
