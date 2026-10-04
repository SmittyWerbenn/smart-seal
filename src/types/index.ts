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
  driverId?: string // for DRIVER role, links the login to a Driver record (DRV-001)
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
  categoryId: string | null // FK -> ItemCategory.id; null = uncategorized
  sku: string
  quantity: number
  unit: string
  address: string
}

export interface ItemCategory {
  id: string
  name: string
  color: string // hex, e.g. #dc2626 — single source of truth for every category badge
  active: boolean
}

// Photo documentation of the Seal / Unlock process (and issue reports).
export type DocPhotoType = 'SEAL_BEFORE' | 'SEAL_AFTER' | 'UNLOCK_BEFORE' | 'UNLOCK_AFTER' | 'ISSUE'

export interface ContainerPhoto {
  id: string
  containerId: string // every photo belongs to exactly one container
  type: DocPhotoType
  dataUrl: string // compressed JPEG data URL (browser-local storage)
  takenAt: string
  takenBy: string
  issueId?: string // set only for ISSUE photos -> IssueReport.id
}

export type IssueContext = 'SEAL' | 'UNLOCK' | 'GENERAL'

export interface IssueReport {
  id: string
  containerId: string
  context: IssueContext
  note: string
  createdAt: string
  createdBy: string
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
  driverId?: string // Driver.id of the active assignment (cleared when delivered or unassigned)
  vehicleId?: string
  exceptionApproved?: boolean // supervisor override for a blocked checkpoint (e.g. tamper)
  driverRemark?: 'ON_TIME' | 'DELAYED' | 'ISSUE' // latest status the driver reported for this shipment
  driverNote?: string
  driverUpdatedAt?: string
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
  // Set on seal attach/detach events so a Smart Seal's full lifecycle can be
  // traced across every container it's been reused on, not just the current one.
  sealId?: string
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
  driverId?: string // set = private to that driver's portal; unset = shown to staff in the topbar bell
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
// yet attached to a container — sits in the Seal Inventory registry as "In
// Stock" until a warehouse operator scans it during stuffing.
export interface BasicSealStockItem {
  id: string
  barcode: string
  createdAt: string
}

// ---------------------------------------------------------------------------
// Driver Portal & Driver Management
// ---------------------------------------------------------------------------

export type DriverStatus = 'AVAILABLE' | 'ON_DELIVERY' | 'OFFLINE' | 'SUSPENDED'

export interface Vehicle {
  id: string
  plate: string // e.g. B 9123 XYZ
  unitNumber: string
  vehicleType: string // e.g. Truck Fuso
  capacityTon: number
}

export interface Driver {
  id: string // internal key
  driverId: string // DRV-001
  name: string
  username: string // driver01
  password: string // prototype only — plain text, never a production pattern
  phone: string
  email?: string
  licenseNumber?: string
  licenseExpiry?: string
  emergencyContact?: string
  vehicleId?: string
  status: DriverStatus
  createdAt: string
  updatedAt: string
}

export type CheckpointType =
  | 'ASSIGNED'
  | 'PICKUP'
  | 'DEPARTED_ORIGIN'
  | 'ARRIVED_ORIGIN_PORT'
  | 'LOADED_VESSEL'
  | 'IN_TRANSIT'
  | 'ARRIVED_DESTINATION_PORT'
  | 'DEPARTED_DESTINATION_PORT'
  | 'ARRIVED_DESTINATION'
  | 'DELIVERED'

export interface DriverAssignment {
  id: string
  shipmentId: string
  containerId: string
  driverId: string // Driver.id
  vehicleId: string
  status: 'ACTIVE' | 'COMPLETED' | 'REASSIGNED'
  assignedAt: string
  assignedBy: string
  completedAt?: string
}

export interface DriverCheckpoint {
  id: string
  assignmentId: string
  shipmentId: string
  containerId: string
  driverId: string // Driver.id
  type: CheckpointType
  location: { lat: number; lng: number; name: string }
  positionSource?: 'GPS' | 'SIMULATED' // GPS = device position at confirmation; SIMULATED = route waypoint fallback
  accuracyM?: number // GPS accuracy radius in metres (GPS only)
  timestamp: string
  notes?: string
}

export interface ProofOfDelivery {
  id: string
  shipmentId: string
  containerId: string
  driverId: string // Driver.id
  receiverName: string
  receiverPhone?: string
  notes?: string
  cargoReceived: boolean
  containerVerified: boolean
  sealVerified: boolean
  signature?: string // data URL from the signature pad
  photoName?: string
  photoDataUrl?: string
  submittedAt: string
}
