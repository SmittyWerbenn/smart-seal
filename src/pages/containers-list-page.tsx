import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Download, Maximize2, Minimize2, Plus, ScanLine, X } from 'lucide-react'
import { useDataStore } from '@/store/dataStore'
import { useAuthStore } from '@/store/authStore'
import { useUiStore } from '@/store/uiStore'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable, type Column } from '@/components/shared/data-table'
import { TrackingMap } from '@/components/map/tracking-map'
import { Input, Select } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Badge } from '@/components/ui/badge'
import { ContainerStatusBadge, MarkerStateBadge, RiskBadge } from '@/components/shared/status-badge'
import { SealScanFlow } from '@/components/shared/seal-scan-flow'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn, downloadCsv, formatDateTime, sealIdFor, titleCase } from '@/lib/utils'
import type { Container } from '@/types'

// Matches dashboard KPI clicks that represent a group of statuses (e.g. "In
// Transit") rather than one exact status — keyed by the `statuses` URL param
// so the label chip can say what's active. 'ACTIVE' is shorthand for "not yet
// delivered", matching the dashboard's Active Containers KPI definition.
const GROUP_LABELS: Record<string, string> = {
  ACTIVE: 'Active Containers',
  'IN_TRANSIT_ORIGIN,IN_TRANSIT_DESTINATION': 'In Transit',
  'AT_ORIGIN_PORT,ARRIVED_DESTINATION_PORT': 'At Port',
  'LOADED_ON_BOARD,OCEAN_TRANSIT': 'On Vessel',
  'AT_DESTINATION,UNLOCKED,DELIVERED': 'At Destination',
}

