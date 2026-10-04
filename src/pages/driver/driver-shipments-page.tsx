import { useMemo } from 'react'
import { useDataStore } from '@/store/dataStore'
import { useCurrentDriver } from '@/hooks/useCurrentDriver'
import { ShipmentCard } from '@/components/driver/shipment-card'
import { EmptyState } from '@/components/shared/states'
import { completedCheckpointTypes } from '@/lib/driver-workflow'
import { sealIdFor } from '@/lib/utils'
import { translate } from '@/i18n'

export default function DriverShipmentsPage() {
  const driver = useCurrentDriver()
  const assignments = useDataStore((s) => s.driverAssignments)
  const shipments = useDataStore((s) => s.shipments)
  const containers = useDataStore((s) => s.containers)
  const checkpoints = useDataStore((s) => s.driverCheckpoints)

  // Data visibility: only this driver's assignments, active first, then history.
  const mine = useMemo(
    () =>
      assignments
        .filter((a) => a.driverId === driver?.id)
        .sort((a, b) => (a.status === 'ACTIVE' ? -1 : 0) - (b.status === 'ACTIVE' ? -1 : 0) || b.assignedAt.localeCompare(a.assignedAt)),
    [assignments, driver],
  )

  return (
    <div className="space-y-4 p-4">
      <div>
        <h1 className="text-lg font-semibold text-navy-900">{translate('ui.myShipments')}</h1>
        <p className="text-sm text-slate-500">{mine.filter((a) => a.status === 'ACTIVE').length} aktif · {mine.length} total</p>
      </div>
      {mine.length === 0 ? (
        <EmptyState title={translate('ui.noShipmentsYet')} description={translate('ui.shipmentsAssignedToYouWill')} />
      ) : (
        mine.map((a) => {
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
              active={a.status === 'ACTIVE'}
            />
          )
        })
      )}
    </div>
  )
}
