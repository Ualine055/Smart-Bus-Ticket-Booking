"use client"

import { useMemo, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/Footer"
import { AuthModal } from "@/components/auth-modal"
import { MyTicketsModal } from "@/components/my-tickets-modal"
import { ProfileModal } from "@/components/profile-modal"
import { PasswordRecovery } from "@/components/password-recovery"
import { HelpModal } from "@/components/help-modal"
import { useAuth } from "@/contexts/AuthContext"
import { logOut } from "@/lib/auth"

type SiteShellProps = {
  children: React.ReactNode
  /** When true (e.g. /my-tickets), the ticket lookup opens straight away. */
  initialOpenMyTickets?: boolean
}

export function SiteShell({ children, initialOpenMyTickets }: SiteShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user: firebaseUser, userData } = useAuth()

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
  // Tickets are found by reference and PIN, so /my-tickets can open the lookup
  // immediately - no need to wait for auth, and no effect required.
  const [showMyTicketsModal, setShowMyTicketsModal] = useState(Boolean(initialOpenMyTickets))
  const [showPasswordRecovery, setShowPasswordRecovery] = useState(false)
  const [showHelpModal, setShowHelpModal] = useState(false)

  const onFindBusesClick = () => {
    if (pathname === "/" || pathname === "/search") {
      document.getElementById("search-section")?.scrollIntoView({ behavior: "smooth" })
    } else {
      router.push("/search")
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
        onMyTicketsClick={() => setShowMyTicketsModal(true)}
        onFindBusesClick={onFindBusesClick}
        onHelpClick={() => setShowHelpModal(true)}
      />

      {children}

      <Footer />

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
