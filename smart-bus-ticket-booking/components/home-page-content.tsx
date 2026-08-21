"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { SiteShell } from "@/components/site-shell"
import { useAuth } from "@/contexts/AuthContext"
import {
  createBooking,
  getSeatsTakenOn,
  generateTicketId,
  generateTicketPin,
} from "@/lib/bookings"
import { searchSchedules, type Schedule } from "@/lib/schedules"
import { HeroSection } from "@/components/hero-section"
import { BusResults } from "@/components/bus-results"
import { SeatSelection } from "@/components/seat-selection"
import { PaymentModal, type PassengerDetails } from "@/components/payment-modal"
import { TicketView } from "@/components/ticket-view"
import { FeaturesSection } from "@/components/features-section"

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

function toMinutes(hhmm: string) {
  const [hours, minutes] = hhmm.split(":").map(Number)
  return hours * 60 + minutes
}

function toTime(totalMinutes: number) {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440
  const hours = Math.floor(normalized / 60)
  const minutes = normalized % 60
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`
}

function toDurationLabel(durationMinutes: number) {
  const hours = Math.floor(durationMinutes / 60)
  const minutes = durationMinutes % 60
  return `${hours}h ${minutes}m`
}

/** Turn published schedules into the bookable buses shown in search results. */
function toBuses(schedules: Schedule[]): Bus[] {
  return schedules.map((schedule) => {
    const departure = toMinutes(schedule.departureTime)

    return {
      id: schedule.id!,
      company: schedule.companyName,
      departureTime: schedule.departureTime,
      arrivalTime: toTime(departure + schedule.durationMinutes),
      duration: toDurationLabel(schedule.durationMinutes),
      from: schedule.from,
      to: schedule.to,
      price: schedule.price,
      // Starts at full capacity; the caller subtracts seats already sold.
      availableSeats: schedule.totalSeats,
      totalSeats: schedule.totalSeats,
      amenities: schedule.amenities ?? [],
      busType: schedule.busType,
    }
  })
}

type ViewState = "search" | "results" | "seats" | "payment" | "ticket"

/** Local calendar date as YYYY-MM-DD (toISOString would use UTC and roll early). */
function todayIso() {
  const now = new Date()
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-")
}

export type HomePageContentProps = {
  autoOpenMyTickets?: boolean
}

export function HomePageContent({ autoOpenMyTickets }: HomePageContentProps) {
  const { user: firebaseUser } = useAuth()

  const [viewState, setViewState] = useState<ViewState>("search")
  const [searchResults, setSearchResults] = useState<Bus[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null)
  const [selectedSeats, setSelectedSeats] = useState<string[]>([])
  const [issuedTicket, setIssuedTicket] = useState<{
    ticketId: string
    pin: string
    passengerName: string
  } | null>(null)
  const [bookingError, setBookingError] = useState("")
  const [searchParams, setSearchParams] = useState({
    from: "",
    to: "",
    date: "",
    passengers: 1,
  })

  /** The date being booked; falls back to today when the search left it blank. */
  const travelDate = searchParams.date || todayIso()

  const handleSearch = async (from: string, to: string, date: string, passengers: number) => {
    setSearchParams({ from, to, date, passengers })
    setSearchResults([])
    setSearching(true)
    setViewState("results")

    setTimeout(() => {
      document.getElementById("bus-results")?.scrollIntoView({ behavior: "smooth" })
    }, 50)

    // Published schedules for the route, and seats already sold on that date.
    const [published, sold] = await Promise.all([
      searchSchedules(from, to),
      getSeatsTakenOn(date || todayIso()),
    ])

    setSearchResults(
      toBuses(published.schedules).map((bus) => {
        const taken = sold.seatsByBus[bus.id]?.length ?? 0
        return { ...bus, availableSeats: Math.max(bus.totalSeats - taken, 0) }
      }),
    )
    setSearching(false)
  }

  const handleSelectBus = (bus: Bus) => {
    setSelectedBus(bus)
    setBookingError("")
    setViewState("seats")
  }

  // Passengers buy without an account; their details are collected at payment.
  const handleSeatConfirm = (seats: string[]) => {
    setBookingError("")
    setSelectedSeats(seats)
    setViewState("payment")
  }

  const handlePaymentSuccess = async (details: PassengerDetails) => {
    if (!selectedBus) return

    const ticketId = generateTicketId()
    const pin = generateTicketPin()

    const result = await createBooking({
      // Only set when an operator or admin books on someone's behalf.
      userId: firebaseUser?.uid ?? null,
      busId: selectedBus.id,
      routeId: `${selectedBus.from}-${selectedBus.to}`,
      ticketId,
      pin,
      passengerName: details.name,
      passengerPhone: details.phone,
      travelDate,
      seats: selectedSeats,
      totalPrice: selectedSeats.length * selectedBus.price,
      paymentMethod: details.paymentMethod,
      paymentStatus: "completed",
      bookingStatus: "confirmed",
      busCompany: selectedBus.company,
      route: {
        from: selectedBus.from,
        to: selectedBus.to,
        departureTime: selectedBus.departureTime,
        arrivalTime: selectedBus.arrivalTime,
      },
    })

    // Someone else may have taken the seat while this passenger was paying.
    if (!result.success) {
      setBookingError(result.error ?? "Your booking could not be saved.")
      setSelectedSeats([])
      setViewState("seats")
      return
    }

    setIssuedTicket({ ticketId, pin, passengerName: details.name })
    setViewState("ticket")
  }

  const handleCloseModal = () => {
    if (viewState === "seats") {
      setViewState("results")
    } else if (viewState === "payment") {
      setViewState("seats")
    } else if (viewState === "ticket") {
      setViewState("search")
      setSearchResults([])
      setSelectedBus(null)
      setSelectedSeats([])
      setIssuedTicket(null)
    }
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) {
      const today = new Date()
      return today.toLocaleDateString("en-US", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    }
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  const handleDownloadTicket = () => {
    if (!selectedBus || !issuedTicket) return

    // The reference and PIN are the only way back to this ticket, so they lead.
    const ticketData = `
BUS CONNECT - Digital Bus Ticket
=============================
Ticket ID: ${issuedTicket.ticketId}
PIN: ${issuedTicket.pin}

Keep these safe - you need both to open
this ticket again at /my-tickets

Passenger: ${issuedTicket.passengerName}
Date: ${formatDate(searchParams.date)}

Route: ${selectedBus.from} → ${selectedBus.to}
Bus Company: ${selectedBus.company}
Departure: ${selectedBus.departureTime}
Arrival: ${selectedBus.arrivalTime}
Seats: ${selectedSeats.join(", ")}

Total Paid: ${(selectedSeats.length * selectedBus.price).toLocaleString()} RWF
=============================
    `

    const blob = new Blob([ticketData], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `BUS CONNECT-Ticket-${issuedTicket.ticketId}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleShareTicket = async () => {
    if (!selectedBus || !issuedTicket) return

    const shareData = {
      title: "Bus Connect Ticket",
      text: `Ticket ${issuedTicket.ticketId} (PIN ${issuedTicket.pin}): ${selectedBus.from} → ${selectedBus.to} on ${formatDate(searchParams.date)} at ${selectedBus.departureTime}. Seats: ${selectedSeats.join(", ")}`,
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch {
        console.log("Share cancelled")
      }
    } else {
      navigator.clipboard.writeText(shareData.text)
      alert("Ticket details copied to clipboard!")
    }
  }

  return (
    // SiteShell provides the header, footer, and the account/help modals shared
    // with every other page; only the booking flow lives here.
    <SiteShell initialOpenMyTickets={autoOpenMyTickets}>
      <main>
        <HeroSection onSearch={handleSearch} />

        {viewState !== "search" && searching && (
          <section id="bus-results" className="py-12">
            <div className="container mx-auto px-4 flex items-center justify-center gap-3 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              Searching for available buses...
            </div>
          </section>
        )}

        {viewState !== "search" && !searching && searchResults.length === 0 && (
          <section id="bus-results" className="py-12">
            <div className="container mx-auto px-4 text-center max-w-md">
              <h2 className="text-xl font-bold mb-2">No buses on this route</h2>
              <p className="text-muted-foreground text-sm">
                No operator has published a departure from{" "}
                <span className="text-foreground">{searchParams.from || "anywhere"}</span> to{" "}
                <span className="text-foreground">{searchParams.to || "anywhere"}</span> yet. Try
                another route, or leave both fields empty to see every available trip.
              </p>
            </div>
          </section>
        )}

        {viewState !== "search" && !searching && searchResults.length > 0 && (
          <BusResults buses={searchResults} onSelectBus={handleSelectBus} />
        )}

        <FeaturesSection />
      </main>

      {viewState === "seats" && selectedBus && (
        <SeatSelection
          bus={selectedBus}
          travelDate={travelDate}
          maxSeats={searchParams.passengers}
          notice={bookingError}
          onClose={handleCloseModal}
          onConfirm={handleSeatConfirm}
        />
      )}

      {viewState === "payment" && selectedBus && (
        <PaymentModal
          bus={selectedBus}
          selectedSeats={selectedSeats}
          onClose={handleCloseModal}
          onSuccess={handlePaymentSuccess}
        />
      )}

      {viewState === "ticket" && selectedBus && issuedTicket && (
        <TicketView
          bus={selectedBus}
          selectedSeats={selectedSeats}
          ticketId={issuedTicket.ticketId}
          pin={issuedTicket.pin}
          passengerName={issuedTicket.passengerName}
          bookingDate={formatDate(searchParams.date)}
          onClose={handleCloseModal}
          onDownload={handleDownloadTicket}
          onShare={handleShareTicket}
        />
      )}
    </SiteShell>
  )
}
