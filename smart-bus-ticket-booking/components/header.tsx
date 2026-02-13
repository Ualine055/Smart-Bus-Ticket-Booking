"use client"

import { useState } from "react"

import Link from "next/link"
import { Bus, Menu, X, User, Ticket, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface HeaderProps {
  user?: { name: string; email: string } | null
  onLoginClick?: () => void
  onSignupClick?: () => void
  onBookNowClick?: () => void
  onLogout?: () => void
  onMyTicketsClick?: () => void
  onProfileClick?: () => void
}

export function Header({ user, onLoginClick, onSignupClick, onBookNowClick, onLogout, onMyTicketsClick, onProfileClick }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  const scrollToSearch = () => {
    const searchSection = document.getElementById("search-section")
    if (searchSection) {
      searchSection.scrollIntoView({ behavior: "smooth" })
    }
    onBookNowClick?.()
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Bus className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold tracking-tight">TRAVELO</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Home
          </Link>
          <Link href="/search" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Find Buses
          </Link>
          <Link href="/my-tickets" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            My Tickets
          </Link>
          <Link href="/help" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Help
          </Link>
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="max-w-[100px] truncate">{user.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem className="flex flex-col items-start">
                  <span className="font-medium">{user.name}</span>
                  <span className="text-xs text-muted-foreground">{user.email}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onMyTicketsClick}>
                  <Ticket className="h-4 w-4 mr-2" />
                  My Tickets
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onProfileClick}>
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onLogout} className="text-destructive">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="ghost" size="sm" className="gap-2" onClick={onLoginClick}>
              <User className="h-4 w-4" />
              Login
            </Button>
          )}
          <Button size="sm" className="gap-2" onClick={scrollToSearch}>
            <Ticket className="h-4 w-4" />
            Book Now
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <nav className="flex flex-col p-4 gap-4">
            <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Home
            </Link>
            <Link href="/search" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Find Buses
            </Link>
            <Link href="/my-tickets" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              My Tickets
            </Link>
            <Link href="/help" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Help
            </Link>
            <div className="flex flex-col gap-2 pt-4 border-t border-border">
              {user ? (
                <>
                  <div className="flex items-center gap-3 px-2 py-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <Button variant="ghost" className="justify-start gap-2" onClick={onLogout}>
                    <LogOut className="h-4 w-4" />
                    Logout
                  </Button>
                </>
              ) : (
                <Button variant="ghost" className="justify-start gap-2" onClick={() => { onLoginClick?.(); setMobileMenuOpen(false); }}>
                  <User className="h-4 w-4" />
                  Login
                </Button>
              )}
              <Button className="justify-start gap-2" onClick={() => { scrollToSearch(); setMobileMenuOpen(false); }}>
                <Ticket className="h-4 w-4" />
                Book Now
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