export default function ContainersListPage() {
  const containers = useDataStore((s) => s.containers)
  const cargo = useDataStore((s) => s.cargo)
  const vessels = useDataStore((s) => s.vessels)
  const geofences = useDataStore((s) => s.geofences)
  const currentUser = useAuthStore((s) => s.currentUser)
  const { selectedContainerId, setSelectedContainer } = useUiStore()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [query, setQuery] = useState(params.get('q') ?? '')
  const [status, setStatus] = useState(params.get('status') ?? 'ALL')
  const [risk, setRisk] = useState(params.get('risk') ?? 'ALL')
  const [sealType, setSealType] = useState<'ALL' | 'SMART' | 'BASIC' | 'NONE'>((params.get('sealType') as 'SMART' | 'BASIC' | 'NONE' | null) ?? 'ALL')
  const [tracking, setTracking] = useState<'ALL' | 'LIVE' | 'NONE' | 'AIS' | 'IOT_GPS'>(
    (params.get('tracking') as 'LIVE' | 'NONE' | 'AIS' | 'IOT_GPS' | null) ?? 'ALL',
  )
  const [groupFilter, setGroupFilter] = useState(params.get('statuses'))
  const [scanOpen, setScanOpen] = useState(false)
  const [mapExpanded, setMapExpanded] = useState(false)

  const scoped = useMemo(() => {
    if (currentUser?.role !== 'CLIENT') return containers
    const ownedIds = new Set(cargo.filter((c) => c.clientId === currentUser.clientId).map((c) => c.containerId))
    return containers.filter((c) => ownedIds.has(c.id))
  }, [containers, cargo, currentUser])

  const filtered = scoped.filter((c) => {
    if (
      query &&
      !`${c.number} ${sealIdFor(c) ?? ''} ${c.originCity} ${c.destinationCity} ${c.destinationPort}`.toLowerCase().includes(query.toLowerCase())
    )
      return false
    if (status !== 'ALL' && c.status !== status) return false
    if (risk !== 'ALL' && c.riskLevel !== risk) return false
    if (sealType === 'SMART' && !c.eSealId) return false
    if (sealType === 'BASIC' && !c.regularSealId) return false
    if (sealType === 'NONE' && (c.eSealId || c.regularSealId)) return false
    // Matches dashboard "Live Tracked" / "No Tracking" / "AIS Tracked" / "IoT
    // GPS Tracked" KPI definitions exactly.
    if (tracking === 'LIVE' && c.trackingMode === 'NONE') return false
    if (tracking === 'NONE' && !(c.trackingMode === 'NONE' && c.status !== 'DELIVERED')) return false
    if (tracking === 'AIS' && c.trackingMode !== 'AIS') return false
    if (tracking === 'IOT_GPS' && c.trackingMode !== 'IOT_GPS') return false
    if (groupFilter) {
      if (groupFilter === 'ACTIVE') {
        if (c.status === 'DELIVERED') return false
      } else if (!groupFilter.split(',').includes(c.status)) {
        return false
      }
    }
    return true
  })

  const columns: Column<Container>[] = [
    {
      key: 'seal',
      header: 'Seal ID',
      render: (c) => {
        const seal = sealIdFor(c)
        return (
          <div className="flex flex-col">
            <span className={seal ? 'font-medium text-navy-900' : 'font-medium text-slate-400'}>{seal ?? 'Not sealed'}</span>
            <span className="text-[11px] text-slate-400">{c.number}</span>
          </div>
        )
      },
    },
    {
      key: 'sealType',
      header: 'Seal Type',
      render: (c) =>
        c.eSealId ? (
          <Badge variant="brand">Smart Seal</Badge>
        ) : c.regularSealId ? (
          <Badge variant="offline">Basic Seal</Badge>
        ) : (
          <Badge variant="neutral">Not Sealed</Badge>
        ),
    },
    { key: 'route', header: 'Route', render: (c) => `${c.originCity} → ${c.destinationCity}` },
    { key: 'status', header: 'Status', render: (c) => <ContainerStatusBadge status={c.status} /> },
    { key: 'security', header: 'Security', render: (c) => titleCase(c.securityMode) },
    {
      key: 'tracking',
      header: 'Tracking',
      render: (c) => (c.trackingMode === 'AIS' ? 'AIS' : c.trackingMode === 'IOT_GPS' ? 'IoT GPS' : <span className="text-slate-400">No Tracking</span>),
    },
    { key: 'risk', header: 'Risk', render: (c) => <RiskBadge level={c.riskLevel} /> },
    { key: 'marker', header: 'Signal', render: (c) => <MarkerStateBadge state={c.markerState} /> },
    { key: 'eta', header: 'ETA', render: (c) => formatDateTime(c.eta) },
  ]

  return (
    <div className="pb-10">
      <PageHeader
        title="Seal Monitoring"
        description={`${filtered.length} of ${scoped.length} seals`}
        below={
          groupFilter && (
            <button
              onClick={() => setGroupFilter(null)}
              className="mt-1 flex w-fit items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 hover:bg-brand-100"
            >
              Filtered: {GROUP_LABELS[groupFilter] ?? groupFilter} <X size={12} />
            </button>
          )
        }
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={() => setScanOpen(true)}>
              <ScanLine size={14} /> Scan Seal
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                downloadCsv(
                  'seals.csv',
                  filtered.map((c) => ({
                    sealId: sealIdFor(c) ?? '',
                    sealType: c.eSealId ? 'Smart Seal' : c.regularSealId ? 'Basic Seal' : 'Not Sealed',
                    container: c.number,
                    status: c.status,
                    origin: c.originCity,
                    destination: c.destinationCity,
                    risk: c.riskLevel,
                  })),
                )
              }
            >
              <Download size={14} /> Export CSV
            </Button>
            {currentUser?.role !== 'CLIENT' && currentUser?.role !== 'AUDITOR' && (
              <Button size="sm" onClick={() => navigate('/stuffing')}>
                <Plus size={14} /> New Stuffing
              </Button>
            )}
          </>
        }
      />

      <Modal open={scanOpen} onClose={() => setScanOpen(false)} title="Scan Seal">
        <SealScanFlow
          onViewLiveTracking={(id) => {
            setScanOpen(false)
            navigate(`/containers/${id}`)
          }}
          onViewContainer={(id) => {
            setScanOpen(false)
            navigate(`/containers/${id}`)
          }}
        />
      </Modal>

      <Card className="mx-4 mb-4 md:mx-6">
        <CardHeader>
          <CardTitle>Live Map</CardTitle>
          <Button variant="secondary" size="sm" onClick={() => setMapExpanded((v) => !v)}>
            {mapExpanded ? (
              <>
                <Minimize2 size={14} /> Collapse Map
              </>
            ) : (
              <>
                <Maximize2 size={14} /> Full Map
              </>
            )}
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className={cn('relative w-full', mapExpanded ? 'h-[70vh]' : 'h-64')}>
            <TrackingMap
              containers={filtered}
              vessels={vessels}
              geofences={geofences}
              selectedContainerId={selectedContainerId}
              onSelectContainer={(id) => {
                setSelectedContainer(id)
                navigate(`/containers/${id}`)
              }}
              center={[-3.5, 108]}
              zoom={5}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="mx-4 mb-4 md:mx-6">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 p-3">
          <Input placeholder="Search seal ID, container, city…" value={query} onChange={(e) => setQuery(e.target.value)} className="w-56" />
          <Select value={sealType} onChange={(e) => setSealType(e.target.value as typeof sealType)} className="w-40">
            <option value="ALL">All seal types</option>
            <option value="SMART">Smart Seal</option>
            <option value="BASIC">Basic Seal</option>
            <option value="NONE">Not Sealed</option>
          </Select>
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-44">
            <option value="ALL">All statuses</option>
            {['CREATED', 'STUFFING', 'SEALED', 'IN_TRANSIT_ORIGIN', 'AT_ORIGIN_PORT', 'LOADED_ON_BOARD', 'OCEAN_TRANSIT', 'ARRIVED_DESTINATION_PORT', 'AT_DESTINATION', 'UNLOCKED', 'DELIVERED'].map((s) => (
              <option key={s} value={s}>
                {titleCase(s)}
              </option>
            ))}
          </Select>
          <Select value={risk} onChange={(e) => setRisk(e.target.value)} className="w-40">
            <option value="ALL">All risk levels</option>
            {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((r) => (
              <option key={r} value={r}>
                {titleCase(r)}
              </option>
            ))}
          </Select>
          <Select value={tracking} onChange={(e) => setTracking(e.target.value as typeof tracking)} className="w-40">
            <option value="ALL">All tracking</option>
            <option value="LIVE">Live Tracked</option>
            <option value="AIS">AIS Tracked</option>
            <option value="IOT_GPS">IoT GPS Tracked</option>
            <option value="NONE">No Tracking</option>
          </Select>
        </div>
        <DataTable columns={columns} rows={filtered} rowKey={(c) => c.id} onRowClick={(c) => navigate(`/containers/${c.id}`)} emptyTitle="No containers match your filters" />
      </Card>
    </div>
  )
}
