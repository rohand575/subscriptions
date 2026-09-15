import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { isFirebaseConfigured } from './lib/firebase'
import { isBiometricEnabled } from './utils/biometric'
import { AppShell } from './components/AppShell'
import { Login } from './pages/Login'
import { LockScreen } from './pages/LockScreen'
import { SetupNotice } from './pages/SetupNotice'
import { Dashboard } from './pages/Dashboard'
import { CalendarPage } from './pages/Calendar'
import { Analytics } from './pages/Analytics'
import { Settings } from './pages/Settings'
import { Loader2 } from 'lucide-react'

function FullScreen({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">{children}</div>
  )
}

export default function App() {
  const { user, loading } = useAuth()
  // In-memory: resets on every cold launch, so Face ID is required each time
  // the PWA is (re)opened.
  const [unlocked, setUnlocked] = useState(false)

  if (!isFirebaseConfigured) return <SetupNotice />

  if (loading) {
    return (
      <FullScreen>
        <Loader2 className="animate-spin text-accent" size={28} />
      </FullScreen>
    )
  }

  if (!user) return <Login />

  if (isBiometricEnabled(user.uid) && !unlocked) {
    return <LockScreen onUnlock={() => setUnlocked(true)} />
  }

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  )
}
