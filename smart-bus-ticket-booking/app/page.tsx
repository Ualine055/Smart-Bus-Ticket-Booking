"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { BusResults } from "@/components/bus-results"
import { SeatSelection } from "@/components/seat-selection"
import { PaymentModal } from "@/components/payment-modal"
import { TicketView } from "@/components/ticket-view"
import { FeaturesSection } from "@/components/features-section"
import { Footer } from "@/components/Footer"
import { AuthModal } from "@/components/auth-modal"
import { MyTicketsModal } from "@/components/my-tickets-modal"
import { ProfileModal } from "@/components/profile-modal"

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

// Mock bus data
const mockBuses: Bus[] = [
  {
    id: "1",
    company: "Volcano Express",
    departureTime: "06:00",
    arrivalTime: "08:30",
    duration: "2h 30m",
    from: "Kigali",
    to: "Musanze",
    price: 3500,
    availableSeats: 12,
    totalSeats: 45,
    amenities: ["wifi", "ac", "charging"],
    busType: "Luxury Coach",
  },
  {
    id: "2",
    company: "Horizon Bus",
    departureTime: "07:30",
    arrivalTime: "10:00",
    duration: "2h 30m",
    from: "Kigali",
    to: "Musanze",
    price: 2800,
    availableSeats: 24,
    totalSeats: 52,
    amenities: ["ac"],
    busType: "Standard",
  },
  {
    id: "3",
    company: "Virunga Lines",
    departureTime: "09:00",
    arrivalTime: "11:15",
    duration: "2h 15m",
    from: "Kigali",
    to: "Musanze",
    price: 4200,
    availableSeats: 8,
    totalSeats: 32,
    amenities: ["wifi", "ac", "charging"],
    busType: "VIP Express",
  },
  {
    id: "4",
    company: "Royal Express",
    departureTime: "10:30",
    arrivalTime: "13:00",
    duration: "2h 30m",
    from: "Kigali",
    to: "Musanze",
    price: 3000,
    availableSeats: 18,
    totalSeats: 45,
    amenities: ["wifi", "ac"],
    busType: "Premium",
  },
  {
    id: "5",
    company: "Kigali Coach",
    departureTime: "14:00",
    arrivalTime: "16:30",
    duration: "2h 30m",
    from: "Kigali",
    to: "Musanze",
    price: 2500,
    availableSeats: 32,
    totalSeats: 52,
    amenities: ["ac"],
    busType: "Economy",
  },
]

type ViewState = "search" | "results" | "seats" | "payment" | "ticket"

interface User {
  name: string
  email: string
  phone: string
}

export default function Home() {
  const [viewState, setViewState] = useState<ViewState>("search")
  const [searchResults, setSearchResults] = useState<Bus[]>([])
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null)
  const [selectedSeats, setSelectedSeats] = useState<string[]>([])
  const [searchParams, setSearchParams] = useState({
    from: "",
    to: "",
    date: "",
    passengers: 1,
  })
  const [user, setUser] = useState<User | null>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState<"login" | "signup">("login")
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showMyTicketsModal, setShowMyTicketsModal] = useState(false)

  const handleSearch = (from: string, to: string, date: string, passengers: number) => {
    setSearchParams({ from, to, date, passengers })
    // Simulate search - in real app, this would be an API call
    const results = mockBuses.map((bus) => ({
      ...bus,
      from: from || bus.from,
      to: to || bus.to,
    }))
    setSearchResults(results)
    setViewState("results")
  }

  const handleSelectBus = (bus: Bus) => {
    setSelectedBus(bus)
    setViewState("seats")
  }

  const handleSeatConfirm = (seats: string[]) => {
    setSelectedSeats(seats)
    setViewState("payment")
  }

  const handlePaymentSuccess = () => {
    setViewState("ticket")
  }

  const handleCloseModal = () => {
    if (viewState === "seats") {
      setViewState("results")
    } else if (viewState === "payment") {
      setViewState("seats")
    } else if (viewState === "ticket") {
      // Reset everything
      setViewState("search")
      setSearchResults([])
      setSelectedBus(null)
      setSelectedSeats([])
    }
  }

  const generateTicketId = () => {
    return `TRV-${Date.now().toString(36).toUpperCase()}`
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
    if (!selectedBus) return
    
    const ticketData = `
TRAVELO - Digital Bus Ticket
=============================
Ticket ID: ${generateTicketId()}
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
    a.download = `TRAVELO-Ticket-${generateTicketId()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleShareTicket = async () => {
    if (!selectedBus) return
    
    const shareData = {
      title: "TRAVELO Bus Ticket",
      text: `My bus ticket: ${selectedBus.from} → ${selectedBus.to} on ${formatDate(searchParams.date)} at ${selectedBus.departureTime}. Seats: ${selectedSeats.join(", ")}`,
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (err) {
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
        onLoginClick={() => {
          setAuthMode("login")
          setShowAuthModal(true)
        }}
        onSignupClick={() => {
          setAuthMode("signup")
          setShowAuthModal(true)
        }}
        onLogout={() => setUser(null)}
        onProfileClick={() => setShowProfileModal(true)}
        onMyTicketsClick={() => setShowMyTicketsModal(true)}
      />

      <main>
        <HeroSection 
          onSearch={handleSearch} 
          isLoggedIn={!!user}
          onAuthRequired={() => {
            setAuthMode("signup")
            setShowAuthModal(true)
          }}
        />

        {viewState !== "search" && searchResults.length > 0 && (
          <BusResults buses={searchResults} onSelectBus={handleSelectBus} />
        )}

        <FeaturesSection />
      </main>

      <Footer />

      {/* Modals */}
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

      {viewState === "ticket" && selectedBus && (
        <TicketView
          bus={selectedBus}
          selectedSeats={selectedSeats}
          ticketId={generateTicketId()}
          passengerName={user?.name || "Guest User"}
          bookingDate={formatDate(searchParams.date)}
          onClose={handleCloseModal}
          onDownload={handleDownloadTicket}
          onShare={handleShareTicket}
        />
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={(userData) => {
          setUser(userData)
          setShowAuthModal(false)
        }}
        initialMode={authMode}
      />

      {/* My Tickets Modal */}
      {showMyTicketsModal && <MyTicketsModal onClose={() => setShowMyTicketsModal(false)} />}

      {/* Profile Modal */}
      {showProfileModal && user && (
        <ProfileModal user={user} onClose={() => setShowProfileModal(false)} />
      )}
    </div>
  )
}
