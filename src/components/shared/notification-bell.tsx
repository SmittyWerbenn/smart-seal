import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { useDataStore } from '@/store/dataStore'
import { cn, timeAgo } from '@/lib/utils'
import { EmptyState } from './states'

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const notifications = useDataStore((s) => s.notifications)
  const markRead = useDataStore((s) => s.markNotificationRead)
  const markAllRead = useDataStore((s) => s.markAllNotificationsRead)
  const navigate = useNavigate()
  const unread = notifications.filter((n) => !n.read).length

  const linkPath = (linkType?: string, linkId?: string) => {
    if (!linkType || !linkId) return null
    if (linkType === 'container') return `/containers/${linkId}`
    if (linkType === 'device') return `/eseals/${linkId}`
    if (linkType === 'vessel') return `/vessels/${linkId}`
    if (linkType === 'alert') return '/alerts'
    return null
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-9 w-9 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-critical-500 px-1 text-[10px] font-semibold text-white">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-40 mt-2 w-80 rounded-lg border border-slate-200 bg-white shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
              <span className="text-sm font-semibold text-navy-900">Notifications</span>
              {unread > 0 && (
                <button onClick={markAllRead} className="text-xs font-medium text-brand-600 hover:underline">
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <EmptyState title="No notifications" description="You're all caught up." />
              ) : (
                notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => {
                      markRead(n.id)
                      const path = linkPath(n.linkType, n.linkId)
                      if (path) navigate(path)
                      setOpen(false)
                    }}
                    className={cn('flex w-full flex-col gap-0.5 border-b border-slate-50 px-4 py-2.5 text-left hover:bg-slate-50', !n.read && 'bg-brand-50/40')}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'h-1.5 w-1.5 shrink-0 rounded-full',
                          n.severity === 'CRITICAL' ? 'bg-critical-500' : n.severity === 'WARNING' ? 'bg-warning-500' : 'bg-brand-500',
                        )}
                      />
                      <span className="text-sm font-medium text-navy-900">{n.title}</span>
                    </div>
                    <span className="pl-3.5 text-xs text-slate-500">{n.message}</span>
                    <span className="pl-3.5 text-[11px] text-slate-400">{timeAgo(n.createdAt)}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
