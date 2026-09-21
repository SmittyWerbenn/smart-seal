import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDataStore } from '@/store/dataStore'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable, type Column } from '@/components/shared/data-table'
import { Card } from '@/components/ui/card'
import { Select } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { SeverityBadge } from '@/components/shared/status-badge'
import { Badge } from '@/components/ui/badge'
import { formatDateTime, sealIdFor, titleCase } from '@/lib/utils'
import type { AlertItem, AlertSeverity, AlertStatus } from '@/types'

export default function AlertsPage() {
  const alerts = useDataStore((s) => s.alerts)
  const containers = useDataStore((s) => s.containers)
  const setAlertStatus = useDataStore((s) => s.setAlertStatus)
  const navigate = useNavigate()
  const [severity, setSeverity] = useState<AlertSeverity | 'ALL'>('ALL')
  const [status, setStatus] = useState<AlertStatus | 'ALL'>('ALL')

  const filtered = alerts.filter((a) => (severity === 'ALL' || a.severity === severity) && (status === 'ALL' || a.status === status))

  const columns: Column<AlertItem>[] = [
    { key: 'category', header: 'Category', render: (a) => titleCase(a.category) },
    { key: 'severity', header: 'Severity', render: (a) => <SeverityBadge severity={a.severity} /> },
    {
      key: 'seal',
      header: 'Seal',
      render: (a) => {
        const container = containers.find((c) => c.id === a.containerId)
        const seal = container ? sealIdFor(container) : null
        return (
          <div className="flex flex-col">
            <span className={seal ? 'font-medium text-navy-800' : 'text-slate-400'}>{seal ?? '—'}</span>
            {container && <span className="text-[11px] text-slate-400">{container.number}</span>}
          </div>
        )
      },
    },
    { key: 'message', header: 'Message', render: (a) => <span className="max-w-xs truncate">{a.message}</span> },
    { key: 'status', header: 'Status', render: (a) => <Badge variant={a.status === 'OPEN' ? 'critical' : a.status === 'ACKNOWLEDGED' ? 'warning' : 'success'}>{a.status}</Badge> },
    { key: 'created', header: 'Created', render: (a) => formatDateTime(a.createdAt) },
    {
      key: 'actions',
      header: 'Actions',
      render: (a) => (
        <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
          {a.status === 'OPEN' && (
            <Button size="sm" variant="secondary" onClick={() => setAlertStatus(a.id, 'ACKNOWLEDGED')}>
              Acknowledge
            </Button>
          )}
          {a.status !== 'RESOLVED' && (
            <Button size="sm" variant="outline" onClick={() => setAlertStatus(a.id, 'RESOLVED')}>
              Resolve
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="pb-10">
      <PageHeader title="Alert Center" description={`${filtered.length} of ${alerts.length} alerts`} />
      <Card className="mx-4 mb-4 md:mx-6">
        <div className="flex flex-wrap gap-2 border-b border-slate-100 p-3">
          <Select value={severity} onChange={(e) => setSeverity(e.target.value as AlertSeverity | 'ALL')} className="w-40">
            <option value="ALL">All severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="WARNING">Warning</option>
            <option value="INFO">Info</option>
          </Select>
          <Select value={status} onChange={(e) => setStatus(e.target.value as AlertStatus | 'ALL')} className="w-40">
            <option value="ALL">All statuses</option>
            <option value="OPEN">Open</option>
            <option value="ACKNOWLEDGED">Acknowledged</option>
            <option value="RESOLVED">Resolved</option>
          </Select>
        </div>
        <DataTable
          columns={columns}
          rows={filtered}
          rowKey={(a) => a.id}
          onRowClick={(a) => a.containerId && navigate(`/containers/${a.containerId}`)}
          emptyTitle="No alerts match your filters"
        />
      </Card>
    </div>
  )
}
