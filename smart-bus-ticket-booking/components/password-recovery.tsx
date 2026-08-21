"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X, Mail, CheckCircle, ArrowLeft } from "lucide-react"
import { resetPassword } from "@/lib/auth"

interface PasswordRecoveryProps {
  isOpen: boolean
  onClose: () => void
}

/**
 * Firebase reports a missing account with `auth/user-not-found`. We deliberately
 * show the same success screen in that case so the form cannot be used to discover
 * which email addresses are registered (email enumeration).
 */
function messageForError(code: string) {
  switch (code) {
    case "auth/invalid-email":
      return "That email address doesn't look valid."
    case "auth/missing-email":
      return "Please enter your email address."
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a few minutes and try again."
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again."
    default:
      return "Could not send the reset link. Please try again."
  }
}

export function PasswordRecovery({ isOpen, onClose }: PasswordRecoveryProps) {
  const [step, setStep] = useState<"email" | "success">("email")
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  if (!isOpen) return null

  const handleClose = () => {
    setStep("email")
    setEmail("")
    setError("")
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    const result = await resetPassword(email.trim())

    setIsLoading(false)

    if (result.success || String(result.error).includes("auth/user-not-found")) {
      setStep("success")
      return
    }

    const code = String(result.error).match(/\(([^)]+)\)/)?.[1] ?? ""
    setError(messageForError(code))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-foreground/60 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative w-full max-w-md mx-4 bg-card rounded-2xl shadow-2xl overflow-hidden">
        {step === "email" ? (
          <>
            <div className="relative bg-primary p-6 text-center">
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 p-1 rounded-full hover:bg-primary-foreground/20"
              >
                <X className="h-5 w-5 text-primary-foreground" />
              </button>
              <h2 className="text-2xl font-bold text-primary-foreground">Forgot Password?</h2>
              <p className="text-primary-foreground/80 mt-1 text-sm">
                Enter your email to reset your password
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="recovery-email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="recovery-email"
                    type="email"
                    placeholder="Enter your email"
                    className="pl-10"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      if (error) setError("")
                    }}
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <Button type="submit" className="w-full" size="lg" disabled={isLoading || !email.trim()}>
                {isLoading ? "Sending..." : "Send Reset Link"}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full gap-2"
                onClick={handleClose}
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Login
              </Button>
            </form>
          </>
        ) : (
          <>
            <div className="p-6 text-center">
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 p-1 rounded-full hover:bg-secondary"
              >
                <X className="h-5 w-5" />
              </button>
              
              <div className="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-10 w-10 text-primary" />
              </div>

              <h2 className="text-2xl font-bold mb-2">Check Your Email</h2>
              <p className="text-muted-foreground mb-6">
                We've sent a password reset link to <strong>{email}</strong>
              </p>

              <div className="bg-secondary/50 rounded-xl p-4 text-sm text-left mb-6">
                <p className="font-medium mb-2">Next steps:</p>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>Check your email inbox</li>
                  <li>Click the reset link</li>
                  <li>Create a new password</li>
                </ol>
              </div>

              <Button onClick={handleClose} className="w-full">
                Done
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
