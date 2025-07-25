"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PaymentAuth } from "@/components/payment-auth"
import { BiometricSetup } from "@/components/biometric-setup"
import { Fingerprint, CreditCard } from "lucide-react"

export default function PaymentAuthTestPage() {
  const [showPaymentAuth, setShowPaymentAuth] = useState(false)
  const [showBiometricSetup, setShowBiometricSetup] = useState(false)
  const [lastResult, setLastResult] = useState("")

  const handlePaymentSuccess = () => {
    setShowPaymentAuth(false)
    setLastResult("✅ Payment authorized successfully!")
    setTimeout(() => setLastResult(""), 3000)
  }

  const handleBiometricSetupSuccess = () => {
    setShowBiometricSetup(false)
    setLastResult("✅ Biometric authentication set up successfully!")
    setTimeout(() => setLastResult(""), 3000)
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Payment Authentication Test</h1>
          <p className="text-gray-400">
            Test the biometric and PIN-based payment authentication system
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border-gray-700 bg-gray-900">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <Fingerprint className="h-5 w-5 mr-2" />
                Biometric Setup
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-400 text-sm">
                Set up fingerprint or face recognition for secure payments
              </p>
              <Button
                onClick={() => setShowBiometricSetup(true)}
                className="w-full bg-blue-600 text-white hover:bg-blue-700"
              >
                Setup Biometric Auth
              </Button>
            </CardContent>
          </Card>

          <Card className="border-gray-700 bg-gray-900">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <CreditCard className="h-5 w-5 mr-2" />
                Test Payment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-400 text-sm">
                Test the payment authentication flow with both biometric and PIN options
              </p>
              <Button
                onClick={() => setShowPaymentAuth(true)}
                className="w-full bg-green-600 text-white hover:bg-green-700"
              >
                Test Payment Flow
              </Button>
            </CardContent>
          </Card>
        </div>

        {lastResult && (
          <Card className="border-green-700 bg-green-900/20">
            <CardContent className="p-4">
              <p className="text-green-300 text-center font-medium">{lastResult}</p>
            </CardContent>
          </Card>
        )}

        <Card className="border-gray-700 bg-gray-900">
          <CardHeader>
            <CardTitle className="text-white">How it Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-gray-300">
            <div>
              <h4 className="font-semibold text-white mb-2">Payment Authentication Options:</h4>
              <ul className="space-y-2 text-sm">
                <li>• <strong>Biometric:</strong> Use fingerprint or face recognition if supported and set up</li>
                <li>• <strong>PIN:</strong> Enter your 4-digit PIN as a fallback option</li>
                <li>• <strong>Automatic Fallback:</strong> If biometric fails, you can easily switch to PIN</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-2">Security Features:</h4>
              <ul className="space-y-2 text-sm">
                <li>• Biometric data never leaves your device</li>
                <li>• WebAuthn standard for secure authentication</li>
                <li>• PIN as reliable backup method</li>
                <li>• No biometric data stored on servers</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <PaymentAuth
          isOpen={showPaymentAuth}
          onClose={() => setShowPaymentAuth(false)}
          onSuccess={handlePaymentSuccess}
          amount={1500}
          recipient="john.doe"
          message="Coffee payment"
        />

        <BiometricSetup
          userId="test-user"
          isOpen={showBiometricSetup}
          onClose={() => setShowBiometricSetup(false)}
          onSuccess={handleBiometricSetupSuccess}
        />
      </div>
    </div>
  )
}
