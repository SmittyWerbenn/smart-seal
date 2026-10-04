import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Download, Maximize2, Minimize2, Plus, ScanLine, X } from 'lucide-react'
import { useDataStore } from '@/store/dataStore'
import { useSimulationStore } from '@/store/simulationStore'
import { ContainerTrackLayer } from '@/components/map/container-track-layer'
import { ContainerTrackPanel } from '@/components/map/container-track-panel'
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
import { cn, downloadCsv, formatDateTime, sealIdFor, securityModeLabel } from '@/lib/utils'
import type { Container } from '@/types'
import { translate, enumLabel } from '@/i18n'

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
  const routes = useDataStore((s) => s.routes)
  const currentUser = useAuthStore((s) => s.currentUser)
  const { selectedContainerId, setSelectedContainer } = useUiStore()
  const followContainer = useUiStore((s) => s.followContainer)
  const setActiveContainer = useSimulationStore((s) => s.setActiveContainer)
  const playRoute = useSimulationStore((s) => s.playRoute)
  const setFollowContainer = useUiStore((s) => s.setFollowContainer)
  // Set when this page starts playback, so leaving the page only stops what it started.
  const playedHere = useRef(false)
  const selectedContainer = containers.find((c) => c.id === selectedContainerId)
  const selectedRoute = routes.find((r) => r.id === selectedContainer?.routeId)
  useEffect(() => {
    return () => {
      if (playedHere.current && useSimulationStore.getState().isPlaying) useSimulationStore.getState().pause()
    }
  }, [])
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
  // Full-screen map: Escape closes it and page scrolling is locked while it is open.
  useEffect(() => {
    if (!mapExpanded) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMapExpanded(false)
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [mapExpanded])

  const scoped = useMemo(() => {
    // Once a seal is unlocked its journey is done — Seal Monitoring is for
    // what's still active, not a permanent archive. Delivered/unlocked
    // history stays queryable via Reports/Audit Logs.
    const active = containers.filter((c) => !c.isUnlocked)
    if (currentUser?.role !== 'CLIENT') return active
    const ownedIds = new Set(cargo.filter((c) => c.clientId === currentUser.clientId).map((c) => c.containerId))
    return active.filter((c) => ownedIds.has(c.id))
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
      get header() { return translate('ui.sealId') },
      render: (c) => {
        const seal = sealIdFor(c)
        return (
          <div className="flex flex-col">
            <span className={seal ? 'font-medium text-navy-900' : 'font-medium text-slate-400'}>{seal ?? translate('misc.notSealedLabel')}</span>
            <span className="text-[11px] text-slate-400">{c.number}</span>
          </div>
        )
      },
    },
    {
      key: 'sealType',
      get header() { return translate('ui.sealType') },
      render: (c) =>
        c.eSealId ? (
          <Badge variant="brand">{translate('ui.smartSeal')}</Badge>
        ) : c.regularSealId ? (
          <Badge variant="offline">{translate('ui.basicSeal')}</Badge>
        ) : (
          <Badge variant="neutral">{translate('ui.notSealed')}</Badge>
        ),
    },
    { key: 'route', get header() { return translate('ui.route') }, render: (c) => `${c.originCity} → ${c.destinationCity}` },
    { key: 'status', get header() { return translate('ui.status') }, render: (c) => <ContainerStatusBadge status={c.status} /> },
    { key: 'security', get header() { return translate('ui.security') }, render: (c) => securityModeLabel(c.securityMode) },
    {
      key: 'tracking',
      get header() { return translate('ui.tracking') },
      render: (c) => (c.trackingMode === 'AIS' ? 'AIS' : c.trackingMode === 'IOT_GPS' ? 'IoT GPS' : <span className="text-slate-400">{translate('ui.noTracking')}</span>),
    },
    { key: 'risk', get header() { return translate('ui.risk') }, render: (c) => <RiskBadge level={c.riskLevel} /> },
    { key: 'marker', get header() { return translate('ui.signal') }, render: (c) => <MarkerStateBadge state={c.markerState} /> },
    { key: 'eta', get header() { return translate('ui.eta') }, render: (c) => formatDateTime(c.eta) },
  ]

  return (
    <div className="pb-10">
      <PageHeader
        title={translate('ui.sealMonitoring')}
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
              <ScanLine size={14} /> {translate('ui.scanSeal')}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                downloadCsv(
                  'seals.csv',
                  filtered.map((c) => ({
                    sealId: sealIdFor(c) ?? '',
                    sealType: c.eSealId ? 'Smart Seal' : c.regularSealId ? 'Basic Seal' : translate('misc.notSealedBadge'),
                    container: c.number,
                    status: c.status,
                    origin: c.originCity,
                    destination: c.destinationCity,
                    risk: c.riskLevel,
                  })),
                )
              }
            >
              <Download size={14} /> {translate('ui.exportCsv')}
            </Button>
            {currentUser?.role !== 'CLIENT' && currentUser?.role !== 'AUDITOR' && (
              <Button size="sm" onClick={() => navigate('/stuffing')}>
                <Plus size={14} /> {translate('ui.newStuffing')}
              </Button>
            )}
          </>
        }
      />

      <Modal open={scanOpen} onClose={() => setScanOpen(false)} title={translate('ui.scanSeal')}>
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

      {/* Full Map: the map card becomes a full-screen view; the panel floats over the bottom of it. */}
      <div className={mapExpanded ? 'fixed inset-0 z-[1100] flex flex-col overflow-hidden bg-white' : 'contents'}>
      <Card className={cn('mx-4 mb-4 md:mx-6', mapExpanded && 'm-0 flex min-h-0 flex-1 flex-col rounded-none border-0 shadow-none')}>
        <CardHeader>
          <CardTitle>{translate('ui.liveMap')}</CardTitle>
          <Button variant="secondary" size="sm" onClick={() => setMapExpanded((v) => !v)}>
            {mapExpanded ? (
              <>
                <Minimize2 size={14} /> {translate('ui.collapseMap')}
              </>
            ) : (
              <>
                <Maximize2 size={14} /> {translate('ui.fullMap')}
              </>
            )}
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className={cn('relative w-full', mapExpanded ? 'h-[calc(100dvh-3.5rem)]' : 'h-64')}>
            <TrackingMap
              containers={filtered}
              vessels={vessels}
              geofences={geofences}
              selectedContainerId={selectedContainerId}
              onSelectContainer={(id) => {
                // Like starting navigation: select, follow the vehicle and start the run on the route.
                setSelectedContainer(id)
                setActiveContainer(id)
                setFollowContainer(true)
                playRoute()
                playedHere.current = true
              }}
              center={[-3.5, 108]}
              zoom={5}
              hideContainerId={selectedContainer?.id ?? null}
              resizeKey={mapExpanded}
            >
              {selectedContainer && (
                <ContainerTrackLayer
                  container={selectedContainer}
                  route={selectedRoute}
                  follow={followContainer}
                  onUserMove={() => setFollowContainer(false)}
                />
              )}
            </TrackingMap>
          </div>
        </CardContent>
      </Card>

      <div className={mapExpanded ? 'absolute inset-x-0 bottom-0 z-[1000] max-h-[42dvh] overflow-y-auto border-t border-slate-200 bg-white/95 p-3 shadow-xl backdrop-blur md:inset-x-auto md:bottom-4 md:right-4 md:top-16 md:max-h-[calc(100dvh-5rem)] md:w-96 md:rounded-xl md:border' : 'mx-4 mb-4 md:mx-6'}>
        {selectedContainer ? (
          <ContainerTrackPanel container={selectedContainer} onPlayed={() => { playedHere.current = true }} />
        ) : (
          <p className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-center text-sm text-slate-500">{translate('track.selectOnMap')}</p>
        )}
      </div>
      </div>

      <Card className="mx-4 mb-4 md:mx-6">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 p-3">
          <Input placeholder={translate('ui.searchSealIdContainerCity')} value={query} onChange={(e) => setQuery(e.target.value)} className="w-56" />
          <Select value={sealType} onChange={(e) => setSealType(e.target.value as typeof sealType)} className="w-40">
            <option value="ALL">{translate('ui.allSealTypes')}</option>
            <option value="SMART">{translate('ui.smartSeal')}</option>
            <option value="BASIC">{translate('ui.basicSeal')}</option>
            <option value="NONE">{translate('ui.notSealed')}</option>
          </Select>
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-44">
            <option value="ALL">{translate('ui.allStatuses')}</option>
            {['CREATED', 'STUFFING', 'SEALED', 'IN_TRANSIT_ORIGIN', 'AT_ORIGIN_PORT', 'LOADED_ON_BOARD', 'OCEAN_TRANSIT', 'ARRIVED_DESTINATION_PORT', 'AT_DESTINATION', 'UNLOCKED', 'DELIVERED'].map((s) => (
              <option key={s} value={s}>
                {enumLabel('status', s)}
              </option>
            ))}
          </Select>
          <Select value={risk} onChange={(e) => setRisk(e.target.value)} className="w-40">
            <option value="ALL">{translate('ui.allRiskLevels')}</option>
            {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((r) => (
              <option key={r} value={r}>
                {enumLabel('status', r)}
              </option>
            ))}
          </Select>
          <Select value={tracking} onChange={(e) => setTracking(e.target.value as typeof tracking)} className="w-40">
            <option value="ALL">{translate('ui.allTracking')}</option>
            <option value="LIVE">{translate('ui.liveTracked')}</option>
            <option value="AIS">{translate('ui.aisTracked')}</option>
            <option value="IOT_GPS">{translate('ui.iotGpsTracked')}</option>
            <option value="NONE">{translate('ui.noTracking')}</option>
          </Select>
        </div>
        <DataTable columns={columns} rows={filtered} rowKey={(c) => c.id} onRowClick={(c) => navigate(`/containers/${c.id}`)} emptyTitle={translate('ui.noContainersMatchYourFilters')} />
      </Card>
    </div>
  )
}
