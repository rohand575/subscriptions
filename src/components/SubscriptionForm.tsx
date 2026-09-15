import { useState, type FormEvent } from 'react'
import { format } from 'date-fns'
import type {
  Category,
  Currency,
  BillingCycle,
  Subscription,
  SubscriptionInput,
} from '../types/subscription'
import {
  BILLING_CYCLES,
  CURRENCIES,
  COLOR_PALETTE,
  CURRENCY_SYMBOL,
} from '../types/subscription'
import { Modal } from './Modal'

interface Props {
  open: boolean
  onClose: () => void
  onSubmit: (input: SubscriptionInput) => Promise<void>
  categories: Category[]
  /** When set, the form edits this subscription instead of creating one. */
  editing?: Subscription | null
}

function toInput(sub: Subscription | null | undefined): SubscriptionInput {
  if (sub) {
    return {
      name: sub.name,
      provider: sub.provider ?? '',
      cost: sub.cost,
      currency: sub.currency,
      billingCycle: sub.billingCycle,
      firstBillingDate: format(sub.firstBillingDate.toDate(), 'yyyy-MM-dd'),
      categoryId: sub.categoryId ?? null,
      tags: sub.tags ?? [],
      color: sub.color,
      notes: sub.notes ?? '',
      active: sub.active,
      reminderDaysBefore: sub.reminderDaysBefore,
    }
  }
  return {
    name: '',
    provider: '',
    cost: 0,
    currency: 'EUR',
    billingCycle: 'monthly',
    firstBillingDate: format(new Date(), 'yyyy-MM-dd'),
    categoryId: null,
    tags: [],
    color: COLOR_PALETTE[0],
    notes: '',
    active: true,
    reminderDaysBefore: 3,
  }
}

/** Cost as an editable string — blank for a brand-new subscription (no forced 0). */
function costToText(sub: Subscription | null | undefined): string {
  return sub ? String(sub.cost) : ''
}

export function SubscriptionForm({
  open,
  onClose,
  onSubmit,
  categories,
  editing,
}: Props) {
  const [form, setForm] = useState<SubscriptionInput>(() => toInput(editing))
  const [tagsText, setTagsText] = useState((editing?.tags ?? []).join(', '))
  // Cost/reminder are kept as raw text so the field can be emptied while typing
  // (a plain number input would snap an empty box back to 0).
  const [costText, setCostText] = useState(() => costToText(editing))
  const [saving, setSaving] = useState(false)

  // Re-seed the form whenever a different subscription is opened for editing.
  const [seededFor, setSeededFor] = useState<string | null>(editing?.id ?? null)
  if (open && (editing?.id ?? null) !== seededFor) {
    setForm(toInput(editing))
    setTagsText((editing?.tags ?? []).join(', '))
    setCostText(costToText(editing))
    setSeededFor(editing?.id ?? null)
  }

  function set<K extends keyof SubscriptionInput>(key: K, value: SubscriptionInput[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const tags = tagsText
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
      await onSubmit({
        ...form,
        cost: Number(costText) || 0,
        reminderDaysBefore: Number.isFinite(form.reminderDaysBefore)
          ? form.reminderDaysBefore
          : 0,
        tags,
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Edit subscription' : 'Add subscription'}
      footer={
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-ghost">
            Cancel
          </button>
          <button
            type="submit"
            form="subscription-form"
            disabled={saving}
            className="btn-primary"
          >
            {saving ? 'Saving…' : editing ? 'Save changes' : 'Add subscription'}
          </button>
        </div>
      }
    >
      <form id="subscription-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Name</label>
          <input
            required
            autoFocus
            className="input"
            placeholder="Netflix, Spotify, AWS…"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
          />
        </div>

        <div>
          <label className="label">Provider (optional)</label>
          <input
            className="input"
            placeholder="e.g. Netflix Inc."
            value={form.provider}
            onChange={(e) => set('provider', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Cost</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400">
                {CURRENCY_SYMBOL[form.currency]}
              </span>
              <input
                required
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                placeholder="0.00"
                className="input pl-7"
                value={costText}
                onChange={(e) => setCostText(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="label">Currency</label>
            <select
              className="input"
              value={form.currency}
              onChange={(e) => set('currency', e.target.value as Currency)}
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {CURRENCY_SYMBOL[c]} {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Billing cycle</label>
            <select
              className="input"
              value={form.billingCycle}
              onChange={(e) => set('billingCycle', e.target.value as BillingCycle)}
            >
              {BILLING_CYCLES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">First billing date</label>
            <input
              required
              type="date"
              className="input"
              value={form.firstBillingDate}
              onChange={(e) => set('firstBillingDate', e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="label">Category</label>
          <select
            className="input"
            value={form.categoryId ?? ''}
            onChange={(e) => set('categoryId', e.target.value || null)}
          >
            <option value="">Uncategorized</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Tags (comma separated)</label>
          <input
            className="input"
            placeholder="india, shared, work"
            value={tagsText}
            onChange={(e) => setTagsText(e.target.value)}
          />
        </div>

        <div>
          <label className="label">Color</label>
          <div className="flex flex-wrap gap-2">
            {COLOR_PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => set('color', c)}
                className={`h-7 w-7 rounded-full ring-2 ring-offset-2 ring-offset-white transition ${
                  form.color === c ? 'ring-ink-900/70' : 'ring-transparent'
                }`}
                style={{ backgroundColor: c }}
                aria-label={`Color ${c}`}
              />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Remind me (days before)</label>
            <input
              type="number"
              inputMode="numeric"
              min="0"
              max="60"
              className="input"
              value={Number.isFinite(form.reminderDaysBefore) ? form.reminderDaysBefore : ''}
              onChange={(e) =>
                set(
                  'reminderDaysBefore',
                  e.target.value === '' ? NaN : Number(e.target.value),
                )
              }
              onBlur={(e) =>
                set('reminderDaysBefore', e.target.value === '' ? 0 : Number(e.target.value))
              }
            />
          </div>
          <div className="flex items-end">
            <label className="flex cursor-pointer select-none items-center gap-2.5 pb-2.5 text-sm text-ink-800">
              <input
                type="checkbox"
                className="h-4 w-4 accent-accent"
                checked={form.active}
                onChange={(e) => set('active', e.target.checked)}
              />
              Active
            </label>
          </div>
        </div>

        <div>
          <label className="label">Notes (optional)</label>
          <textarea
            className="input min-h-20 resize-y"
            placeholder="Anything worth remembering…"
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
          />
        </div>

      </form>
    </Modal>
  )
}
