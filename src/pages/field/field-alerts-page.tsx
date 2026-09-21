import { useDataStore } from '@/store/dataStore'
import { SeverityBadge } from '@/components/shared/status-badge'
import { EmptyState } from '@/components/shared/states'
import { timeAgo, titleCase } from '@/lib/utils'

export default function FieldAlertsPage() {
  const alerts = useDataStore((s) => s.alerts)
  const containers = useDataStore((s) => s.containers)
  const open = alerts.filter((a) => a.status === 'OPEN').slice(0, 20)

  return (
    <div className="p-4">
      <h1 className="mb-1 text-lg font-semibold text-navy-900">Alerts</h1>
      <p className="mb-4 text-sm text-slate-500">{open.length} open alerts</p>
      {open.length === 0 ? (
        <EmptyState title="No open alerts" />
      ) : (
        <div className="space-y-2">
          {open.map((a) => (
            <div key={a.id} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-navy-900">{titleCase(a.category)}</span>
                <SeverityBadge severity={a.severity} />
              </div>
              <p className="mt-1 text-xs text-slate-500">{containers.find((c) => c.id === a.containerId)?.number} · {a.message}</p>
              <p className="mt-1 text-[11px] text-slate-400">{timeAgo(a.createdAt)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
