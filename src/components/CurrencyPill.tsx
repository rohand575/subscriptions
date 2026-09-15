import type { Currency } from '../types/subscription'
import { CURRENCY_SYMBOL } from '../types/subscription'

/** Small badge showing which currency an amount is in. */
export function CurrencyPill({ currency }: { currency: Currency }) {
  return (
    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-md border border-white/10 bg-white/5 px-1.5 text-xs font-semibold text-slate-300">
      {CURRENCY_SYMBOL[currency]} {currency}
    </span>
  )
}
