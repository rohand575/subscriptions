import { useMemo, useState } from 'react'
import {
  PieChart as RePieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import { PieChart as PieIcon } from 'lucide-react'
import { useSubscriptions } from '../hooks/useSubscriptions'
import { useCategories } from '../hooks/useCategories'
import { EmptyState } from '../components/EmptyState'
import type { Currency } from '../types/subscription'
import { CURRENCIES, CURRENCY_SYMBOL } from '../types/subscription'
import { monthlyCost, formatMoney } from '../utils/billing'

export function Analytics() {
  const { subscriptions } = useSubscriptions()
  const { categories } = useCategories()
  const [currency, setCurrency] = useState<Currency>('EUR')

  const active = useMemo(
    () => subscriptions.filter((s) => s.active && s.currency === currency),
    [subscriptions, currency],
  )

  const catById = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c])),
    [categories],
  )

  // Spend by category (monthly-normalised) for the selected currency.
  const byCategory = useMemo(() => {
    const map = new Map<string, { name: string; color: string; value: number }>()
    for (const s of active) {
      const cat = s.categoryId ? catById[s.categoryId] : undefined
      const id = cat?.id ?? 'uncat'
      const name = cat?.name ?? 'Uncategorized'
      const color = cat?.color ?? '#a1a1a6'
      const prev = map.get(id)
      map.set(id, { name, color, value: (prev?.value ?? 0) + monthlyCost(s) })
    }
    return [...map.values()].sort((a, b) => b.value - a.value)
  }, [active, catById])

  // Top subscriptions by monthly cost.
  const topSubs = useMemo(
    () =>
      [...active]
        .map((s) => ({ name: s.name, color: s.color, value: monthlyCost(s) }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6),
    [active],
  )

  const total = byCategory.reduce((sum, c) => sum + c.value, 0)

  if (subscriptions.length === 0) {
    return (
      <EmptyState
        icon={PieIcon}
        title="Nothing to analyze yet"
        description="Add subscriptions to see where your money goes."
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Currency toggle */}
      <div className="inline-flex rounded-full border border-black/10 bg-white p-1 shadow-soft">
        {CURRENCIES.map((c) => (
          <button
            key={c}
            onClick={() => setCurrency(c)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              currency === c
                ? 'bg-accent text-white shadow-glow'
                : 'text-ink-500 hover:text-ink-900'
            }`}
          >
            {CURRENCY_SYMBOL[c]} {c}
          </button>
        ))}
      </div>

      {active.length === 0 ? (
        <EmptyState
          icon={PieIcon}
          title={`No active ${currency} subscriptions`}
          description="Switch currency or add one to see the breakdown."
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Donut: spend by category */}
          <div className="card p-5">
            <h2 className="mb-1 text-sm font-semibold text-ink-800">
              Monthly spend by category
            </h2>
            <p className="mb-4 text-xs text-ink-400">
              {formatMoney(total, currency)} / month total
            </p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={byCategory}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={62}
                    outerRadius={92}
                    paddingAngle={2}
                    stroke="none"
                  >
                    {byCategory.map((d) => (
                      <Cell key={d.name} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(v: number) => formatMoney(v, currency)}
                  />
                </RePieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 space-y-1.5">
              {byCategory.map((c) => (
                <div key={c.name} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-ink-700">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: c.color }}
                    />
                    {c.name}
                  </span>
                  <span className="tabular-nums text-ink-500">
                    {formatMoney(c.value, currency)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Bar: top subscriptions */}
          <div className="card p-5">
            <h2 className="mb-4 text-sm font-semibold text-ink-800">
              Top subscriptions (monthly)
            </h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topSubs}
                  layout="vertical"
                  margin={{ left: 8, right: 16 }}
                >
                  <CartesianGrid horizontal={false} stroke="rgba(0,0,0,0.06)" />
                  <XAxis
                    type="number"
                    tick={{ fill: '#6e6e73', fontSize: 11 }}
                    tickFormatter={(v) => `${CURRENCY_SYMBOL[currency]}${v.toFixed(0)}`}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fill: '#424245', fontSize: 12 }}
                    width={90}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                    contentStyle={tooltipStyle}
                    formatter={(v: number) => formatMoney(v, currency)}
                  />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                    {topSubs.map((d) => (
                      <Cell key={d.name} fill={d.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const tooltipStyle = {
  background: '#ffffff',
  border: '1px solid rgba(0,0,0,0.1)',
  borderRadius: 12,
  boxShadow: '0 12px 32px -16px rgba(0,0,0,0.25)',
  color: '#1d1d1f',
  fontSize: 13,
}
