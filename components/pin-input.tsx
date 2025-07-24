"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface PinInputProps {
  onComplete: (pin: string) => void
  loading?: boolean
}

export function PinInput({ onComplete, loading = false }: PinInputProps) {
  const [pin, setPin] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (pin.length === 4) {
      onComplete(pin)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        type="password"
        value={pin}
        onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
        placeholder="Enter 4-digit PIN"
        className="text-center text-lg bg-gray-800 border-gray-600 text-white"
        maxLength={4}
      />
      <Button 
        type="submit" 
        disabled={pin.length !== 4 || loading}
        className="w-full bg-white text-black hover:bg-gray-200"
      >
        {loading ? "Processing..." : "Confirm"}
      </Button>
    </form>
  )
}
