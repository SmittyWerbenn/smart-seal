import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sailboat, Gauge, Anchor, Ship } from 'lucide-react'
import { useDataStore } from '@/store/dataStore'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable, type Column } from '@/components/shared/data-table'
import { KpiCard } from '@/components/shared/kpi-card'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { formatDateTime } from '@/lib/utils'
import type { Vessel } from '@/types'
import { translate } from '@/i18n'

export default function VesselsListPage() {
  const vessels = useDataStore((s) => s.vessels)
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const filtered = vessels.filter((v) =>
    `${v.name} ${v.imo} ${v.mmsi} ${v.operator} ${v.voyageNumber}`.toLowerCase().includes(query.toLowerCase()),
  )

  const stats = useMemo(() => {
    const underway = vessels.filter((v) => v.status === 'UNDERWAY').length
    const avgSpeed = vessels.length ? Math.round(vessels.reduce((sum, v) => sum + v.speedKn, 0) / vessels.length) : 0
    const totalTeu = vessels.reduce((sum, v) => sum + v.capacityTeu, 0)
    const containersAtSea = vessels.reduce((sum, v) => sum + v.containerIds.length, 0)
    return { underway, avgSpeed, totalTeu, containersAtSea }
  }, [vessels])

  const columns: Column<Vessel>[] = [
    { key: 'name', get header() { return translate('ui.vesselName') }, render: (v) => <span className="font-medium text-navy-900">{v.name}</span> },
    { key: 'type', get header() { return translate('ui.type') }, render: (v) => v.vesselType },
    { key: 'operator', get header() { return translate('ui.operator') }, render: (v) => v.operator },
    { key: 'voyage', get header() { return translate('ui.voyage') }, render: (v) => v.voyageNumber },
    { key: 'route', get header() { return translate('ui.route') }, render: (v) => `${v.originPort} → ${v.destinationPort}` },
    {
      key: 'progress',
      get header() { return translate('ui.voyageProgress') },
      render: (v) => (
        <div className="w-28">
          <Progress value={v.routeProgress * 100} colorClassName="bg-brand-500" />
        </div>
      ),
    },
    { key: 'speed', get header() { return translate('ui.speed') }, render: (v) => `${v.speedKn} kn` },
    { key: 'heading', get header() { return translate('ui.heading') }, render: (v) => `${Math.round(v.heading)}°` },
    { key: 'containers', get header() { return translate('ui.containers') }, render: (v) => v.containerIds.length },
    { key: 'eta', get header() { return translate('ui.eta') }, render: (v) => formatDateTime(v.eta) },
    { key: 'status', get header() { return translate('ui.status') }, render: (v) => <Badge variant="brand">{v.status}</Badge> },
  ]

  return (
    <div className="pb-10">
      <PageHeader title={translate('ui.vesselsAis')} description={`${filtered.length} of ${vessels.length} vessels — live simulated positions update continuously`} />

      <div className="grid grid-cols-2 gap-3 px-4 md:grid-cols-4 md:px-6">
        <KpiCard label={translate('ui.vesselsUnderway')} value={stats.underway} icon={Sailboat} tone="brand" />
        <KpiCard label={translate('ui.avgSpeed')} value={`${stats.avgSpeed} kn`} icon={Gauge} />
        <KpiCard label={translate('ui.containersAtSea')} value={stats.containersAtSea} icon={Ship} tone="brand" />
        <KpiCard label={translate('ui.fleetCapacity')} value={`${stats.totalTeu.toLocaleString()} TEU`} icon={Anchor} />
      </div>

      <Card className="mx-4 mb-4 mt-4 md:mx-6">
        <div className="border-b border-slate-100 p-3">
          <Input placeholder={translate('ui.searchVesselOperatorVoyageImo')} value={query} onChange={(e) => setQuery(e.target.value)} className="w-80" />
        </div>
        <DataTable columns={columns} rows={filtered} rowKey={(v) => v.id} onRowClick={(v) => navigate(`/vessels/${v.id}`)} emptyTitle={translate('ui.noVesselsFound')} />
      </Card>
    </div>
  )
}
