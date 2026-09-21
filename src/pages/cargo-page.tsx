import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { useDataStore } from '@/store/dataStore'
import { useAuthStore } from '@/store/authStore'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable, type Column } from '@/components/shared/data-table'
import { Card } from '@/components/ui/card'
import { Input, Select } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import type { CargoLine } from '@/types'

export default function CargoPage() {
  const cargo = useDataStore((s) => s.cargo)
  const containers = useDataStore((s) => s.containers)
  const currentUser = useAuthStore((s) => s.currentUser)
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('ALL')

  const isClient = currentUser?.role === 'CLIENT'
  const categories = useMemo(() => Array.from(new Set(cargo.map((c) => c.category))).sort(), [cargo])

  const masked = useMemo(
    () =>
      cargo.map((c) => ({
        ...c,
        owned: !isClient || c.clientId === currentUser?.clientId,
      })),
    [cargo, isClient, currentUser],
  )

  const filtered = masked.filter((c) => {
    if (category !== 'ALL' && c.category !== category) return false
    const container = containers.find((x) => x.id === c.containerId)
    return `${container?.number ?? ''} ${c.owned ? c.clientName : ''} ${c.owned ? c.doNumber : ''} ${c.owned ? c.productName : ''}`
      .toLowerCase()
      .includes(query.toLowerCase())
  })

  const columns: Column<CargoLine & { owned: boolean }>[] = [
    { key: 'container', header: 'Container', render: (c) => containers.find((x) => x.id === c.containerId)?.number ?? c.containerId },
    { key: 'product', header: 'Product', render: (c) => (c.owned ? <span className="font-medium text-navy-900">{c.productName}</span> : '—') },
    { key: 'category', header: 'Category', render: (c) => <Badge variant="brand">{c.category}</Badge> },
    {
      key: 'client',
      header: 'Client',
      render: (c) => (c.owned ? c.clientName : <span className="flex items-center gap-1.5 text-slate-400"><Lock size={12} /> Consolidated Cargo</span>),
    },
    { key: 'do', header: 'DO Number', render: (c) => (c.owned ? c.doNumber : '—') },
    { key: 'sku', header: 'SKU', render: (c) => (c.owned ? c.sku : '—') },
    { key: 'qty', header: 'Quantity', render: (c) => (c.owned ? `${c.quantity.toLocaleString()} ${c.unit}` : '—') },
    { key: 'seal', header: 'Tagged Seal', render: (c) => c.sealId ?? <span className="text-slate-400">Not sealed</span> },
  ]

  return (
    <div className="pb-10">
      <PageHeader title="Cargo / Delivery Orders" description={`${filtered.length} cargo lines`} />
      <Card className="mx-4 mb-4 md:mx-6">
        <div className="flex flex-wrap gap-2 border-b border-slate-100 p-3">
          <Input placeholder="Search container, product, client, DO…" value={query} onChange={(e) => setQuery(e.target.value)} className="w-72" />
          <Select value={category} onChange={(e) => setCategory(e.target.value)} className="w-52">
            <option value="ALL">All categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </Select>
        </div>
        <DataTable columns={columns} rows={filtered} rowKey={(c) => c.id} onRowClick={(c) => navigate(`/containers/${c.containerId}`)} emptyTitle="No cargo records" />
      </Card>
    </div>
  )
}
