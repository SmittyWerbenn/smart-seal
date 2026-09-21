import { useMemo } from 'react'
import { useDataStore } from '@/store/dataStore'
import { PageHeader } from '@/components/shared/page-header'
import { KpiCard } from '@/components/shared/kpi-card'
import { DataTable, type Column } from '@/components/shared/data-table'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Warehouse, Truck, Clock3, Wrench, XOctagon, RotateCcw } from 'lucide-react'
import { titleCase } from '@/lib/utils'
import type { ESealDevice } from '@/types'

export default function ReverseLogisticsPage() {
  const devices = useDataStore((s) => s.devices)
  const containers = useDataStore((s) => s.containers)
  const updateDevice = useDataStore((s) => s.updateDevice)

  const stats = useMemo(
    () => ({
      total: devices.length,
      inWarehouse: devices.filter((d) => d.lifecycle === 'IN_WAREHOUSE').length,
      inTransit: devices.filter((d) => d.lifecycle === 'IN_TRANSIT').length,
      idle: devices.filter((d) => d.lifecycle === 'IDLE_AT_DESTINATION').length,
      maintenance: devices.filter((d) => d.lifecycle === 'MAINTENANCE').length,
      broken: devices.filter((d) => d.lifecycle === 'BROKEN').length,
      pending: devices.filter((d) => d.returnStatus === 'PENDING').length,
    }),
    [devices],
  )

  const returnCandidates = devices.filter((d) => d.lifecycle === 'IDLE_AT_DESTINATION' || d.lifecycle === 'MAINTENANCE')

  const columns: Column<ESealDevice>[] = [
    { key: 'device', header: 'Device', render: (d) => <span className="font-medium text-navy-900">{d.id}</span> },
    { key: 'container', header: 'Last Container', render: (d) => containers.find((c) => c.eSealId === d.id)?.number ?? '—' },
    { key: 'destination', header: 'Destination', render: (d) => containers.find((c) => c.eSealId === d.id)?.destinationCity ?? '—' },
    { key: 'lifecycle', header: 'Status', render: (d) => <Badge variant={d.lifecycle === 'BROKEN' ? 'critical' : d.lifecycle === 'MAINTENANCE' ? 'warning' : 'brand'}>{titleCase(d.lifecycle)}</Badge> },
    { key: 'idle', header: 'Days Idle', render: (d) => d.daysIdle },
    { key: 'return', header: 'Return Status', render: (d) => <Badge variant={d.returnStatus === 'RETURNED' ? 'success' : 'neutral'}>{titleCase(d.returnStatus)}</Badge> },
    {
      key: 'action',
      header: '',
      render: (d) =>
        d.returnStatus !== 'RETURNED' &&
        d.returnStatus !== 'NOT_APPLICABLE' && (
          <Button size="sm" variant="secondary" onClick={() => updateDevice(d.id, { lifecycle: 'IN_WAREHOUSE', returnStatus: 'RETURNED', daysIdle: 0 })}>
            <RotateCcw size={13} /> Mark Returned
          </Button>
        ),
    },
  ]

  return (
    <div className="pb-10">
      <PageHeader title="Reverse Logistics" description="Track idle devices and manage returns to warehouse." />
      <div className="grid grid-cols-2 gap-3 px-4 md:grid-cols-3 md:px-6 lg:grid-cols-6">
        <KpiCard label="Total Devices" value={stats.total} icon={Warehouse} />
        <KpiCard label="In Warehouse" value={stats.inWarehouse} icon={Warehouse} tone="brand" />
        <KpiCard label="In Transit" value={stats.inTransit} icon={Truck} tone="default" />
        <KpiCard label="Idle at Destination" value={stats.idle} icon={Clock3} tone="warning" />
        <KpiCard label="Maintenance" value={stats.maintenance} icon={Wrench} tone="warning" />
        <KpiCard label="Broken" value={stats.broken} icon={XOctagon} tone="critical" />
      </div>
      <Card className="mx-4 mt-4 md:mx-6">
        <DataTable columns={columns} rows={returnCandidates} rowKey={(d) => d.id} emptyTitle="No devices pending return" />
      </Card>
    </div>
  )
}
