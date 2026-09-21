import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDataStore } from '@/store/dataStore'
import { useAuthStore } from '@/store/authStore'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable, type Column } from '@/components/shared/data-table'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ContainerStatusBadge } from '@/components/shared/status-badge'
import { formatDate } from '@/lib/utils'
import type { Shipment } from '@/types'

export default function ShipmentsPage() {
  const shipments = useDataStore((s) => s.shipments)
  const cargo = useDataStore((s) => s.cargo)
  const currentUser = useAuthStore((s) => s.currentUser)
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const scoped = useMemo(() => {
    if (currentUser?.role !== 'CLIENT') return shipments
    const ownedContainerIds = new Set(cargo.filter((c) => c.clientId === currentUser.clientId).map((c) => c.containerId))
    return shipments.filter((s) => ownedContainerIds.has(s.containerId))
  }, [shipments, cargo, currentUser])

  const filtered = scoped.filter((s) => `${s.bookingNumber} ${s.shipper} ${s.consignee}`.toLowerCase().includes(query.toLowerCase()))

  const columns: Column<Shipment>[] = [
    { key: 'booking', header: 'Booking No.', render: (s) => <span className="font-medium text-navy-900">{s.bookingNumber}</span> },
    { key: 'shipper', header: 'Shipper', render: (s) => s.shipper },
    { key: 'consignee', header: 'Consignee', render: (s) => s.consignee },
    { key: 'route', header: 'Route', render: (s) => `${s.originCity} → ${s.destinationCity}` },
    { key: 'status', header: 'Status', render: (s) => <ContainerStatusBadge status={s.status} /> },
    { key: 'created', header: 'Created', render: (s) => formatDate(s.createdAt) },
  ]

  return (
    <div className="pb-10">
      <PageHeader title="Shipments" description={`${filtered.length} of ${scoped.length} shipments`} />
      <Card className="mx-4 mb-4 md:mx-6">
        <div className="border-b border-slate-100 p-3">
          <Input placeholder="Search booking, shipper, consignee…" value={query} onChange={(e) => setQuery(e.target.value)} className="w-72" />
        </div>
        <DataTable columns={columns} rows={filtered} rowKey={(s) => s.id} onRowClick={(s) => navigate(`/containers/${s.containerId}`)} emptyTitle="No shipments found" />
      </Card>
    </div>
  )
}
