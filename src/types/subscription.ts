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

/** Each currency maps to the country its subscriptions belong to. */
export const CURRENCY_REGION: Record<Currency, { country: string; flag: string }> = {
  EUR: { country: 'Germany', flag: '🇩🇪' },
  INR: { country: 'India', flag: '🇮🇳' },
}

/** Sensible starter categories offered on first run when none exist yet. */
export const DEFAULT_CATEGORIES: { name: string; color: string }[] = [
  { name: 'Entertainment', color: '#ff2d55' },
  { name: 'Software', color: '#0071e3' },
  { name: 'Utilities', color: '#34c759' },
  { name: 'Health & Fitness', color: '#00c7be' },
  { name: 'Food & Groceries', color: '#ff9500' },
  { name: 'Shopping', color: '#af52de' },
  { name: 'Finance', color: '#5856d6' },
]

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

/** Palette used for subscriptions and categories (Apple system colors). */
export const COLOR_PALETTE = [
  '#0071e3', // blue
  '#ff2d55', // pink
  '#00c7be', // teal
  '#ff9500', // orange
  '#5856d6', // indigo
  '#af52de', // purple
  '#34c759', // green
  '#ff3b30', // red
  '#ffcc00', // yellow
  '#8e8e93', // gray
]
