import { useDataStore } from '@/store/dataStore'
import { delay } from './delay'
import { actorName, fail, ok, requirePermission, type ServiceResult } from './common'
import { findDriver } from './driverService'
import { locationForCheckpoint } from '@/lib/driver-workflow'
import type { Container, DriverAssignment, Shipment } from '@/types'
import { translate } from '@/i18n'

export function activeAssignmentForShipment(shipmentId: string): DriverAssignment | undefined {
  return useDataStore.getState().driverAssignments.find((a) => a.shipmentId === shipmentId && a.status === 'ACTIVE')
}

export function activeAssignmentForDriver(driverId: string): DriverAssignment | undefined {
  return useDataStore.getState().driverAssignments.find((a) => a.driverId === driverId && a.status === 'ACTIVE')
}

export function assignmentsForDriver(driverId: string): DriverAssignment[] {
  return useDataStore
    .getState()
    .driverAssignments.filter((a) => a.driverId === driverId)
    .sort((a, b) => b.assignedAt.localeCompare(a.assignedAt))
}

export const driverAssignmentService = {
  async getAssignmentsForDriver(driverId: string): Promise<DriverAssignment[]> {
    const driver = findDriver(driverId)
    return delay(driver ? assignmentsForDriver(driver.id) : [])
  },

  async getAssignment(id: string): Promise<DriverAssignment | undefined> {
    return delay(useDataStore.getState().driverAssignments.find((a) => a.id === id))
  },

  /**
   * Assigns a shipment to a driver with a vehicle. If the shipment already has an active
   * driver, that assignment is reassigned (marked REASSIGNED and the old driver released).
   */
  async assign(input: { driverId: string; vehicleId: string; shipmentId: string }): Promise<ServiceResult<DriverAssignment>> {
    const denied = requirePermission<DriverAssignment>('driver.assign')
    if (denied) return delay(denied)
    const store = useDataStore.getState()
    const driver = findDriver(input.driverId)
    if (!driver) return delay(fail<DriverAssignment>(translate('ui.driverNotFound2')))
    if (driver.status === 'SUSPENDED') return delay(fail<DriverAssignment>(translate('ui.driverIsSuspendedAndCannot')))
    if (driver.status === 'OFFLINE') return delay(fail<DriverAssignment>(translate('ui.driverIsOffline')))
    if (driver.status === 'ON_DELIVERY') return delay(fail<DriverAssignment>(translate('ui.driverAlreadyHasAnActive')))

    const vehicle = store.vehicles.find((v) => v.id === input.vehicleId)
    if (!vehicle) return delay(fail<DriverAssignment>(translate('ui.vehicleNotFound')))
    const vehicleBusy = store.driverAssignments.some((a) => a.status === 'ACTIVE' && a.vehicleId === vehicle.id)
    if (vehicleBusy) return delay(fail<DriverAssignment>(`Kendaraan ${vehicle.plate} sedang dipakai shipment lain.`))

    const shipment = store.shipments.find((s) => s.id === input.shipmentId)
    if (!shipment) return delay(fail<DriverAssignment>(translate('ui.shipmentNotFound')))
    if (shipment.status === 'DELIVERED') return delay(fail<DriverAssignment>(translate('ui.shipmentHasAlreadyBeenDelivered')))
    const container = store.containers.find((c) => c.id === shipment.containerId)
    if (!container) return delay(fail<DriverAssignment>(translate('ui.containerShipmentNotFound')))

    const now = new Date().toISOString()
    const actor = actorName()
    const previous = activeAssignmentForShipment(shipment.id)
    if (previous) {
      store.updateDriverAssignment(previous.id, { status: 'REASSIGNED', completedAt: now })
      const prevDriver = store.drivers.find((d) => d.id === previous.driverId)
      if (prevDriver) {
        store.updateDriver(prevDriver.id, { status: 'AVAILABLE' })
        store.addNotification({ driverId: prevDriver.id, severity: 'WARNING', title: 'Shipment Reassigned', message: `Shipment ${shipment.id} dialihkan ke driver lain.` })
      }
      store.addAuditLogEntry({ user: actor, action: 'SHIPMENT_REASSIGNED', entity: shipment.id, description: `${shipment.id} reassigned from ${prevDriver?.driverId ?? previous.driverId} to ${driver.driverId}` })
    }

    const assignment: DriverAssignment = {
      id: `ASG-${Date.now().toString(36)}`,
      shipmentId: shipment.id,
      containerId: container.id,
      driverId: driver.id,
      vehicleId: vehicle.id,
      status: 'ACTIVE',
      assignedAt: now,
      assignedBy: actor,
    }
    store.addDriverAssignment(assignment)
    store.addDriverCheckpoint({
      id: `CKP-${assignment.id}-ASSIGNED`,
      assignmentId: assignment.id,
      shipmentId: shipment.id,
      containerId: container.id,
      driverId: driver.id,
      type: 'ASSIGNED',
      location: locationForCheckpoint('ASSIGNED', container, store.routes.find((r) => r.id === container.routeId)),
      timestamp: now,
    })
    store.updateDriver(driver.id, { status: 'ON_DELIVERY' })
    store.updateShipment(shipment.id, { driverId: driver.id, vehicleId: vehicle.id } satisfies Partial<Shipment>)
    store.addAuditLogEntry({ user: actor, action: 'SHIPMENT_ASSIGNED', entity: shipment.id, description: `${shipment.id} assigned to ${driver.name} (${driver.driverId}) with ${vehicle.plate}` })
    store.addTimelineEvent({ containerId: container.id, type: 'DRIVER_ASSIGNED', label: `Assigned to ${driver.name}`, description: `${driver.driverId} · ${vehicle.plate}`, actor })
    store.addNotification({
      driverId: driver.id,
      severity: 'INFO',
      title: 'New Shipment Assigned',
      message: `Shipment ${shipment.id} · Container ${container.number}. You have been assigned to this shipment.`,
      linkType: 'container',
      linkId: container.id,
    })
    return delay(ok(assignment))
  },
}

export function containerForShipment(shipment: Shipment): Container | undefined {
  return useDataStore.getState().containers.find((c) => c.id === shipment.containerId)
}
