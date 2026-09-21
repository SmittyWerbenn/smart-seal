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
    { key: 'name', header: 'Vessel Name', render: (v) => <span className="font-medium text-navy-900">{v.name}</span> },
    { key: 'type', header: 'Type', render: (v) => v.vesselType },
    { key: 'operator', header: 'Operator', render: (v) => v.operator },
    { key: 'voyage', header: 'Voyage', render: (v) => v.voyageNumber },
    { key: 'route', header: 'Route', render: (v) => `${v.originPort} → ${v.destinationPort}` },
    {
      key: 'progress',
      header: 'Voyage Progress',
      render: (v) => (
        <div className="w-28">
          <Progress value={v.routeProgress * 100} colorClassName="bg-brand-500" />
        </div>
      ),
    },
    { key: 'speed', header: 'Speed', render: (v) => `${v.speedKn} kn` },
    { key: 'heading', header: 'Heading', render: (v) => `${Math.round(v.heading)}°` },
    { key: 'containers', header: 'Containers', render: (v) => v.containerIds.length },
    { key: 'eta', header: 'ETA', render: (v) => formatDateTime(v.eta) },
    { key: 'status', header: 'Status', render: (v) => <Badge variant="brand">{v.status}</Badge> },
  ]

  return (
    <div className="pb-10">
      <PageHeader title="Vessels / AIS" description={`${filtered.length} of ${vessels.length} vessels — live simulated positions update continuously`} />

      <div className="grid grid-cols-2 gap-3 px-4 md:grid-cols-4 md:px-6">
        <KpiCard label="Vessels Underway" value={stats.underway} icon={Sailboat} tone="brand" />
        <KpiCard label="Avg. Speed" value={`${stats.avgSpeed} kn`} icon={Gauge} />
        <KpiCard label="Containers at Sea" value={stats.containersAtSea} icon={Ship} tone="brand" />
        <KpiCard label="Fleet Capacity" value={`${stats.totalTeu.toLocaleString()} TEU`} icon={Anchor} />
      </div>

      <Card className="mx-4 mb-4 mt-4 md:mx-6">
        <div className="border-b border-slate-100 p-3">
          <Input placeholder="Search vessel, operator, voyage, IMO, MMSI…" value={query} onChange={(e) => setQuery(e.target.value)} className="w-80" />
        </div>
        <DataTable columns={columns} rows={filtered} rowKey={(v) => v.id} onRowClick={(v) => navigate(`/vessels/${v.id}`)} emptyTitle="No vessels found" />
      </Card>
    </div>
  )
}
