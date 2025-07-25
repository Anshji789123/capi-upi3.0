"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useBiometricAuth } from "@/hooks/use-biometric-auth"
import { Fingerprint, Shield, CheckCircle, XCircle, AlertCircle } from "lucide-react"

interface BiometricSetupProps {
  userId: string
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function BiometricSetup({ userId, isOpen, onClose, onSuccess }: BiometricSetupProps) {
  const {
    isSupported,
    isRegistered,
    loading,
    checkSupport,
    registerBiometric,
    checkRegistration,
    removeBiometric,
  } = useBiometricAuth()

  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState<"success" | "error" | "info">("info")

  useEffect(() => {
    if (isOpen) {
      checkSupport()
      checkRegistration(userId)
    }
  }, [isOpen, userId, checkSupport, checkRegistration])

  const handleRegister = async () => {
    setMessage("")
    const result = await registerBiometric(userId)
    
    if (result.success) {
      setMessage("✅ Biometric authentication setup successfully!")
      setMessageType("success")
      setTimeout(() => {
        onSuccess()
        onClose()
      }, 1500)
    } else {
      setMessage(`❌ ${result.error}`)
      setMessageType("error")
    }
  }

  const handleRemove = () => {
    removeBiometric(userId)
    setMessage("🗑️ Biometric authentication removed")
    setMessageType("info")
  }

  if (!isSupported) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <XCircle className="h-5 w-5 mr-2 text-red-400" />
              Biometric Authentication Not Available
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Biometric authentication is not available in this browser context. This may be due to:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4">
              <ul className="text-sm text-yellow-300 space-y-2">
                <li>• You're viewing this in an iframe or embedded context</li>
                <li>• Your browser doesn't support WebAuthn</li>
                <li>• Browser permissions are restricted</li>
              </ul>
            </div>
            <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-400 mb-2">💡 Try this:</h4>
              <p className="text-sm text-blue-300">
                Open this page in a new browser tab or window to enable biometric authentication.
                You can always use your PIN for secure payments.
              </p>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={onClose} variant="outline" className="border-gray-600 text-white">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Fingerprint className="h-5 w-5 mr-2" />
            Biometric Authentication
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {isRegistered 
              ? "Manage your biometric authentication settings"
              : "Set up fingerprint or face recognition for secure payments"
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <Card className="border-gray-700 bg-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <Shield className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Enhanced Security</h3>
                  <p className="text-sm text-gray-400">
                    Use your fingerprint or face to authorize payments quickly and securely
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {!isRegistered ? (
            <div className="space-y-4">
              <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-400">How it works</h4>
                    <ul className="text-sm text-gray-300 mt-2 space-y-1">
                      <li>• Your biometric data stays on your device</li>
                      <li>• No biometric data is sent to our servers</li>
                      <li>• Works with fingerprint and face recognition</li>
                      <li>• You can always use your PIN as backup</li>
                    </ul>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleRegister}
                disabled={loading}
                className="w-full bg-blue-600 text-white hover:bg-blue-700"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Setting up...
                  </>
                ) : (
                  <>
                    <Fingerprint className="h-4 w-4 mr-2" />
                    Setup Biometric Authentication
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-4 flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <div>
                  <h4 className="text-sm font-medium text-green-400">Biometric Authentication Active</h4>
                  <p className="text-sm text-gray-300">You can now use biometrics to authorize payments</p>
                </div>
              </div>

              <Button
                onClick={handleRemove}
                variant="outline"
                className="w-full border-red-600 text-red-400 hover:bg-red-900/20"
              >
                Remove Biometric Authentication
              </Button>
            </div>
          )}

          {message && (
            <div className={`p-3 rounded text-center ${
              messageType === "success"
                ? "bg-green-900/50 text-green-300 border border-green-700"
                : messageType === "error"
                ? "bg-red-900/50 text-red-300 border border-red-700"
                : "bg-blue-900/50 text-blue-300 border border-blue-700"
            }`}>
              {message}
            </div>
          )}

          <div className="flex space-x-3">
            <Button onClick={onClose} variant="outline" className="flex-1 border-gray-600 text-white">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
