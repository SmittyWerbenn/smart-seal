import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './sidebar'
import { Topbar } from './topbar'
import { NAV_ITEMS } from './nav-config'

export function AppShell() {
  const location = useLocation()
  const activeLabel = NAV_ITEMS.find((n) => location.pathname.startsWith(n.path))?.label

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar title={activeLabel} />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
