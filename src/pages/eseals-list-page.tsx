import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Barcode as BarcodeIcon, TriangleAlert } from 'lucide-react'
import { useDataStore } from '@/store/dataStore'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable, type Column } from '@/components/shared/data-table'
import { Card } from '@/components/ui/card'
import { Input, Select } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BatteryIndicator, SignalIndicator } from '@/components/shared/indicators'
import { DeviceStatusBadge } from '@/components/shared/status-badge'
import { barcodeFor } from '@/lib/barcode'
import { cn, formatDateTime, titleCase } from '@/lib/utils'
import type { DeviceStatus } from '@/types'

// Below this, ops should generate a new batch before stock runs out — a
// typical batch is 50 (see generate-basic-seals-page.tsx default quantity).
const LOW_STOCK_THRESHOLD = 20

interface SealRow {
  id: string
  type: 'Smart' | 'Basic'
  barcode: string
  containerId: string | null
  containerNumber: string | null
  battery: number | null
  signal: number | null
  deviceStatus: DeviceStatus | null
  statusLabel: string
  location: { lat: number; lng: number } | null
  lastSeen: string | null
  lifecycle: string
}

export default function ESealsListPage() {
  const devices = useDataStore((s) => s.devices)
  const containers = useDataStore((s) => s.containers)
  const basicSealStock = useDataStore((s) => s.basicSealStock)
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [query, setQuery] = useState(params.get('q') ?? '')
  const [type, setType] = useState<'ALL' | 'Smart' | 'Basic'>((params.get('type') as 'Smart' | 'Basic' | null) ?? 'ALL')
  const [battery, setBattery] = useState<'ALL' | 'LOW'>((params.get('battery') as 'LOW' | null) ?? 'ALL')

  const rows = useMemo<SealRow[]>(() => {
    const smart: SealRow[] = devices.map((d) => {
      const container = containers.find((c) => c.id === d.containerId)
      return {
        id: d.id,
        type: 'Smart',
        barcode: d.barcode,
        containerId: container?.id ?? null,
        containerNumber: container?.number ?? null,
        battery: d.battery,
        signal: d.signal,
        deviceStatus: d.status,
        statusLabel: titleCase(d.status),
        location: d.location,
        lastSeen: d.lastSeen,
        lifecycle: titleCase(d.lifecycle),
      }
    })
    const basic: SealRow[] = containers
      .filter((c) => c.regularSealId)
      .map((c) => ({
        id: c.regularSealId as string,
        type: 'Basic',
        barcode: barcodeFor(c.regularSealId as string),
        containerId: c.id,
        containerNumber: c.number,
        battery: null,
        signal: null,
        deviceStatus: null,
        statusLabel: c.isUnlocked ? 'Unlocked' : 'Sealed',
        location: c.currentLocation,
        lastSeen: c.lastUpdate,
        lifecycle: titleCase(c.status),
      }))
    const stock: SealRow[] = basicSealStock.map((s) => ({
      id: s.id,
      type: 'Basic',
      barcode: s.barcode,
      containerId: null,
      containerNumber: null,
      battery: null,
      signal: null,
      deviceStatus: null,
      statusLabel: 'In Stock',
      location: null,
      lastSeen: s.createdAt,
      lifecycle: 'Unassigned',
    }))
    return [...stock, ...smart, ...basic]
  }, [devices, containers, basicSealStock])

  const filtered = rows.filter((r) => {
    if (type !== 'ALL' && r.type !== type) return false
    // Matches the dashboard's "Low Battery" KPI definition exactly (devices < 30%).
    if (battery === 'LOW' && !(r.battery !== null && r.battery < 30)) return false
    return `${r.id} ${r.barcode} ${r.containerNumber ?? ''}`.toLowerCase().includes(query.toLowerCase())
  })

  const columns: Column<SealRow>[] = [
    { key: 'id', header: 'Seal ID', render: (r) => <span className="font-medium text-navy-900">{r.id}</span> },
    { key: 'type', header: 'Type', render: (r) => <Badge variant={r.type === 'Smart' ? 'brand' : 'offline'}>{r.type} Seal</Badge> },
    { key: 'barcode', header: 'Barcode', render: (r) => <span className="font-mono text-xs text-slate-500">{r.barcode}</span> },
    { key: 'container', header: 'Container', render: (r) => r.containerNumber ?? '—' },
    { key: 'battery', header: 'Battery', render: (r) => (r.battery !== null ? <BatteryIndicator value={r.battery} /> : <span className="text-slate-300">—</span>) },
    { key: 'signal', header: 'Signal', render: (r) => (r.signal !== null ? <SignalIndicator value={r.signal} /> : <span className="text-slate-300">—</span>) },
    {
      key: 'status',
      header: 'Status',
      render: (r) => (r.deviceStatus ? <DeviceStatusBadge status={r.deviceStatus} /> : <Badge variant="outline">{r.statusLabel}</Badge>),
    },
    { key: 'location', header: 'Location', render: (r) => (r.location ? `${r.location.lat.toFixed(2)}, ${r.location.lng.toFixed(2)}` : '—') },
    { key: 'lastSeen', header: 'Last Seen', render: (r) => (r.lastSeen ? formatDateTime(r.lastSeen) : '—') },
    { key: 'lifecycle', header: 'Lifecycle', render: (r) => r.lifecycle },
  ]

  return (
    <div className="pb-10">
      <PageHeader
        title="Seal Devices"
        description={`${filtered.length} of ${rows.length} seals (${rows.filter((r) => r.type === 'Smart').length} smart, ${rows.filter((r) => r.type === 'Basic').length} basic${basicSealStock.length ? `, ${basicSealStock.length} in stock` : ''})`}
        actions={
          <Button size="sm" variant="secondary" onClick={() => navigate('/eseals/generate')}>
            <BarcodeIcon size={14} /> Generate Basic Seal Barcodes
          </Button>
        }
      />

      {basicSealStock.length < LOW_STOCK_THRESHOLD && (
        <div className={cn('mx-4 mb-4 flex flex-wrap items-center justify-between gap-3 rounded-md border p-3 md:mx-6', basicSealStock.length === 0 ? 'border-critical-500/40 bg-critical-100/50' : 'border-warning-500/40 bg-warning-100/50')}>
          <div className={cn('flex items-center gap-2 text-sm', basicSealStock.length === 0 ? 'text-red-800' : 'text-amber-800')}>
            <TriangleAlert size={16} />
            {basicSealStock.length === 0
              ? 'Basic Seal stock is depleted — no barcodes left to assign during stuffing.'
              : `Basic Seal stock is running low — only ${basicSealStock.length} left.`}
          </div>
          <Button size="sm" onClick={() => navigate('/eseals/generate')}>
            <BarcodeIcon size={14} /> Generate New Batch
          </Button>
        </div>
      )}

      <Card className="mx-4 mb-4 md:mx-6">
        <div className="flex flex-wrap gap-2 border-b border-slate-100 p-3">
          <Input placeholder="Search seal ID, barcode, container…" value={query} onChange={(e) => setQuery(e.target.value)} className="w-64" />
          <Select value={type} onChange={(e) => setType(e.target.value as 'ALL' | 'Smart' | 'Basic')} className="w-44">
            <option value="ALL">All seal types</option>
            <option value="Smart">Smart Seal</option>
            <option value="Basic">Basic Seal</option>
          </Select>
          <Select value={battery} onChange={(e) => setBattery(e.target.value as 'ALL' | 'LOW')} className="w-40">
            <option value="ALL">All battery levels</option>
            <option value="LOW">Low Battery (&lt;30%)</option>
          </Select>
        </div>
        <DataTable
          columns={columns}
          rows={filtered}
          rowKey={(r) => r.id}
          onRowClick={(r) => {
            if (r.type === 'Smart') navigate(`/eseals/${r.id}`)
            else if (r.containerId) navigate(`/containers/${r.containerId}`)
          }}
          emptyTitle="No seals found"
        />
      </Card>
    </div>
  )
}
