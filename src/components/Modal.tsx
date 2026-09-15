import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  /** Pinned action bar at the bottom of the sheet (e.g. Cancel / Save). */
  footer?: ReactNode
}

/**
 * Dismissable sheet: a bottom sheet on mobile, a centered dialog on desktop.
 * Laid out as a flex column so the header and footer stay pinned while only
 * the body scrolls — keeps action buttons reachable even with the keyboard up.
 */
export function Modal({ open, onClose, title, children, footer }: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div
        className="absolute inset-0 bg-black/25 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="card relative z-10 flex max-h-[92dvh] w-full max-w-lg animate-scale-in flex-col overflow-hidden rounded-b-none rounded-t-3xl shadow-lift sm:max-h-[88dvh] sm:rounded-3xl">
        {/* Pinned header */}
        <div className="flex shrink-0 items-center justify-between border-b border-black/[0.06] px-5 py-4">
          <h2 className="text-base font-semibold tracking-tight text-ink-900">{title}</h2>
          <button
            onClick={onClose}
            className="-mr-1.5 rounded-full p-2 text-ink-500 hover:bg-black/[0.05] hover:text-ink-900"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5">
          {children}
        </div>

        {/* Pinned footer (safe-area aware for the home indicator) */}
        {footer && (
          <div
            className="shrink-0 border-t border-black/[0.06] bg-white px-5 py-3"
            style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
