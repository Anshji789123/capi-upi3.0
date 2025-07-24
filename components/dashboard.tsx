"use client"

import type React from "react"
import { setDoc } from "firebase/firestore" // Import setDoc from firebase/firestore

import { useState, useEffect } from "react"
import { signOut } from "firebase/auth"
import { doc, getDoc, updateDoc, collection, query, where, getDocs, addDoc, onSnapshot } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PinInput } from "@/components/pin-input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import {
  CreditCard,
  Send,
  LogOut,
  Copy,
  Check,
  Users,
  Clock,
  History,
  Plus,
  TrendingUp,
  Wallet,
  Shield,
  Gift,
  Settings,
  Bell,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  KeyRound,
} from "lucide-react"

interface UserData {
  name: string
  email: string
  cardId: string
  balance: number
  payLaterLimit?: number
  payLaterUsed?: number
  income?: number
  profession?: string
  age?: number
  joinedAt?: string
  pin?: string
  pinCreatedAt?: string
}

interface Transaction {
  id: string
  senderId: string
  senderCardId: string
  recipientId: string
  recipientCardId: string
  amount: number
  timestamp: string
  status: string
  type?: string
}

interface Notification {
  id: string
  type: 'debit' | 'credit'
  amount: number
  cardId?: string
  timestamp: number
}

interface DashboardProps {
  onLogout: () => void
}

