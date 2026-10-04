import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Container as ContainerIcon, Package } from 'lucide-react'
import type { LatLngExpression } from 'leaflet'
import { useDataStore } from '@/store/dataStore'
import { useCurrentDriver } from '@/hooks/useCurrentDriver'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs } from '@/components/ui/tabs'
import { ContainerStatusBadge } from '@/components/shared/status-badge'
import { CategoryBadge } from '@/components/shared/category-badge'
import { EmptyState } from '@/components/shared/states'
import { TrackingMap } from '@/components/map/tracking-map'
import { JourneySteps } from '@/components/driver/journey-steps'
import { CheckpointWizard } from '@/components/driver/checkpoint-wizard'
import { SealVerificationPanel } from '@/components/driver/seal-verification-panel'
import { CHECKPOINT_META, completedCheckpointTypes, nextCheckpoint, requiresSealVerification } from '@/lib/driver-workflow'
import { sealStatusFor } from '@/services/checkpointService'
import { formatDateTime, formatDate, sealIdFor } from '@/lib/utils'
import { DriverStatusBadge } from '@/components/driver/driver-status-badge'
import { translate } from '@/i18n'

const TABS = [
  { key: 'overview', get label() { return translate('ui.overview') } },
  { key: 'journey', get label() { return translate('ui.journey') } },
  { key: 'tracking', get label() { return translate('ui.tracking') } },
  { key: 'cargo', get label() { return translate('ui.cargo') } },
  { key: 'seal', get label() { return translate('ui.seal') } },
  { key: 'events', get label() { return translate('ui.events') } },
]

