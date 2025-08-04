"use client"

import React, { useState, useEffect } from "react"
import { signOut } from "firebase/auth"
import { collection, onSnapshot, doc, updateDoc, addDoc, query, orderBy, limit, getDoc } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { PaymentAuth } from "@/components/payment-auth"
import { BiometricSetup } from "@/components/biometric-setup"
import { 
  LogOut, 
  Send, 
  History, 
  CreditCard, 
  Settings, 
  Bell, 
  TrendingUp,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  Shield,
  Fingerprint,
  DollarSign
} from "lucide-react"
import { toast } from "sonner"

interface User {
  id: string
  name: string
  email: string
  cardId: string
  balance: number
  createdAt: string
  isFrozen?: boolean
}

interface Transaction {
  id: string
  amount: number
  type: "debit" | "credit"
  description: string
  timestamp: string
  userId: string
  fromUserId?: string
  toUserId?: string
  fromUserName?: string
  toUserName?: string
}

interface DashboardProps {
  onLogout: () => void
}

export function Dashboard({ onLogout }: DashboardProps) {
  const [user, setUser] = useState<User | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [sendAmount, setSendAmount] = useState("")
  const [sendRecipient, setSendRecipient] = useState("")
  const [sendMessage, setSendMessage] = useState("")
  const [requestAmount, setRequestAmount] = useState("")
  const [requestRecipient, setRequestRecipient] = useState("")
  const [requestMessage, setRequestMessage] = useState("")
  const [showPaymentAuth, setShowPaymentAuth] = useState(false)
  const [showBiometricSetup, setShowBiometricSetup] = useState(false)
  const [pendingPayment, setPendingPayment] = useState<{
    amount: number
    recipient: string
    message: string
  } | null>(null)

  useEffect(() => {
    const currentUser = auth.currentUser
    if (!currentUser) {
      onLogout()
      return
    }

    // Listen to user data changes for real-time balance updates
    const userDocRef = doc(db, "users", currentUser.uid)
    const unsubscribeUser = onSnapshot(userDocRef, (doc) => {
      if (doc.exists()) {
        const userData = { id: doc.id, ...doc.data() } as User
        setUser(userData)
        setLoading(false)
      } else {
        console.error("User document not found")
        setLoading(false)
      }
    }, (error) => {
      console.error("Error fetching user data:", error)
      setLoading(false)
    })

    // Listen to transactions
    const transactionsQuery = query(
      collection(db, "transactions"),
      orderBy("timestamp", "desc"),
      limit(50)
    )
    
    const unsubscribeTransactions = onSnapshot(transactionsQuery, (snapshot) => {
      const userTransactions: Transaction[] = []
      snapshot.forEach((doc) => {
        const transaction = { id: doc.id, ...doc.data() } as Transaction
        // Only show transactions related to current user
        if (transaction.userId === currentUser.uid || 
            transaction.fromUserId === currentUser.uid || 
            transaction.toUserId === currentUser.uid) {
          userTransactions.push(transaction)
        }
      })
      setTransactions(userTransactions)
    })

    return () => {
      unsubscribeUser()
      unsubscribeTransactions()
    }
  }, [onLogout])

  const handleLogout = async () => {
    try {
      await signOut(auth)
      onLogout()
      toast.success("Logged out successfully")
    } catch (error) {
      console.error("Error logging out:", error)
      toast.error("Failed to log out")
    }
  }

  const handleSendMoney = async () => {
    if (!user || !sendAmount || !sendRecipient) {
      toast.error("Please fill in all required fields")
      return
    }

    const amount = parseFloat(sendAmount)
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount")
      return
    }

    if (amount > user.balance) {
      toast.error("Insufficient balance")
      return
    }

    // Set pending payment and show auth modal
    setPendingPayment({
      amount,
      recipient: sendRecipient,
      message: sendMessage || `Payment from ${user.name}`
    })
    setShowPaymentAuth(true)
  }

  const handleRequestMoney = async () => {
    if (!user || !requestAmount || !requestRecipient) {
      toast.error("Please fill in all required fields")
      return
    }

    const amount = parseFloat(requestAmount)
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount")
      return
    }

    try {
      // Find recipient by card ID
      const usersQuery = collection(db, "users")
      const usersSnapshot = await getDocs(usersQuery)
      let recipientUser = null

      usersSnapshot.forEach((doc) => {
        const userData = doc.data()
        if (userData.cardId === requestRecipient) {
          recipientUser = { id: doc.id, ...userData }
        }
      })

      if (!recipientUser) {
        toast.error("Recipient not found")
        return
      }

      // Create money request
      await addDoc(collection(db, "money_requests"), {
        fromUserId: user.id,
        fromUserName: user.name,
        fromCardId: user.cardId,
        toUserId: recipientUser.id,
        toUserName: recipientUser.name,
        toCardId: recipientUser.cardId,
        amount,
        message: requestMessage || `Money request from ${user.name}`,
        status: "pending",
        timestamp: new Date().toISOString(),
      })

      toast.success(`Money request sent to ${recipientUser.name}`)
      setRequestAmount("")
      setRequestRecipient("")
      setRequestMessage("")
    } catch (error) {
      console.error("Error sending money request:", error)
      toast.error("Failed to send money request")
    }
  }

  const processSendMoney = async () => {
    if (!user || !pendingPayment) return

    try {
      // Find recipient by card ID
      const usersQuery = collection(db, "users")
      const usersSnapshot = await getDocs(usersQuery)
      let recipientUser = null

      usersSnapshot.forEach((doc) => {
        const userData = doc.data()
        if (userData.cardId === pendingPayment.recipient) {
          recipientUser = { id: doc.id, ...userData }
        }
      })

      if (!recipientUser) {
        toast.error("Recipient not found")
        return
      }

      if (recipientUser.isFrozen) {
        toast.error("Recipient account is frozen")
        return
      }

      // Update balances
      await updateDoc(doc(db, "users", user.id), {
        balance: user.balance - pendingPayment.amount
      })

      await updateDoc(doc(db, "users", recipientUser.id), {
        balance: recipientUser.balance + pendingPayment.amount
      })

      // Create transaction records
      const timestamp = new Date().toISOString()

      // Debit transaction for sender
      await addDoc(collection(db, "transactions"), {
        userId: user.id,
        fromUserId: user.id,
        toUserId: recipientUser.id,
        amount: -pendingPayment.amount,
        type: "debit",
        description: `Sent to ${recipientUser.name} (${recipientUser.cardId})`,
        timestamp,
      })

      // Credit transaction for recipient
      await addDoc(collection(db, "transactions"), {
        userId: recipientUser.id,
        fromUserId: user.id,
        toUserId: recipientUser.id,
        amount: pendingPayment.amount,
        type: "credit",
        description: `Received from ${user.name} (${user.cardId})`,
        timestamp,
      })

      toast.success(`₹${pendingPayment.amount} sent successfully to ${recipientUser.name}`)
      
      // Reset form
      setSendAmount("")
      setSendRecipient("")
      setSendMessage("")
      setPendingPayment(null)
    } catch (error) {
      console.error("Error sending money:", error)
      toast.error("Failed to send money")
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-xl">Loading dashboard...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-xl">User not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="border-b border-gray-700 bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                <span className="text-black font-bold">C</span>
              </div>
              <div>
                <h1 className="text-xl font-bold">Welcome back, {user.name}</h1>
                <p className="text-gray-400 text-sm">Card ID: {user.cardId}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => setShowBiometricSetup(true)}
                variant="outline"
                size="sm"
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <Fingerprint className="w-4 h-4 mr-2" />
                Biometric
              </Button>
              <Button
                onClick={() => {
                  // Show request money form
                  const recipient = prompt("Enter recipient's Card ID:")
                  const amount = prompt("Enter amount to request:")
                  const message = prompt("Enter message (optional):")
                  
                  if (recipient && amount) {
                    setRequestRecipient(recipient)
                    setRequestAmount(amount)
                    setRequestMessage(message || "")
                    handleRequestMoney()
                  }
                }}
                variant="outline"
                size="sm"
                className="border-green-600 text-green-400 hover:bg-green-900/20"
              >
                <DollarSign className="w-4 h-4 mr-2" />
                Request Money
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <Settings className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <Bell className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Credit Score
              </Button>
              <Button 
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Balance Card */}
        <Card className="mb-8 bg-gradient-to-r from-blue-600 to-purple-600 border-0 text-white">
          <CardContent className="p-8">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-blue-100 mb-2">Available Balance</p>
                <h2 className="text-4xl font-bold mb-4">{formatCurrency(user.balance)}</h2>
                <div className="flex items-center space-x-4">
                  <Badge variant="secondary" className="bg-white/20 text-white">
                    <Wallet className="w-3 h-3 mr-1" />
                    Active
                  </Badge>
                  <Badge variant="secondary" className="bg-white/20 text-white">
                    <Shield className="w-3 h-3 mr-1" />
                    Secured
                  </Badge>
                </div>
              </div>
              <div className="text-right">
                <p className="text-blue-100 text-sm">Card ID</p>
                <p className="font-mono text-lg">{user.cardId}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Tabs defaultValue="send" className="space-y-6">
          <TabsList className="bg-gray-800 border-gray-700">
            <TabsTrigger value="send" className="data-[state=active]:bg-gray-700 data-[state=active]:text-white">
              <Send className="w-4 h-4 mr-2" />
              Send Money
            </TabsTrigger>
            <TabsTrigger value="request" className="data-[state=active]:bg-gray-700 data-[state=active]:text-white">
              <Plus className="w-4 h-4 mr-2" />
              Request Money
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-gray-700 data-[state=active]:text-white">
              <History className="w-4 h-4 mr-2" />
              Transaction History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="send" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Send Money</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="recipient" className="text-white">Recipient Card ID</Label>
                  <Input
                    id="recipient"
                    value={sendRecipient}
                    onChange={(e) => setSendRecipient(e.target.value)}
                    placeholder="Enter recipient's Card ID (e.g., john123-capi)"
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="amount" className="text-white">Amount (₹)</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={sendAmount}
                    onChange={(e) => setSendAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="message" className="text-white">Message (Optional)</Label>
                  <Input
                    id="message"
                    value={sendMessage}
                    onChange={(e) => setSendMessage(e.target.value)}
                    placeholder="Enter message"
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <Button 
                  onClick={handleSendMoney}
                  className="w-full bg-blue-600 text-white hover:bg-blue-700"
                  disabled={!sendAmount || !sendRecipient}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send ₹{sendAmount || "0"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="request" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Request Money</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="request-recipient" className="text-white">From Card ID</Label>
                  <Input
                    id="request-recipient"
                    value={requestRecipient}
                    onChange={(e) => setRequestRecipient(e.target.value)}
                    placeholder="Enter Card ID to request from"
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="request-amount" className="text-white">Amount (₹)</Label>
                  <Input
                    id="request-amount"
                    type="number"
                    value={requestAmount}
                    onChange={(e) => setRequestAmount(e.target.value)}
                    placeholder="Enter amount to request"
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="request-message" className="text-white">Message (Optional)</Label>
                  <Input
                    id="request-message"
                    value={requestMessage}
                    onChange={(e) => setRequestMessage(e.target.value)}
                    placeholder="Enter request message"
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <Button 
                  onClick={handleRequestMoney}
                  className="w-full bg-green-600 text-white hover:bg-green-700"
                  disabled={!requestAmount || !requestRecipient}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Request ₹{requestAmount || "0"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {transactions.length === 0 ? (
                    <p className="text-gray-400 text-center py-8">No transactions yet</p>
                  ) : (
                    transactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-4 bg-gray-700 rounded-lg"
                      >
                        <div className="flex items-center space-x-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            transaction.type === "credit" ? "bg-green-600" : "bg-red-600"
                          }`}>
                            {transaction.type === "credit" ? (
                              <ArrowDownLeft className="w-5 h-5 text-white" />
                            ) : (
                              <ArrowUpRight className="w-5 h-5 text-white" />
                            )}
                          </div>
                          <div>
                            <p className="text-white font-medium">{transaction.description}</p>
                            <p className="text-gray-400 text-sm">{formatDate(transaction.timestamp)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${
                            transaction.type === "credit" ? "text-green-400" : "text-red-400"
                          }`}>
                            {transaction.type === "credit" ? "+" : ""}
                            {formatCurrency(Math.abs(transaction.amount))}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Payment Authentication Modal */}
      <PaymentAuth
        isOpen={showPaymentAuth}
        onClose={() => {
          setShowPaymentAuth(false)
          setPendingPayment(null)
        }}
        onSuccess={() => {
          setShowPaymentAuth(false)
          processSendMoney()
        }}
        amount={pendingPayment?.amount || 0}
        recipient={pendingPayment?.recipient || ""}
        message={pendingPayment?.message}
        userId={user.id}
      />

      {/* Biometric Setup Modal */}
      <BiometricSetup
        userId={user.id}
        isOpen={showBiometricSetup}
        onClose={() => setShowBiometricSetup(false)}
        onSuccess={() => {
          setShowBiometricSetup(false)
          toast.success("Biometric authentication setup complete!")
        }}
      />
    </div>
  )
}