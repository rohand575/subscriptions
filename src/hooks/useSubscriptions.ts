import { useEffect, useState, useCallback } from 'react'
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  Timestamp,
  query,
  orderBy,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../context/AuthContext'
import type { Subscription, SubscriptionInput } from '../types/subscription'
import { syncReminders } from '../utils/notifications'
import {
  isCalendarEnabled,
  createRenewalEvent,
  updateRenewalEvent,
  deleteRenewalEvent,
  type RenewalInfo,
} from '../utils/googleCalendar'

/** Map form input to the fields the calendar event needs. */
function renewalInfo(input: SubscriptionInput): RenewalInfo {
  return {
    name: input.name,
    firstBillingDate: new Date(input.firstBillingDate),
    billingCycle: input.billingCycle,
    reminderDaysBefore: input.reminderDaysBefore,
  }
}

/**
 * Live-updating list of the signed-in user's subscriptions, plus CRUD helpers.
 * Data lives under users/{uid}/subscriptions and is locked to the owner by rules.
 */
export function useSubscriptions() {
  const { user } = useAuth()
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)

  const colRef = useCallback(() => {
    if (!user) throw new Error('Not signed in')
    return collection(db, 'users', user.uid, 'subscriptions')
  }, [user])

  useEffect(() => {
    if (!user) {
      setSubscriptions([])
      setLoading(false)
      return
    }
    setLoading(true)
    const q = query(
      collection(db, 'users', user.uid, 'subscriptions'),
      orderBy('createdAt', 'desc'),
    )
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Subscription)
      setSubscriptions(list)
      setLoading(false)
      // Keep native reminders in sync with the latest data.
      void syncReminders(list)
    })
    return unsub
  }, [user])

  const add = useCallback(
    async (input: SubscriptionInput) => {
      const { firstBillingDate, ...rest } = input
      const ref = await addDoc(colRef(), {
        ...rest,
        firstBillingDate: Timestamp.fromDate(new Date(firstBillingDate)),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      // Best-effort: mirror as a Google Calendar event when sync is on.
      if (user && input.active && isCalendarEnabled(user.uid)) {
        try {
          const eventId = await createRenewalEvent(renewalInfo(input))
          await updateDoc(ref, { calendarEventId: eventId })
        } catch (e) {
          console.warn('Calendar sync (add) failed', e)
        }
      }
    },
    [colRef, user],
  )

  const update = useCallback(
    async (id: string, input: SubscriptionInput) => {
      if (!user) throw new Error('Not signed in')
      const { firstBillingDate, ...rest } = input
      const docRef = doc(db, 'users', user.uid, 'subscriptions', id)
      await updateDoc(docRef, {
        ...rest,
        firstBillingDate: Timestamp.fromDate(new Date(firstBillingDate)),
        updatedAt: serverTimestamp(),
      })

      if (!isCalendarEnabled(user.uid)) return
      const eventId = subscriptions.find((s) => s.id === id)?.calendarEventId ?? null
      try {
        if (!input.active) {
          // Inactive subs shouldn't nag — drop any existing event.
          if (eventId) {
            await deleteRenewalEvent(eventId)
            await updateDoc(docRef, { calendarEventId: null })
          }
        } else if (eventId) {
          const newId = await updateRenewalEvent(eventId, renewalInfo(input))
          if (newId !== eventId) await updateDoc(docRef, { calendarEventId: newId })
        } else {
          const newId = await createRenewalEvent(renewalInfo(input))
          await updateDoc(docRef, { calendarEventId: newId })
        }
      } catch (e) {
        console.warn('Calendar sync (update) failed', e)
      }
    },
    [user, subscriptions],
  )

  const remove = useCallback(
    async (id: string) => {
      if (!user) throw new Error('Not signed in')
      const eventId = subscriptions.find((s) => s.id === id)?.calendarEventId
      if (eventId && isCalendarEnabled(user.uid)) {
        try {
          await deleteRenewalEvent(eventId)
        } catch (e) {
          console.warn('Calendar sync (delete) failed', e)
        }
      }
      await deleteDoc(doc(db, 'users', user.uid, 'subscriptions', id))
    },
    [user, subscriptions],
  )

  /**
   * Create calendar events for active subs that don't have one yet — used to
   * backfill existing subscriptions and as a manual "Sync now" retry.
   * Returns counts plus the last error message (for surfacing to the user).
   */
  const syncAllToCalendar = useCallback(async () => {
    const result = { synced: 0, failed: 0, error: null as string | null }
    if (!user || !isCalendarEnabled(user.uid)) return result
    for (const s of subscriptions) {
      if (!s.active || s.calendarEventId) continue
      try {
        const eventId = await createRenewalEvent({
          name: s.name,
          firstBillingDate: s.firstBillingDate.toDate(),
          billingCycle: s.billingCycle,
          reminderDaysBefore: s.reminderDaysBefore,
        })
        await updateDoc(doc(db, 'users', user.uid, 'subscriptions', s.id), {
          calendarEventId: eventId,
        })
        result.synced++
      } catch (e) {
        result.failed++
        result.error = e instanceof Error ? e.message : String(e)
        console.warn('Calendar backfill failed for', s.name, e)
      }
    }
    return result
  }, [user, subscriptions])

  return { subscriptions, loading, add, update, remove, syncAllToCalendar }
}
