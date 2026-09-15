import { useEffect, useState, useCallback } from 'react'
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../context/AuthContext'
import type { Category, CategoryInput } from '../types/subscription'

/** Live-updating list of the user's categories, plus CRUD helpers. */
export function useCategories() {
  const { user } = useAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setCategories([])
      setLoading(false)
      return
    }
    setLoading(true)
    const q = query(
      collection(db, 'users', user.uid, 'categories'),
      orderBy('name'),
    )
    const unsub = onSnapshot(q, (snap) => {
      setCategories(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Category))
      setLoading(false)
    })
    return unsub
  }, [user])

  const add = useCallback(
    async (input: CategoryInput) => {
      if (!user) throw new Error('Not signed in')
      await addDoc(collection(db, 'users', user.uid, 'categories'), input)
    },
    [user],
  )

  const update = useCallback(
    async (id: string, input: Partial<CategoryInput>) => {
      if (!user) throw new Error('Not signed in')
      await updateDoc(doc(db, 'users', user.uid, 'categories', id), input)
    },
    [user],
  )

  const remove = useCallback(
    async (id: string) => {
      if (!user) throw new Error('Not signed in')
      await deleteDoc(doc(db, 'users', user.uid, 'categories', id))
    },
    [user],
  )

  return { categories, loading, add, update, remove }
}
