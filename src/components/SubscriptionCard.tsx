import { format } from 'date-fns'
import { Pencil, Trash2, CalendarClock } from 'lucide-react'
import type { Category, Subscription } from '../types/subscription'
import { CurrencyPill } from './CurrencyPill'
import { formatMoney, nextRenewalDate, daysUntilRenewal } from '../utils/billing'

interface Props {
  sub: Subscription
  category?: Category
  onEdit: (sub: Subscription) => void
  onDelete: (sub: Subscription) => void
}

export function SubscriptionCard({ sub, category, onEdit, onDelete }: Props) {
  const renewal = nextRenewalDate(sub)
  const days = daysUntilRenewal(sub)
  const soon = days <= 7

  return (
    <div
      className={`card group relative overflow-hidden p-4 transition hover:shadow-lift ${
        sub.active ? '' : 'opacity-70'
      }`}
    >
      {/* Accent edge */}
      <span
        className="absolute inset-y-0 left-0 w-1"
        style={{ backgroundColor: sub.color }}
      />
      <div className="flex items-start justify-between gap-3 pl-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-[15px] font-semibold text-ink-900">
              {sub.name}
            </h3>
            {!sub.active && (
              <span className="rounded-md bg-black/[0.05] px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-ink-400">
                paused
              </span>
            )}
          </div>
          {sub.provider && (
            <p className="mt-0.5 truncate text-xs text-ink-500">{sub.provider}</p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {category && (
              <span
                className="inline-flex items-center gap-1.5 rounded-full border border-black/[0.08] bg-black/[0.02] px-2 py-0.5 text-[11px] text-ink-600"
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
                {category.name}
              </span>
            )}
            <span className="text-[11px] capitalize text-ink-400">
              {sub.billingCycle}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1.5">
          <div className="text-right">
            <div className="text-lg font-semibold tabular-nums text-ink-900">
              {formatMoney(sub.cost, sub.currency)}
            </div>
            <div className="mt-0.5 flex justify-end">
              <CurrencyPill currency={sub.currency} />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-black/[0.06] pl-2 pt-3">
        <div
          className={`flex items-center gap-1.5 text-xs ${
            soon ? 'text-accent' : 'text-ink-500'
          }`}
        >
          <CalendarClock size={14} />
          <span>
            {days === 0
              ? 'Renews today'
              : `Renews ${format(renewal, 'd MMM')} · ${days}d`}
          </span>
        </div>
        <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
          <button
            onClick={() => onEdit(sub)}
            className="rounded-full p-1.5 text-ink-500 hover:bg-black/[0.05] hover:text-ink-900"
            aria-label="Edit"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={() => onDelete(sub)}
            className="rounded-full p-1.5 text-ink-500 hover:bg-red-500/10 hover:text-red-500"
            aria-label="Delete"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}
