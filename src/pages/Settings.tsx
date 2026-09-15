import { useEffect, useState } from 'react'
import { Plus, Trash2, LogOut, Bell, BellOff, Tag, ScanFace } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useCategories } from '../hooks/useCategories'
import { COLOR_PALETTE, DEFAULT_CATEGORIES } from '../types/subscription'
import {
  requestNotificationPermission,
  notificationsEnabled,
} from '../utils/notifications'
import {
  isBiometricSupported,
  isBiometricEnabled,
  enrollBiometric,
  disableBiometric,
} from '../utils/biometric'

export function Settings() {
  const { user, signOut } = useAuth()
  const { categories, add, remove } = useCategories()
  const [name, setName] = useState('')
  const [color, setColor] = useState(COLOR_PALETTE[0])
  const [notifOn, setNotifOn] = useState(false)
  const [bioSupported, setBioSupported] = useState(false)
  const [bioOn, setBioOn] = useState(false)
  const [bioBusy, setBioBusy] = useState(false)
  const [bioError, setBioError] = useState<string | null>(null)

  useEffect(() => {
    void notificationsEnabled().then(setNotifOn)
    void isBiometricSupported().then(setBioSupported)
    if (user) setBioOn(isBiometricEnabled(user.uid))
  }, [user])

  async function addCategory() {
    const trimmed = name.trim()
    if (!trimmed) return
    await add({ name: trimmed, color })
    setName('')
    setColor(COLOR_PALETTE[(categories.length + 1) % COLOR_PALETTE.length])
  }

  async function addDefaults() {
    const existing = new Set(categories.map((c) => c.name.toLowerCase()))
    for (const c of DEFAULT_CATEGORIES) {
      if (!existing.has(c.name.toLowerCase())) await add(c)
    }
  }

  async function enableNotifications() {
    const granted = await requestNotificationPermission()
    setNotifOn(granted)
  }

  async function toggleBiometric() {
    if (!user) return
    setBioError(null)
    if (bioOn) {
      disableBiometric(user.uid)
      setBioOn(false)
      return
    }
    setBioBusy(true)
    try {
      const ok = await enrollBiometric(user.uid, user.email ?? user.displayName ?? 'Account')
      setBioOn(ok)
      if (!ok) setBioError('Setup was cancelled.')
    } catch {
      setBioError('Could not set up Face ID lock.')
    } finally {
      setBioBusy(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Account */}
      <div className="card p-5">
        <h2 className="mb-4 text-sm font-semibold text-ink-800">Account</h2>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt=""
                className="h-10 w-10 rounded-full border border-black/10"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-sm font-semibold text-accent">
                {user?.displayName?.[0] ?? user?.email?.[0] ?? '?'}
              </div>
            )}
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-ink-900">
                {user?.displayName ?? 'Signed in'}
              </div>
              <div className="truncate text-xs text-ink-400">{user?.email}</div>
            </div>
          </div>
          <button onClick={() => void signOut()} className="btn-ghost">
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </div>

      {/* Notifications */}
      <div className="card p-5">
        <h2 className="mb-1 text-sm font-semibold text-ink-800">Reminders</h2>
        <p className="mb-4 text-xs text-ink-400">
          Get notified before a subscription renews. On Android these fire in the
          background; on the web they show while the app is open.
        </p>
        <button
          onClick={enableNotifications}
          disabled={notifOn}
          className={notifOn ? 'btn-ghost' : 'btn-primary'}
        >
          {notifOn ? (
            <>
              <Bell size={16} /> Reminders enabled
            </>
          ) : (
            <>
              <BellOff size={16} /> Enable reminders
            </>
          )}
        </button>
      </div>

      {/* Face ID lock */}
      {bioSupported && (
        <div className="card p-5">
          <h2 className="mb-1 text-sm font-semibold text-ink-800">App lock</h2>
          <p className="mb-4 text-xs text-ink-400">
            Require Face ID (or your device biometric) each time you open the app.
            You stay signed in — this just keeps your subscriptions private if
            someone else has your phone.
          </p>
          <button
            onClick={() => void toggleBiometric()}
            disabled={bioBusy}
            className={bioOn ? 'btn-ghost' : 'btn-primary'}
          >
            <ScanFace size={16} />
            {bioBusy ? 'Setting up…' : bioOn ? 'Face ID lock on' : 'Enable Face ID lock'}
          </button>
          {bioError && <p className="mt-3 text-sm text-red-500">{bioError}</p>}
        </div>
      )}

      {/* Categories */}
      <div className="card p-5">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-ink-800">
          <Tag size={16} /> Categories
        </h2>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <input
            className="input flex-1"
            placeholder="New category name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addCategory()}
          />
          <div className="flex items-center gap-1.5">
            {COLOR_PALETTE.slice(0, 6).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`h-7 w-7 rounded-full ring-2 ring-offset-2 ring-offset-white transition ${
                  color === c ? 'ring-ink-900/70' : 'ring-transparent'
                }`}
                style={{ backgroundColor: c }}
                aria-label={`Color ${c}`}
              />
            ))}
          </div>
          <button onClick={addCategory} className="btn-primary">
            <Plus size={16} /> Add
          </button>
        </div>

        {categories.length === 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-ink-400">
              No categories yet. Add some to group your subscriptions.
            </p>
            <button onClick={addDefaults} className="btn-ghost">
              <Plus size={16} /> Add starter categories
            </button>
          </div>
        ) : (
          <div className="space-y-1.5">
            {categories.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-xl px-2 py-2 hover:bg-black/[0.03]"
              >
                <span className="flex items-center gap-2.5 text-sm text-ink-800">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: c.color }}
                  />
                  {c.name}
                </span>
                <button
                  onClick={() => {
                    if (confirm(`Delete category "${c.name}"?`)) void remove(c.id)
                  }}
                  className="rounded-full p-1.5 text-ink-500 hover:bg-red-500/10 hover:text-red-500"
                  aria-label="Delete category"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="pb-4 text-center text-xs text-ink-300">
        Subscriptions · your data stays private to your account
      </p>
    </div>
  )
}
