"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X, Loader2 } from "lucide-react"
import { createSchedule, updateSchedule, type Schedule } from "@/lib/schedules"

interface ScheduleModalProps {
  /** Existing schedule to edit; omit to create a new one. */
  schedule?: Schedule | null
  companyId: string
  companyName: string
  onClose: () => void
  onSaved: () => void
}

type FormState = {
  from: string
  to: string
  departureTime: string
  durationMinutes: string
  price: string
  totalSeats: string
  busPlate: string
  busType: string
  amenities: string[]
}

const AMENITIES = [
  { id: "wifi", label: "WiFi" },
  { id: "ac", label: "Air conditioning" },
  { id: "charging", label: "Charging ports" },
]

const BUS_TYPES = ["Economy", "Standard", "Premium", "Luxury Coach", "VIP Express"]

function initialForm(schedule?: Schedule | null): FormState {
  return {
    from: schedule?.from ?? "",
    to: schedule?.to ?? "",
    departureTime: schedule?.departureTime ?? "",
    durationMinutes: schedule ? String(schedule.durationMinutes) : "",
    price: schedule ? String(schedule.price) : "",
    totalSeats: schedule ? String(schedule.totalSeats) : "",
    busPlate: schedule?.busPlate ?? "",
    busType: schedule?.busType ?? "Standard",
    amenities: schedule?.amenities ?? [],
  }
}

function validate(form: FormState) {
  const errors: Partial<Record<keyof FormState, string>> = {}

  if (!form.from.trim()) errors.from = "Departure city is required"
  if (!form.to.trim()) errors.to = "Destination is required"
  if (form.from.trim().toLowerCase() === form.to.trim().toLowerCase() && form.from.trim()) {
    errors.to = "Destination must differ from departure city"
  }
  if (!/^\d{2}:\d{2}$/.test(form.departureTime)) errors.departureTime = "Departure time is required"
  if (!form.busPlate.trim()) errors.busPlate = "Bus plate number is required"

  const duration = Number(form.durationMinutes)
  if (!Number.isFinite(duration) || duration < 5) {
    errors.durationMinutes = "Enter the trip length in minutes"
  }

  const price = Number(form.price)
  if (!Number.isFinite(price) || price < 1) errors.price = "Enter the fare in RWF"

  const seats = Number(form.totalSeats)
  if (!Number.isInteger(seats) || seats < 1 || seats > 90) {
    errors.totalSeats = "Enter the seat capacity (1-90)"
  }

  return errors
}

export function ScheduleModal({
  schedule,
  companyId,
  companyName,
  onClose,
  onSaved,
}: ScheduleModalProps) {
  const [form, setForm] = useState<FormState>(() => initialForm(schedule))
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [saveError, setSaveError] = useState("")
  const [saving, setSaving] = useState(false)

  const update = (field: keyof FormState, value: string | string[]) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }))
  }

  const toggleAmenity = (id: string) => {
    update(
      "amenities",
      form.amenities.includes(id)
        ? form.amenities.filter((item) => item !== id)
        : [...form.amenities, id],
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const found = validate(form)
    setErrors(found)
    if (Object.keys(found).length > 0) return

    setSaving(true)
    setSaveError("")

    const payload = {
      companyId,
      companyName,
      busPlate: form.busPlate.trim().toUpperCase(),
      busType: form.busType,
      from: form.from.trim(),
      to: form.to.trim(),
      departureTime: form.departureTime,
      durationMinutes: Number(form.durationMinutes),
      price: Number(form.price),
      totalSeats: Number(form.totalSeats),
      amenities: form.amenities,
      active: schedule?.active ?? true,
    }

    const result = schedule?.id
      ? await updateSchedule(schedule.id, payload)
      : await createSchedule(payload)

    setSaving(false)

    if (result.success) {
      onSaved()
    } else {
      setSaveError(result.error ?? "Could not save this schedule.")
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-bold">
              {schedule ? "Edit schedule" : "Add schedule"}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Runs every day at this time
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="from">From</Label>
              <Input
                id="from"
                placeholder="Kigali"
                value={form.from}
                onChange={(e) => update("from", e.target.value)}
                className={errors.from ? "border-destructive" : ""}
              />
              {errors.from && <p className="text-xs text-destructive">{errors.from}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="to">To</Label>
              <Input
                id="to"
                placeholder="Musanze"
                value={form.to}
                onChange={(e) => update("to", e.target.value)}
                className={errors.to ? "border-destructive" : ""}
              />
              {errors.to && <p className="text-xs text-destructive">{errors.to}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="departure">Departure time</Label>
              <Input
                id="departure"
                type="time"
                value={form.departureTime}
                onChange={(e) => update("departureTime", e.target.value)}
                className={errors.departureTime ? "border-destructive" : ""}
              />
              {errors.departureTime && (
                <p className="text-xs text-destructive">{errors.departureTime}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Trip length (minutes)</Label>
              <Input
                id="duration"
                type="number"
                min={5}
                placeholder="150"
                value={form.durationMinutes}
                onChange={(e) => update("durationMinutes", e.target.value)}
                className={errors.durationMinutes ? "border-destructive" : ""}
              />
              {errors.durationMinutes && (
                <p className="text-xs text-destructive">{errors.durationMinutes}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Fare (RWF)</Label>
              <Input
                id="price"
                type="number"
                min={1}
                placeholder="3500"
                value={form.price}
                onChange={(e) => update("price", e.target.value)}
                className={errors.price ? "border-destructive" : ""}
              />
              {errors.price && <p className="text-xs text-destructive">{errors.price}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="seats">Seat capacity</Label>
              <Input
                id="seats"
                type="number"
                min={1}
                max={90}
                placeholder="45"
                value={form.totalSeats}
                onChange={(e) => update("totalSeats", e.target.value)}
                className={errors.totalSeats ? "border-destructive" : ""}
              />
              {errors.totalSeats && <p className="text-xs text-destructive">{errors.totalSeats}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="plate">Bus plate</Label>
              <Input
                id="plate"
                placeholder="RAB 123 A"
                value={form.busPlate}
                onChange={(e) => update("busPlate", e.target.value)}
                className={errors.busPlate ? "border-destructive" : ""}
              />
              {errors.busPlate && <p className="text-xs text-destructive">{errors.busPlate}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="bus-type">Bus type</Label>
              <select
                id="bus-type"
                value={form.busType}
                onChange={(e) => update("busType", e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {BUS_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Amenities</Label>
            <div className="flex flex-wrap gap-2">
              {AMENITIES.map((amenity) => {
                const selected = form.amenities.includes(amenity.id)
                return (
                  <button
                    key={amenity.id}
                    type="button"
                    onClick={() => toggleAmenity(amenity.id)}
                    className={`px-3 py-1.5 rounded-lg border text-sm transition-colors ${
                      selected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-muted-foreground"
                    }`}
                  >
                    {amenity.label}
                  </button>
                )
              })}
            </div>
          </div>

          {saveError && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">{saveError}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1 gap-2" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : schedule ? (
                "Save changes"
              ) : (
                "Add schedule"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
