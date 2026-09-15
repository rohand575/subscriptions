/**
 * Google Calendar sync — adds a recurring "renews" event for each subscription
 * so the phone's native Calendar handles the reminders (no push server needed).
 *
 * Auth uses Google Identity Services (GIS) token client to get a short-lived
 * access token for the calendar.events scope, on demand and independent of the
 * Firebase sign-in (whose Google token isn't refreshed for API use). The sync
 * on/off preference is stored per uid in localStorage.
 */
import type { BillingCycle } from '../types/subscription'

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined
const SCOPE = 'https://www.googleapis.com/auth/calendar.events'
const CAL_API = 'https://www.googleapis.com/calendar/v3/calendars/primary/events'
const PREF_PREFIX = 'calendarSync:'

/** True when a Google OAuth client id has been configured at build time. */
export const isCalendarConfigured = Boolean(CLIENT_ID)

// ---- minimal Google Identity Services typings ----
interface TokenResponse {
  access_token: string
  expires_in: number
  error?: string
}
interface TokenClient {
  requestAccessToken: (opts?: { prompt?: string }) => void
}
declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (cfg: {
            client_id: string
            scope: string
            callback: (r: TokenResponse) => void
            error_callback?: (e: unknown) => void
          }) => TokenClient
        }
      }
    }
  }
}

// ---- GIS script loader ----
let gisPromise: Promise<void> | null = null
function loadGis(): Promise<void> {
  if (window.google?.accounts?.oauth2) return Promise.resolve()
  if (gisPromise) return gisPromise
  gisPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'https://accounts.google.com/gsi/client'
    s.async = true
    s.defer = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('Failed to load Google Identity Services'))
    document.head.appendChild(s)
  })
  return gisPromise
}

// ---- access token (cached in-memory until near expiry) ----
let cachedToken: { value: string; expiresAt: number } | null = null

async function getAccessToken(interactive: boolean): Promise<string> {
  if (!CLIENT_ID) throw new Error('VITE_GOOGLE_CLIENT_ID is not set')
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value
  await loadGis()
  return new Promise<string>((resolve, reject) => {
    const client = window.google!.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPE,
      callback: (r) => {
        if (r.error) {
          reject(new Error(r.error))
          return
        }
        cachedToken = {
          value: r.access_token,
          expiresAt: Date.now() + (r.expires_in - 60) * 1000,
        }
        resolve(r.access_token)
      },
      error_callback: (e) =>
        reject(e instanceof Error ? e : new Error('Google authorization failed')),
    })
    // '' attempts silent issuance (reuses prior consent); 'consent' forces the
    // permission dialog, used the first time the user enables sync.
    client.requestAccessToken({ prompt: interactive ? 'consent' : '' })
  })
}

// ---- sync on/off preference ----
export function isCalendarEnabled(uid: string): boolean {
  return localStorage.getItem(PREF_PREFIX + uid) === '1'
}

/** Turn on sync — triggers the Google consent dialog for the calendar scope. */
export async function enableCalendarSync(uid: string): Promise<void> {
  await getAccessToken(true)
  localStorage.setItem(PREF_PREFIX + uid, '1')
}

export function disableCalendarSync(uid: string): void {
  localStorage.removeItem(PREF_PREFIX + uid)
}

// ---- event construction ----
/** The subset of a subscription needed to build its calendar event. */
export interface RenewalInfo {
  name: string
  firstBillingDate: Date
  billingCycle: BillingCycle
  reminderDaysBefore: number
}

function rrule(cycle: BillingCycle): string {
  switch (cycle) {
    case 'weekly':
      return 'RRULE:FREQ=WEEKLY'
    case 'monthly':
      return 'RRULE:FREQ=MONTHLY'
    case 'quarterly':
      return 'RRULE:FREQ=MONTHLY;INTERVAL=3'
    case 'yearly':
      return 'RRULE:FREQ=YEARLY'
  }
}

/**
 * Reminder day-offsets before each renewal, honouring the sub's lead time and
 * capped at Google's 5-reminder limit — e.g. lead 5 → [5, 3, 2, 1, 0].
 */
function reminderDayOffsets(lead: number): number[] {
  const l = lead > 0 ? lead : 5
  const days = new Set<number>([0, 1, 2, 3, l])
  return [...days]
    .filter((d) => d <= l)
    .sort((a, b) => b - a)
    .slice(0, 5)
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}
/** Local yyyy-MM-dd (not UTC — the renewal day is a wall-clock date). */
function localDateStr(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function buildEventResource(info: RenewalInfo) {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const date = localDateStr(info.firstBillingDate)
  return {
    summary: `${info.name} renews`,
    description: 'Subscription renewal — added by Subscriptions.',
    // A short 09:00 event so reminders pop in the morning rather than at midnight.
    start: { dateTime: `${date}T09:00:00`, timeZone },
    end: { dateTime: `${date}T09:30:00`, timeZone },
    recurrence: [rrule(info.billingCycle)],
    reminders: {
      useDefault: false,
      overrides: reminderDayOffsets(info.reminderDaysBefore).map((d) => ({
        method: 'popup',
        minutes: d * 24 * 60,
      })),
    },
    // Don't block free/busy — a renewal isn't a real appointment.
    transparency: 'transparent',
  }
}

// ---- Calendar API CRUD ----
export async function createRenewalEvent(info: RenewalInfo): Promise<string> {
  const token = await getAccessToken(false)
  const res = await fetch(CAL_API, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(buildEventResource(info)),
  })
  if (!res.ok) throw new Error(`Calendar create failed: ${res.status} ${await res.text().catch(() => '')}`)
  const data = (await res.json()) as { id: string }
  return data.id
}

/** Update the event; if it was deleted externally (404), recreate it. */
export async function updateRenewalEvent(
  eventId: string,
  info: RenewalInfo,
): Promise<string> {
  const token = await getAccessToken(false)
  const res = await fetch(`${CAL_API}/${eventId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(buildEventResource(info)),
  })
  if (res.status === 404 || res.status === 410) return createRenewalEvent(info)
  if (!res.ok) throw new Error(`Calendar update failed: ${res.status} ${await res.text().catch(() => '')}`)
  const data = (await res.json()) as { id: string }
  return data.id
}

export async function deleteRenewalEvent(eventId: string): Promise<void> {
  const token = await getAccessToken(false)
  const res = await fetch(`${CAL_API}/${eventId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  // 404/410 = already gone; treat as success.
  if (!res.ok && res.status !== 404 && res.status !== 410) {
    throw new Error(`Calendar delete failed: ${res.status}`)
  }
}
