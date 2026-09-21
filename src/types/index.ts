// ---------------------------------------------------------------------------
// Smart Seal & Container Tracking
// Core domain types shared across mock services, state stores and UI.
// ---------------------------------------------------------------------------

export type Role =
  | 'SUPER_ADMIN'
  | 'CONTROL_TOWER'
  | 'WAREHOUSE'
  | 'DRIVER'
  | 'SUPERVISOR'
  | 'CLIENT'
  | 'AUDITOR'

export interface DemoUser {
  id: string
  name: string
  email: string
  role: Role
  clientId?: string // for CLIENT role, restricts visible cargo
  avatarColor: string
}

export type ContainerStatus =
  | 'CREATED'
  | 'STUFFING'
  | 'SEALED'
  | 'IN_TRANSIT_ORIGIN'
  | 'GATE_IN_ORIGIN'
  | 'AT_ORIGIN_PORT'
  | 'LOADED_ON_BOARD'
  | 'OCEAN_TRANSIT'
  | 'ARRIVED_DESTINATION_PORT'
  | 'IN_TRANSIT_DESTINATION'
  | 'AT_DESTINATION'
  | 'UNLOCKED'
  | 'DELIVERED'

export type TrackingMode = 'IOT_GPS' | 'AIS' | 'NONE'

// SINGLE_SEAL / DUAL_SEAL use a Smart E-Seal (IoT, live GPS trackable).
// BASIC_SEAL has no electronics: it cannot be live-tracked, only scanned
// on-site to look up the container's manifest.
export type SecurityMode = 'SINGLE_SEAL' | 'DUAL_SEAL' | 'BASIC_SEAL'

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export type MarkerState = 'NORMAL' | 'WARNING' | 'CRITICAL' | 'OFFLINE' | 'DELIVERED'

export interface GeoPoint {
  lat: number
  lng: number
}

export interface TrackingPoint extends GeoPoint {
  timestamp: string
  speedKmh: number
  heading: number
  source: TrackingMode
}

export interface RiskFactor {
  label: string
  detail: string
  weight: number
}

export interface Container {
  id: string
  number: string // e.g. MSCU1234567
  isoType: string
  originCity: string
  originPort: string
  destinationCity: string
  destinationPort: string
  status: ContainerStatus
  trackingMode: TrackingMode
  securityMode: SecurityMode
  eSealId: string | null
  boltSealId: string | null
  regularSealId: string | null
  currentLocation: GeoPoint
  routeId: string
  routeProgress: number // 0..1 along route
  eta: string
  riskLevel: RiskLevel
  riskFactors: RiskFactor[]
  markerState: MarkerState
  lastUpdate: string
  offlineMode: boolean
  isArmed: boolean
  isUnlocked: boolean
  insideDestinationGeofence: boolean
  vesselId?: string
  shipmentId: string
}

export type DeviceLifecycle =
  | 'IN_WAREHOUSE'
  | 'IN_TRANSIT'
  | 'IDLE_AT_DESTINATION'
  | 'MAINTENANCE'
  | 'BROKEN'

export type DeviceStatus = 'ONLINE' | 'OFFLINE' | 'DEEP_SLEEP' | 'TAMPER' | 'LOW_BATTERY'

export type MotionState = 'MOTION_DETECTED' | 'NO_MOTION' | 'DEEP_SLEEP'

export interface HistoryPoint {
  timestamp: string
  value: number
}

export interface ESealDevice {
  id: string // ESEAL-000001
  barcode: string // printed 13-digit barcode scanned on-site, distinct from the device ID
  serialNumber: string
  firmware: string
  containerId: string | null
  battery: number
  temperature: number
  signal: number // 0..100
  status: DeviceStatus
  motion: MotionState
  lifecycle: DeviceLifecycle
  location: GeoPoint
  lastSeen: string
  batteryHistory: HistoryPoint[]
  signalHistory: HistoryPoint[]
  temperatureHistory: HistoryPoint[]
  daysIdle: number
  returnStatus: 'PENDING' | 'IN_PROGRESS' | 'RETURNED' | 'NOT_APPLICABLE'
}

export interface CargoLine {
  id: string
  containerId: string
  sealId: string | null
  clientId: string
  clientName: string
  doNumber: string
  productName: string
  category: string
  sku: string
  quantity: number
  unit: string
  address: string
}

export interface Shipment {
  id: string
  containerId: string
  bookingNumber: string
  shipper: string
  consignee: string
  originCity: string
  destinationCity: string
  status: ContainerStatus
  createdAt: string
}

export type VesselType = 'Container Ship' | 'RoRo' | 'Bulk Carrier' | 'Feeder'

export interface Vessel {
  id: string
  name: string
  vesselType: VesselType
  operator: string
  voyageNumber: string
  capacityTeu: number
  imo: string
  mmsi: string
  position: GeoPoint
  speedKn: number
  heading: number
  originPort: string
  destinationPort: string
  eta: string
  routeId: string
  routeProgress: number
  lastAisUpdate: string
  status: 'UNDERWAY' | 'MOORED' | 'ARRIVED'
  containerIds: string[]
}

export type AlertCategory =
  | 'TAMPER'
  | 'LOW_BATTERY'
  | 'DEVICE_OFFLINE'
  | 'GEOFENCE_VIOLATION'
  | 'SEAL_MISMATCH'
  | 'AIS_DELAY'
  | 'DEVICE_MALFUNCTION'
  | 'UNAUTHORIZED_UNLOCK'
  | 'ROUTE_DEVIATION'

export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL'
export type AlertStatus = 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED'

export interface AlertItem {
  id: string
  category: AlertCategory
  severity: AlertSeverity
  status: AlertStatus
  containerId?: string
  deviceId?: string
  vesselId?: string
  location?: GeoPoint
  message: string
  createdAt: string
  acknowledgedAt?: string
  resolvedAt?: string
}

export type GeofenceType = 'PORT' | 'WAREHOUSE' | 'CUSTOMS' | 'CITY'

export interface Geofence {
  id: string
  name: string
  type: GeofenceType
  center: GeoPoint
  radiusMeters: number
  status: 'ACTIVE' | 'INACTIVE'
}

export interface TimelineEvent {
  id: string
  containerId: string
  type: string
  label: string
  description?: string
  actor: string
  timestamp: string
  location?: GeoPoint
}

export interface AuditLogEntry {
  id: string
  timestamp: string
  user: string
  action: string
  entity: string
  description: string
}

export interface AppNotification {
  id: string
  severity: AlertSeverity
  title: string
  message: string
  createdAt: string
  read: boolean
  linkType?: 'container' | 'device' | 'alert' | 'vessel'
  linkId?: string
}

export interface RouteDefinition {
  id: string
  name: string
  waypoints: GeoPoint[]
  originLabel: string
  destinationLabel: string
  corridorRadiusMeters: number
}

export interface Port {
  id: string
  name: string
  city: string
  country: string
  position: GeoPoint
}

// A Basic Seal that's been provisioned (barcode generated, printed) but not
// yet attached to a container — sits in the Seal Devices registry as "In
// Stock" until a warehouse operator scans it during stuffing.
export interface BasicSealStockItem {
  id: string
  barcode: string
  createdAt: string
}
