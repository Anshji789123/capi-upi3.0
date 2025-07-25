"use client"

import { useState, useCallback } from "react"

export interface BiometricAuthResult {
  success: boolean
  error?: string
  credentialId?: string
}

export function useBiometricAuth() {
  const [isSupported, setIsSupported] = useState<boolean | null>(null)
  const [isRegistered, setIsRegistered] = useState(false)
  const [loading, setLoading] = useState(false)

  // Check if WebAuthn is supported
  const checkSupport = useCallback(() => {
    if (typeof window === "undefined") {
      setIsSupported(false)
      return false
    }

    // Check if we're in an iframe or embedded context
    const isInFrame = window !== window.top

    // Check basic WebAuthn support
    const hasWebAuthn = window.PublicKeyCredential &&
                       navigator.credentials &&
                       typeof navigator.credentials.create === "function"

    // If in iframe, WebAuthn likely won't work due to permissions
    const supported = hasWebAuthn && !isInFrame

    setIsSupported(supported)
    return supported
  }, [])

  // Register biometric credentials
  const registerBiometric = useCallback(async (userId: string): Promise<BiometricAuthResult> => {
    if (typeof window === "undefined" || !checkSupport()) {
      return { success: false, error: "Biometric authentication not supported" }
    }

    setLoading(true)
    try {
      const challenge = new Uint8Array(32)
      crypto.getRandomValues(challenge)

      const credential = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: {
            name: "CAPI Payment",
            id: window.location.hostname,
          },
          user: {
            id: new TextEncoder().encode(userId),
            name: userId,
            displayName: "CAPI User",
          },
          pubKeyCredParams: [
            { alg: -7, type: "public-key" }, // ES256
            { alg: -257, type: "public-key" }, // RS256
          ],
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "required",
          },
          timeout: 60000,
          attestation: "direct",
        },
      }) as PublicKeyCredential

      if (credential) {
        // Store credential ID in localStorage for this demo
        const credentialId = Array.from(new Uint8Array(credential.rawId))
          .map(b => b.toString(16).padStart(2, "0"))
          .join("")
        
        localStorage.setItem(`biometric_${userId}`, credentialId)
        setIsRegistered(true)
        
        return { 
          success: true, 
          credentialId 
        }
      }
      
      return { success: false, error: "Failed to create credential" }
    } catch (error: any) {
      console.error("Biometric registration error:", error)

      let errorMessage = "Failed to register biometric authentication"

      const isInFrame = typeof window !== "undefined" && window !== window.top

      if (error.name === "NotAllowedError") {
        errorMessage = isInFrame
          ? "Biometric authentication is not available in embedded contexts. Please open this page in a new tab."
          : "Biometric authentication was cancelled or denied"
      } else if (error.message?.includes("publickey-credentials-create") || error.message?.includes("Permissions Policy")) {
        errorMessage = isInFrame
          ? "Biometric authentication requires opening this page directly in your browser. Please open in a new tab."
          : "Biometric authentication is not available in this browser context. Please use a supported browser."
      }

      return {
        success: false,
        error: errorMessage
      }
    } finally {
      setLoading(false)
    }
  }, [checkSupport])

  // Authenticate using biometrics
  const authenticateBiometric = useCallback(async (userId: string): Promise<BiometricAuthResult> => {
    if (typeof window === "undefined" || !checkSupport()) {
      return { success: false, error: "Biometric authentication not supported" }
    }

    const storedCredentialId = localStorage.getItem(`biometric_${userId}`)
    if (!storedCredentialId) {
      return { success: false, error: "No biometric credentials found. Please set up biometric authentication first." }
    }

    setLoading(true)
    try {
      const challenge = new Uint8Array(32)
      crypto.getRandomValues(challenge)

      // Convert stored credential ID back to Uint8Array
      const credentialIdBytes = new Uint8Array(
        storedCredentialId.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
      )

      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge,
          allowCredentials: [{
            id: credentialIdBytes,
            type: "public-key",
          }],
          userVerification: "required",
          timeout: 60000,
        },
      })

      if (assertion) {
        return { success: true }
      }
      
      return { success: false, error: "Authentication failed" }
    } catch (error: any) {
      console.error("Biometric authentication error:", error)

      let errorMessage = "Biometric authentication failed"

      const isInFrame = typeof window !== "undefined" && window !== window.top

      if (error.name === "NotAllowedError") {
        errorMessage = isInFrame
          ? "Biometric authentication is not available in embedded contexts. Please use your PIN or open in a new tab."
          : "Biometric authentication was cancelled or denied"
      } else if (error.message?.includes("publickey-credentials-get") || error.message?.includes("Permissions Policy")) {
        errorMessage = isInFrame
          ? "Biometric authentication requires opening this page directly. Please use your PIN or open in a new tab."
          : "Biometric authentication is not available in this browser context. Please use your PIN instead."
      }

      return {
        success: false,
        error: errorMessage
      }
    } finally {
      setLoading(false)
    }
  }, [checkSupport])

  // Check if user has registered biometrics
  const checkRegistration = useCallback((userId: string) => {
    if (typeof window === "undefined") {
      setIsRegistered(false)
      return false
    }
    const hasCredential = !!localStorage.getItem(`biometric_${userId}`)
    setIsRegistered(hasCredential)
    return hasCredential
  }, [])

  // Remove biometric credentials
  const removeBiometric = useCallback((userId: string) => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(`biometric_${userId}`)
    }
    setIsRegistered(false)
  }, [])

  return {
    isSupported,
    isRegistered,
    loading,
    checkSupport,
    registerBiometric,
    authenticateBiometric,
    checkRegistration,
    removeBiometric,
  }
}
