import { useMemo, useState } from 'react'
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  isSameMonth,
  isSameDay,
  isToday,
  format,
} from 'date-fns'
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'
import { useSubscriptions } from '../hooks/useSubscriptions'
import { EmptyState } from '../components/EmptyState'
import type { Subscription } from '../types/subscription'
import { nextRenewalDate, formatMoney } from '../utils/billing'

/** Monday-first weekday headers. */
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function CalendarPage() {
  const { subscriptions, loading } = useSubscriptions()
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()))
  const [selected, setSelected] = useState<Date | null>(null)

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 })
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }, [cursor])

  // Map each renewal within the visible range to its day (yyyy-MM-dd key).
  const renewalsByDay = useMemo(() => {
    const map = new Map<string, Subscription[]>()
    const rangeStart = days[0]
    const rangeEnd = days[days.length - 1]
    for (const sub of subscriptions) {
      if (!sub.active) continue
      // Walk renewals across the visible window (a month spans <=6 renewals for weekly).
      let d = nextRenewalDate(sub, rangeStart)
      let guard = 0
      while (d <= rangeEnd && guard < 60) {
        const key = format(d, 'yyyy-MM-dd')
        map.set(key, [...(map.get(key) ?? []), sub])
        d = nextRenewalDate(sub, addDay(d))
        guard++
      }
    }
    return map
  }, [subscriptions, days])

  const selectedSubs = selected
    ? (renewalsByDay.get(format(selected, 'yyyy-MM-dd')) ?? [])
    : []

  if (!loading && subscriptions.length === 0) {
    return (
      <EmptyState
        icon={CalendarDays}
        title="No renewals to show"
        description="Add subscriptions from the Dashboard and their renewals will appear here."
      />
    )
  }

  return (
    <div className="space-y-5">
      <div className="card p-4 sm:p-5">
        {/* Month nav */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold tracking-tight text-ink-900">
            {format(cursor, 'MMMM yyyy')}
          </h2>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCursor((c) => addMonths(c, -1))}
              className="rounded-full p-2 text-ink-500 hover:bg-black/[0.05] hover:text-ink-900"
              aria-label="Previous month"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => setCursor(startOfMonth(new Date()))}
              className="rounded-full px-3 py-1.5 text-xs font-medium text-ink-700 hover:bg-black/[0.05]"
            >
              Today
            </button>
            <button
              onClick={() => setCursor((c) => addMonths(c, 1))}
              className="rounded-full p-2 text-ink-500 hover:bg-black/[0.05] hover:text-ink-900"
              aria-label="Next month"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Weekday header */}
        <div className="grid grid-cols-7 gap-1">
          {WEEKDAYS.map((d) => (
            <div
              key={d}
              className="pb-2 text-center text-[11px] font-medium uppercase tracking-wide text-ink-400"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const key = format(day, 'yyyy-MM-dd')
            const subs = renewalsByDay.get(key) ?? []
            const inMonth = isSameMonth(day, cursor)
            const isSel = selected && isSameDay(day, selected)
            return (
              <button
                key={key}
                onClick={() => setSelected(day)}
                className={`flex aspect-square flex-col items-center justify-start rounded-xl border p-1.5 text-sm transition sm:p-2 ${
                  isSel
                    ? 'border-accent/50 bg-accent/[0.08]'
                    : 'border-transparent hover:bg-black/[0.04]'
                } ${inMonth ? '' : 'opacity-40'}`}
              >
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs tabular-nums ${
                    isToday(day)
                      ? 'bg-accent font-semibold text-white'
                      : 'text-ink-700'
                  }`}
                >
                  {format(day, 'd')}
                </span>
                {subs.length > 0 && (
                  <div className="mt-1 flex flex-wrap justify-center gap-0.5">
                    {subs.slice(0, 4).map((s, i) => (
                      <span
                        key={s.id + i}
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: s.color }}
                      />
                    ))}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Selected day detail */}
      {selected && (
        <div className="card p-5">
          <h3 className="mb-3 text-sm font-semibold text-ink-800">
            {format(selected, 'EEEE, d MMMM')}
          </h3>
          {selectedSubs.length === 0 ? (
            <p className="text-sm text-ink-400">No renewals on this day.</p>
          ) : (
            <div className="space-y-1">
              {selectedSubs.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-xl px-2 py-2 hover:bg-black/[0.03]"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: s.color }}
                    />
                    <span className="text-sm text-ink-800">{s.name}</span>
                    <span className="text-xs capitalize text-ink-400">
                      {s.billingCycle}
                    </span>
                  </div>
                  <span className="text-sm tabular-nums text-ink-700">
                    {formatMoney(s.cost, s.currency)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/** Next calendar day (used to step past a matched renewal). */
function addDay(d: Date): Date {
  const n = new Date(d)
  n.setDate(n.getDate() + 1)
  return n
}
