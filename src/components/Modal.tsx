import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

/** Centered, dismissable modal sheet. Slides up from the bottom on mobile. */
export function Modal({ open, onClose, title, children }: Props) {
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
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="card relative z-10 max-h-[92vh] w-full max-w-lg animate-scale-in overflow-y-auto rounded-b-none rounded-t-3xl shadow-lift sm:rounded-3xl">
        <div className="glass sticky top-0 flex items-center justify-between border-b px-5 py-4">
          <h2 className="text-base font-semibold tracking-tight text-ink-900">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-ink-500 hover:bg-black/[0.05] hover:text-ink-900"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}
