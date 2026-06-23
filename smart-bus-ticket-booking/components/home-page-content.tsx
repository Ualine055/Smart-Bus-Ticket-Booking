"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/Footer"
import { useAuth } from "@/contexts/AuthContext"
import { logOut } from "@/lib/auth"
import { createBooking } from "@/lib/bookings"
import { HeroSection } from "@/components/hero-section"
import { BusResults } from "@/components/bus-results"
import { SeatSelection } from "@/components/seat-selection"
import { PaymentModal } from "@/components/payment-modal"
import { TicketView } from "@/components/ticket-view"
import { FeaturesSection } from "@/components/features-section"
import { AuthModal } from "@/components/auth-modal"
import { MyTicketsModal } from "@/components/my-tickets-modal"
import { ProfileModal } from "@/components/profile-modal"
import { PasswordRecovery } from "@/components/password-recovery"
import { HelpModal } from "@/components/help-modal"

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

type BusOperatorSchedule = {
  id: string
  company: string
  busType: string
  price: number
  totalSeats: number
  amenities: string[]
  startTime: string
  endTime: string
  frequencyMinutes: number
  durationMinutes: number
}

const busOperatorSchedules: BusOperatorSchedule[] = [
  {
    id: "volcano",
    company: "Volcano Express",
    busType: "Luxury Coach",
    price: 3500,
    totalSeats: 45,
    amenities: ["wifi", "ac", "charging"],
    startTime: "06:00",
    endTime: "20:00",
    frequencyMinutes: 30,
    durationMinutes: 150,
  },
  {
    id: "horizon",
    company: "Horizon Bus",
    busType: "Standard",
    price: 2800,
    totalSeats: 52,
    amenities: ["ac"],
    startTime: "06:30",
    endTime: "19:30",
    frequencyMinutes: 30,
    durationMinutes: 150,
  },
  {
    id: "virunga",
    company: "Virunga Lines",
    busType: "VIP Express",
    price: 4200,
    totalSeats: 32,
    amenities: ["wifi", "ac", "charging"],
    startTime: "07:00",
    endTime: "18:00",
    frequencyMinutes: 60,
    durationMinutes: 135,
  },
  {
    id: "royal",
    company: "Royal Express",
    busType: "Premium",
    price: 3000,
    totalSeats: 45,
    amenities: ["wifi", "ac"],
    startTime: "08:00",
    endTime: "18:30",
    frequencyMinutes: 45,
    durationMinutes: 150,
  },
  {
    id: "kigali-coach",
    company: "Kigali Coach",
    busType: "Economy",
    price: 2500,
    totalSeats: 52,
    amenities: ["ac"],
    startTime: "06:00",
    endTime: "21:00",
    frequencyMinutes: 30,
    durationMinutes: 150,
  },
]

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

function buildBusesForRoute(from: string, to: string): Bus[] {
  const routeFrom = from || "Kigali"
  const routeTo = to || "Musanze"

  return busOperatorSchedules.flatMap((operator) => {
    const start = toMinutes(operator.startTime)
    const end = toMinutes(operator.endTime)
    const buses: Bus[] = []
    let sequence = 0

    for (let departure = start; departure <= end; departure += operator.frequencyMinutes) {
      sequence += 1
      const availableSeats = Math.max(operator.totalSeats - ((sequence * 7) % operator.totalSeats), 1)

      buses.push({
        id: `${operator.id}-${departure}`,
        company: operator.company,
        departureTime: toTime(departure),
        arrivalTime: toTime(departure + operator.durationMinutes),
        duration: toDurationLabel(operator.durationMinutes),
        from: routeFrom,
        to: routeTo,
        price: operator.price,
        availableSeats,
        totalSeats: operator.totalSeats,
        amenities: operator.amenities,
        busType: operator.busType,
      })
    }

    return buses
  })
}

type ViewState = "search" | "results" | "seats" | "payment" | "ticket"

function generateTicketId() {
  return `TRV-${Date.now().toString(36).toUpperCase()}`
}

export type HomePageContentProps = {
  autoOpenMyTickets?: boolean
}

