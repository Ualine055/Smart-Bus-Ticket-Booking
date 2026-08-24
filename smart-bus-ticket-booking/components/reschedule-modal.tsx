"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { X, Clock, Smartphone, CreditCard, Loader2, Check, AlertCircle } from "lucide-react"
import { rescheduleBooking, getSeatsTakenOn, seatExists, type Booking } from "@/lib/bookings"
import { searchSchedules, type Schedule } from "@/lib/schedules"
import { useLanguage, format } from "@/contexts/LanguageContext"

const RESCHEDULE_FEE = 500 // RWF

interface RescheduleModalProps {
  booking: Booking
  onClose: () => void
  onSuccess: (updatedBooking: Booking) => void
}

type Step = "select" | "payment" | "done"

/** A departure the passenger could move to, with its seat situation resolved. */
type Option = {
  schedule: Schedule
  arrivalTime: string
  seatsFree: boolean
  /** Extra to pay if the new departure costs more per seat than the original. */
  fareDifference: number
  blockedReason?: string
}

function toMinutes(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number)
  return h * 60 + m
}

function toTime(totalMinutes: number) {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440
  return `${String(Math.floor(normalized / 60)).padStart(2, "0")}:${String(normalized % 60).padStart(2, "0")}`
}

export function RescheduleModal({ booking, onClose, onSuccess }: RescheduleModalProps) {
  const { t } = useLanguage()
  const [step, setStep] = useState<Step>("select")
  const [options, setOptions] = useState<Option[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<"mtn" | "airtel" | "card">("mtn")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState("")

  const seats = useMemo(() => booking.seats ?? [], [booking.seats])
  const paidPerSeat = seats.length > 0 ? booking.totalPrice / seats.length : booking.totalPrice

  // Real departures the same operator runs on this route, with live seat counts.
  useEffect(() => {
    let active = true

    const load = async () => {
      const [published, sold] = await Promise.all([
        searchSchedules(booking.route.from, booking.route.to),
        getSeatsTakenOn(booking.travelDate),
      ])

      if (!active) return

      // On the day of travel, a departure that has already left is not an option.
      const now = new Date()
      const isToday =
        booking.travelDate ===
        [
          now.getFullYear(),
          String(now.getMonth() + 1).padStart(2, "0"),
          String(now.getDate()).padStart(2, "0"),
        ].join("-")
      const cutoff = now.getHours() * 60 + now.getMinutes() + 15

      const candidates = published.schedules
        .filter(
          (schedule) =>
            schedule.id !== booking.busId &&
            schedule.companyName === booking.busCompany &&
            (!isToday || toMinutes(schedule.departureTime) > cutoff),
        )
        .map<Option>((schedule) => {
          const taken = sold.seatsByBus[schedule.id!] ?? []
          const missing = seats.filter((seat) => !seatExists(seat, schedule.totalSeats))
          const clash = seats.filter((seat) => taken.includes(seat))

          return {
            schedule,
            arrivalTime: toTime(toMinutes(schedule.departureTime) + schedule.durationMinutes),
            seatsFree: missing.length === 0 && clash.length === 0,
            fareDifference: Math.max(0, (schedule.price - paidPerSeat) * seats.length),
            blockedReason:
              missing.length > 0
                ? format(t.seatMissingOnBus, { seats: missing.join(", ") })
                : clash.length > 0
                ? format(t.seatTakenOnDeparture, { seats: clash.join(", ") })
                : undefined,
          }
        })

      setOptions(candidates)
      setLoading(false)
    }

    load()

    return () => {
      active = false
    }
  }, [booking.route.from, booking.route.to, booking.travelDate, booking.busId, booking.busCompany, seats, paidPerSeat, t.seatMissingOnBus, t.seatTakenOnDeparture])

  const selected = options.find((option) => option.schedule.id === selectedId)
  const totalDue = RESCHEDULE_FEE + (selected?.fareDifference ?? 0)

  const handlePayment = async () => {
    if (!booking.id || !selected) return

    setIsProcessing(true)
    setError("")

    // Simulated settlement, as in the main booking flow.
    await new Promise((r) => setTimeout(r, 2000))

    const result = await rescheduleBooking(
      booking.id,
      {
        busId: selected.schedule.id!,
        departureTime: selected.schedule.departureTime,
        arrivalTime: selected.arrivalTime,
        totalSeats: selected.schedule.totalSeats,
        companyName: selected.schedule.companyName,
      },
      RESCHEDULE_FEE,
    )

    setIsProcessing(false)

    if (!result.success) {
      setError(result.error || t.rescheduleFailed)
      setStep("select")
      return
    }

    setStep("done")
    setTimeout(() => {
      onSuccess({
        ...booking,
        busId: selected.schedule.id!,
        route: {
          ...booking.route,
          departureTime: selected.schedule.departureTime,
          arrivalTime: selected.arrivalTime,
        },
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
          <h2 className="text-2xl font-bold mb-2">{t.rescheduledTitle}</h2>
          <p className="text-muted-foreground">
            {format(t.rescheduledBody, { time: selected?.schedule.departureTime ?? "" })}
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
            <h2 className="text-xl font-bold">{t.rescheduleTicket}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {booking.route.from} → {booking.route.to} • {booking.travelDate}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} disabled={isProcessing}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {step === "select" && (
            <>
              <div className="bg-secondary/50 rounded-xl p-4 mb-5 flex items-center gap-3">
                <Clock className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="text-sm">
                  <span className="text-muted-foreground">{t.currentDeparture}: </span>
                  <span className="font-semibold">{booking.route.departureTime}</span>
                  <span className="text-muted-foreground"> • {t.seatsLabel} {seats.join(", ")}</span>
                </div>
              </div>

              <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 mb-5 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <p className="text-sm text-primary">
                  {format(t.rescheduleFeeNote, { fee: RESCHEDULE_FEE.toLocaleString() })}
                </p>
              </div>

              {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3 mb-4 text-sm text-destructive">
                  {error}
                </div>
              )}

              <Label className="text-base font-medium mb-3 block">{t.otherDepartures}</Label>

              {loading ? (
                <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  {t.loadingDepartures}
                </div>
              ) : options.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">
                  {format(t.noOtherDepartures, { company: booking.busCompany })}
                </p>
              ) : (
                <div className="space-y-2">
                  {options.map((option) => {
                    const id = option.schedule.id!
                    const isSelected = selectedId === id

                    return (
                      <button
                        key={id}
                        onClick={() => option.seatsFree && setSelectedId(id)}
                        disabled={!option.seatsFree}
                        className={`w-full text-left p-4 rounded-xl border transition-colors ${
                          !option.seatsFree
                            ? "border-border opacity-60 cursor-not-allowed"
                            : isSelected
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold">
                              {option.schedule.departureTime} → {option.arrivalTime}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {option.schedule.busType} • {option.schedule.busPlate}
                            </div>
                          </div>
                          <div className="text-right text-sm">
                            {option.blockedReason ? (
                              <span className="text-destructive">{option.blockedReason}</span>
                            ) : option.fareDifference > 0 ? (
                              <span className="text-primary font-medium">
                                +{option.fareDifference.toLocaleString()} RWF
                              </span>
                            ) : (
                              <span className="text-muted-foreground">{t.noFareChange}</span>
                            )}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </>
          )}

          {step === "payment" && selected && (
            <>
              <div className="bg-secondary/50 rounded-xl p-4 mb-6">
                <h3 className="font-medium mb-3">{t.rescheduleSummary}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t.routeLabel}</span>
                    <span>
                      {booking.route.from} → {booking.route.to}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t.oldDeparture}</span>
                    <span className="line-through text-muted-foreground">
                      {booking.route.departureTime}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t.newDeparture}</span>
                    <span className="font-semibold text-primary">
                      {selected.schedule.departureTime}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t.seatsLabel}</span>
                    <span>{seats.join(", ")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t.rescheduleFeeLabel}</span>
                    <span>{RESCHEDULE_FEE.toLocaleString()} RWF</span>
                  </div>
                  {selected.fareDifference > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t.fareDifference}</span>
                      <span>{selected.fareDifference.toLocaleString()} RWF</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-border font-medium">
                    <span>{t.totalDue}</span>
                    <span className="text-primary">{totalDue.toLocaleString()} RWF</span>
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3 mb-4 text-sm text-destructive">
                  {error}
                </div>
              )}

              <Label className="text-base font-medium">{t.paymentMethodLabel}</Label>
              <RadioGroup
                value={paymentMethod}
                onValueChange={(v) => setPaymentMethod(v as "mtn" | "airtel" | "card")}
                className="space-y-3 mt-3"
              >
                <label
                  htmlFor="rs-mtn"
                  className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-colors ${
                    paymentMethod === "mtn" ? "border-primary bg-primary/5" : "border-border"
                  }`}
                >
                  <RadioGroupItem value="mtn" id="rs-mtn" />
                  <div className="h-10 w-10 rounded-lg bg-[#FFCC00] flex items-center justify-center">
                    <Smartphone className="h-5 w-5 text-black" />
                  </div>
                  <div className="font-medium">{t.mtnMoMo}</div>
                </label>

                <label
                  htmlFor="rs-airtel"
                  className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-colors ${
                    paymentMethod === "airtel" ? "border-primary bg-primary/5" : "border-border"
                  }`}
                >
                  <RadioGroupItem value="airtel" id="rs-airtel" />
                  <div className="h-10 w-10 rounded-lg bg-[#E40000] flex items-center justify-center">
                    <Smartphone className="h-5 w-5 text-white" />
                  </div>
                  <div className="font-medium">{t.airtelMoney}</div>
                </label>

                <label
                  htmlFor="rs-card"
                  className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-colors ${
                    paymentMethod === "card" ? "border-primary bg-primary/5" : "border-border"
                  }`}
                >
                  <RadioGroupItem value="card" id="rs-card" />
                  <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div className="font-medium">{t.cardPayment}</div>
                </label>
              </RadioGroup>

              {(paymentMethod === "mtn" || paymentMethod === "airtel") && (
                <div className="space-y-2 mt-4">
                  <Label htmlFor="rs-phone">{t.phoneLabel}</Label>
                  <Input
                    id="rs-phone"
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
        <div className="p-6 border-t border-border">
          {step === "select" ? (
            <Button
              onClick={() => setStep("payment")}
              className="w-full"
              size="lg"
              disabled={!selected}
            >
              {t.continueBtn}
            </Button>
          ) : (
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep("select")}
                className="flex-1"
                disabled={isProcessing}
              >
                {t.back}
              </Button>
              <Button
                onClick={handlePayment}
                className="flex-1 gap-2"
                disabled={
                  isProcessing ||
                  ((paymentMethod === "mtn" || paymentMethod === "airtel") && !phoneNumber)
                }
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t.processing}
                  </>
                ) : (
                  format(t.payAmount, { amount: totalDue.toLocaleString() })
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
