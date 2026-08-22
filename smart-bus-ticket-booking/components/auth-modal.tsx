"use client"

import React from "react"

import { useState } from "react"
import { X, Mail, Lock, User, Phone, Eye, EyeOff, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { signUp, signIn, type UserData } from "@/lib/auth"

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (user: { name: string; email: string; phone: string }) => void
  initialMode?: "login" | "signup"
  onForgotPassword?: () => void
}

export function AuthModal({ isOpen, onClose, onSuccess, initialMode = "login", onForgotPassword }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "signup">(initialMode)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  if (!isOpen) return null

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (mode === "signup" && !formData.name.trim()) {
      newErrors.name = "Name is required"
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format"
    }

    if (mode === "signup" && !formData.phone.trim()) {
      newErrors.phone = "Phone number is required"
    }

    if (!formData.password) {
      newErrors.password = "Password is required"
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)

    try {
      let result
      
      if (mode === "signup") {
        result = await signUp(formData.email, formData.password, formData.name, formData.phone)
      } else {
        result = await signIn(formData.email, formData.password)
      }

      if (result.success) {
        let name = formData.name
        let phone = formData.phone
        if (mode !== "signup" && "userData" in result && result.userData) {
          const ud = result.userData as UserData
          name = ud.name || formData.email.split("@")[0]
          phone = ud.phone || "+250 78 XXX XXXX"
        }
        onSuccess({
          name,
          email: formData.email,
          phone,
        })
      } else {
        setErrors({ general: result.error || "Authentication failed" })
      }
    } catch {
      setErrors({ general: "An unexpected error occurred" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const switchMode = () => {
    setMode(mode === "login" ? "signup" : "login")
    setErrors({})
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-foreground/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md mx-4 bg-card rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="relative bg-primary p-6 text-center">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-full hover:bg-primary-foreground/20 transition-colors"
          >
            <X className="h-5 w-5 text-primary-foreground" />
          </button>
          <h2 className="text-2xl font-bold text-primary-foreground">
            {mode === "login" ? "Operator Sign In" : "Create Operator Account"}
          </h2>
          <p className="text-primary-foreground/80 mt-1 text-sm">
            {mode === "login"
              ? "For bus companies and administrators"
              : "Register a bus company on BUS CONNECT"}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {mode === "signup" && (
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  className={`pl-10 ${errors.name ? "border-destructive" : ""}`}
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                />
              </div>
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                className={`pl-10 ${errors.email ? "border-destructive" : ""}`}
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
              />
            </div>
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
          </div>

          {mode === "signup" && (
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+250 7XX XXX XXX"
                  className={`pl-10 ${errors.phone ? "border-destructive" : ""}`}
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                />
              </div>
              {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                className={`pl-10 pr-10 ${errors.password ? "border-destructive" : ""}`}
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
          </div>

          {errors.general && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">{errors.general}</p>
            </div>
          )}

          {mode === "login" && (
            <div className="flex justify-end">
              <button 
                type="button" 
                onClick={onForgotPassword}
                className="text-sm text-primary hover:underline"
              >
                Forgot password?
              </button>
            </div>
          )}

          <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {mode === "login" ? "Signing in..." : "Creating account..."}
              </>
            ) : (
              <>{mode === "login" ? "Sign In" : "Create Account"}</>
            )}
          </Button>

          <p className="text-center text-sm text-muted-foreground mt-6">
            {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
            <button type="button" onClick={switchMode} className="text-primary hover:underline font-medium">
              {mode === "login" ? "Sign up" : "Sign in"}
            </button>
          </p>

          {/* Passengers never register - they buy with a ticket ID and PIN. */}
          <p className="text-center text-xs text-muted-foreground border-t border-border pt-4">
            Just booking a seat? You don&apos;t need an account. Search for your bus and pay -
            your ticket ID and PIN are all you need.
          </p>
        </form>
      </div>
    </div>
  )
}
