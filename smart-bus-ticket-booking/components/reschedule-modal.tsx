"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { X, Clock, Smartphone, CreditCard, Loader2, Check, AlertCircle } from "lucide-react"
import { rescheduleBooking, Booking } from "@/lib/bookings"

const RESCHEDULE_FEE = 500 // RWF

// Generate time slots every 30 min from 05:00 to 22:00
const TIME_SLOTS = Array.from({ length: 35 }, (_, i) => {
  const totalMinutes = 5 * 60 + i * 30
  const h = Math.floor(totalMinutes / 60).toString().padStart(2, "0")
  const m = (totalMinutes % 60).toString().padStart(2, "0")
  return `${h}:${m}`
})

function addDuration(time: string, durationStr: string): string {
  const [h, m] = time.split(":").map(Number)
  const match = durationStr.match(/(\d+)h\s*(\d+)?m?/)
  if (!match) return time
  const dh = parseInt(match[1] || "0")
  const dm = parseInt(match[2] || "0")
  const total = h * 60 + m + dh * 60 + dm
  const nh = Math.floor(total / 60) % 24
  const nm = total % 60
  return `${nh.toString().padStart(2, "0")}:${nm.toString().padStart(2, "0")}`
}

interface RescheduleModalProps {
  booking: Booking
  onClose: () => void
  onSuccess: (updatedBooking: Booking) => void
}

type Step = "select" | "payment" | "done"

