import { useMemo, useState } from 'react'
import { Plus, Wallet, CalendarClock, Layers } from 'lucide-react'
import { format } from 'date-fns'
import { useSubscriptions } from '../hooks/useSubscriptions'
import { useCategories } from '../hooks/useCategories'
import { SubscriptionCard } from '../components/SubscriptionCard'
import { SubscriptionForm } from '../components/SubscriptionForm'
import { CategoryChip } from '../components/CategoryChip'
import { EmptyState } from '../components/EmptyState'
import type { Subscription } from '../types/subscription'
import { CURRENCIES } from '../types/subscription'
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
    () => (filter ? subscriptions.filter((s) => s.categoryId === filter) : subscriptions),
    [subscriptions, filter],
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
            <div className="flex items-center gap-2 text-slate-400">
              <Wallet size={16} />
              <span className="text-xs font-medium uppercase tracking-wide">
                {c} · monthly
              </span>
            </div>
            <div className="mt-3 text-2xl font-semibold tabular-nums text-slate-50">
              {formatMoney(monthly[c], c)}
            </div>
            <div className="mt-1 text-xs text-slate-500">
              {formatMoney(monthly[c] * 12, c)} / year
            </div>
          </div>
        ))}
        <div className="card p-5">
          <div className="flex items-center gap-2 text-slate-400">
            <Layers size={16} />
            <span className="text-xs font-medium uppercase tracking-wide">Active</span>
          </div>
          <div className="mt-3 text-2xl font-semibold tabular-nums text-slate-50">
            {activeCount}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {subscriptions.length} total
          </div>
        </div>
      </div>

      {/* Upcoming renewals */}
      {upcoming.length > 0 && (
        <div className="card p-5">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-200">
            <CalendarClock size={16} className="text-accent-soft" />
            Upcoming renewals
          </h2>
          <div className="space-y-1">
            {upcoming.map((s) => {
              const d = daysUntilRenewal(s)
              return (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-white/[0.03]"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: s.color }}
                    />
                    <span className="text-sm text-slate-200">{s.name}</span>
                    <span className="text-xs text-slate-500">
                      {format(nextRenewalDate(s), 'd MMM')}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm tabular-nums text-slate-300">
                      {formatMoney(s.cost, s.currency)}
                    </span>
                    <span
                      className={`w-14 text-right text-xs ${
                        d <= 3 ? 'text-accent-soft' : 'text-slate-500'
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
        <h2 className="text-sm font-semibold text-slate-200">
          All subscriptions
        </h2>
        <button onClick={openAdd} className="btn-primary">
          <Plus size={16} /> Add
        </button>
      </div>

      {/* Category filters */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <CategoryChip
            name="All"
            color="#7c6bff"
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
            <div key={i} className="card h-28 animate-pulse bg-ink-800/40" />
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {visible.map((s) => (
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
