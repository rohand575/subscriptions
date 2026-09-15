import { NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, CalendarDays, PieChart, Settings, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
}

const NAV: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/analytics', label: 'Analytics', icon: PieChart },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const title = NAV.find((n) => n.to === pathname)?.label ?? 'Subscriptions'

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-black/[0.06] px-4 py-6 md:flex">
        <div className="mb-8 flex items-center gap-2.5 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-white shadow-glow">
            <PieChart size={18} />
          </div>
          <span className="text-[15px] font-semibold tracking-tight text-ink-900">Subscriptions</span>
        </div>
        <nav className="flex flex-col gap-1">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-white text-accent shadow-soft'
                    : 'text-ink-500 hover:bg-black/[0.04] hover:text-ink-900'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="glass sticky top-0 z-30 border-b px-5 py-4 md:px-8">
          <h1 className="text-xl font-semibold tracking-tight text-ink-900">{title}</h1>
        </header>
        <main className="flex-1 px-5 pb-28 pt-5 md:px-8 md:pb-10">
          <div className="animate-fade-in">{children}</div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="glass fixed inset-x-0 bottom-0 z-40 border-t md:hidden">
        <div
          className="mx-auto flex max-w-md items-stretch justify-around"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition ${
                  isActive ? 'text-accent' : 'text-ink-400'
                }`
              }
            >
              <Icon size={21} />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
