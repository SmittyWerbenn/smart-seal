import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { useDataStore } from '@/store/dataStore'
import { useUiStore } from '@/store/uiStore'
import { TrackingMap } from '@/components/map/tracking-map'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ContainerStatusBadge, MarkerStateBadge, RiskBadge } from '@/components/shared/status-badge'
import { EventTimeline } from '@/components/shared/event-timeline'
import { EmptyState } from '@/components/shared/states'
import { cn, formatDateTime, sealIdFor, titleCase } from '@/lib/utils'
import type { MarkerState } from '@/types'

const MARKER_FILTERS: { label: string; value: MarkerState | 'ALL' }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Normal', value: 'NORMAL' },
  { label: 'Warning', value: 'WARNING' },
  { label: 'Critical', value: 'CRITICAL' },
  { label: 'Offline', value: 'OFFLINE' },
  { label: 'Delivered', value: 'DELIVERED' },
]

export default function ControlTowerPage() {
  const { containers, vessels, geofences, timeline } = useDataStore()
  const { selectedContainerId, setSelectedContainer } = useUiStore()
  const navigate = useNavigate()
  const [markerFilter, setMarkerFilter] = useState<MarkerState | 'ALL'>('ALL')
  const [query, setQuery] = useState('')
  const [showVessels, setShowVessels] = useState(true)
  const [showGeofences, setShowGeofences] = useState(true)

  const filtered = useMemo(() => {
    return containers.filter((c) => {
      if (markerFilter !== 'ALL' && c.markerState !== markerFilter) return false
      if (
        query &&
        !`${c.number} ${c.eSealId ?? ''} ${c.regularSealId ?? ''} ${c.originCity} ${c.destinationCity}`
          .toLowerCase()
          .includes(query.toLowerCase())
      )
        return false
      return true
    })
  }, [containers, markerFilter, query])

  const selected = containers.find((c) => c.id === selectedContainerId)
  const selectedTimeline = selected ? timeline.filter((e) => e.containerId === selected.id).slice(-12) : []

  return (
    <div className="flex h-[calc(100vh-56px)] flex-col md:flex-row">
      {/* Filters */}
      <aside className="flex shrink-0 flex-col gap-4 border-b border-slate-200 bg-white p-4 md:w-60 md:border-b-0 md:border-r">
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">Search</p>
          <div className="relative">
            <Search size={14} className="pointer-events-none absolute left-2.5 top-2.5 text-slate-400" />
            <Input placeholder="Seal ID / container / city" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-8" />
          </div>
        </div>
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">Status</p>
          <div className="flex flex-wrap gap-1.5">
            {MARKER_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setMarkerFilter(f.value)}
                className={cn(
                  'rounded-full border px-2.5 py-1 text-xs font-medium',
                  markerFilter === f.value ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50',
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Layers</p>
          <label className="flex items-center gap-2 text-sm text-navy-700">
            <input type="checkbox" checked={showVessels} onChange={(e) => setShowVessels(e.target.checked)} /> Vessels
          </label>
          <label className="flex items-center gap-2 text-sm text-navy-700">
            <input type="checkbox" checked={showGeofences} onChange={(e) => setShowGeofences(e.target.checked)} /> Geofences
          </label>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">{filtered.length} seals</p>
          <div className="space-y-1">
            {filtered.slice(0, 60).map((c) => {
              const sealId = sealIdFor(c)
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedContainer(c.id)}
                  className={cn(
                    'flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-slate-50',
                    selectedContainerId === c.id && 'bg-brand-50',
                  )}
                >
                  <span className="flex flex-col overflow-hidden">
                    <span className={cn('truncate font-medium', sealId ? 'text-navy-800' : 'text-slate-400')}>{sealId ?? 'Not sealed'}</span>
                    <span className="truncate text-[10px] text-slate-400">{c.number}</span>
                  </span>
                  <MarkerStateBadge state={c.markerState} />
                </button>
              )
            })}
          </div>
        </div>
      </aside>

      {/* Map */}
      <div className="relative min-h-[320px] flex-1">
        <TrackingMap
          containers={filtered}
          vessels={showVessels ? vessels : []}
          geofences={showGeofences ? geofences : []}
          selectedContainerId={selectedContainerId}
          onSelectContainer={setSelectedContainer}
          center={[-3.5, 108]}
          zoom={5}
        />
      </div>

      {/* Detail panel */}
      <aside className="flex w-full shrink-0 flex-col border-t border-slate-200 bg-white md:w-80 md:border-l md:border-t-0">
        {!selected ? (
          <EmptyState title="No seal selected" description="Click a marker or pick a seal from the list to see details." />
        ) : (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="border-b border-slate-100 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-navy-900">{sealIdFor(selected) ?? 'Not sealed'}</h3>
                <MarkerStateBadge state={selected.markerState} />
              </div>
              <p className="text-xs text-slate-400">{selected.number}</p>
              <p className="mt-0.5 text-xs text-slate-500">
                {selected.originCity} → {selected.destinationCity}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <ContainerStatusBadge status={selected.status} />
                <RiskBadge level={selected.riskLevel} />
                <Badge variant="outline">{selected.trackingMode === 'AIS' ? 'AIS' : selected.trackingMode === 'IOT_GPS' ? 'IoT GPS' : 'No Tracking'}</Badge>
              </div>
              <dl className="mt-3 space-y-1 text-xs text-slate-500">
                <div className="flex justify-between"><dt>Security</dt><dd className="font-medium text-navy-700">{titleCase(selected.securityMode)}</dd></div>
                <div className="flex justify-between"><dt>ETA</dt><dd className="font-medium text-navy-700">{formatDateTime(selected.eta)}</dd></div>
                <div className="flex justify-between"><dt>Last update</dt><dd className="font-medium text-navy-700">{formatDateTime(selected.lastUpdate)}</dd></div>
              </dl>
              {selected.riskFactors.length > 0 && (
                <div className="mt-3 rounded-md bg-critical-100/50 p-2.5">
                  <p className="text-xs font-semibold text-red-800">{titleCase(selected.riskLevel)} risk</p>
                  <ul className="mt-1 list-disc space-y-0.5 pl-4 text-[11px] text-red-700">
                    {selected.riskFactors.map((f) => (
                      <li key={f.label}>{f.detail}</li>
                    ))}
                  </ul>
                </div>
              )}
              <Button className="mt-3 w-full" size="sm" onClick={() => navigate(`/containers/${selected.id}`)}>
                Open seal detail
              </Button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Event timeline</p>
              <EventTimeline events={selectedTimeline} dense />
            </div>
          </div>
        )}
      </aside>
    </div>
  )
}
