interface Props {
  name: string
  color: string
  onClick?: () => void
  active?: boolean
}

/** Colored pill representing a category, optionally clickable as a filter. */
export function CategoryChip({ name, color, onClick, active }: Props) {
  const Comp = onClick ? 'button' : 'span'
  return (
    <Comp
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition ${
        active
          ? 'border-transparent bg-ink-900 text-white'
          : 'border-black/[0.08] bg-white text-ink-700 shadow-soft hover:bg-black/[0.03]'
      }`}
    >
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      {name}
    </Comp>
  )
}
