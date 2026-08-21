"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Bus, Menu, X, User, Ticket, LogOut, Globe, Sun, Moon, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useLanguage } from "@/contexts/LanguageContext"
import { useTheme } from "@/contexts/ThemeContext"

interface HeaderProps {
  user?: { name: string; email: string } | null
  /** When set, shows dashboard entry points for company / admin accounts */
  userRole?: "passenger" | "company" | "admin"
  onLoginClick?: () => void
  onSignupClick?: () => void
  onBookNowClick?: () => void
  onLogout?: () => void
  onMyTicketsClick?: () => void
  onProfileClick?: () => void
  onFindBusesClick?: () => void
  onHelpClick?: () => void
}

export function Header({
  user,
  userRole,
  onLoginClick,
  onSignupClick,
  onBookNowClick,
  onLogout,
  onMyTicketsClick,
  onProfileClick,
  onFindBusesClick,
  onHelpClick,
}: HeaderProps) {
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { language, setLanguage, t } = useLanguage()
  const { theme, toggleTheme } = useTheme()

  const languages = ["English", "Kinyarwanda", "French"] as const
  
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
          <span className="text-xl font-bold tracking-tight">BUS CONNECT</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <button onClick={scrollToSearch} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            {t.home}
          </button>
          <button onClick={onFindBusesClick} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            {t.findBuses}
          </button>
          <button onClick={onMyTicketsClick} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            {t.myTickets}
          </button>
          <button onClick={onHelpClick} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            {t.help}
          </button>
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <Globe className="h-4 w-4" />
                {language}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {languages.map((lang) => (
                <DropdownMenuItem key={lang} onClick={() => setLanguage(lang)} className={language === lang ? "font-semibold text-primary" : ""}>
                  {lang}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
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
                  {t.myTickets}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onProfileClick}>
                  <User className="h-4 w-4 mr-2" />
                  {t.profile}
                </DropdownMenuItem>
                {(userRole === "company" || userRole === "admin") && (
                  <DropdownMenuItem onClick={() => router.push("/company-dashboard")}>
                    <Bus className="h-4 w-4 mr-2" />
                    {t.companyDashboard}
                  </DropdownMenuItem>
                )}
                {userRole === "admin" && (
                  <DropdownMenuItem onClick={() => router.push("/admin")}>
                    <Shield className="h-4 w-4 mr-2" />
                    {t.adminDashboard}
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onLogout} className="text-destructive">
                  <LogOut className="h-4 w-4 mr-2" />
                  {t.logout}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="ghost" size="sm" className="gap-2" onClick={onLoginClick}>
              <User className="h-4 w-4" />
              {t.login}
            </Button>
          )}
          <Button size="sm" className="gap-2" onClick={scrollToSearch}>
            <Ticket className="h-4 w-4" />
            {t.bookNow}
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <nav className="flex flex-col p-4 gap-4">
            <button onClick={() => { scrollToSearch(); setMobileMenuOpen(false); }} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors text-left">
              {t.home}
            </button>
            <button onClick={() => { onFindBusesClick?.(); setMobileMenuOpen(false); }} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors text-left">
              {t.findBuses}
            </button>
            <button onClick={() => { onMyTicketsClick?.(); setMobileMenuOpen(false); }} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors text-left">
              {t.myTickets}
            </button>
            <button onClick={() => { onHelpClick?.(); setMobileMenuOpen(false); }} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors text-left">
              {t.help}
            </button>
            <div className="flex flex-col gap-2 pt-4 border-t border-border">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="justify-start gap-2">
                    <Globe className="h-4 w-4" />
                    {language}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {languages.map((lang) => (
                    <DropdownMenuItem key={lang} onClick={() => setLanguage(lang)} className={language === lang ? "font-semibold text-primary" : ""}>
                      {lang}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
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
                  {(userRole === "company" || userRole === "admin") && (
                    <Link
                      href="/company-dashboard"
                      className="text-sm font-medium text-muted-foreground hover:text-foreground px-2 py-1.5 rounded-md hover:bg-accent flex items-center gap-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Bus className="h-4 w-4" />
                      {t.companyDashboard}
                    </Link>
                  )}
                  {userRole === "admin" && (
                    <Link
                      href="/admin"
                      className="text-sm font-medium text-muted-foreground hover:text-foreground px-2 py-1.5 rounded-md hover:bg-accent flex items-center gap-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Shield className="h-4 w-4" />
                      {t.adminDashboard}
                    </Link>
                  )}
                  <Button variant="ghost" className="justify-start gap-2" onClick={onLogout}>
                    <LogOut className="h-4 w-4" />
                    {t.logout}
                  </Button>
                </>
              ) : (
                <Button variant="ghost" className="justify-start gap-2" onClick={() => { onLoginClick?.(); setMobileMenuOpen(false); }}>
                  <User className="h-4 w-4" />
                  {t.login}
                </Button>
              )}
              <Button className="justify-start gap-2" onClick={() => { scrollToSearch(); setMobileMenuOpen(false); }}>
                <Ticket className="h-4 w-4" />
                {t.bookNow}
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
