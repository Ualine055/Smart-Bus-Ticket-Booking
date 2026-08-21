"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { X, Smartphone, CreditCard, Loader2, Check } from "lucide-react"

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
    if (!passengerName.trim()) found.name = "Passenger name is required"
    if (!phoneNumber.trim()) {
      found.phone = "Phone number is required"
    } else if (!/^[0-9+\s-]{7,}$/.test(phoneNumber.trim())) {
      found.phone = "Enter a valid phone number"
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
          <h2 className="text-2xl font-bold mb-2">Payment Successful!</h2>
          <p className="text-muted-foreground">
            Your ticket has been confirmed. Redirecting to your ticket...
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
            <h2 className="text-xl font-bold">Complete Payment</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Secure checkout
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} disabled={isProcessing}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6">
          {/* Order Summary */}
          <div className="bg-secondary/50 rounded-xl p-4 mb-6">
            <h3 className="font-medium mb-3">Order Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Route</span>
                <span>{bus.from} → {bus.to}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Bus Company</span>
                <span>{bus.company}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Departure</span>
                <span>{bus.departureTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Seats</span>
                <span>{selectedSeats.join(", ")}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-border font-medium">
                <span>Total</span>
                <span className="text-primary">{totalPrice.toLocaleString()} RWF</span>
              </div>
            </div>
          </div>

          {/* Passenger details */}
          <div className="space-y-4 mb-6">
            <Label className="text-base font-medium">Passenger Details</Label>
            <div className="space-y-2">
              <Label htmlFor="passenger-name">Full name</Label>
              <Input
                id="passenger-name"
                placeholder="As it appears on your ID"
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
              <Label htmlFor="passenger-phone">Phone number</Label>
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
                Used to confirm your booking and for mobile money payment.
              </p>
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Payment Method</Label>
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
                  <div className="font-medium">MTN Mobile Money</div>
                  <div className="text-sm text-muted-foreground">Pay with MTN MoMo</div>
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
                  <div className="font-medium">Airtel Money</div>
                  <div className="text-sm text-muted-foreground">Pay with Airtel Money</div>
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
                  <div className="font-medium">Debit/Credit Card</div>
                  <div className="text-sm text-muted-foreground">Visa, Mastercard</div>
                </div>
              </label>
            </RadioGroup>

            {(paymentMethod === "mtn" || paymentMethod === "airtel") && (
              <p className="text-xs text-muted-foreground mt-4">
                A payment request will be sent to {phoneNumber || "your phone number"}.
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
                Processing...
              </>
            ) : (
              `Pay ${totalPrice.toLocaleString()} RWF`
            )}
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-4">
            Your payment is secure and encrypted
          </p>
        </div>
      </div>
    </div>
  )
}