export function HomePageContent({ autoOpenMyTickets }: HomePageContentProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user: firebaseUser, userData, loading: authLoading } = useAuth()

  const [viewState, setViewState] = useState<ViewState>("search")
  const [searchResults, setSearchResults] = useState<Bus[]>([])
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null)
  const [selectedSeats, setSelectedSeats] = useState<string[]>([])
  const [issuedTicketId, setIssuedTicketId] = useState("")
  const [searchParams, setSearchParams] = useState({
    from: "",
    to: "",
    date: "",
    passengers: 1,
  })

  const user = useMemo(
    () =>
      firebaseUser && userData
        ? { name: userData.name, email: userData.email, phone: userData.phone }
        : null,
    [firebaseUser, userData],
  )

  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState<"login" | "signup">("login")
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showMyTicketsModal, setShowMyTicketsModal] = useState(false)
  const [showPasswordRecovery, setShowPasswordRecovery] = useState(false)
  const [showHelpModal, setShowHelpModal] = useState(false)

  const ticketsOpenedRef = useRef(false)
  const promptedLoginRef = useRef(false)

  useEffect(() => {
    if (!autoOpenMyTickets || authLoading) return

    if (firebaseUser && userData) {
      if (!ticketsOpenedRef.current) {
        ticketsOpenedRef.current = true
        setShowMyTicketsModal(true)
      }
      return
    }

    if (!firebaseUser && !promptedLoginRef.current) {
      promptedLoginRef.current = true
      setAuthMode("login")
      setShowAuthModal(true)
    }
  }, [autoOpenMyTickets, authLoading, firebaseUser, userData])

  const onFindBusesClick = () => {
    if (pathname === "/" || pathname === "/search") {
      document.getElementById("search-section")?.scrollIntoView({ behavior: "smooth" })
    } else {
      router.push("/search")
    }
  }

  const handleSearch = (from: string, to: string, date: string, passengers: number) => {
    setSearchParams({ from, to, date, passengers })
    const results = buildBusesForRoute(from, to)
    setSearchResults(results)
    setViewState("results")
    setTimeout(() => {
      document.getElementById("bus-results")?.scrollIntoView({ behavior: "smooth" })
    }, 50)
  }

  const handleSelectBus = (bus: Bus) => {
    setSelectedBus(bus)
    setViewState("seats")
  }

  const handleSeatConfirm = (seats: string[]) => {
    if (!user) {
      setAuthMode("login")
      setShowAuthModal(true)
      return
    }
    setSelectedSeats(seats)
    setViewState("payment")
  }

  const handlePaymentSuccess = async () => {
    if (!selectedBus || !firebaseUser) return
    const ticketId = generateTicketId()
    setIssuedTicketId(ticketId)
    await createBooking({
      userId: firebaseUser.uid,
      busId: selectedBus.id,
      routeId: `${selectedBus.from}-${selectedBus.to}`,
      ticketId,
      passengerName: user?.name || "Guest User",
      passengerPhone: userData?.phone || "",
      travelDate: searchParams.date || new Date().toISOString().split("T")[0],
      seats: selectedSeats,
      totalPrice: selectedSeats.length * selectedBus.price,
      paymentMethod: "mtn",
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
      setIssuedTicketId("")
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
    if (!selectedBus || !issuedTicketId) return

    const ticketData = `
BUS CONNECT - Digital Bus Ticket
=============================
Ticket ID: ${issuedTicketId}
Passenger: ${user?.name || "Guest User"}
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
    a.download = `BUS CONNECT-Ticket-${issuedTicketId}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleShareTicket = async () => {
    if (!selectedBus || !issuedTicketId) return

    const shareData = {
      title: "Bus Connect Ticket",
      text: `Ticket ${issuedTicketId}: ${selectedBus.from} → ${selectedBus.to} on ${formatDate(searchParams.date)} at ${selectedBus.departureTime}. Seats: ${selectedSeats.join(", ")}`,
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
    <div className="min-h-screen bg-background">
      <Header
        user={user}
        userRole={userData?.role}
        onLoginClick={() => {
          setAuthMode("login")
          setShowAuthModal(true)
        }}
        onSignupClick={() => {
          setAuthMode("signup")
          setShowAuthModal(true)
        }}
        onLogout={async () => {
          await logOut()
          setShowMyTicketsModal(false)
        }}
        onProfileClick={() => setShowProfileModal(true)}
        onMyTicketsClick={() => {
          if (!user) {
            setAuthMode("login")
            setShowAuthModal(true)
          } else {
            setShowMyTicketsModal(true)
          }
        }}
        onFindBusesClick={onFindBusesClick}
        onHelpClick={() => setShowHelpModal(true)}
      />

      <main>
        <HeroSection onSearch={handleSearch} />

        {viewState !== "search" && searchResults.length > 0 && (
          <BusResults buses={searchResults} onSelectBus={handleSelectBus} />
        )}

        <FeaturesSection />
      </main>

      <Footer />

      {viewState === "seats" && selectedBus && (
        <SeatSelection
          bus={selectedBus}
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

      {viewState === "ticket" && selectedBus && issuedTicketId && (
        <TicketView
          bus={selectedBus}
          selectedSeats={selectedSeats}
          ticketId={issuedTicketId}
          passengerName={user?.name || "Guest User"}
          bookingDate={formatDate(searchParams.date)}
          onClose={handleCloseModal}
          onDownload={handleDownloadTicket}
          onShare={handleShareTicket}
        />
      )}

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setShowAuthModal(false)
        }}
        initialMode={authMode}
        onForgotPassword={() => {
          setShowAuthModal(false)
          setShowPasswordRecovery(true)
        }}
      />

      <PasswordRecovery
        isOpen={showPasswordRecovery}
        onClose={() => setShowPasswordRecovery(false)}
      />

      {showMyTicketsModal && (
        <MyTicketsModal onClose={() => setShowMyTicketsModal(false)} />
      )}

      {showHelpModal && <HelpModal onClose={() => setShowHelpModal(false)} />}

      {showProfileModal && user && (
        <ProfileModal user={user} onClose={() => setShowProfileModal(false)} />
      )}
    </div>
  )
}