export function Dashboard({ onLogout }: DashboardProps) {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [availableUsers, setAvailableUsers] = useState<UserData[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [paymentAmount, setPaymentAmount] = useState("")
  const [recipientCardId, setRecipientCardId] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState("send")
  const [balanceVisible, setBalanceVisible] = useState(true)
  const [dataLoading, setDataLoading] = useState(true)
  const [notifications, setNotifications] = useState<Notification[]>([])

  // PIN related states
  const [showPinSetup, setShowPinSetup] = useState(false)
  const [showPinVerification, setShowPinVerification] = useState(false)
  const [pinSetupStep, setPinSetupStep] = useState<'create' | 'confirm'>('create')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [verifyPin, setVerifyPin] = useState('')
  const [pinMessage, setPinMessage] = useState('')
  const [pendingPayment, setPendingPayment] = useState<{
    type: 'regular' | 'payLater'
    amount: number
    recipientCardId: string
  } | null>(null)

  // Pay Later form states
  const [showPayLaterForm, setShowPayLaterForm] = useState(false)
  const [income, setIncome] = useState("")
  const [profession, setProfession] = useState("")
  const [age, setAge] = useState("")
  const [payLaterAmount, setPayLaterAmount] = useState("")

  useEffect(() => {
    const fetchUserData = async () => {
      if (!auth.currentUser) {
        setDataLoading(false)
        return
      }

      try {
        console.log("Fetching user data for:", auth.currentUser.uid)

        // Try to get from server first
        let userDoc
        try {
          userDoc = await getDoc(doc(db, "users", auth.currentUser.uid))
        } catch (serverError) {
          console.log("Server fetch failed, trying cache:", serverError)
          // Fallback to cache
          userDoc = await getDoc(doc(db, "users", auth.currentUser.uid))
        }

        if (userDoc.exists()) {
          const data = userDoc.data() as UserData
          console.log("User data loaded:", data)
          setUserData(data)
        } else {
          console.log("No user document found, creating one...")
          // Create user document if it doesn't exist
          const cardId = `${auth.currentUser.email?.split("@")[0] || "user"}${Math.floor(Math.random() * 1000)}-capi`
          const newUserData = {
            name: auth.currentUser.displayName || auth.currentUser.email?.split("@")[0] || "User",
            email: auth.currentUser.email || "",
            cardId,
            balance: 10000,
            createdAt: new Date().toISOString(),
          }

          await setDoc(doc(db, "users", auth.currentUser.uid), newUserData) // Use setDoc here
          setUserData(newUserData)
          console.log("Created new user document:", newUserData)
        }
      } catch (error) {
        console.error("Error fetching user data:", error)
      } finally {
        setDataLoading(false)
      }
    }

    fetchUserData()
  }, [])

  // Real-time user data updates
  useEffect(() => {
    if (!auth.currentUser) return

    console.log("Setting up real-time user data listener...")
    const unsubscribe = onSnapshot(
      doc(db, "users", auth.currentUser.uid),
      (doc) => {
        if (doc.exists()) {
          const data = doc.data() as UserData
          console.log("Real-time user data update:", data)
          setUserData(data)
        }
      },
      (error) => {
        console.error("Error in user data listener:", error)
      },
    )

    return () => unsubscribe()
  }, [])

  // Real-time available users
  useEffect(() => {
    console.log("Setting up real-time users listener...")
    const unsubscribe = onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        console.log("Users snapshot received, docs count:", snapshot.docs.length)
        const users: UserData[] = []
        snapshot.forEach((doc) => {
          const userData = doc.data() as UserData
          console.log("User found:", userData.name, userData.cardId)
          if (doc.id !== auth.currentUser?.uid) {
            users.push(userData)
          }
        })
        console.log("Available users:", users.length)
        setAvailableUsers(users)
      },
      (error) => {
        console.error("Error fetching users:", error)
      },
    )

    return () => unsubscribe()
  }, [])

  // Real-time transactions
  useEffect(() => {
    if (!auth.currentUser) return

    const q1 = query(collection(db, "transactions"), where("senderId", "==", auth.currentUser.uid))
    const q2 = query(collection(db, "transactions"), where("recipientId", "==", auth.currentUser.uid))

    const unsubscribe1 = onSnapshot(q1, (snapshot) => {
      const sent: Transaction[] = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Transaction) }))

      const unsubscribe2 = onSnapshot(q2, (snap2) => {
        const received: Transaction[] = snap2.docs.map((d) => ({ id: d.id, ...(d.data() as Transaction) }))

        // Merge, sort by timestamp DESC, and keep latest 15
        const combined = [...sent, ...received].sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        )
        setTransactions(combined.slice(0, 15))
      })

      return () => unsubscribe2()
    })

    return () => unsubscribe1()
  }, [])

  const copyCardId = () => {
    if (userData?.cardId) {
      navigator.clipboard.writeText(userData.cardId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const calculatePayLaterLimit = (income: number, age: number, profession: string) => {
    let baseLimit = Math.min(income * 0.15, 100000) // 15% of annual income or max 100k

    // Age factor
    if (age >= 25 && age <= 35) baseLimit *= 1.3
    else if (age >= 36 && age <= 50) baseLimit *= 1.2
    else if (age >= 18 && age <= 24) baseLimit *= 1.1

    // Profession factor
    const professionMultiplier: { [key: string]: number } = {
      software_engineer: 1.4,
      doctor: 1.5,
      business_owner: 1.3,
      consultant: 1.2,
      teacher: 1.1,
      other: 1.0,
    }

    baseLimit *= professionMultiplier[profession] || 1.0

    return Math.floor(baseLimit)
  }

  const handlePayLaterApplication = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userData || !auth.currentUser) return

    setLoading(true)
    setMessage("")

    try {
      console.log("Applying for Pay Later...")
      const annualIncome = Number.parseInt(income)
      const userAge = Number.parseInt(age)
      const approvedLimit = calculatePayLaterLimit(annualIncome, userAge, profession)

      console.log("Calculated limit:", approvedLimit)

      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        income: annualIncome,
        profession,
        age: userAge,
        payLaterLimit: approvedLimit,
        payLaterUsed: 0,
      })

      setShowPayLaterForm(false)
      setMessage(`🎉 Congratulations! You've been pre-approved for ₹${approvedLimit.toLocaleString()} Pay Later limit.`)

      // Clear form
      setIncome("")
      setProfession("")
      setAge("")
    } catch (error) {
      console.error("Pay Later application error:", error)
      setMessage("❌ Application failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handlePayLaterPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userData || !auth.currentUser) return

    const amount = Number.parseFloat(payLaterAmount)
    const availableLimit = (userData.payLaterLimit || 0) - (userData.payLaterUsed || 0)

    if (amount <= 0) {
      setMessage("❌ Please enter a valid amount")
      return
    }

    if (amount > availableLimit) {
      setMessage(`❌ Amount exceeds available Pay Later limit of ₹${availableLimit.toLocaleString()}`)
      return
    }

    if (!recipientCardId.trim()) {
      setMessage("❌ Please enter recipient Card ID")
      return
    }

    // Check if PIN is set up
    if (!userData.pin) {
      setMessage("❌ Please set up a PIN first for secure payments")
      setShowPinSetup(true)
      return
    }

    // Set pending payment and show PIN verification
    setPendingPayment({
      type: 'payLater',
      amount,
      recipientCardId: recipientCardId.trim()
    })
    setShowPinVerification(true)
    setMessage("")
  }

  const handleRegularPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userData || !auth.currentUser) return

    const amount = Number.parseFloat(paymentAmount)

    if (amount <= 0) {
      setMessage("❌ Please enter a valid amount")
      return
    }

    if (amount > userData.balance) {
      setMessage("❌ Insufficient balance")
      return
    }

    if (!recipientCardId.trim()) {
      setMessage("❌ Please enter recipient Card ID")
      return
    }

    // Check if PIN is set up
    if (!userData.pin) {
      setMessage("❌ Please set up a PIN first for secure payments")
      setShowPinSetup(true)
      return
    }

    // Set pending payment and show PIN verification
    setPendingPayment({
      type: 'regular',
      amount,
      recipientCardId: recipientCardId.trim()
    })
    setShowPinVerification(true)
    setMessage("")
  }

  const handleLogout = async () => {
    await signOut(auth)
    onLogout()
  }

  const quickPayUser = (cardId: string) => {
    setRecipientCardId(cardId)
    // Auto scroll to payment form
    document.getElementById("payment-section")?.scrollIntoView({ behavior: "smooth" })
  }

  const addNotification = (type: 'debit' | 'credit', amount: number, cardId?: string) => {
    const notification: Notification = {
      id: Date.now().toString(),
      type,
      amount,
      cardId,
      timestamp: Date.now()
    }

    setNotifications(prev => [notification, ...prev.slice(0, 4)]) // Keep only last 5 notifications

    // Auto-remove notification after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id))
    }, 5000)
  }

  const handlePinSetup = async () => {
    if (!userData || !auth.currentUser) return

    if (pinSetupStep === 'create') {
      if (newPin.length !== 4) {
        setPinMessage("❌ PIN must be 4 digits")
        return
      }
      setPinSetupStep('confirm')
      setPinMessage('')
    } else {
      if (confirmPin !== newPin) {
        setPinMessage("❌ PINs do not match. Please try again.")
        setConfirmPin('')
        setPinSetupStep('create')
        setNewPin('')
        return
      }

      try {
        await updateDoc(doc(db, "users", auth.currentUser.uid), {
          pin: newPin,
          pinCreatedAt: new Date().toISOString(),
        })

        setShowPinSetup(false)
        setPinSetupStep('create')
        setNewPin('')
        setConfirmPin('')
        setPinMessage('')
        setMessage("🔒 PIN created successfully! Your payments are now secure.")
      } catch (error) {
        console.error("PIN setup error:", error)
        setPinMessage("❌ Failed to create PIN. Please try again.")
      }
    }
  }

  const handlePinVerification = async (pin: string) => {
    if (!userData || !pendingPayment) return

    if (pin !== userData.pin) {
      setPinMessage("❌ Incorrect PIN. Please try again.")
      setVerifyPin('')
      return
    }

    setShowPinVerification(false)
    setVerifyPin('')
    setPinMessage('')

    // Execute the pending payment
    if (pendingPayment.type === 'regular') {
      await executeRegularPayment(pendingPayment.amount, pendingPayment.recipientCardId)
    } else {
      await executePayLaterPayment(pendingPayment.amount, pendingPayment.recipientCardId)
    }

    setPendingPayment(null)
  }

  const executeRegularPayment = async (amount: number, recipientCardId: string) => {
    if (!userData || !auth.currentUser) return

    setLoading(true)
    setMessage("")

    try {
      // Find recipient by card ID
      const usersRef = collection(db, "users")
      const q = query(usersRef, where("cardId", "==", recipientCardId.trim()))
      const querySnapshot = await getDocs(q)

      if (querySnapshot.empty) {
        setMessage("❌ Recipient Card ID not found")
        return
      }

      const recipientDoc = querySnapshot.docs[0]
      const recipientData = recipientDoc.data()

      // Update sender balance
      const newSenderBalance = userData.balance - amount
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        balance: newSenderBalance,
      })

      // Update recipient balance
      const newRecipientBalance = recipientData.balance + amount
      await updateDoc(doc(db, "users", recipientDoc.id), {
        balance: newRecipientBalance,
      })

      // Create transaction record
      await addDoc(collection(db, "transactions"), {
        senderId: auth.currentUser.uid,
        senderCardId: userData.cardId,
        recipientId: recipientDoc.id,
        recipientCardId: recipientCardId.trim(),
        amount: amount,
        timestamp: new Date().toISOString(),
        status: "completed",
        type: "regular",
      })

      setPaymentAmount("")
      setRecipientCardId("")
      setMessage(`�� Successfully sent ₹${amount.toLocaleString()} to @${recipientCardId}`)
    } catch (error) {
      console.error("Regular payment error:", error)
      setMessage("❌ Payment failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const executePayLaterPayment = async (amount: number, recipientCardId: string) => {
    if (!userData || !auth.currentUser) return

    setLoading(true)
    setMessage("")

    try {
      // Find recipient by card ID
      const usersRef = collection(db, "users")
      const q = query(usersRef, where("cardId", "==", recipientCardId.trim()))
      const querySnapshot = await getDocs(q)

      if (querySnapshot.empty) {
        setMessage("❌ Recipient Card ID not found")
        return
      }

      const recipientDoc = querySnapshot.docs[0]
      const recipientData = recipientDoc.data()

      // Update sender Pay Later used amount
      const newPayLaterUsed = (userData.payLaterUsed || 0) + amount
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        payLaterUsed: newPayLaterUsed,
      })

      // Update recipient balance
      const newRecipientBalance = recipientData.balance + amount
      await updateDoc(doc(db, "users", recipientDoc.id), {
        balance: newRecipientBalance,
      })

      // Create transaction record
      await addDoc(collection(db, "transactions"), {
        senderId: auth.currentUser.uid,
        senderCardId: userData.cardId,
        recipientId: recipientDoc.id,
        recipientCardId: recipientCardId.trim(),
        amount: amount,
        timestamp: new Date().toISOString(),
        status: "completed",
        type: "pay_later",
      })

      setPayLaterAmount("")
      setRecipientCardId("")
      setMessage(`✅ Successfully sent ₹${amount.toLocaleString()} using Pay Later to @${recipientCardId}`)
    } catch (error) {
      console.error("Pay Later payment error:", error)
      setMessage("❌ Payment failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (dataLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-black font-bold text-xl">C</span>
          </div>
          <div className="text-white text-xl mb-2">Loading your dashboard...</div>
          <div className="text-gray-400">Setting up your CAPI account</div>
        </div>
      </div>
    )
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-xl mb-4">Unable to load user data</div>
          <Button onClick={handleLogout} className="bg-white text-black hover:bg-gray-200">
            Sign Out & Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-black/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <span className="text-black font-bold text-sm">C</span>
            </div>
            <span className="text-xl font-bold text-white">CAPI Dashboard</span>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
              <Bell className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
              <Settings className="h-4 w-4" />
            </Button>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-black bg-transparent"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="border border-gray-700 bg-gradient-to-br from-blue-900/20 to-blue-800/20">
            <CardContent className="p-4 text-center">
              <Wallet className="h-8 w-8 text-blue-400 mx-auto mb-2" />
              <p className="text-blue-400 text-sm font-medium">Balance</p>
              <p className="text-white text-xl font-bold">₹{userData.balance.toLocaleString()}</p>
            </CardContent>
          </Card>

          <Card className="border border-gray-700 bg-gradient-to-br from-green-900/20 to-green-800/20">
            <CardContent className="p-4 text-center">
              <Clock className="h-8 w-8 text-green-400 mx-auto mb-2" />
              <p className="text-green-400 text-sm font-medium">Pay Later</p>
              <p className="text-white text-xl font-bold">
                ₹{((userData.payLaterLimit || 0) - (userData.payLaterUsed || 0)).toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card className="border border-gray-700 bg-gradient-to-br from-purple-900/20 to-purple-800/20">
            <CardContent className="p-4 text-center">
              <Users className="h-8 w-8 text-purple-400 mx-auto mb-2" />
              <p className="text-purple-400 text-sm font-medium">Active Users</p>
              <p className="text-white text-xl font-bold">{availableUsers.length}</p>
            </CardContent>
          </Card>

          <Card className="border border-gray-700 bg-gradient-to-br from-orange-900/20 to-orange-800/20">
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-8 w-8 text-orange-400 mx-auto mb-2" />
              <p className="text-orange-400 text-sm font-medium">Transactions</p>
              <p className="text-white text-xl font-bold">{transactions.length}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Virtual Card */}
          <Card className="border border-gray-700 bg-gradient-to-br from-gray-900 to-gray-800 lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <div className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Your CAPI Card
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setBalanceVisible(!balanceVisible)}
                  className="text-gray-400 hover:text-white"
                >
                  {balanceVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gradient-to-r from-gray-800 to-gray-700 p-6 rounded-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>

                <div className="flex justify-between items-start mb-8 relative z-10">
                  <div>
                    <p className="text-gray-400 text-sm">CAPI CARD</p>
                    <p className="text-white font-bold text-lg">Virtual Payment Card</p>
                  </div>
                  <div className="text-right">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                      <span className="text-black font-bold">C</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 relative z-10">
                  <div>
                    <p className="text-gray-400 text-sm">Card ID</p>
                    <div className="flex items-center space-x-2">
                      <p className="text-white font-mono text-lg">@{userData.cardId}</p>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={copyCardId}
                        className="text-gray-400 hover:text-white p-1"
                      >
                        {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <p className="text-gray-400 text-sm">Cardholder Name</p>
                    <p className="text-white font-semibold">{userData.name.toUpperCase()}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-400 text-sm">Available Balance</p>
                      <p className="text-white font-bold text-xl">
                        {balanceVisible ? `₹${userData.balance.toLocaleString()}` : "••••••"}
                      </p>
                    </div>

                    {userData.payLaterLimit && (
                      <div>
                        <p className="text-gray-400 text-sm">Pay Later</p>
                        <p className="text-green-400 font-bold text-xl">
                          {balanceVisible
                            ? `₹${((userData.payLaterLimit || 0) - (userData.payLaterUsed || 0)).toLocaleString()}`
                            : "••••••"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-3">
                <Button className="bg-white text-black hover:bg-gray-200 flex items-center justify-center">
                  <Send className="h-4 w-4 mr-2" />
                  Quick Pay
                </Button>
                <Button
                  variant="outline"
                  className="border-gray-600 text-white hover:bg-gray-800 bg-transparent"
                  onClick={() => setShowPinSetup(true)}
                >
                  {userData.pin ? (
                    <>
                      <Lock className="h-4 w-4 mr-2" />
                      Change PIN
                    </>
                  ) : (
                    <>
                      <KeyRound className="h-4 w-4 mr-2" />
                      Setup PIN
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Payment Section */}
          <Card className="border border-gray-700 bg-gray-900 lg:col-span-1" id="payment-section">
            <CardHeader>
              <div className="flex space-x-2">
                <Button
                  variant={activeTab === "send" ? "default" : "ghost"}
                  onClick={() => setActiveTab("send")}
                  className={`flex-1 ${activeTab === "send" ? "bg-white text-black" : "text-gray-400 hover:text-white"}`}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send Money
                </Button>
                <Button
                  variant={activeTab === "payLater" ? "default" : "ghost"}
                  onClick={() => setActiveTab("payLater")}
                  className={`flex-1 ${activeTab === "payLater" ? "bg-white text-black" : "text-gray-400 hover:text-white"}`}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Pay Later
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {activeTab === "send" && (
                <form onSubmit={handleRegularPayment} className="space-y-4">
                  <div>
                    <Label htmlFor="recipient" className="text-white">
                      Recipient Card ID
                    </Label>
                    <Input
                      id="recipient"
                      type="text"
                      value={recipientCardId}
                      onChange={(e) => setRecipientCardId(e.target.value)}
                      placeholder="Enter recipient's Card ID (e.g., john123-capi)"
                      className="bg-gray-800 border-gray-600 text-white"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="amount" className="text-white">
                      Amount (₹)
                    </Label>
                    <Input
                      id="amount"
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      placeholder="Enter amount"
                      className="bg-gray-800 border-gray-600 text-white"
                      min="1"
                      max={userData.balance}
                      required
                    />
                    <p className="text-gray-400 text-sm mt-1">Available: ₹{userData.balance.toLocaleString()}</p>
                  </div>

                  <Button type="submit" disabled={loading} className="w-full bg-white text-black hover:bg-gray-200">
                    {loading ? "Processing..." : "Send Money"}
                  </Button>
                </form>
              )}

              {activeTab === "payLater" && (
                <div className="space-y-4">
                  {!userData.payLaterLimit ? (
                    !showPayLaterForm ? (
                      <div className="text-center space-y-4">
                        <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 p-6 rounded-lg">
                          <Clock className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                          <h3 className="text-white font-bold text-lg mb-2">Get Instant Credit</h3>
                          <p className="text-gray-400 mb-4">Apply for Pay Later to get pre-approved credit limit</p>
                          <Button
                            onClick={() => setShowPayLaterForm(true)}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Apply for Pay Later
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={handlePayLaterApplication} className="space-y-4">
                        <div className="bg-gray-800 p-4 rounded-lg mb-4">
                          <h3 className="text-white font-semibold mb-2">📋 Application Details</h3>
                          <p className="text-gray-400 text-sm">Provide your details for instant pre-approval</p>
                        </div>

                        <div>
                          <Label htmlFor="income" className="text-white">
                            Annual Income (₹)
                          </Label>
                          <Input
                            id="income"
                            type="number"
                            value={income}
                            onChange={(e) => setIncome(e.target.value)}
                            placeholder="e.g., 500000"
                            className="bg-gray-800 border-gray-600 text-white"
                            min="100000"
                            required
                          />
                        </div>

                        <div>
                          <Label htmlFor="profession" className="text-white">
                            Profession
                          </Label>
                          <Select value={profession} onValueChange={setProfession} required>
                            <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                              <SelectValue placeholder="Select your profession" />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-800 border-gray-600">
                              <SelectItem value="software_engineer">Software Engineer</SelectItem>
                              <SelectItem value="doctor">Doctor</SelectItem>
                              <SelectItem value="teacher">Teacher</SelectItem>
                              <SelectItem value="business_owner">Business Owner</SelectItem>
                              <SelectItem value="consultant">Consultant</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="age" className="text-white">
                            Age
                          </Label>
                          <Input
                            id="age"
                            type="number"
                            value={age}
                            onChange={(e) => setAge(e.target.value)}
                            placeholder="e.g., 28"
                            className="bg-gray-800 border-gray-600 text-white"
                            min="18"
                            max="65"
                            required
                          />
                        </div>

                        <div className="flex space-x-2">
                          <Button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700"
                          >
                            {loading ? "Processing..." : "Apply Now"}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setShowPayLaterForm(false)}
                            className="text-gray-400 hover:text-white"
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    )
                  ) : (
                    <form onSubmit={handlePayLaterPayment} className="space-y-4">
                      <div className="bg-gradient-to-r from-green-900/20 to-blue-900/20 p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-white font-semibold">Pay Later Available</p>
                            <p className="text-green-400 text-2xl font-bold">
                              ���{((userData.payLaterLimit || 0) - (userData.payLaterUsed || 0)).toLocaleString()}
                            </p>
                          </div>
                          <Shield className="h-8 w-8 text-green-400" />
                        </div>
                        <p className="text-gray-400 text-sm mt-2">
                          Total Limit: ₹{(userData.payLaterLimit || 0).toLocaleString()} | Used: ₹
                          {(userData.payLaterUsed || 0).toLocaleString()}
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="recipient-paylater" className="text-white">
                          Recipient Card ID
                        </Label>
                        <Input
                          id="recipient-paylater"
                          type="text"
                          value={recipientCardId}
                          onChange={(e) => setRecipientCardId(e.target.value)}
                          placeholder="Enter recipient's Card ID"
                          className="bg-gray-800 border-gray-600 text-white"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="paylater-amount" className="text-white">
                          Amount (₹)
                        </Label>
                        <Input
                          id="paylater-amount"
                          type="number"
                          value={payLaterAmount}
                          onChange={(e) => setPayLaterAmount(e.target.value)}
                          placeholder="Enter amount"
                          className="bg-gray-800 border-gray-600 text-white"
                          min="1"
                          max={(userData.payLaterLimit || 0) - (userData.payLaterUsed || 0)}
                          required
                        />
                        <p className="text-gray-400 text-sm mt-1">
                          Available: ₹{((userData.payLaterLimit || 0) - (userData.payLaterUsed || 0)).toLocaleString()}
                        </p>
                      </div>

                      <Button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white hover:from-green-700 hover:to-blue-700"
                      >
                        {loading ? "Processing..." : "Pay with Credit"}
                      </Button>
                    </form>
                  )}
                </div>
              )}

              {message && (
                <div
                  className={`p-3 rounded mt-4 ${
                    message.includes("✅") || message.includes("🎉")
                      ? "bg-green-900/50 text-green-300 border border-green-700"
                      : "bg-red-900/50 text-red-300 border border-red-700"
                  }`}
                >
                  {message}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Available Users */}
          <Card className="border border-gray-700 bg-gray-900 lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <div className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Live Users
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-green-400 text-sm font-medium">{availableUsers.length} online</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {availableUsers.length > 0 ? (
                  availableUsers.map((user, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-all duration-200 cursor-pointer group"
                      onClick={() => quickPayUser(user.cardId)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-gray-800"></div>
                        </div>
                        <div>
                          <p className="text-white font-semibold">{user.name}</p>
                          <p className="text-gray-400 text-sm font-mono">@{user.cardId}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className="bg-white text-black hover:bg-gray-200 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation()
                          quickPayUser(user.cardId)
                        }}
                      >
                        Pay
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No other users online</p>
                    <p className="text-gray-500 text-sm">Invite friends to join CAPI!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transaction History */}
        <Card className="border border-gray-700 bg-gray-900 mt-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              <div className="flex items-center">
                <History className="h-5 w-5 mr-2" />
                Recent Transactions
              </div>
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                View All
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {transactions.length > 0 ? (
                transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          transaction.senderId === auth.currentUser?.uid
                            ? "bg-red-500/20 text-red-400"
                            : "bg-green-500/20 text-green-400"
                        }`}
                      >
                        {transaction.senderId === auth.currentUser?.uid ? (
                          <Send className="h-5 w-5" />
                        ) : (
                          <Plus className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <p className="text-white font-semibold">
                          {transaction.senderId === auth.currentUser?.uid ? "Sent to" : "Received from"} @
                          {transaction.senderId === auth.currentUser?.uid
                            ? transaction.recipientCardId
                            : transaction.senderCardId}
                        </p>
                        <div className="flex items-center space-x-2">
                          <p className="text-gray-400 text-sm">{new Date(transaction.timestamp).toLocaleString()}</p>
                          {transaction.type === "pay_later" && (
                            <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium">
                              Pay Later
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-bold text-lg ${
                          transaction.senderId === auth.currentUser?.uid ? "text-red-400" : "text-green-400"
                        }`}
                      >
                        {transaction.senderId === auth.currentUser?.uid ? "-" : "+"}₹
                        {transaction.amount.toLocaleString()}
                      </p>
                      <p className="text-gray-400 text-sm capitalize">{transaction.status}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <History className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg">No transactions yet</p>
                  <p className="text-gray-500">Start sending money to see your transaction history</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* PIN Setup Dialog */}
      <Dialog open={showPinSetup} onOpenChange={setShowPinSetup}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <KeyRound className="h-5 w-5 mr-2" />
              {userData?.pin ? 'Change PIN' : 'Setup PIN'}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {pinSetupStep === 'create'
                ? 'Create a 4-digit PIN to secure your payments'
                : 'Confirm your PIN by entering it again'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-sm text-gray-400 mb-4">
                {pinSetupStep === 'create' ? 'Enter your new PIN' : 'Confirm your PIN'}
              </p>
              <PinInput
                onComplete={pinSetupStep === 'create' ? setNewPin : setConfirmPin}
                value={pinSetupStep === 'create' ? newPin : confirmPin}
                onChange={pinSetupStep === 'create' ? setNewPin : setConfirmPin}
                className="mb-4"
              />
            </div>

            {pinMessage && (
              <div className={`p-3 rounded text-center ${
                pinMessage.includes('❌')
                  ? 'bg-red-900/50 text-red-300 border border-red-700'
                  : 'bg-green-900/50 text-green-300 border border-green-700'
              }`}>
                {pinMessage}
              </div>
            )}

            <div className="flex space-x-3">
              <Button
                onClick={handlePinSetup}
                disabled={pinSetupStep === 'create' ? newPin.length !== 4 : confirmPin.length !== 4}
                className="flex-1 bg-white text-black hover:bg-gray-200"
              >
                {pinSetupStep === 'create' ? 'Continue' : 'Confirm PIN'}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setShowPinSetup(false)
                  setPinSetupStep('create')
                  setNewPin('')
                  setConfirmPin('')
                  setPinMessage('')
                }}
                className="text-gray-400 hover:text-white"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* PIN Verification Dialog */}
      <Dialog open={showPinVerification} onOpenChange={() => {
        setShowPinVerification(false)
        setPendingPayment(null)
        setVerifyPin('')
        setPinMessage('')
      }}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Verify PIN
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Enter your PIN to authorize this payment of ₹{pendingPayment?.amount.toLocaleString()} to @{pendingPayment?.recipientCardId}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-sm text-gray-400 mb-4">Enter your 4-digit PIN</p>
              <PinInput
                onComplete={handlePinVerification}
                value={verifyPin}
                onChange={setVerifyPin}
                className="mb-4"
              />
            </div>

            {pinMessage && (
              <div className="p-3 rounded text-center bg-red-900/50 text-red-300 border border-red-700">
                {pinMessage}
              </div>
            )}

            <div className="flex space-x-3">
              <Button
                onClick={() => handlePinVerification(verifyPin)}
                disabled={verifyPin.length !== 4 || loading}
                className="flex-1 bg-white text-black hover:bg-gray-200"
              >
                {loading ? 'Processing...' : 'Authorize Payment'}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setShowPinVerification(false)
                  setPendingPayment(null)
                  setVerifyPin('')
                  setPinMessage('')
                }}
                className="text-gray-400 hover:text-white"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
