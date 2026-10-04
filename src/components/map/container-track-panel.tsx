import { Check, Circle, Dot, Eye, Pause, Play, RotateCcw, ShieldAlert } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useShallow } from 'zustand/react/shallow'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { BatteryIndicator, SignalIndicator } from '@/components/shared/indicators'
import { ContainerStatusBadge } from '@/components/shared/status-badge'
import { useDataStore } from '@/store/dataStore'
import { useSimulationStore } from '@/store/simulationStore'
import { useUiStore } from '@/store/uiStore'
import { enumLabel, useT } from '@/i18n'
import { formatDateTime, cn } from '@/lib/utils'
import { distanceMeters } from '@/mock/geo'
import type { Container } from '@/types'

interface ContainerTrackPanelProps {
  container: Container
  onPlayed?: () => void // lets the page know playback was started from here
}

/** Journey checkpoints as fractions of the route (matches the simulated waypoint layout). */
const JOURNEY: { key: 'stepOrigin' | 'stepOriginPort' | 'stepOcean' | 'stepDestPort' | 'stepDestination'; at: number }[] = [
  { key: 'stepOrigin', at: 0 },
  { key: 'stepOriginPort', at: 0.2 },
  { key: 'stepOcean', at: 0.5 },
  { key: 'stepDestPort', at: 0.8 },
  { key: 'stepDestination', at: 1 },
]

/** Container details for the selected marker. Every value comes from the stores; this panel only controls the engine. */
export function ContainerTrackPanel({ container, onPlayed }: ContainerTrackPanelProps) {
  const t = useT()
  const navigate = useNavigate()
  const device = useDataStore((s) => s.devices.find((d) => d.id === container.eSealId))
  // useShallow: the selector returns a new object each call, which would otherwise re-render forever.
  const sim = useSimulationStore(useShallow((s) => ({ isPlaying: s.isPlaying, speed: s.speed, activeId: s.activeContainerId })))
  const setActiveContainer = useSimulationStore((s) => s.setActiveContainer)
  const playRoute = useSimulationStore((s) => s.playRoute)
  const pause = useSimulationStore((s) => s.pause)
  const resetRoute = useSimulationStore((s) => s.resetRoute)
  const setSpeed = useSimulationStore((s) => s.setSpeed)
  const follow = useUiStore((s) => s.followContainer)
  const setFollow = useUiStore((s) => s.setFollowContainer)

  const isActive = sim.activeId === container.id
  const playing = isActive && sim.isPlaying
  const progress = container.routeProgress
  const tampered = device?.status === 'TAMPER'
  const routes = useDataStore((s) => s.routes)
  const route = routes.find((r) => r.id === container.routeId)
  const routeKm = route ? route.waypoints.slice(1).reduce((sum, p, i) => sum + distanceMeters(route.waypoints[i], p), 0) / 1000 : 0
  const remainingKm = Math.max(0, routeKm * (1 - container.routeProgress))
  const pct = Math.round(progress * 100)

  // Engine is shared: making this container active is what lets Play/Pause/Reset act on it.
  const play = () => {
    if (!isActive) setActiveContainer(container.id)
    playRoute()
    onPlayed?.()
  }
  const reset = () => {
    if (!isActive) setActiveContainer(container.id)
    resetRoute()
  }
  const togglePause = () => pause()

  return (
    <Card>
      <CardContent className="space-y-4 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">{t('track.title')}</p>
            <p className="font-mono text-base font-semibold text-navy-900">{container.number}</p>
            <p className="font-mono text-xs text-slate-500">{container.eSealId ?? container.regularSealId ?? '—'}</p>
          </div>
          <ContainerStatusBadge status={container.status} />
        </div>

        {tampered && (
          <div className="flex items-center gap-2 rounded-md bg-red-50 p-2.5 text-sm font-medium text-red-700">
            <ShieldAlert size={16} /> {t('track.tamperDetected')}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant={playing ? 'secondary' : 'primary'} onClick={playing ? togglePause : play} disabled={!playing && progress >= 1}>
            {playing ? <><Pause size={14} /> {t('track.pause')}</> : <><Play size={14} /> {t('track.play')}</>}
          </Button>
          <Button size="sm" variant="secondary" onClick={reset}>
            <RotateCcw size={14} /> {t('track.reset')}
          </Button>
          <div className="flex overflow-hidden rounded-md border border-slate-200">
            {([1, 5, 20] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSpeed(s)}
                className={cn('px-2.5 py-1 text-xs font-semibold', sim.speed === s ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50')}
              >
                ×{s}
              </button>
            ))}
          </div>
          <label className="ml-auto flex items-center gap-1.5 text-xs font-medium text-navy-800">
            <input type="checkbox" className="h-4 w-4 accent-brand-600" checked={follow} onChange={(e) => setFollow(e.target.checked)} />
            {t('track.follow')}
          </label>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm md:grid-cols-4">
          <Info label={t('track.currentPosition')} value={`${container.currentLocation.lat.toFixed(4)}, ${container.currentLocation.lng.toFixed(4)}`} mono />
          <Info label={t('track.speed')} value={`×${sim.speed}${playing ? '' : ` · ${t('track.idleNote')}`}`} />
          <Info label={t('track.remainingDistance')} value={`${remainingKm.toFixed(0)} km`} />
          <Info label={t('ui.status')} value={enumLabel('status', container.status)} />
          <Info label={t('ui.eta')} value={formatDateTime(container.eta)} />
          <Info label={t('ui.battery')} value={device ? <BatteryIndicator value={device.battery} /> : t('track.noDevice')} />
          <Info label={t('ui.signal')} value={device ? <SignalIndicator value={device.signal} /> : '—'} />
          <Info label={t('ui.temperature')} value={device ? `${device.temperature}°C` : '—'} />
          <Info label={t('ui.tamper')} value={tampered ? t('track.tamperDetected') : t('track.tamperSecure')} />
          <Info label={t('track.gpsStatus')} value={container.trackingMode === 'NONE' ? t('track.gpsInactive') : t('track.gpsActive')} />
          <Info label={t('ui.lastUpdate')} value={formatDateTime(container.lastUpdate)} />
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            {t('track.journeyProgress')} · {t('track.progressPct', { pct })}
          </p>
          <ol className="space-y-1">
            {JOURNEY.map((step, i) => {
              const done = progress >= step.at
              const current = done && (i === JOURNEY.length - 1 || progress < JOURNEY[i + 1].at)
              return (
                <li key={step.key} className={cn('flex items-center gap-2 text-sm', current && 'font-semibold text-brand-700')}>
                  {done && !current ? <Check size={14} className="text-success-600" /> : current ? <Dot size={20} className="-mx-1.5 text-brand-600" /> : <Circle size={12} className="text-slate-300" />}
                  <span className={cn(!done && 'text-slate-400')}>{t(`track.${step.key}`)}</span>
                </li>
              )
            })}
          </ol>
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={() => navigate(`/containers/${container.id}`)}>
            <Eye size={14} /> {t('track.viewDetails')}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function Info({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={cn('text-navy-900', mono && 'font-mono text-[13px]')}>{value}</p>
    </div>
  )
}
