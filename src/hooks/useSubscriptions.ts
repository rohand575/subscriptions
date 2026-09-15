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
      await addDoc(colRef(), {
        ...rest,
        firstBillingDate: Timestamp.fromDate(new Date(firstBillingDate)),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    },
    [colRef],
  )

  const update = useCallback(
    async (id: string, input: SubscriptionInput) => {
      if (!user) throw new Error('Not signed in')
      const { firstBillingDate, ...rest } = input
      await updateDoc(doc(db, 'users', user.uid, 'subscriptions', id), {
        ...rest,
        firstBillingDate: Timestamp.fromDate(new Date(firstBillingDate)),
        updatedAt: serverTimestamp(),
      })
    },
    [user],
  )

  const remove = useCallback(
    async (id: string) => {
      if (!user) throw new Error('Not signed in')
      await deleteDoc(doc(db, 'users', user.uid, 'subscriptions', id))
    },
    [user],
  )

  return { subscriptions, loading, add, update, remove }
}
