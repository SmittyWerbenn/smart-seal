import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Package } from 'lucide-react'
import { useDataStore } from '@/store/dataStore'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Tabs } from '@/components/ui/tabs'
import { ContainerStatusBadge, MarkerStateBadge, RiskBadge } from '@/components/shared/status-badge'
import { EmptyState } from '@/components/shared/states'
import { formatDateTime, sealIdFor, securityModeLabel } from '@/lib/utils'
import { OverviewTab } from '@/components/container/overview-tab'
import { TrackingTab } from '@/components/container/tracking-tab'
import { CargoTab } from '@/components/container/cargo-tab'
import { SealsTab } from '@/components/container/seals-tab'
import { EventsTab } from '@/components/container/events-tab'
import { DocumentsTab } from '@/components/container/documents-tab'

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'tracking', label: 'Tracking' },
  { key: 'cargo', label: 'Cargo' },
  { key: 'seals', label: 'Seals' },
  { key: 'events', label: 'Events' },
  { key: 'documents', label: 'Documents' },
]

export default function ContainerDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { containers, devices, cargo, timeline, routes } = useDataStore()
  const [tab, setTab] = useState('overview')

  const currentUser = useAuthStore((s) => s.currentUser)
  const container = useMemo(() => containers.find((c) => c.id === id || c.number === id), [containers, id])
  const device = devices.find((d) => d.id === container?.eSealId || d.containerId === container?.id)
  const containerCargo = cargo.filter((c) => c.containerId === container?.id)
  const containerEvents = timeline.filter((e) => e.containerId === container?.id)
  const route = routes.find((r) => r.id === container?.routeId)

  const isClient = currentUser?.role === 'CLIENT'
  const visibleCargo = containerCargo.filter((c) => !isClient || c.clientId === currentUser?.clientId)
  const cargoSummary =
    containerCargo.length === 0
      ? 'No cargo recorded yet'
      : visibleCargo.length === 0
        ? `${containerCargo.length} consolidated cargo ${containerCargo.length === 1 ? 'line' : 'lines'}`
        : visibleCargo
            .slice(0, 2)
            .map((c) => c.productName)
            .join(', ') + (containerCargo.length > 2 ? ` +${containerCargo.length - 2} more` : '')

  if (!container) {
    return <EmptyState title="Seal not found" description="It may have been reset. Try going back to the seal list." action={{ label: 'Back to seals', onClick: () => navigate('/containers') }} />
  }

  const sealId = sealIdFor(container)

  return (
    <div className="pb-10">
      <div className="border-b border-slate-200 bg-white px-4 pb-4 pt-4 md:px-6">
        <button onClick={() => navigate(-1)} className="mb-2 flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-navy-800">
          <ArrowLeft size={14} /> Back
        </button>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-navy-900">{sealId ?? 'Not Sealed'}</h1>
              <ContainerStatusBadge status={container.status} />
              <MarkerStateBadge state={container.markerState} />
            </div>
            <p className="mt-1 text-xs text-slate-400">Container {container.number}</p>
            <p className="mt-1 text-sm text-slate-500">
              {container.originCity} ({container.originPort}) → {container.destinationCity} ({container.destinationPort})
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-navy-700">
              <Package size={14} className="text-slate-400" /> {cargoSummary}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div>
              <p className="text-xs text-slate-400">Security Mode</p>
              <p className="font-medium text-navy-800">{securityModeLabel(container.securityMode)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">ETA</p>
              <p className="font-medium text-navy-800">{formatDateTime(container.eta)}</p>
            </div>
            <RiskBadge level={container.riskLevel} />
            {!container.isArmed && (
              <Button size="sm" onClick={() => navigate(`/containers/${container.id}/stuffing`)}>
                Start Stuffing
              </Button>
            )}
          </div>
        </div>
        <Tabs tabs={TABS} active={tab} onChange={setTab} className="mt-4" />
      </div>

      <div className="p-4 md:p-6">
        {tab === 'overview' && <OverviewTab container={container} device={device} cargo={containerCargo} />}
        {tab === 'tracking' && <TrackingTab container={container} route={route} />}
        {tab === 'cargo' && <CargoTab cargo={containerCargo} container={container} />}
        {tab === 'seals' && <SealsTab container={container} device={device} />}
        {tab === 'events' && <EventsTab events={containerEvents} />}
        {tab === 'documents' && <DocumentsTab container={container} />}
      </div>
    </div>
  )
}