export function RescheduleModal({ booking, onClose, onSuccess }: RescheduleModalProps) {
  const [step, setStep] = useState<Step>("select")
  const [selectedTime, setSelectedTime] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<"mtn" | "airtel" | "card">("mtn")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState("")

  // Filter out the current departure time
  const availableSlots = TIME_SLOTS.filter((t) => t !== booking.route.departureTime)

  // Estimate trip duration from original times
  const estimateDuration = (): string => {
    const [dh, dm] = booking.route.departureTime.split(":").map(Number)
    const [ah, am] = booking.route.arrivalTime.split(":").map(Number)
    const diff = (ah * 60 + am) - (dh * 60 + dm)
    const h = Math.floor(Math.abs(diff) / 60)
    const m = Math.abs(diff) % 60
    return `${h}h ${m}m`
  }

  const newArrivalTime = selectedTime ? addDuration(selectedTime, estimateDuration()) : ""

  const handleConfirmTime = () => {
    if (!selectedTime) return
    setStep("payment")
  }

  const handlePayment = async () => {
    if (!booking.id) return
    setIsProcessing(true)
    setError("")
    // Simulate payment processing
    await new Promise((r) => setTimeout(r, 2000))
    const result = await rescheduleBooking(booking.id, selectedTime, newArrivalTime, RESCHEDULE_FEE)
    setIsProcessing(false)
    if (!result.success) {
      setError(result.error || "Failed to reschedule. Please try again.")
      return
    }
    setStep("done")
    setTimeout(() => {
      onSuccess({
        ...booking,
        route: { ...booking.route, departureTime: selectedTime, arrivalTime: newArrivalTime },
        rescheduleFee: RESCHEDULE_FEE,
      })
    }, 1500)
  }

  if (step === "done") {
    return (
      <div className="fixed inset-0 z-[60] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-card border border-border rounded-2xl w-full max-w-md p-8 text-center">
          <div className="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
            <Check className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Rescheduled!</h2>
          <p className="text-muted-foreground">
            Your ticket has been updated to <span className="font-semibold text-foreground">{selectedTime}</span>.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[60] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-bold">Reschedule Ticket</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {booking.route.from} → {booking.route.to}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} disabled={isProcessing}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {step === "select" && (
            <>
              {/* Current time info */}
              <div className="bg-secondary/50 rounded-xl p-4 mb-5 flex items-center gap-3">
                <Clock className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="text-sm">
                  <span className="text-muted-foreground">Current departure: </span>
                  <span className="font-semibold">{booking.route.departureTime}</span>
                </div>
              </div>

              {/* Reschedule fee notice */}
              <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 mb-5 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <p className="text-sm text-primary">
                  A reschedule fee of <span className="font-bold">{RESCHEDULE_FEE.toLocaleString()} RWF</span> will be charged.
                </p>
              </div>

              {/* Time slot picker */}
              <Label className="text-base font-medium mb-3 block">Select new departure time</Label>
              <div className="grid grid-cols-4 gap-2">
                {availableSlots.map((slot) => (
                  <button
                    key={slot}
                    onClick={() => setSelectedTime(slot)}
                    className={`py-2 px-1 rounded-lg text-sm font-medium border transition-colors ${
                      selectedTime === slot
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:border-primary/50 hover:bg-secondary"
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>

              {selectedTime && (
                <div className="mt-4 text-sm text-muted-foreground text-center">
                  New arrival: <span className="font-semibold text-foreground">{newArrivalTime}</span>
                </div>
              )}
            </>
          )}

          {step === "payment" && (
            <>
              {/* Summary */}
              <div className="bg-secondary/50 rounded-xl p-4 mb-6">
                <h3 className="font-medium mb-3">Reschedule Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Route</span>
                    <span>{booking.route.from} → {booking.route.to}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Old departure</span>
                    <span className="line-through text-muted-foreground">{booking.route.departureTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">New departure</span>
                    <span className="font-semibold text-primary">{selectedTime}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-border font-medium">
                    <span>Reschedule Fee</span>
                    <span className="text-primary">{RESCHEDULE_FEE.toLocaleString()} RWF</span>
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3 mb-4 text-sm text-destructive">
                  {error}
                </div>
              )}

              {/* Payment method */}
              <Label className="text-base font-medium mb-3 block">Payment Method</Label>
              <RadioGroup
                value={paymentMethod}
                onValueChange={(v) => setPaymentMethod(v as "mtn" | "airtel" | "card")}
                className="space-y-3"
              >
                <label
                  htmlFor="r-mtn"
                  className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-colors ${
                    paymentMethod === "mtn" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground"
                  }`}
                >
                  <RadioGroupItem value="mtn" id="r-mtn" />
                  <div className="h-10 w-10 rounded-lg bg-[#FFCC00] flex items-center justify-center">
                    <Smartphone className="h-5 w-5 text-black" />
                  </div>
                  <div>
                    <div className="font-medium">MTN Mobile Money</div>
                    <div className="text-sm text-muted-foreground">Pay with MTN MoMo</div>
                  </div>
                </label>

                <label
                  htmlFor="r-airtel"
                  className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-colors ${
                    paymentMethod === "airtel" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground"
                  }`}
                >
                  <RadioGroupItem value="airtel" id="r-airtel" />
                  <div className="h-10 w-10 rounded-lg bg-[#E40000] flex items-center justify-center">
                    <Smartphone className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="font-medium">Airtel Money</div>
                    <div className="text-sm text-muted-foreground">Pay with Airtel Money</div>
                  </div>
                </label>

                <label
                  htmlFor="r-card"
                  className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-colors ${
                    paymentMethod === "card" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground"
                  }`}
                >
                  <RadioGroupItem value="card" id="r-card" />
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
                <div className="space-y-2 mt-4">
                  <Label htmlFor="r-phone">Phone Number</Label>
                  <Input
                    id="r-phone"
                    type="tel"
                    placeholder="07X XXX XXXX"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="bg-secondary"
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border space-y-3">
          {step === "select" && (
            <Button onClick={handleConfirmTime} className="w-full" size="lg" disabled={!selectedTime}>
              Continue — Pay {RESCHEDULE_FEE.toLocaleString()} RWF
            </Button>
          )}
          {step === "payment" && (
            <>
              <Button
                onClick={handlePayment}
                className="w-full"
                size="lg"
                disabled={isProcessing || ((paymentMethod === "mtn" || paymentMethod === "airtel") && !phoneNumber)}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  `Pay ${RESCHEDULE_FEE.toLocaleString()} RWF`
                )}
              </Button>
              <Button variant="ghost" className="w-full" onClick={() => setStep("select")} disabled={isProcessing}>
                Back
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
