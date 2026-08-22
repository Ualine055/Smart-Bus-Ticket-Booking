"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { X, Smartphone, CreditCard, Loader2, Check } from "lucide-react"
import { useLanguage, format } from "@/contexts/LanguageContext"

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

export type PaymentMethod = "mtn" | "airtel" | "card"

export type PassengerDetails = {
  name: string
  phone: string
  paymentMethod: PaymentMethod
}

interface PaymentModalProps {
  bus: Bus
  selectedSeats: string[]
  onClose: () => void
  /** Receives who is travelling and how they paid, since there is no account to read it from. */
  onSuccess: (details: PassengerDetails) => void
}

export function PaymentModal({ bus, selectedSeats, onClose, onSuccess }: PaymentModalProps) {
  const { t } = useLanguage()
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("mtn")
  const [passengerName, setPassengerName] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({})
  const [isProcessing, setIsProcessing] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  const totalPrice = selectedSeats.length * bus.price

  const handlePayment = async () => {
    // Passengers travel without an account, so these details are the only
    // record of who holds the ticket.
    const found: { name?: string; phone?: string } = {}
    if (!passengerName.trim()) found.name = t.nameRequired
    if (!phoneNumber.trim()) {
      found.phone = t.phoneRequired
    } else if (!/^[0-9+\s-]{7,}$/.test(phoneNumber.trim())) {
      found.phone = t.phoneInvalid
    }

    setErrors(found)
    if (Object.keys(found).length > 0) return

    setIsProcessing(true)
    // Simulated settlement. Real MTN MoMo / Airtel Money collection requires
    // merchant API credentials and a server-side callback, which this academic
    // build does not have; the chosen method is still recorded on the booking.
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setIsProcessing(false)
    setIsComplete(true)
    // Wait a moment to show success state
    setTimeout(() => {
      onSuccess({
        name: passengerName.trim(),
        phone: phoneNumber.trim(),
        paymentMethod,
      })
    }, 1500)
  }

  if (isComplete) {
    return (
      <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-card border border-border rounded-2xl w-full max-w-md p-8 text-center">
          <div className="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
            <Check className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">{t.paymentSuccessful}</h2>
          <p className="text-muted-foreground">
            {t.ticketConfirmed}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-bold">{t.completePayment}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {t.secureCheckout}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} disabled={isProcessing}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6">
          {/* Order Summary */}
          <div className="bg-secondary/50 rounded-xl p-4 mb-6">
            <h3 className="font-medium mb-3">{t.orderSummary}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t.routeLabel}</span>
                <span>{bus.from} → {bus.to}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t.busCompanyLabel}</span>
                <span>{bus.company}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t.departureLabel}</span>
                <span>{bus.departureTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t.seatsLabel}</span>
                <span>{selectedSeats.join(", ")}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-border font-medium">
                <span>{t.totalLabel}</span>
                <span className="text-primary">{totalPrice.toLocaleString()} RWF</span>
              </div>
            </div>
          </div>

          {/* Passenger details */}
          <div className="space-y-4 mb-6">
            <Label className="text-base font-medium">{t.passengerDetails}</Label>
            <div className="space-y-2">
              <Label htmlFor="passenger-name">{t.fullNameLabel}</Label>
              <Input
                id="passenger-name"
                placeholder={t.fullNamePlaceholder}
                value={passengerName}
                onChange={(e) => {
                  setPassengerName(e.target.value)
                  if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }))
                }}
                className={`bg-secondary ${errors.name ? "border-destructive" : ""}`}
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="passenger-phone">{t.phoneLabel}</Label>
              <Input
                id="passenger-phone"
                type="tel"
                placeholder="07X XXX XXXX"
                value={phoneNumber}
                onChange={(e) => {
                  setPhoneNumber(e.target.value)
                  if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }))
                }}
                className={`bg-secondary ${errors.phone ? "border-destructive" : ""}`}
              />
              {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
              <p className="text-xs text-muted-foreground">
                {t.phoneHelp}
              </p>
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-4">
            <Label className="text-base font-medium">{t.paymentMethodLabel}</Label>
            <RadioGroup
              value={paymentMethod}
              onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
              className="space-y-3"
            >
              <label
                htmlFor="mtn"
                className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-colors ${
                  paymentMethod === "mtn" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground"
                }`}
              >
                <RadioGroupItem value="mtn" id="mtn" />
                <div className="h-10 w-10 rounded-lg bg-[#FFCC00] flex items-center justify-center">
                  <Smartphone className="h-5 w-5 text-black" />
                </div>
                <div>
                  <div className="font-medium">{t.mtnMoMo}</div>
                  <div className="text-sm text-muted-foreground">{t.payWithMtn}</div>
                </div>
              </label>

              <label
                htmlFor="airtel"
                className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-colors ${
                  paymentMethod === "airtel" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground"
                }`}
              >
                <RadioGroupItem value="airtel" id="airtel" />
                <div className="h-10 w-10 rounded-lg bg-[#E40000] flex items-center justify-center">
                  <Smartphone className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="font-medium">{t.airtelMoney}</div>
                  <div className="text-sm text-muted-foreground">{t.payWithAirtel}</div>
                </div>
              </label>

              <label
                htmlFor="card"
                className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-colors ${
                  paymentMethod === "card" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground"
                }`}
              >
                <RadioGroupItem value="card" id="card" />
                <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-medium">{t.cardPayment}</div>
                  <div className="text-sm text-muted-foreground">{t.cardTypes}</div>
                </div>
              </label>
            </RadioGroup>

            {(paymentMethod === "mtn" || paymentMethod === "airtel") && (
              <p className="text-xs text-muted-foreground mt-4">
                {format(t.paymentRequestNote, { phone: phoneNumber || t.yourPhoneNumber })}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border">
          <Button
            onClick={handlePayment}
            className="w-full"
            size="lg"
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                {t.processing}
              </>
            ) : (
              format(t.payAmount, { amount: totalPrice.toLocaleString() })
            )}
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-4">
            {t.paymentSecureNote}
          </p>
        </div>
      </div>
    </div>
  )
}
