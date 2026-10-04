// Derived driver facts for lists and detail pages. Pure functions over store arrays.
import type { Driver, DriverAssignment, DriverCheckpoint, Shipment } from '@/types'
import { CHECKPOINT_META } from './driver-workflow'

export interface DriverSnapshot {
  currentAssignment?: DriverAssignment
  currentShipment?: Shipment
  lastCheckpoint?: DriverCheckpoint
  locationName: string
  completedCount: number
}

export function driverSnapshot(driver: Driver, assignments: DriverAssignment[], checkpoints: DriverCheckpoint[], shipments: Shipment[]): DriverSnapshot {
  const mine = assignments.filter((a) => a.driverId === driver.id)
  const currentAssignment = mine.find((a) => a.status === 'ACTIVE')
  const currentShipment = currentAssignment ? shipments.find((s) => s.id === currentAssignment.shipmentId) : undefined
  const lastCheckpoint = checkpoints
    .filter((c) => c.driverId === driver.id)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0]
  return {
    currentAssignment,
    currentShipment,
    lastCheckpoint,
    locationName: lastCheckpoint ? lastCheckpoint.location.name : '—',
    completedCount: mine.filter((a) => a.status === 'COMPLETED').length,
  }
}

export function checkpointLabel(type: DriverCheckpoint['type']): string {
  return CHECKPOINT_META[type].label
}
