import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Home, Package, ScanLine, BellRing, UserRound, LogOut } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useDataStore } from '@/store/dataStore'
import { useCurrentDriver } from '@/hooks/useCurrentDriver'
import { AppLogo } from '@/components/shared/logo'
import { cn } from '@/lib/utils'
import { LanguageToggle } from '@/components/shared/language-toggle'
import { translate } from '@/i18n'

const TABS = [
  { path: '/driver/dashboard', get label() { return translate('ui.home') }, icon: Home, end: true },
  { path: '/driver/shipments', get label() { return translate('ui.shipment') }, icon: Package },
  { path: '/driver/scan', get label() { return translate('ui.scan') }, icon: ScanLine },
  { path: '/driver/alerts', get label() { return translate('ui.alerts') }, icon: BellRing },
  { path: '/driver/profile', get label() { return translate('ui.profile') }, icon: UserRound },
]

export function DriverShell() {
  const logout = useAuthStore((s) => s.logout)
  const driver = useCurrentDriver()
  const notifications = useDataStore((s) => s.notifications)
  const navigate = useNavigate()
  const unread = notifications.filter((n) => n.driverId === driver?.id && !n.read).length

  return (
    <div className="flex h-screen flex-col bg-slate-50">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4">
        <div className="flex items-center gap-2">
          <AppLogo iconOnly />
          <span className="text-sm font-semibold text-navy-900">{translate('ui.driverPortal')}</span>
        </div>
        <div className="flex items-center gap-1">
          <LanguageToggle />
          <button onClick={() => navigate('/driver/alerts')} className="relative flex h-10 w-10 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100" aria-label={translate('ui.notifications')}>
            <BellRing size={18} />
            {unread > 0 && <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-critical-500 px-1 text-[10px] font-semibold text-white">{unread}</span>}
          </button>
          <button
            onClick={() => {
              logout()
              navigate('/driver')
            }}
            className="flex h-10 w-10 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100"
            aria-label={translate('ui.logout')}
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 flex h-16 border-t border-slate-200 bg-white">
        {TABS.map((tab) => (
          <NavLink
            key={tab.path}
            to={tab.path}
            end={tab.end}
            className={({ isActive }) => cn('flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium', isActive ? 'text-brand-600' : 'text-slate-400')}
          >
            <tab.icon size={20} />
            {tab.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
