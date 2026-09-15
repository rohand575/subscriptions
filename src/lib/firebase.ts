import { initializeApp } from 'firebase/app'
import {
  initializeAuth,
  indexedDBLocalPersistence,
  browserLocalPersistence,
  browserPopupRedirectResolver,
  GoogleAuthProvider,
} from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

/** True when the .env has been filled in. Lets us show a friendly setup screen. */
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId,
)

const app = initializeApp(firebaseConfig)

// Explicit persistence order so the session survives cold launches — notably in
// iOS standalone (home-screen) PWAs, where the default can fall back to
// in-memory and force a re-login every time the app is opened.
export const auth = initializeAuth(app, {
  persistence: [indexedDBLocalPersistence, browserLocalPersistence],
  // Required: unlike getAuth(), initializeAuth() does not add a default
  // resolver, so signInWithPopup would otherwise fail.
  popupRedirectResolver: browserPopupRedirectResolver,
})
export const db = getFirestore(app)
export const googleProvider = new GoogleAuthProvider()
