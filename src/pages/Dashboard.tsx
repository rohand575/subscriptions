import { useMemo, useState } from 'react'
import { Plus, Wallet, CalendarClock, Layers } from 'lucide-react'
import { format } from 'date-fns'
import { useSubscriptions } from '../hooks/useSubscriptions'
import { useCategories } from '../hooks/useCategories'
import { SubscriptionCard } from '../components/SubscriptionCard'
import { SubscriptionForm } from '../components/SubscriptionForm'
import { CategoryChip } from '../components/CategoryChip'
import { EmptyState } from '../components/EmptyState'
import type { Subscription, Currency } from '../types/subscription'
import { CURRENCIES, CURRENCY_REGION } from '../types/subscription'
import {
  totalsByCurrency,
  formatMoney,
  daysUntilRenewal,
  nextRenewalDate,
} from '../utils/billing'

export function Dashboard() {
  const { subscriptions, loading, add, update, remove } = useSubscriptions()
  const { categories } = useCategories()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Subscription | null>(null)
  const [filter, setFilter] = useState<string | null>(null)
  const [region, setRegion] = useState<Currency | null>(null)

  const monthly = useMemo(() => totalsByCurrency(subscriptions, 'monthly'), [subscriptions])
  const catById = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c])),
    [categories],
  )

  const upcoming = useMemo(
    () =>
      subscriptions
        .filter((s) => s.active && daysUntilRenewal(s) <= 30)
        .sort((a, b) => daysUntilRenewal(a) - daysUntilRenewal(b))
        .slice(0, 5),
    [subscriptions],
  )

  const visible = useMemo(
    () =>
      subscriptions.filter(
        (s) =>
          (!filter || s.categoryId === filter) &&
          (!region || s.currency === region),
      ),
    [subscriptions, filter, region],
  )

  // Split the visible list into per-region groups so Germany (EUR) and India
  // (INR) subscriptions read as clearly separate sections.
  const groups = useMemo(
    () =>
      CURRENCIES.map((c) => ({
        currency: c,
        ...CURRENCY_REGION[c],
        subs: visible.filter((s) => s.currency === c),
        monthly: monthly[c],
      })).filter((g) => g.subs.length > 0),
    [visible, monthly],
  )

  const activeCount = subscriptions.filter((s) => s.active).length

  function openAdd() {
    setEditing(null)
    setFormOpen(true)
  }
  function openEdit(sub: Subscription) {
    setEditing(sub)
    setFormOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Totals */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {CURRENCIES.map((c) => (
          <div key={c} className="card p-5">
            <div className="flex items-center gap-2 text-ink-500">
              <span className="text-base leading-none">{CURRENCY_REGION[c].flag}</span>
              <span className="text-xs font-medium uppercase tracking-wide">
                {CURRENCY_REGION[c].country} · monthly
              </span>
            </div>
            <div className="mt-3 text-2xl font-semibold tabular-nums tracking-tight text-ink-900">
              {formatMoney(monthly[c], c)}
            </div>
            <div className="mt-1 text-xs text-ink-400">
              {formatMoney(monthly[c] * 12, c)} / year
            </div>
          </div>
        ))}
        <div className="card p-5">
          <div className="flex items-center gap-2 text-ink-500">
            <Layers size={16} />
            <span className="text-xs font-medium uppercase tracking-wide">Active</span>
          </div>
          <div className="mt-3 text-2xl font-semibold tabular-nums tracking-tight text-ink-900">
            {activeCount}
          </div>
          <div className="mt-1 text-xs text-ink-400">
            {subscriptions.length} total
          </div>
        </div>
      </div>

      {/* Upcoming renewals */}
      {upcoming.length > 0 && (
        <div className="card p-5">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink-800">
            <CalendarClock size={16} className="text-accent" />
            Upcoming renewals
          </h2>
          <div className="space-y-1">
            {upcoming.map((s) => {
              const d = daysUntilRenewal(s)
              return (
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
                    <span className="text-xs text-ink-400">
                      {format(nextRenewalDate(s), 'd MMM')}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm tabular-nums text-ink-700">
                      {formatMoney(s.cost, s.currency)}
                    </span>
                    <span
                      className={`w-14 text-right text-xs ${
                        d <= 3 ? 'text-accent' : 'text-ink-400'
                      }`}
                    >
                      {d === 0 ? 'today' : `${d}d`}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Header + add */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-ink-800">
          All subscriptions
        </h2>
        <button onClick={openAdd} className="btn-primary">
          <Plus size={16} /> Add
        </button>
      </div>

      {/* Region filters */}
      <div className="flex flex-wrap gap-2">
        <CategoryChip
          name="All regions"
          color="#0071e3"
          active={region === null}
          onClick={() => setRegion(null)}
        />
        {CURRENCIES.map((c) => (
          <CategoryChip
            key={c}
            name={`${CURRENCY_REGION[c].flag} ${CURRENCY_REGION[c].country}`}
            color="#0071e3"
            active={region === c}
            onClick={() => setRegion(region === c ? null : c)}
          />
        ))}
      </div>

      {/* Category filters */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <CategoryChip
            name="All"
            color="#0071e3"
            active={filter === null}
            onClick={() => setFilter(null)}
          />
          {categories.map((c) => (
            <CategoryChip
              key={c.id}
              name={c.name}
              color={c.color}
              active={filter === c.id}
              onClick={() => setFilter(filter === c.id ? null : c.id)}
            />
          ))}
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="card h-28 animate-pulse bg-black/[0.03]" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title={filter ? 'Nothing in this category' : 'No subscriptions yet'}
          description={
            filter
              ? 'Try a different filter or add one here.'
              : 'Add your first subscription to start tracking where your money goes.'
          }
          action={
            <button onClick={openAdd} className="btn-primary">
              <Plus size={16} /> Add subscription
            </button>
          }
        />
      ) : (
        <div className="space-y-6">
          {groups.map((g) => (
            <section key={g.currency} className="space-y-3">
              <div className="flex items-center justify-between border-b border-black/[0.06] pb-2">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-ink-800">
                  <span className="text-base leading-none">{g.flag}</span>
                  {g.country}
                  <span className="rounded-full bg-black/[0.04] px-2 py-0.5 text-[11px] font-medium text-ink-500">
                    {g.subs.length}
                  </span>
                </h3>
                <span className="text-xs tabular-nums text-ink-400">
                  {formatMoney(g.monthly, g.currency)} / mo
                </span>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {g.subs.map((s) => (
                  <SubscriptionCard
                    key={s.id}
                    sub={s}
                    category={s.categoryId ? catById[s.categoryId] : undefined}
                    onEdit={openEdit}
                    onDelete={(sub) => {
                      if (confirm(`Delete "${sub.name}"?`)) void remove(sub.id)
                    }}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <SubscriptionForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        categories={categories}
        editing={editing}
        onSubmit={(input) => (editing ? update(editing.id, input) : add(input))}
      />
    </div>
  )
}
