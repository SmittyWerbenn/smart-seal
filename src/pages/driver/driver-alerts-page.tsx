import { useMemo } from 'react'
import { AlertTriangle, BellRing, CheckCheck, Info } from 'lucide-react'
import { useDataStore } from '@/store/dataStore'
import { useCurrentDriver } from '@/hooks/useCurrentDriver'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/states'
import { driverNotificationService } from '@/services/driverNotificationService'
import { cn, timeAgo } from '@/lib/utils'
import { translate } from '@/i18n'

export default function DriverAlertsPage() {
  const driver = useCurrentDriver()
  const all = useDataStore((s) => s.notifications)
  const notifications = useMemo(
    () => all.filter((n) => n.driverId === driver?.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [all, driver],
  )
  const unread = notifications.filter((n) => !n.read).length

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-navy-900">{translate('ui.notifications2')}</h1>
          <p className="text-sm text-slate-500">{unread} belum dibaca</p>
        </div>
        {unread > 0 && driver && (
          <Button variant="secondary" size="sm" onClick={() => driverNotificationService.markAllRead(driver.id)}>
            <CheckCheck size={14} /> {translate('ui.markAll')}
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState icon={BellRing} title={translate('ui.noNotificationsYet')} />
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const Icon = n.severity === 'CRITICAL' ? AlertTriangle : Info
            return (
              <button
                key={n.id}
                onClick={() => driverNotificationService.markRead(n.id)}
                className={cn(
                  'flex w-full gap-3 rounded-lg border bg-white p-3 text-left',
                  n.severity === 'CRITICAL' ? 'border-red-300' : 'border-slate-200',
                  !n.read && 'ring-1 ring-brand-200',
                )}
              >
                <Icon size={18} className={cn('mt-0.5 shrink-0', n.severity === 'CRITICAL' ? 'text-critical-500' : 'text-brand-600')} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-navy-900">{n.title}</p>
                  <p className="text-sm text-slate-600">{n.message}</p>
                  <p className="mt-1 text-[11px] text-slate-400">{timeAgo(n.createdAt)}</p>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
