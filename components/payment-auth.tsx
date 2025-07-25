"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { PinInput } from "@/components/pin-input"
import { useBiometricAuth } from "@/hooks/use-biometric-auth"
import { Fingerprint, Shield, Lock, AlertCircle, CheckCircle, XCircle } from "lucide-react"

interface PaymentAuthProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  amount: number
  recipient: string
  message?: string
  loading?: boolean
  userId?: string
}

type AuthMethod = "choose" | "biometric" | "pin"

export function PaymentAuth({
  isOpen,
  onClose,
  onSuccess,
  amount,
  recipient,
  message,
  loading = false,
  userId = "current-user"
}: PaymentAuthProps) {
  const [authMethod, setAuthMethod] = useState<AuthMethod>("choose")
  const [pin, setPin] = useState("")
  const [authMessage, setAuthMessage] = useState("")
  const [authError, setAuthError] = useState("")
  const [biometricAttempted, setBiometricAttempted] = useState(false)

  const {
    isSupported,
    isRegistered,
    loading: biometricLoading,
    authenticateBiometric,
    checkSupport,
    checkRegistration,
  } = useBiometricAuth()

  useEffect(() => {
    if (isOpen) {
      // Reset state when dialog opens
      setAuthMethod("choose")
      setPin("")
      setAuthMessage("")
      setAuthError("")
      setBiometricAttempted(false)
      
      // Check biometric support and registration
      checkSupport()
      checkRegistration(userId)
    }
  }, [isOpen, checkSupport, checkRegistration])

  const handleBiometricAuth = async () => {
    setBiometricAttempted(true)
    setAuthError("")
    setAuthMessage("Please authenticate using your fingerprint or face...")
    
    const userId = "current-user" // Replace with actual user ID
    const result = await authenticateBiometric(userId)
    
    if (result.success) {
      setAuthMessage("✅ Biometric authentication successful!")
      setTimeout(() => {
        onSuccess()
      }, 1000)
    } else {
      setAuthError(result.error || "Biometric authentication failed")
      setAuthMessage("Biometric authentication failed. Please try again or use your PIN.")
      // Don't automatically switch to PIN, let user choose
    }
  }

  const handlePinSubmit = (enteredPin: string) => {
    if (enteredPin.length === 4) {
      setPin(enteredPin)
      // In a real app, you would verify the PIN against stored hash
      // For demo purposes, we'll simulate success
      setTimeout(() => {
        setAuthMessage("✅ PIN verification successful!")
        setTimeout(() => {
          onSuccess()
        }, 1000)
      }, 500)
    }
  }

  const handleClose = () => {
    setAuthMethod("choose")
    setPin("")
    setAuthMessage("")
    setAuthError("")
    setBiometricAttempted(false)
    onClose()
  }

  const renderChooseMethod = () => (
    <div className="space-y-4">
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div className="flex justify-between items-start mb-2">
          <span className="text-gray-400">Amount:</span>
          <span className="text-white font-bold text-lg">₹{amount.toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-start mb-2">
          <span className="text-gray-400">To:</span>
          <span className="text-white">@{recipient}</span>
        </div>
        {message && (
          <div className="flex justify-between items-start">
            <span className="text-gray-400">Message:</span>
            <span className="text-white text-sm">{message}</span>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <p className="text-gray-400 text-center">Choose your authentication method:</p>
        
        {isSupported && isRegistered && (
          <Button
            onClick={() => setAuthMethod("biometric")}
            className="w-full bg-blue-600 text-white hover:bg-blue-700 h-12"
            disabled={loading}
          >
            <Fingerprint className="h-5 w-5 mr-3" />
            Use Biometric Authentication
          </Button>
        )}

        <Button
          onClick={() => setAuthMethod("pin")}
          variant="outline"
          className="w-full border-gray-600 text-white hover:bg-gray-800 h-12"
          disabled={loading}
        >
          <Lock className="h-5 w-5 mr-3" />
          Use 4-Digit PIN
        </Button>
      </div>

      {!isSupported && (
        <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-4 w-4 text-yellow-400 mt-0.5" />
            <p className="text-sm text-yellow-300">
              Biometric authentication is not supported on this device. Please use your PIN.
            </p>
          </div>
        </div>
      )}

      {isSupported && !isRegistered && (
        <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-4 w-4 text-blue-400 mt-0.5" />
            <p className="text-sm text-blue-300">
              Biometric authentication is not set up. You can enable it in settings after this payment.
            </p>
          </div>
        </div>
      )}
    </div>
  )

  const renderBiometricAuth = () => (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto">
          <Fingerprint className="h-10 w-10 text-blue-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white mb-2">Biometric Authentication</h3>
          <p className="text-gray-400">
            Authenticate with your fingerprint or face to authorize the payment
          </p>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div className="text-center space-y-2">
          <p className="text-white font-medium">₹{amount.toLocaleString()}</p>
          <p className="text-gray-400">to @{recipient}</p>
        </div>
      </div>

      {!biometricAttempted && (
        <Button
          onClick={handleBiometricAuth}
          disabled={biometricLoading}
          className="w-full bg-blue-600 text-white hover:bg-blue-700"
        >
          {biometricLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Authenticating...
            </>
          ) : (
            <>
              <Fingerprint className="h-4 w-4 mr-2" />
              Authenticate Now
            </>
          )}
        </Button>
      )}

      {authMessage && (
        <div className={`p-3 rounded text-center ${
          authMessage.includes("✅")
            ? "bg-green-900/50 text-green-300 border border-green-700"
            : "bg-blue-900/50 text-blue-300 border border-blue-700"
        }`}>
          {authMessage}
        </div>
      )}

      {authError && (
        <div className="bg-red-900/50 text-red-300 border border-red-700 p-3 rounded text-center">
          {authError}
        </div>
      )}

      {authError && (
        <div className="space-y-2">
          <Button
            onClick={handleBiometricAuth}
            variant="outline"
            className="w-full border-blue-600 text-blue-400 hover:bg-blue-900/20"
            disabled={biometricLoading}
          >
            Try Biometric Again
          </Button>
          <Button
            onClick={() => setAuthMethod("pin")}
            variant="outline"
            className="w-full border-gray-600 text-white hover:bg-gray-800"
          >
            Use PIN Instead
          </Button>
        </div>
      )}

      <Button
        onClick={() => setAuthMethod("choose")}
        variant="ghost"
        className="w-full text-gray-400 hover:text-white"
      >
        ← Back to options
      </Button>
    </div>
  )

  const renderPinAuth = () => (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="w-20 h-20 bg-gray-600/20 rounded-full flex items-center justify-center mx-auto">
          <Lock className="h-10 w-10 text-gray-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white mb-2">PIN Authentication</h3>
          <p className="text-gray-400">
            Enter your 4-digit PIN to authorize the payment
          </p>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div className="text-center space-y-2">
          <p className="text-white font-medium">₹{amount.toLocaleString()}</p>
          <p className="text-gray-400">to @{recipient}</p>
        </div>
      </div>

      <div className="space-y-4">
        <PinInput 
          onComplete={handlePinSubmit}
          loading={loading}
        />
      </div>

      {authMessage && (
        <div className="bg-green-900/50 text-green-300 border border-green-700 p-3 rounded text-center">
          {authMessage}
        </div>
      )}

      <Button
        onClick={() => setAuthMethod("choose")}
        variant="ghost"
        className="w-full text-gray-400 hover:text-white"
      >
        ← Back to options
      </Button>
    </div>
  )

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Authorize Payment
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Please authenticate to complete your payment
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          {authMethod === "choose" && renderChooseMethod()}
          {authMethod === "biometric" && renderBiometricAuth()}
          {authMethod === "pin" && renderPinAuth()}
        </div>

        <div className="flex justify-end mt-6">
          <Button
            onClick={handleClose}
            variant="outline"
            className="border-gray-600 text-white hover:bg-gray-800"
            disabled={loading || biometricLoading}
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