export default function DriverShipmentDetailPage() {
  const { id = '' } = useParams()
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const driver = useCurrentDriver()
  const [tab, setTab] = useState('overview')
  // "Update Checkpoint" from Home/Shipment cards arrives with ?checkpoint=1 and opens the wizard.
  const [wizardOpen, setWizardOpen] = useState(() => params.get('checkpoint') === '1')

  const shipment = useDataStore((s) => s.shipments.find((x) => x.id === id))
  const assignments = useDataStore((s) => s.driverAssignments)
  const containers = useDataStore((s) => s.containers)
  const routes = useDataStore((s) => s.routes)
  const geofences = useDataStore((s) => s.geofences)
  const cargo = useDataStore((s) => s.cargo)
  const checkpoints = useDataStore((s) => s.driverCheckpoints)
  const pods = useDataStore((s) => s.proofOfDeliveries)
  const vehicles = useDataStore((s) => s.vehicles)

  // Data visibility: a driver only sees shipments assigned to them (checked again in services).
  const assignment = useMemo(
    () =>
      assignments
        .filter((a) => a.shipmentId === id && a.driverId === driver?.id)
        .sort((a, b) => (a.status === 'ACTIVE' ? -1 : 1) - (b.status === 'ACTIVE' ? -1 : 1))[0],
    [assignments, id, driver],
  )
  const container = containers.find((c) => c.id === shipment?.containerId)
  const route = routes.find((r) => r.id === container?.routeId)

  const completed = useMemo(() => (assignment ? completedCheckpointTypes(checkpoints, assignment.id) : []), [checkpoints, assignment])
  const next = nextCheckpoint(completed)
  const isActive = assignment?.status === 'ACTIVE' && !!next

  // Clear the one-shot query flag so a refresh does not reopen the wizard.
  useEffect(() => {
    if (params.get('checkpoint') === '1') setParams({}, { replace: true })
  }, [params, setParams])

  if (!shipment || !assignment || !container) {
    return (
      <div className="p-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/driver/shipments')}>
          <ArrowLeft size={14} /> {translate('ui.back2')}
        </Button>
        <EmptyState icon={Package} title={translate('ui.shipmentUnavailable')} description={translate('ui.thisShipmentIsNotAssigned')} />
      </div>
    )
  }

  const vehicle = vehicles.find((v) => v.id === assignment.vehicleId)
  const seal = sealStatusFor(container)
  const cargoLines = cargo.filter((c) => c.containerId === container.id)
  const pod = pods.find((p) => p.shipmentId === shipment.id)
  const sealLabel = sealIdFor(container)
  const portFences = geofences.filter((g) => g.type === 'PORT' && (g.name.includes(shipment.originCity) || g.name.includes(shipment.destinationCity)))
  const waypoints: LatLngExpression[] = (route?.waypoints ?? []).map((p) => [p.lat, p.lng])
  const sortedEvents = checkpoints.filter((c) => c.assignmentId === assignment.id).sort((a, b) => a.timestamp.localeCompare(b.timestamp))

  return (
    <div className="space-y-4 p-4 pb-40">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate('/driver/shipments')}>
          <ArrowLeft size={14} /> {translate('ui.shipment')}
        </Button>
        <DriverStatusBadge status={driver?.status ?? 'AVAILABLE'} />
      </div>

      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">{shipment.id}</p>
        <h1 className="font-mono text-lg font-semibold text-navy-900">{container.number}</h1>
        <p className="text-sm text-slate-500">{shipment.originCity} → {shipment.destinationCity}</p>
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === 'overview' && (
        <Card>
          <CardContent className="grid grid-cols-2 gap-4 py-4 text-sm">
            <Info label={translate('ui.shipmentId')} value={shipment.id} mono />
            <Info label={translate('ui.container')} value={container.number} mono />
            <Info label={translate('ui.seal')} value={sealLabel ?? '—'} mono />
            <Info label={translate('ui.status')} value={<ContainerStatusBadge status={container.status} />} />
            <Info label={translate('ui.origin')} value={shipment.originCity} />
            <Info label={translate('ui.destination')} value={shipment.destinationCity} />
            <Info label={translate('ui.customer')} value={shipment.consignee} />
            <Info label={translate('ui.eta')} value={formatDateTime(container.eta)} />
            <Info label={translate('ui.driver')} value={`${driver?.name} (${driver?.driverId})`} />
            <Info label={translate('ui.truck')} value={vehicle ? `${vehicle.plate} · ${vehicle.vehicleType}` : '—'} />
            <Info label={translate('ui.assignment')} value={assignment.status} />
            <Info label={translate('ui.progress')} value={`${completed.length}/10 checkpoint`} />
          </CardContent>
        </Card>
      )}

      {tab === 'journey' && (
        <Card>
          <CardContent className="py-4">
            <JourneySteps completed={completed} />
          </CardContent>
        </Card>
      )}

      {tab === 'tracking' && (
        <div className="space-y-2">
          <TrackingMap containers={[container]} geofences={portFences} routeWaypoints={waypoints} selectedContainerId={container.id} height="300px" />
          <p className="text-xs text-slate-500">
            Posisi simulasi: {container.currentLocation.lat.toFixed(3)}, {container.currentLocation.lng.toFixed(3)} · Port & geofence tujuan ditampilkan sebagai referensi.
          </p>
        </div>
      )}

      {tab === 'cargo' && (
        <Card>
          <CardContent className="space-y-3 py-4">
            {cargoLines.length === 0 ? (
              <EmptyState icon={ContainerIcon} title={translate('ui.noCargoYet')} />
            ) : (
              cargoLines.map((c) => (
                <div key={c.id} className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-navy-900">{c.productName}</p>
                    <p className="text-xs text-slate-500">DO {c.doNumber} · {c.quantity} {c.unit} · {c.clientName}</p>
                  </div>
                  <CategoryBadge categoryId={c.categoryId} />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {tab === 'seal' && (
        <SealVerificationPanel status={seal} verified={pod?.sealVerified ?? false} readOnly />
      )}

      {tab === 'events' && (
        <Card>
          <CardContent className="space-y-3 py-4">
            {sortedEvents.map((e) => (
              <div key={e.id} className="border-l-2 border-brand-300 pl-3">
                <p className="text-sm font-medium text-navy-900">{CHECKPOINT_META[e.type].label}</p>
                <p className="text-xs text-slate-500">{formatDateTime(e.timestamp)} · {e.location.name}{e.positionSource === 'GPS' ? ` · ${translate('misc.gpsBadge')}` : ''}</p>
                {e.notes && <p className="text-xs text-slate-600">{e.notes}</p>}
              </div>
            ))}
            {pod && (
              <div className="rounded-md bg-green-50 p-3 text-sm text-green-800">
                {translate('ui.proofOfDeliveryReceivedBy')} <span className="font-semibold">{pod.receiverName}</span> · {formatDateTime(pod.submittedAt)}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {assignment.status === 'COMPLETED' && (
        <p className="rounded-md bg-slate-100 p-3 text-sm text-slate-600">Shipment ini sudah selesai{pod ? ` · POD ${formatDate(pod.submittedAt)}` : ''}.</p>
      )}

      {isActive && next && (
        <div className="fixed bottom-16 left-0 right-0 border-t border-slate-200 bg-white p-3">
          <div className="mx-auto max-w-lg">
            <Button size="lg" className="min-h-14 w-full text-base" onClick={() => setWizardOpen(true)}>
              {next === 'DELIVERED' ? translate('misc.completeDeliveryCta') : translate('misc.updateCheckpointCta')}
            </Button>
            <p className="mt-1 text-center text-[11px] text-slate-500">
              Berikutnya: {CHECKPOINT_META[next].label}
              {requiresSealVerification(next) ? ' · perlu verifikasi segel' : ''}
            </p>
          </div>
        </div>
      )}

      {isActive && (
        <CheckpointWizard open={wizardOpen} onClose={() => setWizardOpen(false)} assignment={assignment} receiverHint={shipment.consignee} />
      )}
    </div>
  )
}

function Info({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className={mono ? 'font-mono text-navy-900' : 'text-navy-900'}>{value}</p>
    </div>
  )
}
