// Pure driver-checkpoint rules shared by the mock seed, the stores and the UI.
// No store imports here, so this file can be used from anywhere without cycles.
import { WAREHOUSES, portForCity, pointOnRoute } from '@/mock/geo'
import type { CheckpointType, Container, ContainerStatus, DriverCheckpoint, GeoPoint, RouteDefinition } from '@/types'
import { translate } from '@/i18n'

/** Strict journey order. A driver can only confirm the next checkpoint in this list. */
export const CHECKPOINT_SEQUENCE: CheckpointType[] = [
  'ASSIGNED',
  'PICKUP',
  'DEPARTED_ORIGIN',
  'ARRIVED_ORIGIN_PORT',
  'LOADED_VESSEL',
  'IN_TRANSIT',
  'ARRIVED_DESTINATION_PORT',
  'DEPARTED_DESTINATION_PORT',
  'ARRIVED_DESTINATION',
  'DELIVERED',
]

export const CHECKPOINT_META: Record<CheckpointType, { label: string; containerStatus: ContainerStatus; progress: number }> = {
  ASSIGNED: { get label() { return translate('ui.assigned') }, containerStatus: 'STUFFING', progress: 0 },
  PICKUP: { get label() { return translate('ui.pickup') }, containerStatus: 'IN_TRANSIT_ORIGIN', progress: 0.02 },
  DEPARTED_ORIGIN: { get label() { return translate('ui.departedOrigin') }, containerStatus: 'IN_TRANSIT_ORIGIN', progress: 0.08 },
  ARRIVED_ORIGIN_PORT: { get label() { return translate('ui.arrivedOriginPort') }, containerStatus: 'AT_ORIGIN_PORT', progress: 0.2 },
  LOADED_VESSEL: { get label() { return translate('ui.loadedVessel') }, containerStatus: 'LOADED_ON_BOARD', progress: 0.3 },
  IN_TRANSIT: { get label() { return translate('ui.inTransit') }, containerStatus: 'OCEAN_TRANSIT', progress: 0.55 },
  ARRIVED_DESTINATION_PORT: { get label() { return translate('ui.arrivedDestinationPort') }, containerStatus: 'ARRIVED_DESTINATION_PORT', progress: 0.8 },
  DEPARTED_DESTINATION_PORT: { get label() { return translate('ui.departedDestinationPort') }, containerStatus: 'IN_TRANSIT_DESTINATION', progress: 0.85 },
  ARRIVED_DESTINATION: { get label() { return translate('ui.arrivedDestination') }, containerStatus: 'AT_DESTINATION', progress: 0.95 },
  DELIVERED: { get label() { return translate('ui.delivered') }, containerStatus: 'DELIVERED', progress: 1 },
}

/** Checkpoints that must pass a seal verification before the driver can confirm them. */
export function requiresSealVerification(type: CheckpointType): boolean {
  return type === 'ARRIVED_DESTINATION' || type === 'DELIVERED'
}

/** The single checkpoint the driver may confirm next, or null when the journey is complete. */
export function nextCheckpoint(completed: CheckpointType[]): CheckpointType | null {
  return CHECKPOINT_SEQUENCE.find((t) => !completed.includes(t)) ?? null
}

export function completedCheckpointTypes(checkpoints: DriverCheckpoint[], assignmentId: string): CheckpointType[] {
  return checkpoints.filter((c) => c.assignmentId === assignmentId).map((c) => c.type)
}

/** Simulated location for a checkpoint (no real GPS in this prototype). */
export function locationForCheckpoint(type: CheckpointType, container: Container, route: RouteDefinition | undefined): { lat: number; lng: number; name: string } {
  const originWarehouse = WAREHOUSES[`Warehouse ${container.originCity}`]
  const destWarehouse = WAREHOUSES[`Warehouse ${container.destinationCity}`]
  const originPort = portForCity(container.originCity)
  const destPort = portForCity(container.destinationCity)
  const waypoints = route?.waypoints ?? []
  const first = waypoints[0] ?? container.currentLocation
  const last = waypoints[waypoints.length - 1] ?? container.currentLocation

  const at = (p: GeoPoint, name: string) => ({ lat: p.lat, lng: p.lng, name })

  switch (type) {
    case 'ASSIGNED':
    case 'PICKUP':
    case 'DEPARTED_ORIGIN':
      return at(originWarehouse ?? first, `Warehouse ${container.originCity}`)
    case 'ARRIVED_ORIGIN_PORT':
    case 'LOADED_VESSEL':
      return at(originPort.position, originPort.name)
    case 'IN_TRANSIT':
      return at(waypoints.length ? pointOnRoute(waypoints, 0.5).point : originPort.position, 'At Sea')
    case 'ARRIVED_DESTINATION_PORT':
    case 'DEPARTED_DESTINATION_PORT':
      return at(destPort.position, destPort.name)
    case 'ARRIVED_DESTINATION':
    case 'DELIVERED':
      return at(destWarehouse ?? last, `Warehouse ${container.destinationCity}`)
  }
}

/** Container fields a checkpoint writes (status, progress, position, marker). */
export function containerPatchForCheckpoint(
  type: CheckpointType,
  container: Container,
  route: RouteDefinition | undefined,
  at: string,
  position?: { lat: number; lng: number }, // device GPS fix when available; otherwise the simulated route point
): Partial<Container> {
  const loc = position ?? locationForCheckpoint(type, container, route)
  const delivered = type === 'DELIVERED'
  return {
    status: CHECKPOINT_META[type].containerStatus,
    routeProgress: CHECKPOINT_META[type].progress,
    currentLocation: { lat: loc.lat, lng: loc.lng },
    insideDestinationGeofence: type === 'ARRIVED_DESTINATION' || delivered,
    markerState: delivered ? 'DELIVERED' : 'NORMAL',
    lastUpdate: at,
  }
}
