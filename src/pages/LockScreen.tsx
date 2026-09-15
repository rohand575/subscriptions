import { useCallback, useEffect, useState } from 'react'
import { ScanFace, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { verifyBiometric } from '../utils/biometric'

export function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const { user, signOut } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const unlock = useCallback(async () => {
    if (!user) return
    setError(null)
    setBusy(true)
    try {
      const ok = await verifyBiometric(user.uid)
      if (ok) onUnlock()
      else setError('Could not verify. Try again.')
    } catch {
      setError('Unlock cancelled. Tap to try again.')
    } finally {
      setBusy(false)
    }
  }, [user, onUnlock])

  // Auto-prompt once on mount so a launch is a single tap of Face ID.
  useEffect(() => {
    void unlock()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="card w-full max-w-sm p-8 text-center shadow-lift">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent text-white shadow-glow">
          <ScanFace size={30} />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Locked</h1>
        <p className="mt-2 text-sm text-ink-500">
          Unlock with Face ID to view your subscriptions.
        </p>

        <button
          onClick={() => void unlock()}
          disabled={busy}
          className="btn-primary mt-8 w-full gap-2 text-[15px]"
        >
          <ScanFace size={18} />
          {busy ? 'Verifying…' : 'Unlock with Face ID'}
        </button>

        {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

        <button
          onClick={() => void signOut()}
          className="btn-ghost mx-auto mt-6 gap-2 text-xs text-ink-400"
        >
          <LogOut size={14} /> Sign out instead
        </button>
      </div>
    </div>
  )
}
