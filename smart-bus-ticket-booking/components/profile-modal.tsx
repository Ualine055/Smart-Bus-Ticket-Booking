"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X, User, Mail, Phone, Loader2, Check } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { updateUserProfile } from "@/lib/auth"

interface ProfileModalProps {
  user: { name: string; email: string; phone: string }
  onClose: () => void
}

export function ProfileModal({ user, onClose }: ProfileModalProps) {
  const { user: firebaseUser, refreshUserData } = useAuth()

  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(user.name)
  const [phone, setPhone] = useState(user.phone)
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({})
  const [saveError, setSaveError] = useState("")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const startEditing = () => {
    setName(user.name)
    setPhone(user.phone)
    setErrors({})
    setSaveError("")
    setSaved(false)
    setEditing(true)
  }

  const handleSave = async () => {
    if (!firebaseUser) return

    const found: { name?: string; phone?: string } = {}
    if (!name.trim()) found.name = "Name is required"
    if (!phone.trim()) found.phone = "Phone number is required"

    setErrors(found)
    if (Object.keys(found).length > 0) return

    setSaving(true)
    setSaveError("")

    const result = await updateUserProfile(firebaseUser.uid, name.trim(), phone.trim())

    setSaving(false)

    if (result.success) {
      await refreshUserData()
      setEditing(false)
      setSaved(true)
    } else {
      setSaveError(result.error ?? "Could not save your profile.")
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-bold">My Profile</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex justify-center">
            <div className="h-24 w-24 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-3xl font-bold">
              {(editing ? name : user.name).charAt(0).toUpperCase() || "?"}
            </div>
          </div>

          {saved && !editing && (
            <div className="p-3 bg-primary/10 border border-primary/20 rounded-md flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <p className="text-sm text-primary">Profile updated.</p>
            </div>
          )}

          {editing ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="profile-name">Full Name</Label>
                <Input
                  id="profile-name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }))
                  }}
                  className={errors.name ? "border-destructive" : ""}
                />
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="profile-phone">Phone Number</Label>
                <Input
                  id="profile-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value)
                    if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }))
                  }}
                  className={errors.phone ? "border-destructive" : ""}
                />
                {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
              </div>

              <div className="bg-secondary/50 rounded-xl p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                  <Mail className="h-4 w-4" />
                  Email Address
                </div>
                <div className="font-medium">{user.email}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Your email is your sign-in name and cannot be changed here.
                </p>
              </div>

              {saveError && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                  <p className="text-sm text-destructive">{saveError}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-secondary/50 rounded-xl p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                  <User className="h-4 w-4" />
                  Full Name
                </div>
                <div className="font-medium">{user.name}</div>
              </div>

              <div className="bg-secondary/50 rounded-xl p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                  <Mail className="h-4 w-4" />
                  Email Address
                </div>
                <div className="font-medium">{user.email}</div>
              </div>

              <div className="bg-secondary/50 rounded-xl p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                  <Phone className="h-4 w-4" />
                  Phone Number
                </div>
                <div className="font-medium">{user.phone}</div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-border flex gap-3">
          {editing ? (
            <>
              <Button
                variant="outline"
                onClick={() => setEditing(false)}
                className="flex-1"
                disabled={saving}
              >
                Cancel
              </Button>
              <Button onClick={handleSave} className="flex-1 gap-2" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save changes"
                )}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={startEditing} className="flex-1">
                Edit profile
              </Button>
              <Button onClick={onClose} className="flex-1">
                Close
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
