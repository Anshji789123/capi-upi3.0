"use client"

import { useState, useEffect } from "react"
import { onSnapshot, doc } from "firebase/firestore"
import { db } from "@/lib/firebase"

export function useFirebaseConnection() {
  const [isOnline, setIsOnline] = useState<boolean | null>(null)
  const [lastError, setLastError] = useState<string | null>(null)

  useEffect(() => {
    // Create a dummy document to test connectivity
    const testDocRef = doc(db, "_connection_test", "test")
    
    const unsubscribe = onSnapshot(
      testDocRef,
      {
        includeMetadataChanges: true
      },
      (snapshot) => {
        const source = snapshot.metadata.fromCache ? "cache" : "server"
        const isConnected = !snapshot.metadata.fromCache && snapshot.metadata.hasPendingWrites === false
        
        setIsOnline(isConnected)
        setLastError(null)
        
        console.log(`Firebase connection status: ${isConnected ? 'online' : 'offline'} (source: ${source})`)
      },
      (error) => {
        console.error("Firebase connection error:", error)
        setIsOnline(false)
        setLastError(error.message)
      }
    )

    // Also listen to browser online/offline events
    const handleOnline = () => {
      console.log("Browser went online")
    }
    
    const handleOffline = () => {
      console.log("Browser went offline")
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      unsubscribe()
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return { isOnline, lastError }
}
