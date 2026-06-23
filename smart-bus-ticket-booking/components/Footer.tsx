"use client"

import Link from "next/link"
import { Bus, Mail, Phone, MapPin } from "lucide-react"
import { useLanguage } from "@/contexts/LanguageContext"

export function Footer() {
  const { t } = useLanguage()
  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <Bus className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">BUS CONNECT</span>
            </Link>
            <p className="text-muted-foreground text-sm mb-4">
            {t.footerDesc}
            </p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>Kigali, Rwanda</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span>+250 788 000 000</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>support@busconnect.rw</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">{t.quickLinks}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t.home}
                </Link>
              </li>
              <li>
                <Link href="/search" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t.findBuses}
                </Link>
              </li>
              <li>
                <Link href="/my-tickets" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t.myTickets}
                </Link>
              </li>
              <li>
                <Link href="/routes" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t.popularRoutes}
                </Link>
              </li>
            </ul>
          </div>

          {/* For Business */}
          <div>
            <h3 className="font-semibold mb-4">{t.forBusiness}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/register-company" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t.registerCompany}
                </Link>
              </li>
              <li>
                <Link href="/company-dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t.companyDashboard}
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t.pricing}
                </Link>
              </li>
              <li>
                <Link href="/api-access" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t.apiAccess}
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold mb-4">{t.supportFooter}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/help" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t.helpCenter}
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t.faq}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t.contactUs}
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t.terms}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © 2026 BUS CONNECT. {t.allRights}
          </p>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              {t.privacyPolicy}
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              {t.termsOfService}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
