"use client"

import React, { useState, useEffect } from "react"
import { collection, onSnapshot, doc, updateDoc, query, orderBy, limit } from "firebase/firestore"
import { db, auth } from "@/lib/firebase"
import { signOut } from "firebase/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LogOut, Users, CreditCard, Activity, Shield, ShieldOff } from "lucide-react"
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
  userName?: string
}

export function AdminPanel() {
  const [users, setUsers] = useState<User[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Listen to users collection
    const usersQuery = query(collection(db, "users"), orderBy("createdAt", "desc"))
    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
      const usersData: User[] = []
      snapshot.forEach((doc) => {
        usersData.push({ id: doc.id, ...doc.data() } as User)
      })
      setUsers(usersData)
      setLoading(false)
    })

    // Listen to transactions collection
    const transactionsQuery = query(
      collection(db, "transactions"), 
      orderBy("timestamp", "desc"), 
      limit(100)
    )
    const unsubscribeTransactions = onSnapshot(transactionsQuery, (snapshot) => {
      const transactionsData: Transaction[] = []
      snapshot.forEach((doc) => {
        transactionsData.push({ id: doc.id, ...doc.data() } as Transaction)
      })
      setTransactions(transactionsData)
    })

    return () => {
      unsubscribeUsers()
      unsubscribeTransactions()
    }
  }, [])

  const handleFreezeUser = async (userId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, "users", userId), {
        isFrozen: !currentStatus
      })
      toast.success(`User account ${!currentStatus ? "frozen" : "unfrozen"} successfully`)
    } catch (error) {
      console.error("Error updating user status:", error)
      toast.error("Failed to update user status")
    }
  }

  const handleLogout = async () => {
    try {
      await signOut(auth)
      toast.success("Logged out successfully")
    } catch (error) {
      console.error("Error logging out:", error)
      toast.error("Failed to log out")
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

  const totalUsers = users.length
  const activeUsers = users.filter(user => !user.isFrozen).length
  const frozenUsers = users.filter(user => user.isFrozen).length
  const totalBalance = users.reduce((sum, user) => sum + user.balance, 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-xl">Loading admin panel...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="border-b border-gray-700 bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold">CAPI Admin Panel</h1>
              <p className="text-gray-400">Administrator Dashboard</p>
            </div>
            <Button 
              onClick={handleLogout}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Total Users</CardTitle>
              <Users className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{totalUsers}</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Active Users</CardTitle>
              <Shield className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{activeUsers}</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Frozen Users</CardTitle>
              <ShieldOff className="h-4 w-4 text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{frozenUsers}</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Total Balance</CardTitle>
              <CreditCard className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{formatCurrency(totalBalance)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="bg-gray-800 border-gray-700">
            <TabsTrigger value="users" className="data-[state=active]:bg-gray-700 data-[state=active]:text-white">
              Users Management
            </TabsTrigger>
            <TabsTrigger value="transactions" className="data-[state=active]:bg-gray-700 data-[state=active]:text-white">
              Transaction History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">All Users</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700">
                      <TableHead className="text-gray-400">Name</TableHead>
                      <TableHead className="text-gray-400">Email</TableHead>
                      <TableHead className="text-gray-400">Card ID</TableHead>
                      <TableHead className="text-gray-400">Balance</TableHead>
                      <TableHead className="text-gray-400">Status</TableHead>
                      <TableHead className="text-gray-400">Joined</TableHead>
                      <TableHead className="text-gray-400">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id} className="border-gray-700">
                        <TableCell className="text-white font-medium">{user.name}</TableCell>
                        <TableCell className="text-gray-300">{user.email}</TableCell>
                        <TableCell className="text-gray-300 font-mono text-sm">{user.cardId}</TableCell>
                        <TableCell className="text-white">{formatCurrency(user.balance)}</TableCell>
                        <TableCell>
                          {user.isFrozen ? (
                            <Badge variant="destructive" className="bg-red-600">
                              Frozen
                            </Badge>
                          ) : (
                            <Badge variant="default" className="bg-green-600">
                              Active
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-gray-300">{formatDate(user.createdAt)}</TableCell>
                        <TableCell>
                          <Button
                            onClick={() => handleFreezeUser(user.id, user.isFrozen || false)}
                            variant={user.isFrozen ? "default" : "destructive"}
                            size="sm"
                            className={user.isFrozen ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
                          >
                            {user.isFrozen ? (
                              <>
                                <Shield className="w-3 h-3 mr-1" />
                                Unfreeze
                              </>
                            ) : (
                              <>
                                <ShieldOff className="w-3 h-3 mr-1" />
                                Freeze
                              </>
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700">
                      <TableHead className="text-gray-400">User</TableHead>
                      <TableHead className="text-gray-400">Type</TableHead>
                      <TableHead className="text-gray-400">Amount</TableHead>
                      <TableHead className="text-gray-400">Description</TableHead>
                      <TableHead className="text-gray-400">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => {
                      const user = users.find(u => u.id === transaction.userId)
                      return (
                        <TableRow key={transaction.id} className="border-gray-700">
                          <TableCell className="text-white font-medium">
                            {user?.name || transaction.userName || "Unknown User"}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={transaction.type === "credit" ? "default" : "destructive"}
                              className={transaction.type === "credit" ? "bg-green-600" : "bg-red-600"}
                            >
                              {transaction.type === "credit" ? "Credit" : "Debit"}
                            </Badge>
                          </TableCell>
                          <TableCell className={`font-medium ${
                            transaction.type === "credit" ? "text-green-400" : "text-red-400"
                          }`}>
                            {transaction.type === "credit" ? "+" : "-"}{formatCurrency(Math.abs(transaction.amount))}
                          </TableCell>
                          <TableCell className="text-gray-300">{transaction.description}</TableCell>
                          <TableCell className="text-gray-300">{formatDate(transaction.timestamp)}</TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
