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
import { PaymentAuth } from "@/components/payment-auth"
import { BiometricSetup } from "@/components/biometric-setup"
import { useFirebaseConnection } from "@/hooks/use-firebase-connection"
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
  Fingerprint,
  DollarSign,
  CheckCircle,
  XCircle,
  ArrowDownLeft,
  Award,
  Target,
} from "lucide-react"

interface SubCard {
  id: string
  name: string
  cardId: string
  category: string
  limit: number
  used: number
  createdAt: string
  isActive: boolean
}

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
  creditScore?: number
  totalTransactionAmount?: number
  transactionCount?: number
  subCards?: SubCard[]
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
  subCardId?: string
  subCardName?: string
}

interface Notification {
  id: string
  type: 'debit' | 'credit'
  amount: number
  cardId?: string
  timestamp: number
}

interface PaymentRequest {
  id: string
  requesterId: string
  requesterCardId: string
  requesterName: string
  recipientId: string
  recipientCardId: string
  amount: number
  message?: string
  timestamp: string
  status: 'pending' | 'approved' | 'declined'
  type: 'payment_request'
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

  // Payment request states
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([])
  const [requestAmount, setRequestAmount] = useState("")
  const [requestRecipientCardId, setRequestRecipientCardId] = useState("")
  const [requestMessage, setRequestMessage] = useState("")
  const [pendingRequestApproval, setPendingRequestApproval] = useState<PaymentRequest | null>(null)
  const [showRequestApproval, setShowRequestApproval] = useState(false)

  // PIN related states
  const [showPinSetup, setShowPinSetup] = useState(false)
  const [showPinVerification, setShowPinVerification] = useState(false)
  const [showPaymentAuth, setShowPaymentAuth] = useState(false)
  const [showBiometricSetup, setShowBiometricSetup] = useState(false)

  // Block card states
  const [showBlockCard, setShowBlockCard] = useState(false)
  const [blockDuration, setBlockDuration] = useState("")
  const [isCardBlocked, setIsCardBlocked] = useState(false)
  const [blockMessage, setBlockMessage] = useState("")

  // Settings states
  const [showSettings, setShowSettings] = useState(false)
  const [newEmail, setNewEmail] = useState("")
  const [settingsMessage, setSettingsMessage] = useState("")

  // Chatbot states
  const [showChatbot, setShowChatbot] = useState(false)
  const [chatMessages, setChatMessages] = useState<Array<{id: string, text: string, isUser: boolean, timestamp: Date}>>([])
  const [chatInput, setChatInput] = useState("")

  // SubCard states
  const [showSubCardDialog, setShowSubCardDialog] = useState(false)
  const [subCardName, setSubCardName] = useState("")
  const [subCardCategory, setSubCardCategory] = useState("")
  const [subCardLimit, setSubCardLimit] = useState("")
  const [selectedSubCard, setSelectedSubCard] = useState<string>("") // For payment selection

