import {
  addWeeks,
  addMonths,
  addYears,
  differenceInCalendarDays,
  isBefore,
  startOfDay,
} from 'date-fns'
import type { BillingCycle, Currency, Subscription } from '../types/subscription'
import { CURRENCY_LOCALE, CURRENCY_SYMBOL } from '../types/subscription'

/** Advance a date by one billing period. */
function advance(date: Date, cycle: BillingCycle): Date {
  switch (cycle) {
    case 'weekly':
      return addWeeks(date, 1)
    case 'monthly':
      return addMonths(date, 1)
    case 'quarterly':
      return addMonths(date, 3)
    case 'yearly':
      return addYears(date, 1)
  }
}

/**
 * The next renewal date on or after `from` (default today), derived by stepping
 * forward from the first billing date. Handles subs whose first bill is in the future.
 */
export function nextRenewalDate(sub: Subscription, from: Date = new Date()): Date {
  const today = startOfDay(from)
  let d = startOfDay(sub.firstBillingDate.toDate())
  // Guard against pathological loops (e.g. bad data) with a generous cap.
  let guard = 0
  while (isBefore(d, today) && guard < 5000) {
    d = advance(d, sub.billingCycle)
    guard++
  }
  return d
}

/** Days from today until the next renewal (0 = renews today). */
export function daysUntilRenewal(sub: Subscription, from: Date = new Date()): number {
  return differenceInCalendarDays(nextRenewalDate(sub, from), startOfDay(from))
}

/** Approx. weeks per month, used to normalise weekly costs. */
const WEEKS_PER_MONTH = 4.345

/** Normalise a subscription's cost to a per-month figure. */
export function monthlyCost(sub: Subscription): number {
  switch (sub.billingCycle) {
    case 'weekly':
      return sub.cost * WEEKS_PER_MONTH
    case 'monthly':
      return sub.cost
    case 'quarterly':
      return sub.cost / 3
    case 'yearly':
      return sub.cost / 12
  }
}

/** Normalise a subscription's cost to a per-year figure. */
export function yearlyCost(sub: Subscription): number {
  return monthlyCost(sub) * 12
}

/** Format a money amount in its currency's locale (e.g. 1.234,56 € / ₹1,234.56). */
export function formatMoney(amount: number, currency: Currency): string {
  try {
    return new Intl.NumberFormat(CURRENCY_LOCALE[currency], {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    return `${CURRENCY_SYMBOL[currency]}${amount.toFixed(2)}`
  }
}

/** Sum monthly-normalised cost per currency for a set of active subscriptions. */
export function totalsByCurrency(
  subs: Subscription[],
  period: 'monthly' | 'yearly' = 'monthly',
): Record<Currency, number> {
  const totals: Record<Currency, number> = { EUR: 0, INR: 0 }
  for (const sub of subs) {
    if (!sub.active) continue
    totals[sub.currency] += period === 'monthly' ? monthlyCost(sub) : yearlyCost(sub)
  }
  return totals
}
