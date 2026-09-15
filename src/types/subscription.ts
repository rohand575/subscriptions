import type { Timestamp } from 'firebase/firestore'

export type Currency = 'EUR' | 'INR'

export type BillingCycle = 'weekly' | 'monthly' | 'quarterly' | 'yearly'

export const CURRENCIES: Currency[] = ['EUR', 'INR']

export const BILLING_CYCLES: { value: BillingCycle; label: string }[] = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
]

export const CURRENCY_SYMBOL: Record<Currency, string> = {
  EUR: '€',
  INR: '₹',
}

export const CURRENCY_LOCALE: Record<Currency, string> = {
  EUR: 'de-DE',
  INR: 'en-IN',
}

/** A subscription document as stored in Firestore. */
export interface Subscription {
  id: string
  name: string
  provider?: string
  cost: number
  currency: Currency
  billingCycle: BillingCycle
  /** First time this subscription billed / will bill. Renewals derive from this. */
  firstBillingDate: Timestamp
  categoryId?: string | null
  tags: string[]
  /** Accent color for the card / calendar dot. */
  color: string
  notes?: string
  active: boolean
  /** Days before renewal to fire a reminder. 0 disables. */
  reminderDaysBefore: number
  createdAt: Timestamp
  updatedAt: Timestamp
}

/** Fields the user edits in the form (id/timestamps are managed automatically). */
export type SubscriptionInput = Omit<
  Subscription,
  'id' | 'createdAt' | 'updatedAt' | 'firstBillingDate'
> & {
  /** ISO date string (yyyy-MM-dd) from the date input. */
  firstBillingDate: string
}

export interface Category {
  id: string
  name: string
  color: string
}

export type CategoryInput = Omit<Category, 'id'>

/** Palette used for subscriptions and categories. */
export const COLOR_PALETTE = [
  '#7c6bff',
  '#ff6b8b',
  '#4fd1c5',
  '#f6ad55',
  '#63b3ed',
  '#b794f4',
  '#68d391',
  '#fc8181',
  '#f6e05e',
  '#a0aec0',
]
