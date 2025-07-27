"use client"

import { useState, useEffect } from "react"
import { onAuthStateChanged, type User } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { ArrowRight, CreditCard, Users, Brain, Star, Zap, Shield, Hash, Smartphone, Globe, Link2, Eye, UserCheck, AlertTriangle, Plus, Utensils, Gamepad2, ShoppingBag, Car, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AuthModal } from "@/components/auth-modal"
import { Dashboard } from "@/components/dashboard"
import { AdminPanel } from "@/components/admin-panel"
import Link from "next/link"

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showAdminPanel, setShowAdminPanel] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  if (showAdminPanel) {
    return <AdminPanel />
  }

  if (user) {
    return <Dashboard onLogout={() => setUser(null)} />
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
            <span className="text-xl font-bold text-white">CAPI</span>
          </div>
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="#features" className="text-gray-400 hover:text-white transition-colors">
              Features
            </Link>
            <Link href="#how-it-works" className="text-gray-400 hover:text-white transition-colors">
              How it Works
            </Link>
            <Link href="#testimonials" className="text-gray-400 hover:text-white transition-colors">
              Reviews
            </Link>
          </nav>
          <Button
            onClick={() => setShowAuthModal(true)}
            variant="outline"
            className="border-white text-white hover:bg-white hover:text-black bg-transparent"
          >
            Sign In
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 md:py-32 text-center bg-black">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Card-Based <span className="text-gray-400">UPI</span>{" "}
              <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Revolution</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
              Pay with your Card ID instantly. Like UPI, but for your Visa, Mastercard & RuPay cards. Latest technology.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                size="lg"
                className="bg-white text-black hover:bg-gray-200 px-8 py-4 text-lg font-semibold group"
                onClick={() => setShowAuthModal(true)}
              >
                Get Your Card ID
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-white text-white hover:bg-white hover:text-black px-8 py-4 text-lg bg-transparent"
              >
                See How It Works
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-black">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">Why CAPI is Different</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Advanced features that make CAPI the safest and most convenient payment solution
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            <Card className="border border-gray-700 bg-gray-900 hover:bg-gray-800 transition-all duration-300 group">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <Link2 className="h-8 w-8 text-black" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-white">One-Time Bank Link</h3>
                <p className="text-gray-400">
                  Instantly generate a virtual card by linking your bank account just once.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-gray-700 bg-gray-900 hover:bg-gray-800 transition-all duration-300 group">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <Hash className="h-8 w-8 text-black" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-white">Unique Card ID</h3>
                <p className="text-gray-400">
                  Send or receive money using a smart Card ID like ansh@cardid — no need for UPI, phone number, or bank details.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-gray-700 bg-gray-900 hover:bg-gray-800 transition-all duration-300 group">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <Eye className="h-8 w-8 text-black" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-white">Smart Privacy + Full Traceability</h3>
                <p className="text-gray-400">
                  Stay anonymous to others, but all transactions are traceable end-to-end using KYC, IP, and device tracking.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-gray-700 bg-gray-900 hover:bg-gray-800 transition-all duration-300 group">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <AlertTriangle className="h-8 w-8 text-black" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-white">Built-in Scam Protection</h3>
                <p className="text-gray-400">
                  If fraud occurs, we trace it instantly, freeze the scammer's access, and alert the proper authorities.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12">
            <Button
              size="lg"
              className="bg-white text-black hover:bg-gray-200 px-8 py-4 text-lg font-semibold group"
              onClick={() => setShowAuthModal(true)}
            >
              Get My Card ID
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </section>

      {/* Subcard Feature Section */}
      <section className="py-20 bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">Create Subcards for Everything</h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Set spending limits and organize your finances with purpose-built subcards for different categories
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto mb-12">
            {/* Food Subcard */}
            <Card className="border border-gray-700 bg-gray-800 hover:bg-gray-700 transition-all duration-300 group">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                    <Utensils className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Food & Dining</h3>
                    <p className="text-sm text-gray-400">Set monthly food budget</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Monthly Limit</span>
                    <span className="text-white font-semibold">₹5,000</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-orange-500 h-2 rounded-full w-3/4"></div>
                  </div>
                  <p className="text-xs text-gray-400">₹3,750 spent this month</p>
                </div>
              </CardContent>
            </Card>

            {/* Entertainment Subcard */}
            <Card className="border border-gray-700 bg-gray-800 hover:bg-gray-700 transition-all duration-300 group">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                    <Gamepad2 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Entertainment</h3>
                    <p className="text-sm text-gray-400">Movies, games, streaming</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Monthly Limit</span>
                    <span className="text-white font-semibold">₹2,000</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-purple-500 h-2 rounded-full w-1/2"></div>
                  </div>
                  <p className="text-xs text-gray-400">₹1,000 spent this month</p>
                </div>
              </CardContent>
            </Card>

            {/* Shopping Subcard */}
            <Card className="border border-gray-700 bg-gray-800 hover:bg-gray-700 transition-all duration-300 group">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                    <ShoppingBag className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Shopping</h3>
                    <p className="text-sm text-gray-400">Clothes, electronics, etc.</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Monthly Limit</span>
                    <span className="text-white font-semibold">₹10,000</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full w-2/5"></div>
                  </div>
                  <p className="text-xs text-gray-400">₹4,000 spent this month</p>
                </div>
              </CardContent>
            </Card>

            {/* Transport Subcard */}
            <Card className="border border-gray-700 bg-gray-800 hover:bg-gray-700 transition-all duration-300 group">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                    <Car className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Transport</h3>
                    <p className="text-sm text-gray-400">Uber, fuel, parking</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Monthly Limit</span>
                    <span className="text-white font-semibold">₹3,000</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full w-1/3"></div>
                  </div>
                  <p className="text-xs text-gray-400">₹1,000 spent this month</p>
                </div>
              </CardContent>
            </Card>

            {/* Bills Subcard */}
            <Card className="border border-gray-700 bg-gray-800 hover:bg-gray-700 transition-all duration-300 group">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                    <Home className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Bills & Utilities</h3>
                    <p className="text-sm text-gray-400">Electricity, internet, rent</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Monthly Limit</span>
                    <span className="text-white font-semibold">₹8,000</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-yellow-500 h-2 rounded-full w-5/6"></div>
                  </div>
                  <p className="text-xs text-gray-400">₹6,700 spent this month</p>
                </div>
              </CardContent>
            </Card>

            {/* Create New Subcard */}
            <Card className="border border-dashed border-gray-600 bg-gray-800 hover:bg-gray-700 transition-all duration-300 group cursor-pointer">
              <CardContent className="p-6 h-full flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center mb-4 group-hover:bg-white group-hover:scale-110 transition-all">
                  <Plus className="h-6 w-6 text-white group-hover:text-black" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Create Custom Subcard</h3>
                <p className="text-sm text-gray-400">Set limits for any category</p>
              </CardContent>
            </Card>
          </div>

          {/* Benefits */}
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
            <div className="text-center">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-6 w-6 text-black" />
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Spending Control</h4>
              <p className="text-gray-400 text-sm">Set monthly limits to avoid overspending in any category</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                <Brain className="h-6 w-6 text-black" />
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Smart Tracking</h4>
              <p className="text-gray-400 text-sm">Automatically categorize expenses and track spending patterns</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-6 w-6 text-black" />
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Family Sharing</h4>
              <p className="text-gray-400 text-sm">Share subcards with family members with individual limits</p>
            </div>
          </div>

          <div className="text-center">
            <Button
              size="lg"
              className="bg-white text-black hover:bg-gray-200 px-8 py-4 text-lg font-semibold group"
              onClick={() => setShowAuthModal(true)}
            >
              Start Creating Subcards
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">How CAPI Works</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Simple as UPI, but powered by your cards with latest technology
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8 max-w-6xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-black font-bold text-xl">1</span>
              </div>
              <h3 className="text-xl font-bold mb-4 text-white">Get Your Card ID</h3>
              <p className="text-gray-400">Sign up and get assigned a unique Card ID like @yourname-capi</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-black font-bold text-xl">2</span>
              </div>
              <h3 className="text-xl font-bold mb-4 text-white">Link Cards</h3>
              <p className="text-gray-400">Connect your Visa, Mastercard, and RuPay cards securely</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-black font-bold text-xl">3</span>
              </div>
              <h3 className="text-xl font-bold mb-4 text-white">Pay Friends</h3>
              <p className="text-gray-400">Send money using Card IDs instantly like UPI</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-black font-bold text-xl">4</span>
              </div>
              <h3 className="text-xl font-bold mb-4 text-white">Pay Merchants</h3>
              <p className="text-gray-400">Scan QR codes at any merchant and pay with your cards</p>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="py-20 bg-black">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">Latest Technology</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Built with cutting-edge technology for secure, fast, and reliable payments
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <Card className="border border-gray-700 bg-gray-900 hover:bg-gray-800 transition-all duration-300">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6">
                  <Shield className="h-8 w-8 text-black" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-white">Bank-Grade Security</h3>
                <p className="text-gray-400">Advanced encryption and tokenization to keep your card data safe</p>
              </CardContent>
            </Card>

            <Card className="border border-gray-700 bg-gray-900 hover:bg-gray-800 transition-all duration-300">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6">
                  <Zap className="h-8 w-8 text-black" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-white">Lightning Fast</h3>
                <p className="text-gray-400">Instant processing with optimized card network routing</p>
              </CardContent>
            </Card>

            <Card className="border border-gray-700 bg-gray-900 hover:bg-gray-800 transition-all duration-300">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6">
                  <Globe className="h-8 w-8 text-black" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-white">Universal Support</h3>
                <p className="text-gray-400">Works with all major card networks and payment systems</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Why Better than UPI Section */}
      <section className="py-20 bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-12 text-white">Beyond Traditional UPI</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto">
                  <CreditCard className="h-6 w-6 text-black" />
                </div>
                <h3 className="text-xl font-bold text-white">Card-Based Payments</h3>
                <p className="text-gray-400">Use your existing credit/debit cards instead of bank accounts</p>
              </div>
              <div className="space-y-4">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto">
                  <Zap className="h-6 w-6 text-black" />
                </div>
                <h3 className="text-xl font-bold text-white">Instant Processing</h3>
                <p className="text-gray-400">Faster than traditional UPI with advanced card network routing</p>
              </div>
              <div className="space-y-4">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto">
                  <Smartphone className="h-6 w-6 text-black" />
                </div>
                <h3 className="text-xl font-bold text-white">Latest Technology</h3>
                <p className="text-gray-400">Built with modern APIs and AI-powered smart features</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 bg-black">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">Trusted by Users</h2>
            <p className="text-xl text-gray-400">See what early adopters are saying about CAPI</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="border border-gray-700 bg-gray-900 shadow-lg">
              <CardContent className="p-8">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-white text-white" />
                  ))}
                </div>
                <p className="text-gray-300 mb-6">
                  "Finally! I can use my credit cards like UPI. My Card ID makes receiving payments so easy."
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-black font-bold mr-3">
                    AK
                  </div>
                  <div>
                    <p className="font-semibold text-white">Arjun Kumar</p>
                    <p className="text-sm text-gray-400">Startup Founder</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-700 bg-gray-900 shadow-lg">
              <CardContent className="p-8">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-white text-white" />
                  ))}
                </div>
                <p className="text-gray-300 mb-6">
                  "The smart card selection feature is brilliant. It automatically uses my cashback card for shopping!"
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-black font-bold mr-3">
                    PS
                  </div>
                  <div>
                    <p className="font-semibold text-white">Priya Sharma</p>
                    <p className="text-sm text-gray-400">Product Manager</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-700 bg-gray-900 shadow-lg">
              <CardContent className="p-8">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-white text-white" />
                  ))}
                </div>
                <p className="text-gray-300 mb-6">
                  "Sending money to friends with just their Card ID is game-changing. No more asking for account
                  numbers!"
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-black font-bold mr-3">
                    RG
                  </div>
                  <div>
                    <p className="font-semibold text-white">Rahul Gupta</p>
                    <p className="text-sm text-gray-400">Software Engineer</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>



      {/* CTA Section */}
      <section className="py-20 bg-gray-900 border-t border-gray-800">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">Ready for Card-Based Payments?</h2>
          <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
            Join thousands of users who are already using their cards like UPI with CAPI
          </p>
          <Button
            size="lg"
            className="bg-white text-black hover:bg-gray-200 px-8 py-4 text-lg font-semibold"
            onClick={() => setShowAuthModal(true)}
          >
            Get Your Card ID Today
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black border-t border-gray-800 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <span className="text-black font-bold text-sm">C</span>
              </div>
              <span className="text-xl font-bold text-white">CAPI</span>
            </div>

            <nav className="flex flex-wrap justify-center md:justify-end space-x-8 mb-4 md:mb-0">
              <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">
                Terms
              </Link>
              <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link href="/contact" className="text-gray-400 hover:text-white transition-colors">
                Contact
              </Link>
            </nav>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-gray-400 text-sm">
              © 2025 CAPI. All rights reserved. Engineered by Ansh Chauhan - anshchauhan556@gmail.com
            </p>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => setShowAuthModal(false)}
        onAdminLogin={() => {
          setShowAuthModal(false)
          setShowAdminPanel(true)
        }}
      />
    </div>
  )
}
