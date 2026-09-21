import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Home, PackagePlus, ScanLine, MapPin, BellRing, LogOut } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { AppLogo } from '@/components/shared/logo'
import { cn } from '@/lib/utils'

const TABS = [
  { path: '/field', label: 'Home', icon: Home, end: true },
  { path: '/field/stuffing', label: 'Stuffing', icon: PackagePlus },
  { path: '/field/scanner', label: 'Scanner', icon: ScanLine },
  { path: '/field/tracking', label: 'Tracking', icon: MapPin },
  { path: '/field/alerts', label: 'Alerts', icon: BellRing },
]

export function FieldShell() {
  const { currentUser, logout } = useAuthStore()
  const navigate = useNavigate()

  return (
    <div className="flex h-screen flex-col bg-slate-50">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4">
        <AppLogo iconOnly />
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-navy-700">{currentUser?.name}</span>
          <button
            onClick={() => {
              logout()
              navigate('/login')
            }}
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-16">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 flex h-16 border-t border-slate-200 bg-white">
        {TABS.map((tab) => (
          <NavLink
            key={tab.path}
            to={tab.path}
            end={tab.end}
            className={({ isActive }) =>
              cn('flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium', isActive ? 'text-brand-600' : 'text-slate-400')
            }
          >
            <tab.icon size={20} />
            {tab.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
