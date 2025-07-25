import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { initializeFirestore, CACHE_SIZE_UNLIMITED, enableNetwork, disableNetwork } from "firebase/firestore"
import { getAnalytics } from "firebase/analytics"

const firebaseConfig = {
  apiKey: "AIzaSyAe5CVCK5-sijj8SPl4kkl_4iIMhEaC7jg",
  authDomain: "taxnavi-352cb.firebaseapp.com",
  databaseURL: "https://taxnavi-352cb-default-rtdb.firebaseio.com",
  projectId: "taxnavi-352cb",
  storageBucket: "taxnavi-352cb.firebasestorage.app",
  messagingSenderId: "323239878286",
  appId: "1:323239878286:web:d098e1a1de8bf2524033df",
  measurementId: "G-8QJ12Z0NFK",
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
// Use long-polling so Firestore works even when WebSockets are blocked (e.g. v0 preview)
export const db = initializeFirestore(app, {
  ignoreUndefinedProperties: true,
  cacheSizeBytes: CACHE_SIZE_UNLIMITED,
  // Automatically falls back to long-polling in restricted environments.
  experimentalAutoDetectLongPolling: true,
})

// Initialize analytics only on client side
let analytics
if (typeof window !== "undefined") {
  analytics = getAnalytics(app)
}

export { analytics }
