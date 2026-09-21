import { NavLink } from 'react-router-dom'
import { ChevronsLeft, ChevronsRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { navForRole } from './nav-config'
import { AppLogo } from './logo'
import { useAuthStore } from '@/store/authStore'
import { useUiStore } from '@/store/uiStore'

export function Sidebar() {
  const currentUser = useAuthStore((s) => s.currentUser)
  const { sidebarCollapsed, toggleSidebar, mobileNavOpen, setMobileNavOpen } = useUiStore()
  if (!currentUser) return null
  const items = navForRole(currentUser.role)

  return (
    <>
      <aside
        className={cn(
          'hidden shrink-0 flex-col border-r border-slate-200 bg-white transition-all duration-200 md:flex print:hidden',
          sidebarCollapsed ? 'w-[68px]' : 'w-60',
        )}
      >
        <div className="flex h-14 items-center border-b border-slate-100 px-4">
          <AppLogo iconOnly={sidebarCollapsed} />
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
          {items.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive ? 'bg-brand-50 text-brand-700' : 'text-navy-600 hover:bg-slate-50 hover:text-navy-900',
                )
              }
            >
              <item.icon size={17} className="shrink-0" />
              {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          ))}
        </nav>
        <button
          onClick={toggleSidebar}
          className="flex items-center gap-2 border-t border-slate-100 px-4 py-3 text-xs font-medium text-slate-400 hover:text-navy-700"
        >
          {sidebarCollapsed ? <ChevronsRight size={16} /> : (<><ChevronsLeft size={16} /> Collapse</>)}
        </button>
      </aside>

      {mobileNavOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="absolute inset-0 bg-navy-950/50" onClick={() => setMobileNavOpen(false)} />
          <aside className="relative z-10 flex h-full w-64 flex-col bg-white shadow-xl">
            <div className="flex h-14 items-center border-b border-slate-100 px-4">
              <AppLogo />
            </div>
            <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
              {items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileNavOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium',
                      isActive ? 'bg-brand-50 text-brand-700' : 'text-navy-600 hover:bg-slate-50',
                    )
                  }
                >
                  <item.icon size={17} />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>
          </aside>
        </div>
      )}
    </>
  )
}
