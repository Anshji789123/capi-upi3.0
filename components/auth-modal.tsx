"use client"

import type React from "react"

import { useState } from "react"
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth"
import { doc, setDoc, getDoc } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X } from "lucide-react"

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  onAdminLogin?: () => void
}

export function AuthModal({ isOpen, onClose, onSuccess, onAdminLogin }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  if (!isOpen) return null

  const generateCardId = (name: string) => {
    const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, "")
    const randomNum = Math.floor(Math.random() * 1000)
    return `${cleanName}${randomNum}-capi`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      if (isLogin) {
        // Sign in existing user
        const userCredential = await signInWithEmailAndPassword(auth, email, password)
        console.log("User signed in:", userCredential.user.uid)

        // Check if user data exists in Firestore
        const userDoc = await getDoc(doc(db, "users", userCredential.user.uid))
        if (!userDoc.exists()) {
          // If user data doesn't exist, create it (for existing users)
          const cardId = generateCardId(userCredential.user.email?.split("@")[0] || "user")
          await setDoc(doc(db, "users", userCredential.user.uid), {
            name: userCredential.user.email?.split("@")[0] || "User",
            email: userCredential.user.email || "",
            cardId,
            balance: 10000,
            createdAt: new Date().toISOString(),
          })
          console.log("Created user data for existing user")
        }
      } else {
        // Create new user
        console.log("Creating new user with:", { name, email })
        const userCredential = await createUserWithEmailAndPassword(auth, email, password)
        const user = userCredential.user
        console.log("New user created:", user.uid)

        // Create user document in Firestore
        const cardId = generateCardId(name)
        const userData = {
          name,
          email,
          cardId,
          balance: 10000,
          createdAt: new Date().toISOString(),
        }

        console.log("Saving user data:", userData)
        await setDoc(doc(db, "users", user.uid), userData)
        console.log("User data saved successfully")
      }

      onSuccess()
      onClose()

      // Reset form
      setEmail("")
      setPassword("")
      setName("")
    } catch (err: any) {
      console.error("Auth error:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-gray-900 border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white">{isLogin ? "Sign In to CAPI" : "Create CAPI Account"}</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <Label htmlFor="name" className="text-white">
                  Full Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={!isLogin}
                  className="bg-gray-800 border-gray-600 text-white"
                  placeholder="Enter your full name"
                />
              </div>
            )}
            <div>
              <Label htmlFor="email" className="text-white">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-gray-800 border-gray-600 text-white"
                placeholder="Enter your email"
              />
            </div>
            <div>
              <Label htmlFor="password" className="text-white">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-gray-800 border-gray-600 text-white"
                placeholder="Enter your password"
                minLength={6}
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full bg-white text-black hover:bg-gray-200">
              {loading ? "Loading..." : isLogin ? "Sign In" : "Create Account"}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-gray-400 hover:text-white text-sm"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