  // Notification dropdown state
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false)

  // Firebase connection status
  const { isOnline, lastError } = useFirebaseConnection()
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
            creditScore: 300, // Starting credit score
            totalTransactionAmount: 0,
            transactionCount: 0,
            createdAt: new Date().toISOString(),
          }

          await setDoc(doc(db, "users", auth.currentUser.uid), newUserData) // Use setDoc here
          setUserData(newUserData)
          console.log("Created new user document:", newUserData)
        }
      } catch (error: any) {
        console.error("Error fetching user data:", error)

        // Handle offline scenarios gracefully
        if (error.code === 'unavailable' || error.message?.includes('offline')) {
          setMessage("⚠️ Working in offline mode. Some features may be limited.")
        } else if (error.code === 'permission-denied') {
          setMessage("❌ Permission denied. Please check your authentication.")
        } else {
          setMessage("❌ Unable to load user data. Please check your connection and try again.")
        }
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

          // Check for balance increase (incoming credit)
          if (userData && data.balance > userData.balance) {
            const creditAmount = data.balance - userData.balance
            addNotification('credit', creditAmount)
          }

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
      const sent: Transaction[] = snapshot.docs.map((d) => ({ ...(d.data() as Transaction), id: d.id }))

      const unsubscribe2 = onSnapshot(q2, (snap2) => {
        const received: Transaction[] = snap2.docs.map((d) => ({ ...(d.data() as Transaction), id: d.id }))

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

  // Real-time payment requests
  useEffect(() => {
    if (!auth.currentUser) return

    // Listen for incoming payment requests (where user is the recipient)
    const q1 = query(
      collection(db, "payment_requests"),
      where("recipientId", "==", auth.currentUser.uid),
      where("status", "==", "pending")
    )

    // Listen for outgoing payment requests (where user is the requester)
    const q2 = query(
      collection(db, "payment_requests"),
      where("requesterId", "==", auth.currentUser.uid)
    )

    const unsubscribe1 = onSnapshot(q1, (snapshot) => {
      const incoming: PaymentRequest[] = snapshot.docs.map((d) => ({ ...(d.data() as PaymentRequest), id: d.id }))

      const unsubscribe2 = onSnapshot(q2, (snap2) => {
        const outgoing: PaymentRequest[] = snap2.docs.map((d) => ({ ...(d.data() as PaymentRequest), id: d.id }))

        // Merge and sort by timestamp DESC
        const combined = [...incoming, ...outgoing].sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        )
        setPaymentRequests(combined)
      })

      return () => unsubscribe2()
    })

    return () => unsubscribe1()
  }, [])

  // Update credit score periodically
  useEffect(() => {
    if (!auth.currentUser || !userData) return

    // Update credit score on first load and after transactions
    if (auth.currentUser) {
      updateCreditScore(auth.currentUser.uid)
    }

    // Set up periodic updates (every 5 minutes)
    const interval = setInterval(() => {
      if (auth.currentUser) {
        updateCreditScore(auth.currentUser.uid)
      }
    }, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [transactions])

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (showNotificationDropdown && !target.closest('.notification-dropdown')) {
        setShowNotificationDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showNotificationDropdown])

  const copyCardId = () => {
    if (userData?.cardId) {
      navigator.clipboard.writeText(userData.cardId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const calculateCreditScore = (totalAmount: number, transactionCount: number) => {
    // Base score calculation
    let score = 300 // Starting score

    // Transaction amount factor (up to 400 points)
    const amountScore = Math.min(400, (totalAmount / 100000) * 100) // 100k transactions = 100 points

    // Transaction frequency factor (up to 200 points)
    const frequencyScore = Math.min(200, transactionCount * 5) // 5 points per transaction, max 200

    // Consistency bonus (up to 100 points)
    const consistencyBonus = transactionCount > 10 ? Math.min(100, transactionCount * 2) : 0

    score = score + amountScore + frequencyScore + consistencyBonus

    return Math.min(1000, Math.round(score)) // Cap at 1000
  }

  const updateCreditScore = async (userId: string) => {
    if (!auth.currentUser) return

    try {
      // Get all user transactions
      const sentQuery = query(collection(db, "transactions"), where("senderId", "==", userId))
      const receivedQuery = query(collection(db, "transactions"), where("recipientId", "==", userId))

      const [sentDocs, receivedDocs] = await Promise.all([
        getDocs(sentQuery),
        getDocs(receivedQuery)
      ])

      const allTransactions = [
        ...sentDocs.docs.map(doc => doc.data()),
        ...receivedDocs.docs.map(doc => doc.data())
      ]

      const totalAmount = allTransactions.reduce((sum, tx) => sum + (tx.amount || 0), 0)
      const transactionCount = allTransactions.length
      const creditScore = calculateCreditScore(totalAmount, transactionCount)

      // Get current credit score to check for improvements
      const currentUserDoc = await getDoc(doc(db, "users", userId))
      const currentData = currentUserDoc.data()
      const previousScore = currentData?.creditScore || 300

      // Update user's credit score
      await updateDoc(doc(db, "users", userId), {
        creditScore,
        totalTransactionAmount: totalAmount,
        transactionCount
      })

      // Credit score improvements no longer show as notifications
      // This was causing confusion with small amounts like 9-12 rupees

      console.log(`Credit score updated: ${creditScore} (Total: ₹${totalAmount}, Count: ${transactionCount})`)
    } catch (error) {
      console.error("Error updating credit score:", error)
    }
  }

  const getUpdatedPayLaterLimit = (baseLimitFromIncome: number, creditScore: number) => {
    let multiplier = 1.0

    if (creditScore >= 900) multiplier = 2.0      // Excellent: 2x limit
    else if (creditScore >= 800) multiplier = 1.7  // Very Good: 1.7x limit
    else if (creditScore >= 700) multiplier = 1.4  // Good: 1.4x limit
    else if (creditScore >= 600) multiplier = 1.2  // Fair: 1.2x limit
    else if (creditScore >= 500) multiplier = 1.0  // Average: 1x limit
    else multiplier = 0.8                          // Poor: 0.8x limit

    return Math.round(baseLimitFromIncome * multiplier)
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
      const baseLimit = calculatePayLaterLimit(annualIncome, userAge, profession)

      // Update credit score first
      await updateCreditScore(auth.currentUser.uid)

      // Get updated user data with credit score
      const updatedUserDoc = await getDoc(doc(db, "users", auth.currentUser.uid))
      const updatedUserData = updatedUserDoc.data()
      const currentCreditScore = updatedUserData?.creditScore || 300

      const approvedLimit = getUpdatedPayLaterLimit(baseLimit, currentCreditScore)

      console.log("Calculated limit:", approvedLimit, "Credit Score:", currentCreditScore)

      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        income: annualIncome,
        profession,
        age: userAge,
        payLaterLimit: approvedLimit,
        payLaterUsed: 0,
      })

      setShowPayLaterForm(false)
      setMessage(`Congratulations! You've been pre-approved for ₹${approvedLimit.toLocaleString()} Pay Later limit.`)

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
      setMessage(`❌ Amount exceeds available Pay Later limit of ��${availableLimit.toLocaleString()}`)
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

    // Set pending payment and show payment authentication
    setPendingPayment({
      type: 'payLater',
      amount,
      recipientCardId: recipientCardId.trim()
    })
    setShowPaymentAuth(true)
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

    // Set pending payment and show payment authentication
    setPendingPayment({
      type: 'regular',
      amount,
      recipientCardId: recipientCardId.trim()
    })
    setShowPaymentAuth(true)
    setMessage("")
  }

  const handleLogout = async () => {
    await signOut(auth)
    onLogout()
  }

  const quickPayUser = (cardId: string) => {
    setRecipientCardId(cardId)
    setActiveTab("send")
    // Auto scroll to payment form
    document.getElementById("payment-section")?.scrollIntoView({ behavior: "smooth" })
  }

  const quickRequestUser = (cardId: string) => {
    setRequestRecipientCardId(cardId)
    setActiveTab("request")
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

    // Auto-remove notification after 10 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id))
    }, 10000)
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
        setMessage("���� PIN created successfully! Your payments are now secure.")
      } catch (error) {
        console.error("PIN setup error:", error)
        setPinMessage("❌ Failed to create PIN. Please try again.")
      }
    }
  }

  const handlePaymentAuthSuccess = async () => {
    if (!pendingPayment) return

    setShowPaymentAuth(false)

    // Execute the pending payment
    if (pendingPayment.type === 'regular') {
      await executeRegularPayment(pendingPayment.amount, pendingPayment.recipientCardId)
    } else {
      await executePayLaterPayment(pendingPayment.amount, pendingPayment.recipientCardId)
    }

    setPendingPayment(null)
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

    // If a sub-card is selected, handle sub-card payment
    if (selectedSubCard) {
      return handleSubCardPayment(amount, recipientCardId, selectedSubCard)
    }

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
      setSelectedSubCard("")
      setMessage(`✅ Successfully sent ₹${amount.toLocaleString()} to @${recipientCardId}`)

      // Add notification for sender (debit)
      addNotification('debit', amount, recipientCardId.trim())

      // Update credit scores for both users
      await updateCreditScore(auth.currentUser.uid)
      await updateCreditScore(recipientDoc.id)
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

      // Add notification for sender (Pay Later debit)
      addNotification('debit', amount, recipientCardId.trim())

      // Update credit scores for both users
      await updateCreditScore(auth.currentUser.uid)
      await updateCreditScore(recipientDoc.id)
    } catch (error) {
      console.error("Pay Later payment error:", error)
      setMessage("❌ Payment failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handlePaymentRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userData || !auth.currentUser) return

    const amount = Number.parseFloat(requestAmount)

    if (amount <= 0) {
      setMessage("�� Please enter a valid amount")
      return
    }

    if (!requestRecipientCardId.trim()) {
      setMessage("❌ Please select a user to request money from")
      return
    }

    setLoading(true)
    setMessage("")

    try {
      // Find recipient by card ID
      const usersRef = collection(db, "users")
      const q = query(usersRef, where("cardId", "==", requestRecipientCardId.trim()))
      const querySnapshot = await getDocs(q)

      if (querySnapshot.empty) {
        setMessage("�� Recipient not found")
        return
      }

      const recipientDoc = querySnapshot.docs[0]
      const recipientData = recipientDoc.data()

      // Create payment request
      await addDoc(collection(db, "payment_requests"), {
        requesterId: auth.currentUser.uid,
        requesterCardId: userData.cardId,
        requesterName: userData.name,
        recipientId: recipientDoc.id,
        recipientCardId: requestRecipientCardId.trim(),
        amount: amount,
        message: requestMessage.trim() || "",
        timestamp: new Date().toISOString(),
        status: "pending",
        type: "payment_request",
      })

      setRequestAmount("")
      setRequestRecipientCardId("")
      setRequestMessage("")
      setMessage(`✅ Payment request sent to @${requestRecipientCardId} for ₹${amount.toLocaleString()}`)
    } catch (error) {
      console.error("Payment request error:", error)
      setMessage("❌ Failed to send payment request. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleRequestApproval = async (request: PaymentRequest, approved: boolean) => {
    if (!userData || !auth.currentUser) return

    if (approved) {
      // Check if user has sufficient balance
      if (request.amount > userData.balance) {
        setMessage("❌ Insufficient balance to approve this request")
        return
      }

      // Check if PIN is set up
      if (!userData.pin) {
        setMessage("❌ Please set up a PIN first for secure payments")
        setShowPinSetup(true)
        return
      }

      // Set pending request approval and show PIN verification
      setPendingRequestApproval(request)
      setShowRequestApproval(true)
      setMessage("")
    } else {
      // Decline the request
      setLoading(true)
      try {
        await updateDoc(doc(db, "payment_requests", request.id), {
          status: "declined",
        })
        setMessage(`❌ Payment request declined`)
      } catch (error) {
        console.error("Request decline error:", error)
        setMessage("❌ Failed to decline request. Please try again.")
      } finally {
        setLoading(false)
      }
    }
  }

  const executeRequestApproval = async (pin: string) => {
    if (!userData || !pendingRequestApproval || !auth.currentUser) return

    if (pin !== userData.pin) {
      setPinMessage("❌ Incorrect PIN. Please try again.")
      setVerifyPin('')
      return
    }

    setShowRequestApproval(false)
    setVerifyPin('')
    setPinMessage('')

    setLoading(true)
    setMessage("")

    try {
      const request = pendingRequestApproval

      // Update payer's balance (subtract)
      const newPayerBalance = userData.balance - request.amount
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        balance: newPayerBalance,
      })

      // Update requester's balance (add)
      const requesterDoc = await getDoc(doc(db, "users", request.requesterId))
      if (requesterDoc.exists()) {
        const requesterData = requesterDoc.data()
        const newRequesterBalance = requesterData.balance + request.amount
        await updateDoc(doc(db, "users", request.requesterId), {
          balance: newRequesterBalance,
        })
      }

      // Update request status
      await updateDoc(doc(db, "payment_requests", request.id), {
        status: "approved",
      })

      // Create transaction record
      await addDoc(collection(db, "transactions"), {
        senderId: auth.currentUser.uid,
        senderCardId: userData.cardId,
        recipientId: request.requesterId,
        recipientCardId: request.requesterCardId,
        amount: request.amount,
        timestamp: new Date().toISOString(),
        status: "completed",
        type: "request_payment",
      })

      setMessage(`✅ Successfully sent ₹${request.amount.toLocaleString()} to @${request.requesterCardId}`)

      // Add notification for payer (debit)
      addNotification('debit', request.amount, request.requesterCardId)

      // Update credit scores for both users
      await updateCreditScore(auth.currentUser.uid)
      await updateCreditScore(request.requesterId)
    } catch (error) {
      console.error("Request approval error:", error)
      setMessage("❌ Payment failed. Please try again.")
    } finally {
      setLoading(false)
      setPendingRequestApproval(null)
    }
  }

  const handleBlockCard = async () => {
    if (!userData || !auth.currentUser || !blockDuration) return

    setLoading(true)
    setBlockMessage("")

    try {
      const blockEndTime = new Date()
      switch (blockDuration) {
        case "1hour":
          blockEndTime.setHours(blockEndTime.getHours() + 1)
          break
        case "6hours":
          blockEndTime.setHours(blockEndTime.getHours() + 6)
          break
        case "24hours":
          blockEndTime.setDate(blockEndTime.getDate() + 1)
          break
        case "3days":
          blockEndTime.setDate(blockEndTime.getDate() + 3)
          break
        case "7days":
          blockEndTime.setDate(blockEndTime.getDate() + 7)
          break
        case "permanent":
          blockEndTime.setFullYear(blockEndTime.getFullYear() + 10) // Set far in future
          break
      }

      // Update user's card status
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        cardBlocked: true,
        blockDuration: blockDuration,
        blockEndTime: blockEndTime.toISOString(),
        blockedAt: new Date().toISOString(),
      })

      setIsCardBlocked(true)
      setShowBlockCard(false)
      setBlockDuration("")

      const durationText = blockDuration === "permanent" ? "permanently" : `for ${blockDuration.replace(/(\d+)/, '$1 ').replace('hours', 'hour(s)').replace('days', 'day(s)')}`
      setMessage(`🔒 Your card has been blocked ${durationText} for security. All transactions are now disabled.`)
      setBlockMessage("")
    } catch (error) {
      console.error("Card block error:", error)
      setBlockMessage("❌ Failed to block card. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleEmailUpdate = async () => {
    if (!userData || !auth.currentUser || !newEmail.trim()) return

    setLoading(true)
    setSettingsMessage("")

    try {
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        email: newEmail.trim(),
        updatedAt: new Date().toISOString(),
      })

      setSettingsMessage("✅ Email updated successfully!")
      setNewEmail("")
    } catch (error) {
      console.error("Email update error:", error)
      setSettingsMessage("❌ Failed to update email. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim()) return

    const userMessage = {
      id: Date.now().toString(),
      text: chatInput.trim(),
      isUser: true,
      timestamp: new Date()
    }

    setChatMessages(prev => [...prev, userMessage])

    // Simulate bot response
    setTimeout(() => {
      const botResponse = getBotResponse(chatInput.trim())
      const botMessage = {
        id: (Date.now() + 1).toString(),
        text: botResponse,
        isUser: false,
        timestamp: new Date()
      }
      setChatMessages(prev => [...prev, botMessage])
    }, 1000)

    setChatInput("")
  }

  const handleCreateSubCard = async () => {
    if (!userData || !auth.currentUser) return

    if (!subCardName.trim()) {
      setMessage("❌ Please enter a sub-card name")
      return
    }

    if (!subCardCategory) {
      setMessage("❌ Please select a category")
      return
    }

    const limit = Number.parseFloat(subCardLimit)
    if (limit <= 0 || limit > userData.balance) {
      setMessage("❌ Invalid limit amount")
      return
    }

    setLoading(true)
    try {
      const newSubCard: SubCard = {
        id: Date.now().toString(),
        name: subCardName.trim(),
        cardId: `${userData.cardId.split('-')[0]}.${subCardCategory.toLowerCase()}@capi`,
        category: subCardCategory,
        limit,
        used: 0,
        createdAt: new Date().toISOString(),
        isActive: true
      }

      const currentSubCards = userData.subCards || []
      const updatedSubCards = [...currentSubCards, newSubCard]

      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        subCards: updatedSubCards
      })

      setShowSubCardDialog(false)
      setSubCardName("")
      setSubCardCategory("")
      setSubCardLimit("")
      setMessage(`✅ Sub-card created: ${newSubCard.cardId}`)
    } catch (error) {
      console.error("Sub-card creation error:", error)
      setMessage("❌ Failed to create sub-card. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleSubCardPayment = async (amount: number, recipientCardId: string, subCardId: string) => {
    if (!userData || !auth.currentUser) return

    const subCard = userData.subCards?.find(sc => sc.id === subCardId)
    if (!subCard) {
      setMessage("❌ Sub-card not found")
      return
    }

    const availableLimit = subCard.limit - subCard.used
    if (amount > availableLimit) {
      setMessage(`❌ Amount exceeds sub-card limit of ₹${availableLimit.toLocaleString()}`)
      return
    }

    if (amount > userData.balance) {
      setMessage("❌ Insufficient main card balance")
      return
    }

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

      // Update sub-card usage
      const updatedSubCards = userData.subCards!.map(sc =>
        sc.id === subCardId ? { ...sc, used: sc.used + amount } : sc
      )

      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        balance: newSenderBalance,
        subCards: updatedSubCards
      })

      // Update recipient balance
      const newRecipientBalance = recipientData.balance + amount
      await updateDoc(doc(db, "users", recipientDoc.id), {
        balance: newRecipientBalance,
      })

      // Create transaction record with sub-card info
      await addDoc(collection(db, "transactions"), {
        senderId: auth.currentUser.uid,
        senderCardId: userData.cardId,
        recipientId: recipientDoc.id,
        recipientCardId: recipientCardId.trim(),
        amount: amount,
        timestamp: new Date().toISOString(),
        status: "completed",
        type: "sub_card",
        subCardId: subCard.id,
        subCardName: subCard.name
      })

      setPaymentAmount("")
      setRecipientCardId("")
      setSelectedSubCard("")
      setMessage(`✅ Successfully sent ₹${amount.toLocaleString()} from ${subCard.name} to @${recipientCardId}`)

      // Add notification for sender (debit)
      addNotification('debit', amount, recipientCardId.trim())

      // Update credit scores for both users
      await updateCreditScore(auth.currentUser.uid)
      await updateCreditScore(recipientDoc.id)
    } catch (error) {
      console.error("Sub-card payment error:", error)
      setMessage("❌ Payment failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleToggleSubCard = async (subCardId: string) => {
    if (!userData || !auth.currentUser) return

    setLoading(true)
    try {
      const updatedSubCards = userData.subCards!.map(sc =>
        sc.id === subCardId ? { ...sc, isActive: !sc.isActive } : sc
      )

      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        subCards: updatedSubCards
      })

      setMessage(`✅ Sub-card ${updatedSubCards.find(sc => sc.id === subCardId)?.isActive ? 'activated' : 'deactivated'}`)
    } catch (error) {
      console.error("Sub-card toggle error:", error)
      setMessage("❌ Failed to update sub-card status")
    } finally {
      setLoading(false)
    }
  }

  const getBotResponse = (input: string): string => {
    const lowerInput = input.toLowerCase()

    if (lowerInput.includes("sub card") || lowerInput.includes("subcard")) {
      return "Sub-cards help you manage spending by category! Create sub-cards for food, shopping, entertainment etc. Each has its own limit and tracks spending separately. Use the '+' button next to your main card to create one."
    }
    if (lowerInput.includes("balance") || lowerInput.includes("money")) {
      return "Your current balance is displayed on your dashboard. You can check it anytime in the balance card. If you need to add money, you can receive payments from other users."
    }
    if (lowerInput.includes("send") || lowerInput.includes("payment")) {
      return "To send money: 1) Go to the Send Money tab, 2) Enter the recipient's Card ID, 3) Enter the amount, 4) Complete PIN/biometric verification. Make sure you have sufficient balance!"
    }
    if (lowerInput.includes("pay later") || lowerInput.includes("credit")) {
      return "Pay Later allows you to spend money even without sufficient balance. To apply: 1) Go to Pay Later tab, 2) Fill your income and profession details, 3) Get instant approval based on your credit score."
    }
    if (lowerInput.includes("pin") || lowerInput.includes("security")) {
      return "For security, set up a 4-digit PIN in your card settings. You can also enable biometric authentication for faster payments. Always keep your PIN secret!"
    }
    if (lowerInput.includes("block") || lowerInput.includes("card") || lowerInput.includes("security")) {
      return "If your card details are leaked, immediately use the 'Block Card' feature in the footer. You can choose different block durations from 1 hour to permanent. This will disable all transactions."
    }
    if (lowerInput.includes("credit score")) {
      return "Your credit score improves with: 1) Regular transactions, 2) Higher transaction amounts, 3) Using Pay Later responsibly, 4) Maintaining payment consistency. Higher scores unlock better Pay Later limits!"
    }
    if (lowerInput.includes("request")) {
      return "To request money: 1) Go to Request tab, 2) Select the user you want to request from, 3) Enter amount and optional message, 4) Send request. The recipient will get a notification to approve."
    }
    if (lowerInput.includes("card id") || lowerInput.includes("cardid")) {
      return "Your Card ID is your unique identifier (like @john123-capi). Others use this to send you money. You can copy it from your card display. Share it safely with trusted contacts only."
    }
    if (lowerInput.includes("transaction") || lowerInput.includes("history")) {
      return "All your transactions appear in the Recent Transactions section. You can see sent/received payments, Pay Later transactions, and their status. Green = money received, Red = money sent."
    }
    if (lowerInput.includes("help") || lowerInput.includes("support")) {
      return "I can help with: account balance, sending money, Pay Later, credit scores, security features, transaction history, and general CAPI questions. What specific topic do you need help with?"
    }

    return "I'm here to help with CAPI! I can assist with payments, Pay Later, credit scores, security features, sub-cards, and account management. Could you please be more specific about what you need help with?"
  }

  // Store original function
  const executeRegularPaymentOriginal = executeRegularPayment

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
            <div className="relative notification-dropdown">
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white relative"
                onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
              >
                <Bell className="h-4 w-4" />
                {notifications.length > 0 && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">{notifications.length}</span>
                  </div>
                )}
              </Button>

              {showNotificationDropdown && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50">
                  <div className="p-4 border-b border-gray-700">
                    <h3 className="text-white font-semibold">Recent Activity</h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className="p-4 hover:bg-gray-700 transition-colors border-b border-gray-700 last:border-b-0"
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              notification.type === 'credit' ? 'bg-green-600' : 'bg-red-600'
                            }`}>
                              {notification.type === 'credit' ? (
                                <Plus className="h-4 w-4 text-white" />
                              ) : (
                                <Send className="h-4 w-4 text-white" />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="text-white font-semibold text-sm">
                                {notification.type === 'credit' ? 'Money Received' : 'Money Sent'}
                              </p>
                              <p className="text-gray-400 text-sm">
                                ₹{notification.amount.toLocaleString()}
                                {notification.cardId && ` ${notification.type === 'credit' ? 'from' : 'to'} @${notification.cardId}`}
                              </p>
                              <p className="text-gray-500 text-xs">
                                {new Date(notification.timestamp).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center">
                        <Bell className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400">No recent activity</p>
                        <p className="text-gray-500 text-sm">Your transactions will appear here</p>
                      </div>
                    )}
                  </div>
                  {notifications.length > 0 && (
                    <div className="p-4 border-t border-gray-700">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="w-full text-gray-400 hover:text-white"
                        onClick={() => {
                          setNotifications([])
                          setShowNotificationDropdown(false)
                        }}
                      >
                        Clear All
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white"
              onClick={() => setShowSettings(true)}
            >
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

      {/* Connection Status */}
      {isOnline === false && (
        <div className="bg-yellow-900/90 border-b border-yellow-700 px-4 py-2">
          <div className="container mx-auto flex items-center justify-center">
            <div className="flex items-center space-x-2 text-yellow-300">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">
                {lastError ? "Connection error - using offline mode" : "Offline mode - changes will sync when connected"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="fixed top-20 right-4 z-50 space-y-2">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 rounded-lg shadow-lg border backdrop-blur-md transform transition-all duration-300 ease-in-out ${
                notification.type === 'credit'
                  ? 'bg-green-900/90 border-green-700 text-green-100'
                  : 'bg-red-900/90 border-red-700 text-red-100'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  notification.type === 'credit' ? 'bg-green-600' : 'bg-red-600'
                }`}>
                  {notification.type === 'credit' ? (
                    <Plus className="h-4 w-4 text-white" />
                  ) : (
                    <Send className="h-4 w-4 text-white" />
                  )}
                </div>
                <div>
                  <p className="font-semibold">
                    {notification.type === 'credit' ? 'Money Received!' : 'Money Sent!'}
                  </p>
                  <p className="text-sm opacity-90">
                    {notification.type === 'credit'
                      ? `₹${notification.amount.toLocaleString()} credited to your account`
                      : `₹${notification.amount.toLocaleString()} sent to @${notification.cardId}`
                    }
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card className="border border-white/20 bg-white text-black">
            <CardContent className="p-4 text-center">
              <Wallet className="h-8 w-8 text-black mx-auto mb-2" />
              <p className="text-gray-700 text-sm font-medium">Balance</p>
              <p className="text-black text-xl font-bold">₹{userData.balance.toLocaleString()}</p>
            </CardContent>
          </Card>

          <Card className="border border-gray-300 bg-black text-white">
            <CardContent className="p-4 text-center">
              <Clock className="h-8 w-8 text-white mx-auto mb-2" />
              <p className="text-gray-300 text-sm font-medium">Pay Later</p>
              <p className="text-white text-xl font-bold">
                ₹{((userData.payLaterLimit || 0) - (userData.payLaterUsed || 0)).toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card className="border border-white/20 bg-white text-black">
            <CardContent className="p-4 text-center">
              <Users className="h-8 w-8 text-black mx-auto mb-2" />
              <p className="text-gray-700 text-sm font-medium">Active Users</p>
              <p className="text-black text-xl font-bold">{availableUsers.length}</p>
            </CardContent>
          </Card>

          <Card className="border border-gray-300 bg-black text-white">
            <CardContent className="p-4 text-center">
              <Award className="h-8 w-8 text-white mx-auto mb-2" />
              <p className="text-gray-300 text-sm font-medium">Credit Score</p>
              <p className="text-white text-xl font-bold">{userData.creditScore || 300}</p>
              <p className="text-gray-400 text-xs mt-1">
                {(userData.creditScore || 300) >= 700 ? 'Good' : (userData.creditScore || 300) >= 600 ? 'Fair' : 'Poor'}
              </p>
            </CardContent>
          </Card>

          <Card className="border border-white/20 bg-white text-black">
            <CardContent className="p-4 text-center">
              <ArrowDownLeft className="h-8 w-8 text-black mx-auto mb-2" />
              <p className="text-gray-700 text-sm font-medium">Pending Requests</p>
              <p className="text-black text-xl font-bold">
                {paymentRequests.filter(r => r.recipientId === auth.currentUser?.uid && r.status === 'pending').length}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
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
                <Button
                  variant="outline"
                  className="border-blue-600 text-blue-400 hover:bg-blue-900/20 bg-transparent"
                  onClick={() => setShowBiometricSetup(true)}
                >
                  <Fingerprint className="h-4 w-4 mr-2" />
                  Biometric
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Credit Score Section */}
          <Card className="border border-gray-700 bg-gradient-to-br from-gray-900 to-gray-800 lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <div className="flex items-center">
                  <Award className="h-5 w-5 mr-2" />
                  Your Credit Score
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-yellow-400">{userData.creditScore || 300}</span>
                  <span className="text-gray-400 text-sm">/1000</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all duration-500 ${
                    (userData.creditScore || 300) >= 700
                      ? 'bg-green-500'
                      : (userData.creditScore || 300) >= 600
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${((userData.creditScore || 300) / 1000) * 100}%` }}
                ></div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Rating</span>
                  <span className={`font-medium ${
                    (userData.creditScore || 300) >= 900 ? 'text-green-400' :
                    (userData.creditScore || 300) >= 800 ? 'text-blue-400' :
                    (userData.creditScore || 300) >= 700 ? 'text-green-400' :
                    (userData.creditScore || 300) >= 600 ? 'text-yellow-400' :
                    (userData.creditScore || 300) >= 500 ? 'text-orange-400' : 'text-red-400'
                  }`}>
                    {(userData.creditScore || 300) >= 900 ? 'Excellent' :
                     (userData.creditScore || 300) >= 800 ? 'Very Good' :
                     (userData.creditScore || 300) >= 700 ? 'Good' :
                     (userData.creditScore || 300) >= 600 ? 'Fair' :
                     (userData.creditScore || 300) >= 500 ? 'Average' : 'Poor'}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Total Transactions</span>
                  <span className="text-white">{userData.transactionCount || 0}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Transaction Volume</span>
                  <span className="text-white">₹{(userData.totalTransactionAmount || 0).toLocaleString()}</span>
                </div>

                <div className="bg-gray-800 p-3 rounded-lg mt-4">
                  <p className="text-gray-300 text-sm mb-2">💡 Improve your score:</p>
                  <ul className="text-gray-400 text-xs space-y-1">
                    <li>• Make more transactions</li>
                    <li>• Increase transaction amounts</li>
                    <li>• Use Pay Later responsibly</li>
                    <li>• Maintain payment consistency</li>
                  </ul>
                  <div className="flex space-x-2 mt-3">
                    <Button
                      size="sm"
                      className="text-xs bg-black text-white hover:bg-gray-800 border border-white"
                      onClick={() => {
                        setActiveTab("send")
                        document.getElementById("payment-section")?.scrollIntoView({ behavior: "smooth" })
                      }}
                    >
                      Send Money
                    </Button>
                    <Button
                      size="sm"
                      className="text-xs bg-white text-black hover:bg-gray-200 border border-black"
                      onClick={() => {
                        setActiveTab("request")
                        document.getElementById("payment-section")?.scrollIntoView({ behavior: "smooth" })
                      }}
                    >
                      Request Money
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Section */}
          <Card className="border border-gray-700 bg-gray-900 lg:col-span-1" id="payment-section">
            <CardHeader>
              <div className="flex flex-col gap-2 sm:flex-row sm:space-x-2">
                <Button
                  variant={activeTab === "send" ? "default" : "ghost"}
                  onClick={() => setActiveTab("send")}
                  className={`flex-1 text-xs sm:text-sm ${activeTab === "send" ? "bg-white text-black" : "text-gray-400 hover:text-white"}`}
                >
                  <Send className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Send
                </Button>
                <Button
                  variant={activeTab === "payLater" ? "default" : "ghost"}
                  onClick={() => setActiveTab("payLater")}
                  className={`flex-1 text-xs sm:text-sm ${activeTab === "payLater" ? "bg-white text-black" : "text-gray-400 hover:text-white"}`}
                >
                  <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Pay Later
                </Button>
                <Button
                  variant={activeTab === "request" ? "default" : "ghost"}
                  onClick={() => setActiveTab("request")}
                  className={`flex-1 text-xs sm:text-sm ${activeTab === "request" ? "bg-white text-black" : "text-gray-400 hover:text-white"}`}
                >
                  <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Request
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
                    <p className="text-gray-400 text-sm mt-1">Available: ��{userData.balance.toLocaleString()}</p>
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

              {activeTab === "request" && (
                <form onSubmit={handlePaymentRequest} className="space-y-4">
                  <div className="bg-gradient-to-r from-orange-900/20 to-yellow-900/20 p-4 rounded-lg mb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-white font-semibold mb-2">💸 Request Money</h3>
                        <p className="text-gray-400 text-sm">Ask other users to send you money</p>
                      </div>
                      <DollarSign className="h-8 w-8 text-orange-400" />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="request-recipient" className="text-white">
                      Request From
                    </Label>
                    <Select value={requestRecipientCardId} onValueChange={setRequestRecipientCardId} required>
                      <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                        <SelectValue placeholder="Select user or use credit score" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-600 max-h-60 overflow-y-auto">
                        {availableUsers.map((user) => (
                          <SelectItem key={user.cardId} value={user.cardId} className="text-white hover:bg-gray-700">
                            {user.name} (@{user.cardId})
                          </SelectItem>
                        ))}
                        <SelectItem value="credit_score" className="text-green-400 hover:bg-gray-700">
                          Credit Score (₹{userData.creditScore || 300} available)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="request-amount" className="text-white">
                      Amount (₹)
                    </Label>
                    <Input
                      id="request-amount"
                      type="number"
                      value={requestAmount}
                      onChange={(e) => setRequestAmount(e.target.value)}
                      placeholder="Enter amount to request"
                      className="bg-gray-800 border-gray-600 text-white"
                      min="1"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="request-message" className="text-white">
                      Message (Optional)
                    </Label>
                    <Input
                      id="request-message"
                      type="text"
                      value={requestMessage}
                      onChange={(e) => setRequestMessage(e.target.value)}
                      placeholder="Add a note for your request"
                      className="bg-gray-800 border-gray-600 text-white"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading || availableUsers.length === 0}
                    className="w-full bg-gradient-to-r from-orange-600 to-yellow-600 text-white hover:from-orange-700 hover:to-yellow-700"
                  >
                    {loading ? "Sending Request..." : "Send Request"}
                  </Button>

                  {availableUsers.length === 0 && (
                    <p className="text-gray-400 text-sm text-center">No users available to request money from</p>
                  )}
                </form>
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
                      <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          className="bg-white text-black hover:bg-gray-200"
                          onClick={(e) => {
                            e.stopPropagation()
                            quickPayUser(user.cardId)
                          }}
                        >
                          Pay
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-orange-400 text-orange-400 hover:bg-orange-400 hover:text-white"
                          onClick={(e) => {
                            e.stopPropagation()
                            quickRequestUser(user.cardId)
                          }}
                        >
                          Request
                        </Button>
                      </div>
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

        {/* Pending Payment Requests */}
        {paymentRequests.length > 0 && (
          <Card className="border border-gray-700 bg-gray-900 mt-8">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <div className="flex items-center">
                  <ArrowDownLeft className="h-5 w-5 mr-2" />
                  Payment Requests
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                  <span className="text-orange-400 text-sm font-medium">
                    {paymentRequests.filter(r => r.recipientId === auth.currentUser?.uid && r.status === 'pending').length} pending
                  </span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {paymentRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-4 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          request.recipientId === auth.currentUser?.uid
                            ? "bg-orange-500/20 text-orange-400"
                            : "bg-blue-500/20 text-blue-400"
                        }`}
                      >
                        {request.recipientId === auth.currentUser?.uid ? (
                          <ArrowDownLeft className="h-5 w-5" />
                        ) : (
                          <DollarSign className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <p className="text-white font-semibold">
                          {request.recipientId === auth.currentUser?.uid
                            ? `Request from @${request.requesterCardId}`
                            : `Request to @${request.recipientCardId}`}
                        </p>
                        <div className="flex items-center space-x-2">
                          <p className="text-gray-400 text-sm">{new Date(request.timestamp).toLocaleString()}</p>
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              request.status === 'pending'
                                ? 'bg-yellow-600 text-yellow-100'
                                : request.status === 'approved'
                                ? 'bg-green-600 text-green-100'
                                : 'bg-red-600 text-red-100'
                            }`}
                          >
                            {request.status}
                          </span>
                        </div>
                        {request.message && (
                          <p className="text-gray-300 text-sm mt-1">"{request.message}"</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex items-center space-x-3">
                      <div>
                        <p className="text-orange-400 font-bold text-lg">
                          ₹{request.amount.toLocaleString()}
                        </p>
                      </div>
                      {request.recipientId === auth.currentUser?.uid && request.status === 'pending' && (
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => handleRequestApproval(request, true)}
                            className="bg-green-600 text-white hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRequestApproval(request, false)}
                            className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

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
                <>
                  {transactions.map((transaction) => (
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
                  ))}


                </>
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

      {/* Footer Section */}
      <div className="container mx-auto px-4 py-6 mt-8">
        <Card className="border border-gray-700 bg-gray-900">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center">
                  <Shield className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Card Security</h3>
                  <p className="text-gray-400 text-sm">Block your card immediately if your details are compromised</p>
                  <p className="text-gray-500 text-xs mt-1">Engineered by Ansh Chauhan</p>
                </div>
              </div>
              <Button
                variant="outline"
                className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                onClick={() => setShowBlockCard(true)}
              >
                <Lock className="h-4 w-4 mr-2" />
                Block Card Now
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chatbot Button */}
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setShowChatbot(true)}
          className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </Button>
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
                loading={loading}
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
                loading={loading}
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

      {/* Request Approval PIN Verification Dialog */}
      <Dialog open={showRequestApproval} onOpenChange={() => {
        setShowRequestApproval(false)
        setPendingRequestApproval(null)
        setVerifyPin('')
        setPinMessage('')
      }}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Approve Payment Request
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Enter your PIN to approve this payment request of ₹{pendingRequestApproval?.amount.toLocaleString()} to @{pendingRequestApproval?.requesterCardId}
              {pendingRequestApproval?.message && (
                <div className="mt-2 p-2 bg-gray-800 rounded text-sm">
                  Message: "{pendingRequestApproval.message}"
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-sm text-gray-400 mb-4">Enter your 4-digit PIN</p>
              <PinInput
                onComplete={executeRequestApproval}
                loading={loading}
              />
            </div>

            {pinMessage && (
              <div className="p-3 rounded text-center bg-red-900/50 text-red-300 border border-red-700">
                {pinMessage}
              </div>
            )}

            <div className="flex space-x-3">
              <Button
                onClick={() => executeRequestApproval(verifyPin)}
                disabled={verifyPin.length !== 4 || loading}
                className="flex-1 bg-green-600 text-white hover:bg-green-700"
              >
                {loading ? 'Processing...' : 'Approve & Pay'}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setShowRequestApproval(false)
                  setPendingRequestApproval(null)
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

      {/* Payment Authentication Dialog */}
      {pendingPayment && (
        <PaymentAuth
          isOpen={showPaymentAuth}
          onClose={() => {
            setShowPaymentAuth(false)
            setPendingPayment(null)
          }}
          onSuccess={handlePaymentAuthSuccess}
          amount={pendingPayment.amount}
          recipient={pendingPayment.recipientCardId}
          loading={loading}
          userId={auth.currentUser?.uid}
        />
      )}

      {/* Biometric Setup Dialog */}
      <BiometricSetup
        userId={auth.currentUser?.uid || ""}
        isOpen={showBiometricSetup}
        onClose={() => setShowBiometricSetup(false)}
        onSuccess={() => setShowBiometricSetup(false)}
      />

      {/* Block Card Dialog */}
      <Dialog open={showBlockCard} onOpenChange={setShowBlockCard}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Lock className="h-5 w-5 mr-2 text-red-400" />
              Block Card for Security
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Block your card immediately for security reasons. If your card details are leaked, you can temporarily disable it.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="bg-red-900/20 border border-red-700/50 p-4 rounded-lg">
              <div className="flex items-center space-x-3">
                <Shield className="h-8 w-8 text-red-400" />
                <div>
                  <h3 className="text-white font-semibold">Card Security Block</h3>
                  <p className="text-gray-300 text-sm">Your card will be temporarily disabled for all transactions</p>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="block-duration" className="text-white">
                Block Duration
              </Label>
              <Select value={blockDuration} onValueChange={setBlockDuration} required>
                <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                  <SelectValue placeholder="Select how long to block your card" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  <SelectItem value="1hour">1 Hour</SelectItem>
                  <SelectItem value="6hours">6 Hours</SelectItem>
                  <SelectItem value="24hours">24 Hours</SelectItem>
                  <SelectItem value="3days">3 Days</SelectItem>
                  <SelectItem value="7days">7 Days</SelectItem>
                  <SelectItem value="permanent">Permanent (Contact Support to Unblock)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {blockMessage && (
              <div className="p-3 rounded text-center bg-red-900/50 text-red-300 border border-red-700">
                {blockMessage}
              </div>
            )}

            <div className="bg-yellow-900/20 border border-yellow-700/50 p-4 rounded-lg">
              <div className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-yellow-400" />
                <div>
                  <p className="text-yellow-200 font-medium">Important Notice</p>
                  <p className="text-yellow-300 text-sm">
                    Once blocked, you cannot make any payments or receive money until the block period expires or you contact support.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <Button
                onClick={handleBlockCard}
                disabled={!blockDuration || loading}
                className="flex-1 bg-red-600 text-white hover:bg-red-700"
              >
                {loading ? 'Blocking Card...' : 'Block Card Now'}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setShowBlockCard(false)
                  setBlockDuration("")
                  setBlockMessage("")
                }}
                className="text-gray-400 hover:text-white"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              Account Settings
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Update your account information and preferences
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="text-white font-semibold mb-3">Account Information</h3>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="current-email" className="text-gray-300">
                    Current Email
                  </Label>
                  <Input
                    id="current-email"
                    value={userData?.email || ""}
                    disabled
                    className="bg-gray-700 border-gray-600 text-gray-400"
                  />
                </div>
                <div>
                  <Label htmlFor="new-email" className="text-white">
                    New Email Address
                  </Label>
                  <Input
                    id="new-email"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="Enter new email address"
                    className="bg-gray-800 border-gray-600 text-white"
                  />
                </div>
              </div>
            </div>

            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="text-white font-semibold mb-3">Security Settings</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white">PIN Protection</p>
                    <p className="text-gray-400 text-sm">
                      {userData?.pin ? "PIN is set up" : "No PIN configured"}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white"
                    onClick={() => {
                      setShowSettings(false)
                      setShowPinSetup(true)
                    }}
                  >
                    {userData?.pin ? "Change PIN" : "Setup PIN"}
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white">Biometric Authentication</p>
                    <p className="text-gray-400 text-sm">Enable fingerprint/face unlock</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-green-600 text-green-400 hover:bg-green-600 hover:text-white"
                    onClick={() => {
                      setShowSettings(false)
                      setShowBiometricSetup(true)
                    }}
                  >
                    Setup
                  </Button>
                </div>
              </div>
            </div>

            {settingsMessage && (
              <div className={`p-3 rounded text-center ${
                settingsMessage.includes('✅')
                  ? 'bg-green-900/50 text-green-300 border border-green-700'
                  : 'bg-red-900/50 text-red-300 border border-red-700'
              }`}>
                {settingsMessage}
              </div>
            )}

            <div className="flex space-x-3">
              <Button
                onClick={handleEmailUpdate}
                disabled={!newEmail.trim() || loading}
                className="flex-1 bg-blue-600 text-white hover:bg-blue-700"
              >
                {loading ? 'Updating...' : 'Update Email'}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setShowSettings(false)
                  setNewEmail("")
                  setSettingsMessage("")
                }}
                className="text-gray-400 hover:text-white"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Chatbot Dialog */}
      <Dialog open={showChatbot} onOpenChange={setShowChatbot}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mr-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              CAPI Assistant
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Ask me anything about CAPI payments, features, and help!
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Chat Messages */}
            <div className="h-80 bg-gray-800 rounded-lg p-4 overflow-y-auto space-y-3">
              {chatMessages.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <p className="text-gray-400 text-sm">Hello! I'm your CAPI assistant.</p>
                  <p className="text-gray-500 text-xs mt-1">Ask me about payments, security, or any CAPI features!</p>
                </div>
              ) : (
                chatMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs px-3 py-2 rounded-lg ${
                        message.isUser
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-gray-100'
                      }`}
                    >
                      <p className="text-sm">{message.text}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleChatSubmit} className="flex space-x-2">
              <Input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask me anything about CAPI..."
                className="flex-1 bg-gray-800 border-gray-600 text-white"
              />
              <Button
                type="submit"
                disabled={!chatInput.trim()}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </Button>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
