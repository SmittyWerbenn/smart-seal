import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useDataStore } from '@/store/dataStore'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable, type Column } from '@/components/shared/data-table'
import { Card } from '@/components/ui/card'
import { Select } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { SeverityBadge } from '@/components/shared/status-badge'
import { Badge } from '@/components/ui/badge'
import { formatDateTime, sealIdFor } from '@/lib/utils'
import type { AlertItem, AlertSeverity, AlertStatus } from '@/types'
import { translate, enumLabel } from '@/i18n'

export default function AlertsPage() {
  const alerts = useDataStore((s) => s.alerts)
  const containers = useDataStore((s) => s.containers)
  const setAlertStatus = useDataStore((s) => s.setAlertStatus)
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [severity, setSeverity] = useState<AlertSeverity | 'ALL'>((params.get('severity') as AlertSeverity | null) ?? 'ALL')
  const [status, setStatus] = useState<AlertStatus | 'ALL'>((params.get('status') as AlertStatus | null) ?? 'ALL')

  const filtered = alerts.filter((a) => (severity === 'ALL' || a.severity === severity) && (status === 'ALL' || a.status === status))

  const columns: Column<AlertItem>[] = [
    { key: 'category', get header() { return translate('ui.category') }, render: (a) => enumLabel('alertCategory', a.category) },
    { key: 'severity', get header() { return translate('ui.severity') }, render: (a) => <SeverityBadge severity={a.severity} /> },
    {
      key: 'seal',
      get header() { return translate('ui.seal') },
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
    { key: 'message', get header() { return translate('ui.message') }, render: (a) => <span className="max-w-xs truncate">{a.message}</span> },
    { key: 'status', get header() { return translate('ui.status') }, render: (a) => <Badge variant={a.status === 'OPEN' ? 'critical' : a.status === 'ACKNOWLEDGED' ? 'warning' : 'success'}>{a.status}</Badge> },
    { key: 'created', get header() { return translate('ui.created') }, render: (a) => formatDateTime(a.createdAt) },
    {
      key: 'actions',
      get header() { return translate('ui.actions') },
      render: (a) => (
        <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
          {a.status === 'OPEN' && (
            <Button size="sm" variant="secondary" onClick={() => setAlertStatus(a.id, 'ACKNOWLEDGED')}>
              {translate('ui.acknowledge')}
            </Button>
          )}
          {a.status !== 'RESOLVED' && (
            <Button size="sm" variant="outline" onClick={() => setAlertStatus(a.id, 'RESOLVED')}>
              {translate('ui.resolve')}
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="pb-10">
      <PageHeader title={translate('ui.alertCenter')} description={`${filtered.length} of ${alerts.length} alerts`} />
      <Card className="mx-4 mb-4 md:mx-6">
        <div className="flex flex-wrap gap-2 border-b border-slate-100 p-3">
          <Select value={severity} onChange={(e) => setSeverity(e.target.value as AlertSeverity | 'ALL')} className="w-40">
            <option value="ALL">{translate('ui.allSeverities')}</option>
            <option value="CRITICAL">{translate('ui.critical')}</option>
            <option value="WARNING">{translate('ui.warning')}</option>
            <option value="INFO">{translate('ui.info')}</option>
          </Select>
          <Select value={status} onChange={(e) => setStatus(e.target.value as AlertStatus | 'ALL')} className="w-40">
            <option value="ALL">{translate('ui.allStatuses')}</option>
            <option value="OPEN">{translate('ui.open')}</option>
            <option value="ACKNOWLEDGED">{translate('ui.acknowledged')}</option>
            <option value="RESOLVED">{translate('ui.resolved')}</option>
          </Select>
        </div>
        <DataTable
          columns={columns}
          rows={filtered}
          rowKey={(a) => a.id}
          onRowClick={(a) => a.containerId && navigate(`/containers/${a.containerId}`)}
          emptyTitle={translate('ui.noAlertsMatchYourFilters')}
        />
      </Card>
    </div>
  )
}
