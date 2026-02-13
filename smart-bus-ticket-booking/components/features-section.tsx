import { Search, CreditCard, QrCode, Clock, Shield, Headphones } from "lucide-react"

const features = [
  {
    icon: Search,
    title: "Easy Search",
    description: "Find buses by route, date, and time with our intuitive search system.",
  },
  {
    icon: CreditCard,
    title: "Secure Payments",
    description: "Pay safely with MTN MoMo, Airtel Money, or card payments.",
  },
  {
    icon: QrCode,
    title: "Digital Tickets",
    description: "Receive instant QR code tickets directly to your device.",
  },
  {
    icon: Clock,
    title: "Real-time Updates",
    description: "Get live updates on bus schedules and seat availability.",
  },
  {
    icon: Shield,
    title: "Verified Companies",
    description: "Travel with trusted and verified bus operators.",
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    description: "Our customer support team is always here to help.",
  },
]

export function FeaturesSection() {
  return (
    <section className="py-20 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Why Choose TRAVELO?
          </h2>
          <p className="text-muted-foreground text-lg">
            Experience the future of bus travel with our comprehensive digital booking platform.
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
