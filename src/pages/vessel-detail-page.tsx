import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Gauge, Navigation2, Clock, Radio } from 'lucide-react'
import { useDataStore } from '@/store/dataStore'
import { TrackingMap } from '@/components/map/tracking-map'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/shared/states'
import { distanceMeters } from '@/mock/geo'
import { formatDateTime } from '@/lib/utils'
import { translate, enumLabel } from '@/i18n'

export default function VesselDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const vessels = useDataStore((s) => s.vessels)
  const routes = useDataStore((s) => s.routes)
  const containers = useDataStore((s) => s.containers)

  const vessel = vessels.find((v) => v.id === id)
  const route = routes.find((r) => r.id === vessel?.routeId)
  const carriedContainers = containers.filter((c) => c.vesselId === vessel?.id)
  const apiCallsToday = useMemo(() => Math.floor(Math.random() * 40) + 12, [vessel?.id])

  if (!vessel) return <EmptyState title={translate('ui.vesselNotFound')} action={{ get label() { return translate('ui.backToVessels') }, onClick: () => navigate('/vessels') }} />

  const destination = route?.waypoints[route.waypoints.length - 1]
  const distanceToDestination = destination ? distanceMeters(vessel.position, destination) / 1852 : null

  return (
    <div className="pb-10">
      <div className="border-b border-slate-200 bg-white px-4 pb-4 pt-4 md:px-6">
        <button onClick={() => navigate(-1)} className="mb-2 flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-navy-800">
          <ArrowLeft size={14} /> {translate('ui.back')}
        </button>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold text-navy-900">{vessel.name}</h1>
          <Badge variant="brand">{vessel.vesselType}</Badge>
          <Badge variant="outline">{enumLabel('status', vessel.status)}</Badge>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          {vessel.operator} · Voyage {vessel.voyageNumber} · IMO {vessel.imo} · MMSI {vessel.mmsi}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-3 md:p-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>{translate('ui.livePosition')}</CardTitle>
          </CardHeader>
          <CardContent className="h-[420px] p-0">
            <TrackingMap vessels={[vessel]} routeWaypoints={route?.waypoints.map((w) => [w.lat, w.lng])} height="420px" />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardContent className="grid grid-cols-2 gap-3 py-4">
              <Stat icon={Gauge} label={translate('ui.speed')} value={`${vessel.speedKn} kn`} />
              <Stat icon={Navigation2} label={translate('ui.heading')} value={`${Math.round(vessel.heading)}°`} />
              <Stat icon={Clock} label={translate('ui.eta')} value={formatDateTime(vessel.eta)} />
              <Stat icon={Radio} label={translate('ui.lastAisUpdate')} value={formatDateTime(vessel.lastAisUpdate)} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{translate('ui.voyage')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Row label={translate('ui.originPort')} value={vessel.originPort} />
              <Row label={translate('ui.destinationPort')} value={vessel.destinationPort} />
              <Row label={translate('ui.distanceRemaining')} value={distanceToDestination ? `${distanceToDestination.toFixed(0)} nm` : '—'} />
              <Row label={translate('ui.capacity')} value={vessel.capacityTeu ? `${vessel.capacityTeu.toLocaleString()} TEU` : '—'} />
              <Row label={translate('ui.containersAboard')} value={`${carriedContainers.length}`} />
              <div>
                <div className="mb-1 flex justify-between text-slate-500">
                  <span>{translate('ui.voyageProgress')}</span>
                  <span className="font-medium text-navy-800">{Math.round(vessel.routeProgress * 100)}%</span>
                </div>
                <Progress value={vessel.routeProgress * 100} colorClassName="bg-brand-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>{translate('ui.aisPollingSimulation')}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
            <div className="rounded-md bg-slate-50 p-3">
              <p className="text-xs text-slate-500">{translate('ui.eta3Days')}</p>
              <p className="font-medium text-navy-800">{translate('ui.updateEvery12Hours')}</p>
            </div>
            <div className="rounded-md bg-slate-50 p-3">
              <p className="text-xs text-slate-500">{translate('ui.within50NauticalMiles')}</p>
              <p className="font-medium text-navy-800">{translate('ui.updateEvery30Minutes')}</p>
            </div>
            <div className="rounded-md bg-slate-50 p-3">
              <p className="text-xs text-slate-500">{translate('ui.apiCallsTodaySimulated')}</p>
              <p className="font-medium text-navy-800">{apiCallsToday}</p>
            </div>
          </CardContent>
        </Card>

        {carriedContainers.length > 0 && (
          <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle>{translate('ui.containersAboard')}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {carriedContainers.map((c) => (
                <button key={c.id} onClick={() => navigate(`/containers/${c.id}`)} className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-navy-700 hover:bg-slate-50">
                  {c.number}
                </button>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

function Stat({ icon: Icon, label, value }: { icon: typeof Gauge; label: string; value: string }) {
  return (
    <div>
      <p className="flex items-center gap-1 text-xs text-slate-500"><Icon size={12} /> {label}</p>
      <p className="mt-0.5 text-sm font-semibold text-navy-900">{value}</p>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-navy-800">{value}</span>
    </div>
  )
}
