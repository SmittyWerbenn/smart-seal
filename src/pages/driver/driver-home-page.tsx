import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShieldAlert, Truck, WifiOff, ArrowRight } from 'lucide-react'
import { useDataStore } from '@/store/dataStore'
import { useCurrentDriver } from '@/hooks/useCurrentDriver'
import { DriverStatusBadge } from '@/components/driver/driver-status-badge'
import { ShipmentCard } from '@/components/driver/shipment-card'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/states'
import { completedCheckpointTypes } from '@/lib/driver-workflow'
import { sealStatusFor } from '@/services/checkpointService'
import { sealIdFor } from '@/lib/utils'
import { translate } from '@/i18n'

function greeting(date = new Date()) {
  const h = date.getHours()
  if (h < 11) return translate('msg.msg019')
  if (h < 15) return translate('msg.msg020')
  if (h < 19) return translate('msg.msg021')
  return translate('msg.msg022')
}

export default function DriverHomePage() {
  const driver = useCurrentDriver()
  const navigate = useNavigate()
  const assignments = useDataStore((s) => s.driverAssignments)
  const shipments = useDataStore((s) => s.shipments)
  const containers = useDataStore((s) => s.containers)
  const checkpoints = useDataStore((s) => s.driverCheckpoints)
  const vehicles = useDataStore((s) => s.vehicles)
  const notifications = useDataStore((s) => s.notifications)

  const active = useMemo(
    () => (driver ? assignments.filter((a) => a.driverId === driver.id && a.status === 'ACTIVE') : []),
    [assignments, driver],
  )
  const vehicle = vehicles.find((v) => v.id === (active[0]?.vehicleId ?? driver?.vehicleId))
  const unread = notifications.filter((n) => n.driverId === driver?.id && !n.read).length
  const tamperedContainer = active.map((a) => containers.find((c) => c.id === a.containerId)).find((c) => c && sealStatusFor(c).state === 'TAMPER')

  if (!driver) return null
  const online = driver.status !== 'OFFLINE' && driver.status !== 'SUSPENDED'

  return (
    <div className="space-y-4 p-4">
      <section className="rounded-xl bg-navy-900 p-4 text-white">
        <p className="text-sm text-slate-300">{greeting()}, {driver.name.split(' ')[0]}</p>
        <p className="font-mono text-xs text-slate-400">{driver.driverId}</p>
        <div className="mt-3 flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm font-semibold">
            <span className={online ? 'h-2.5 w-2.5 rounded-full bg-green-400' : 'h-2.5 w-2.5 rounded-full bg-slate-400'} />
            {online ? translate('misc.onlineShort') : driver.status === 'SUSPENDED' ? translate('misc.suspendedShort') : translate('ui.offline')}
          </span>
          <DriverStatusBadge status={driver.status} />
        </div>
        {unread > 0 && (
          <Link to="/driver/alerts" className="mt-3 flex items-center justify-between rounded-md bg-white/10 px-3 py-2 text-sm">
            {unread} notifikasi baru <ArrowRight size={14} />
          </Link>
        )}
      </section>

      {tamperedContainer && (
        <div className="flex gap-3 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-800">
          <ShieldAlert size={20} className="shrink-0" />
          <div>
            <p className="font-semibold">{translate('ui.securityAlert')}</p>
            <p>Tamper detected on {tamperedContainer.number}. Checkpoint cannot continue. Contact Control Tower.</p>
          </div>
        </div>
      )}
      {driver.status === 'OFFLINE' && (
        <div className="flex gap-3 rounded-lg bg-slate-100 p-4 text-sm text-slate-700">
          <WifiOff size={20} className="shrink-0" />
          <p>{translate('ui.youAreOfflineCheckpointsAre')}</p>
        </div>
      )}

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{translate('ui.vehicleInformation')}</p>
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-md bg-brand-50 text-brand-700"><Truck size={20} /></span>
          <div>
            <p className="font-mono text-base font-semibold text-navy-900">{vehicle?.plate ?? 'Belum ada kendaraan'}</p>
            <p className="text-sm text-slate-500">
              {vehicle ? translate('misc.vehicleCapacityLine', { type: vehicle.vehicleType, ton: vehicle.capacityTon, unit: vehicle.unitNumber }) : translate('misc.askAdminForVehicle')}
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-navy-900">{translate('ui.activeShipments')}</h2>
          <Link to="/driver/shipments" className="text-xs font-medium text-brand-600">{translate('ui.all')}</Link>
        </div>
        {active.length === 0 ? (
          <EmptyState title={translate('ui.noActiveShipmentsYet')} description={translate('ui.anAdminWillAssignA')} />
        ) : (
          active.map((a) => {
            const shipment = shipments.find((s) => s.id === a.shipmentId)
            const container = containers.find((c) => c.id === a.containerId)
            if (!shipment) return null
            return (
              <ShipmentCard
                key={a.id}
                shipment={shipment}
                container={container}
                sealId={container ? sealIdFor(container) : null}
                completed={completedCheckpointTypes(checkpoints, a.id)}
                active
                showCheckpointAction={false}
              />
            )
          })
        )}
        {active.length > 0 && (
          <Button size="lg" className="min-h-14 w-full text-base" onClick={() => navigate(`/driver/shipments/${active[0].shipmentId}?checkpoint=1`)}>
            {translate('ui.updateCheckpoint')}
          </Button>
        )}
      </section>
    </div>
  )
}
