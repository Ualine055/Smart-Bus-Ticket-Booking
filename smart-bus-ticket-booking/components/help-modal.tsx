"use client"

import { Button } from "@/components/ui/button"
import { X, Phone, Mail, MessageCircle, HelpCircle } from "lucide-react"

interface HelpModalProps {
  onClose: () => void
}

const faqs = [
  { q: "How do I book a bus ticket?", a: "Search for your route, select a bus, choose your seats, and complete payment." },
  { q: "Can I cancel my ticket?", a: "Yes, you can cancel up to 2 hours before departure from My Tickets." },
  { q: "What payment methods are accepted?", a: "We accept MTN MoMo, Airtel Money, and card payments." },
  { q: "How do I get my ticket?", a: "Your digital ticket with QR code is available instantly after payment." },
  { q: "What if my bus is delayed?", a: "You will receive an SMS notification with updated departure time." },
]

export function HelpModal({ onClose }: HelpModalProps) {
  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-bold">Help Center</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          {/* Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { icon: Phone, label: "Call Us", value: "+250 788 000 000" },
              { icon: Mail, label: "Email", value: "support@busconnect.rw" },
              { icon: MessageCircle, label: "Live Chat", value: "Available 24/7" },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-secondary/50 rounded-xl p-4 flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">{label}</div>
                  <div className="text-sm font-medium">{value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* FAQs */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-primary" />
              Frequently Asked Questions
            </h3>
            <div className="space-y-3">
              {faqs.map((faq) => (
                <div key={faq.q} className="border border-border rounded-xl p-4">
                  <div className="font-medium text-sm mb-1">{faq.q}</div>
                  <div className="text-sm text-muted-foreground">{faq.a}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-border">
          <Button onClick={onClose} variant="outline" className="w-full">Close</Button>
        </div>
      </div>
    </div>
  )
}
