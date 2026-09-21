import { useState } from 'react'
import { CheckCircle2, Circle, Loader2, Play, Sparkles } from 'lucide-react'
import { useDataStore } from '@/store/dataStore'
import { useSimulationStore } from '@/store/simulationStore'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/input'
import { TrackingMap } from '@/components/map/tracking-map'
import { ContainerStatusBadge, MarkerStateBadge } from '@/components/shared/status-badge'
import { cn, sealIdFor } from '@/lib/utils'

const SPEEDS: (1 | 5 | 20)[] = [1, 5, 20]

export default function SimulationPage() {
  const containers = useDataStore((s) => s.containers)
  const routes = useDataStore((s) => s.routes)
  const geofences = useDataStore((s) => s.geofences)
  const sim = useSimulationStore()
  const [tab, setTab] = useState<'manual' | 'demo'>('demo')

  const container = containers.find((c) => c.id === sim.activeContainerId)
  const route = routes.find((r) => r.id === container?.routeId)

  const buttons: { label: string; onClick: () => void; disabled?: boolean }[] = [
    { label: 'RESET DEMO', onClick: sim.resetDemo },
    { label: 'START JOURNEY', onClick: sim.startJourney },
    { label: 'PAUSE', onClick: sim.pause },
    { label: 'MOVE TO ORIGIN PORT', onClick: sim.moveToOriginPort },
    { label: 'LOAD ON VESSEL', onClick: sim.loadOnVessel },
    { label: 'START OCEAN TRANSIT', onClick: sim.startOceanTransit },
    { label: 'ARRIVE DESTINATION PORT', onClick: sim.arriveDestinationPort },
    { label: 'START DESTINATION DELIVERY', onClick: sim.startDestinationDelivery },
    { label: 'ENTER DESTINATION GEOFENCE', onClick: sim.enterDestinationGeofence },
    { label: 'ENABLE UNLOCK', onClick: sim.enableUnlock },
    { label: 'COMPLETE DELIVERY', onClick: sim.completeDelivery },
    { label: 'SIMULATE TAMPER', onClick: sim.simulateTamper },
    { label: 'SIMULATE LOW BATTERY', onClick: sim.simulateLowBattery },
    { label: 'SIMULATE OFFLINE', onClick: sim.simulateOffline },
    { label: 'SIMULATE DEVICE RETURN', onClick: sim.simulateDeviceReturn },
  ]

  return (
    <div className="pb-10">
      <PageHeader
        title="Demo Simulation Panel"
        description="Drive the end-to-end seal journey for stakeholder presentations — no backend required."
      />

      <div className="grid grid-cols-1 gap-4 px-4 md:grid-cols-3 md:px-6">
        <Card className="md:col-span-2">
          <CardHeader className="flex-wrap gap-2">
            <CardTitle>Live Preview</CardTitle>
            <div className="flex items-center gap-2">
              <Select value={sim.activeContainerId} onChange={(e) => sim.setActiveContainer(e.target.value)} className="w-56">
                {containers.slice(0, 40).map((c) => (
                  <option key={c.id} value={c.id}>
                    {sealIdFor(c) ?? `${c.number} (not sealed)`}
                  </option>
                ))}
              </Select>
              {container && <MarkerStateBadge state={container.markerState} />}
              {container && <ContainerStatusBadge status={container.status} />}
            </div>
          </CardHeader>
          <CardContent className="h-[380px] p-0">
            {container && (
              <TrackingMap
                containers={[container]}
                geofences={geofences}
                routeWaypoints={route?.waypoints.map((w) => [w.lat, w.lng])}
                height="380px"
              />
            )}
          </CardContent>
          <CardContent className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
            <span className="text-xs font-medium text-slate-500">Speed</span>
            {SPEEDS.map((s) => (
              <button
                key={s}
                onClick={() => sim.setSpeed(s)}
                className={cn('rounded-md border px-2.5 py-1 text-xs font-semibold', sim.speed === s ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-500')}
              >
                ×{s}
              </button>
            ))}
            <span className={cn('ml-auto flex items-center gap-1.5 text-xs font-medium', sim.isPlaying ? 'text-success-500' : 'text-slate-400')}>
              {sim.isPlaying ? <Loader2 size={13} className="animate-spin" /> : <Circle size={8} className="fill-current" />}
              {sim.isPlaying ? 'Moving' : 'Idle'}
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>One-Click Demo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-slate-500">Runs the complete 16-step journey automatically at high speed — the primary feature for stakeholder demos.</p>
            <Button className="w-full" size="lg" onClick={() => sim.runFullDemo()} disabled={sim.fullDemoRunning}>
              {sim.fullDemoRunning ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Running…
                </>
              ) : (
                <>
                  <Sparkles size={16} /> RUN FULL DEMO
                </>
              )}
            </Button>
            <div className="max-h-72 space-y-1.5 overflow-y-auto pt-1">
              {sim.fullDemoSteps.map((step) => (
                <div key={step.key} className="flex items-center gap-2 text-xs">
                  {step.done ? <CheckCircle2 size={14} className="shrink-0 text-success-500" /> : <Circle size={14} className="shrink-0 text-slate-300" />}
                  <span className={step.done ? 'text-navy-800' : 'text-slate-400'}>{step.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 px-4 md:px-6">
        <div className="mb-2 flex gap-1 border-b border-slate-200">
          <button onClick={() => setTab('demo')} className={cn('border-b-2 px-3 py-2 text-sm font-medium', tab === 'demo' ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500')}>
            Guided Demo Controls
          </button>
          <button onClick={() => setTab('manual')} className={cn('border-b-2 px-3 py-2 text-sm font-medium', tab === 'manual' ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500')}>
            All Controls
          </button>
        </div>

        {tab === 'manual' && (
          <Card>
            <CardContent className="grid grid-cols-2 gap-2 py-4 sm:grid-cols-3 lg:grid-cols-4">
              {buttons.map((b) => (
                <Button key={b.label} variant="secondary" size="sm" onClick={b.onClick} disabled={b.disabled}>
                  <Play size={12} /> {b.label}
                </Button>
              ))}
            </CardContent>
          </Card>
        )}

        {tab === 'demo' && (
          <Card>
            <CardContent className="py-4">
              <ol className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {(
                  [
                    { n: '1', label: 'START JOURNEY', fn: sim.startJourney },
                    { n: '2', label: 'LOAD ON VESSEL (after origin port)', fn: sim.loadOnVessel },
                    { n: '3', label: 'START OCEAN TRANSIT', fn: sim.startOceanTransit },
                    { n: '4', label: 'START DESTINATION DELIVERY (after port arrival)', fn: sim.startDestinationDelivery },
                    { n: '5', label: 'COMPLETE DELIVERY (unlocks & delivers)', fn: sim.completeDelivery },
                  ] as { n: string; label: string; fn: () => void }[]
                ).map((step) => (
                  <li key={step.label} className="flex items-center gap-2 rounded-md border border-slate-100 p-2.5 text-xs">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[11px] font-semibold text-brand-700">{step.n}</span>
                    <span className="flex-1 text-navy-700">{step.label}</span>
                    <Button size="sm" variant="outline" onClick={step.fn}>
                      Run
                    </Button>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
