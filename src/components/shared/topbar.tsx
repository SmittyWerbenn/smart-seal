import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu, ChevronDown, LogOut } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useUiStore } from '@/store/uiStore'
import { ALL_ROLES } from '@/mock/users'
import { NotificationBell } from './notification-bell'
import { GlobalSearch } from './global-search'
import { cn } from '@/lib/utils'

export function Topbar({ title }: { title?: string }) {
  const { currentUser, switchRole, logout } = useAuthStore()
  const setMobileNavOpen = useUiStore((s) => s.setMobileNavOpen)
  const [roleMenuOpen, setRoleMenuOpen] = useState(false)
  const navigate = useNavigate()

  if (!currentUser) return null

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4 print:hidden">
      <button className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 md:hidden" onClick={() => setMobileNavOpen(true)}>
        <Menu size={20} />
      </button>
      {title && <h1 className="hidden text-sm font-semibold text-navy-900 md:block">{title}</h1>}

      <div className="ml-auto flex items-center gap-2 md:ml-auto">
        <GlobalSearch />

        <NotificationBell />

        <div className="relative">
          <button
            onClick={() => setRoleMenuOpen((o) => !o)}
            className="flex items-center gap-2 rounded-md border border-slate-200 py-1 pl-1 pr-2 hover:bg-slate-50"
          >
            <span
              className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold text-white"
              style={{ backgroundColor: currentUser.avatarColor }}
            >
              {currentUser.name.charAt(0)}
            </span>
            <span className="hidden flex-col items-start leading-tight sm:flex">
              <span className="text-xs font-medium text-navy-900">{currentUser.name}</span>
              <span className="text-[10px] text-slate-400">{ALL_ROLES.find((r) => r.role === currentUser.role)?.label}</span>
            </span>
            <ChevronDown size={14} className="text-slate-400" />
          </button>
          {roleMenuOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setRoleMenuOpen(false)} />
              <div className="absolute right-0 z-40 mt-2 w-64 rounded-lg border border-slate-200 bg-white p-1.5 shadow-lg">
                <p className="px-2 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Switch demo role</p>
                {ALL_ROLES.map((r) => (
                  <button
                    key={r.role}
                    onClick={() => {
                      switchRole(r.role)
                      setRoleMenuOpen(false)
                      navigate(r.role === 'DRIVER' ? '/field' : '/dashboard')
                    }}
                    className={cn(
                      'flex w-full flex-col items-start rounded-md px-2 py-1.5 text-left hover:bg-slate-50',
                      currentUser.role === r.role && 'bg-brand-50',
                    )}
                  >
                    <span className="text-sm font-medium text-navy-900">{r.label}</span>
                    <span className="text-[11px] text-slate-500">{r.description}</span>
                  </button>
                ))}
                <div className="my-1 border-t border-slate-100" />
                <button
                  onClick={() => {
                    logout()
                    navigate('/login')
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-critical-500 hover:bg-red-50"
                >
                  <LogOut size={14} /> Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
