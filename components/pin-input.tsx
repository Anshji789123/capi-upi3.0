"use client"

import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface PinInputProps {
  length?: number
  onComplete: (pin: string) => void
  value?: string
  onChange?: (pin: string) => void
  disabled?: boolean
  className?: string
  placeholder?: string
}

export function PinInput({ 
  length = 4, 
  onComplete, 
  value = "", 
  onChange, 
  disabled = false, 
  className,
  placeholder = "Enter PIN"
}: PinInputProps) {
  const [pins, setPins] = useState<string[]>(Array(length).fill(""))
  const refs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (value) {
      const newPins = value.split("").slice(0, length)
      while (newPins.length < length) {
        newPins.push("")
      }
      setPins(newPins)
    }
  }, [value, length])

  const handleChange = (index: number, digit: string) => {
    if (!/^\d*$/.test(digit)) return // Only allow digits

    const newPins = [...pins]
    newPins[index] = digit.slice(-1) // Only take last digit if multiple entered

    setPins(newPins)
    onChange?.(newPins.join(""))

    // Auto-focus next input
    if (digit && index < length - 1) {
      refs.current[index + 1]?.focus()
    }

    // Check if all filled
    const pinString = newPins.join("")
    if (pinString.length === length && pinString.split("").every(p => p !== "")) {
      onComplete(pinString)
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !pins[index] && index > 0) {
      refs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length)
    
    if (pastedData) {
      const newPins = Array(length).fill("")
      for (let i = 0; i < pastedData.length; i++) {
        newPins[i] = pastedData[i]
      }
      setPins(newPins)
      onChange?.(newPins.join(""))

      if (pastedData.length === length) {
        onComplete(pastedData)
      }
    }
  }

  return (
    <div className={cn("flex gap-2 justify-center", className)}>
      {pins.map((pin, index) => (
        <Input
          key={index}
          ref={(el) => (refs.current[index] = el)}
          type="password"
          inputMode="numeric"
          pattern="\d*"
          maxLength={1}
          value={pin}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          disabled={disabled}
          className="w-12 h-12 text-center text-lg font-bold bg-gray-800 border-gray-600 text-white"
          placeholder={index === 0 ? placeholder.charAt(0) : "•"}
        />
      ))}
    </div>
  )
}
