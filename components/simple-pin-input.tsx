"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"

interface SimplePinInputProps {
  onComplete: (pin: string) => void
  value?: string
  onChange?: (pin: string) => void
}

export function SimplePinInput({ onComplete, value = "", onChange }: SimplePinInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pin = e.target.value.replace(/\D/g, "").slice(0, 4) // Only digits, max 4
    onChange?.(pin)
    if (pin.length === 4) {
      onComplete(pin)
    }
  }

  return (
    <Input
      type="password"
      inputMode="numeric"
      pattern="\d*"
      maxLength={4}
      value={value}
      onChange={handleChange}
      placeholder="Enter 4-digit PIN"
      className="text-center text-lg font-bold bg-gray-800 border-gray-600 text-white max-w-32 mx-auto"
    />
  )
}
