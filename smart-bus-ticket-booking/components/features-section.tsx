"use client"

import { useLanguage } from "@/contexts/LanguageContext"
import { Search, CreditCard, QrCode, Clock, Shield, Headphones } from "lucide-react"

export function FeaturesSection() {
  const { t } = useLanguage()

  const features = [
    { icon: Search, title: t.easySearch, description: t.easySearchDesc },
    { icon: CreditCard, title: t.securePayments, description: t.securePaymentsDesc },
    { icon: QrCode, title: t.digitalTickets, description: t.digitalTicketsDesc },
    { icon: Clock, title: t.realTimeUpdates, description: t.realTimeUpdatesDesc },
    { icon: Shield, title: t.verifiedCompanies, description: t.verifiedCompaniesDesc },
    { icon: Headphones, title: t.support247, description: t.support247Desc },
  ]
  return (
    <section className="py-20 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t.whyChoose}
          </h2>
          <p className="text-muted-foreground text-lg">
            {t.whySubtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-colors group"
            >
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
