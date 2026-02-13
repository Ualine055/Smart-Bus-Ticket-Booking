"use client"

import { Button } from "@/components/ui/button"
import { X, User, Mail, Phone } from "lucide-react"

interface ProfileModalProps {
  user: { name: string; email: string; phone: string }
  onClose: () => void
}

export function ProfileModal({ user, onClose }: ProfileModalProps) {
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
              {user.name.charAt(0).toUpperCase()}
            </div>
          </div>

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
        </div>

        <div className="p-6 border-t border-border">
          <Button onClick={onClose} className="w-full">
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
