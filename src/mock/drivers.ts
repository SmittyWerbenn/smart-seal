// Seeded Driver Portal data. The first demo container (MSCU1234567) is left untouched
// so the existing RUN FULL DEMO walkthrough keeps working; driver assignments start at
// the second container.
import { CHECKPOINT_META, CHECKPOINT_SEQUENCE, containerPatchForCheckpoint, locationForCheckpoint } from '@/lib/driver-workflow'
import type {
  AppNotification,
  AuditLogEntry,
  CheckpointType,
  Container,
  Driver,
  DriverAssignment,
  DriverCheckpoint,
  ProofOfDelivery,
  RouteDefinition,
  Shipment,
  TimelineEvent,
  Vehicle,
} from '@/types'

export const DEMO_DRIVER_PASSWORD = 'driver123'

export const VEHICLES: Vehicle[] = [
  { id: 'VEH-001', plate: 'B 9123 XYZ', unitNumber: 'TRK-01', vehicleType: 'Truck Fuso', capacityTon: 10 },
  { id: 'VEH-002', plate: 'B 8841 KJD', unitNumber: 'TRK-02', vehicleType: 'Truck Hino', capacityTon: 16 },
  { id: 'VEH-003', plate: 'L 7720 AB', unitNumber: 'TRK-03', vehicleType: 'Truck Mitsubishi Canter', capacityTon: 5 },
  { id: 'VEH-004', plate: 'B 1456 TRS', unitNumber: 'TRK-04', vehicleType: 'Trailer Container 20ft', capacityTon: 24 },
  { id: 'VEH-005', plate: 'D 9031 PQ', unitNumber: 'TRK-05', vehicleType: 'Truck Isuzu Elf', capacityTon: 4 },
]

const DRIVER_ROSTER: { driverId: string; name: string; phone: string; vehicleId: string; status: Driver['status']; email: string }[] = [
  { driverId: 'DRV-001', name: 'Budi Santoso', phone: '081234567890', vehicleId: 'VEH-001', status: 'ON_DELIVERY', email: 'budi.santoso@smartseal.demo' },
  { driverId: 'DRV-002', name: 'Andi Wijaya', phone: '081298765432', vehicleId: 'VEH-002', status: 'ON_DELIVERY', email: 'andi.wijaya@smartseal.demo' },
  { driverId: 'DRV-003', name: 'Dedi Pratama', phone: '081355512340', vehicleId: 'VEH-003', status: 'AVAILABLE', email: 'dedi.pratama@smartseal.demo' },
  { driverId: 'DRV-004', name: 'Rizky Maulana', phone: '081377788901', vehicleId: 'VEH-004', status: 'OFFLINE', email: 'rizky.maulana@smartseal.demo' },
  { driverId: 'DRV-005', name: 'Agus Setiawan', phone: '081399966702', vehicleId: 'VEH-005', status: 'SUSPENDED', email: 'agus.setiawan@smartseal.demo' },
  // Demo driver for the DRIVER role (user-driver): has an active assignment so checkpoints work straight away.
  { driverId: 'DRV-006', name: 'Agus Prasetyo', phone: '081300000006', vehicleId: 'VEH-005', status: 'ON_DELIVERY', email: 'agus.prasetyo@smartseal.demo' },
]

export function driverUsernameFor(driverId: string): string {
  return `driver${driverId.slice(-2)}`
}

export function buildDemoDrivers(now = new Date()): Driver[] {
  const stamp = now.toISOString()
  return DRIVER_ROSTER.map((d) => ({
    id: d.driverId.toLowerCase(),
    driverId: d.driverId,
    name: d.name,
    username: driverUsernameFor(d.driverId),
    password: DEMO_DRIVER_PASSWORD,
    phone: d.phone,
    email: d.email,
    licenseNumber: `SIM-B${d.driverId.slice(-3)}-2024`,
    licenseExpiry: new Date(now.getFullYear() + 2, 5, 30).toISOString().slice(0, 10),
    emergencyContact: `Keluarga ${d.name.split(' ')[0]} — ${d.phone}`,
    vehicleId: d.vehicleId,
    status: d.status,
    createdAt: stamp,
    updatedAt: stamp,
  }))
}

interface SeedInput {
  containers: Container[]
  shipments: Shipment[]
  routes: RouteDefinition[]
  now?: Date
}

interface SeedPlan {
  driverIndex: number // index into DRIVER_ROSTER
  containerIndex: number // index into containers (never 0)
  stopAt: CheckpointType | 'COMPLETED' // last checkpoint reached (COMPLETED = delivered with POD)
}

// 8 assignments: 2 active (mid-journey), 6 completed with POD.
const PLAN: SeedPlan[] = [
  { driverIndex: 0, containerIndex: 1, stopAt: 'ARRIVED_ORIGIN_PORT' },
  { driverIndex: 1, containerIndex: 2, stopAt: 'IN_TRANSIT' },
  { driverIndex: 2, containerIndex: 3, stopAt: 'COMPLETED' },
  { driverIndex: 3, containerIndex: 4, stopAt: 'COMPLETED' },
  { driverIndex: 4, containerIndex: 5, stopAt: 'COMPLETED' },
  { driverIndex: 5, containerIndex: 11, stopAt: 'ASSIGNED' }, // Agus Prasetyo: SHP-0012 just assigned
  { driverIndex: 0, containerIndex: 6, stopAt: 'COMPLETED' },
  { driverIndex: 1, containerIndex: 7, stopAt: 'COMPLETED' },
  { driverIndex: 2, containerIndex: 8, stopAt: 'COMPLETED' },
]

/**
 * Builds the Driver Portal dataset from the already-generated containers/shipments.
 * Returns full replacement arrays for the driver slices plus the matching container,
 * shipment, timeline, audit and notification records. Used by the initial seed and by
 * the store migration, so both produce identical demo state.
 */
export function seedDriverPortal({ containers, shipments, routes, now = new Date() }: SeedInput) {
  const drivers = buildDemoDrivers(now)
  const vehicles = VEHICLES
  const driverAssignments: DriverAssignment[] = []
  const driverCheckpoints: DriverCheckpoint[] = []
  const proofOfDeliveries: ProofOfDelivery[] = []
  const notifications: AppNotification[] = []
  const auditLog: AuditLogEntry[] = []
  const timeline: TimelineEvent[] = []
  const nextContainers = containers.map((c) => ({ ...c }))
  const nextShipments = shipments.map((s) => ({ ...s }))
  let seq = 0

  PLAN.forEach((plan, idx) => {
    const driver = drivers[plan.driverIndex]
    const container = nextContainers[plan.containerIndex]
    const shipIdx = nextShipments.findIndex((s) => s.containerId === container.id)
    const shipment = nextShipments[shipIdx]
    const route = routes.find((r) => r.id === container.routeId)
    const assignmentId = `ASG-${String(idx + 1).padStart(3, '0')}`
    const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600_000).toISOString()

    const isCompleted = plan.stopAt === 'COMPLETED'
    const stopIndex = isCompleted ? CHECKPOINT_SEQUENCE.length - 1 : CHECKPOINT_SEQUENCE.indexOf(plan.stopAt as CheckpointType)
    const types = CHECKPOINT_SEQUENCE.slice(0, stopIndex + 1)
    const assignedAt = hoursAgo(isCompleted ? 96 - idx * 6 : 8)

    driverAssignments.push({
      id: assignmentId,
      shipmentId: shipment.id,
      containerId: container.id,
      driverId: driver.id,
      vehicleId: driver.vehicleId!,
      status: isCompleted ? 'COMPLETED' : 'ACTIVE',
      assignedAt,
      assignedBy: 'Supervisor',
      completedAt: isCompleted ? hoursAgo(12 + idx * 4) : undefined,
    })

    notifications.push({
      id: `NTF-DRV-${assignmentId}`,
      severity: 'INFO',
      title: 'New Shipment Assigned',
      message: `Shipment ${shipment.id} · Container ${container.number}. You have been assigned to this shipment.`,
      createdAt: assignedAt,
      read: isCompleted,
      driverId: driver.id,
      linkType: 'container',
      linkId: container.id,
    })

    types.forEach((type, i) => {
      const timestamp = isCompleted ? hoursAgo(96 - idx * 6 - i * 3) : hoursAgo(Math.max(0.5, 8 - i * 1.5))
      const location = locationForCheckpoint(type, container, route)
      driverCheckpoints.push({
        id: `CKP-${assignmentId}-${type}`,
        assignmentId,
        shipmentId: shipment.id,
        containerId: container.id,
        driverId: driver.id,
        type,
        location,
        timestamp,
      })
      if (type !== 'ASSIGNED') {
        timeline.push({
          id: `EVT-${assignmentId}-${type}`,
          containerId: container.id,
          type: 'DRIVER_CHECKPOINT',
          label: `Checkpoint: ${CHECKPOINT_META[type].label}`,
          description: `Driver ${driver.name} (${driver.driverId}) — ${location.name}`,
          actor: driver.name,
          timestamp,
          location: { lat: location.lat, lng: location.lng },
        })
        auditLog.push({
          id: `AUD-${assignmentId}-${type}`,
          timestamp,
          user: driver.name,
          action: 'CHECKPOINT_UPDATED',
          entity: shipment.id,
          description: `Checkpoint ${type} (${CHECKPOINT_META[type].label}) at ${location.name}`,
        })
      }
    })

    // Apply the final checkpoint to the container and shipment so the rest of the app agrees.
    const last = types[types.length - 1]
    const at = hoursAgo(isCompleted ? 12 + idx * 4 : 1)
    Object.assign(container, containerPatchForCheckpoint(last, container, route, at))
    nextShipments[shipIdx] = {
      ...shipment,
      status: container.status,
      driverId: isCompleted ? undefined : driver.id,
      vehicleId: isCompleted ? undefined : driver.vehicleId,
    }

    if (isCompleted) {
      seq += 1
      proofOfDeliveries.push({
        id: `POD-${String(seq).padStart(3, '0')}`,
        shipmentId: shipment.id,
        containerId: container.id,
        driverId: driver.id,
        receiverName: `Penerima ${shipment.consignee}`,
        receiverPhone: '0215550' + String(100 + idx),
        notes: 'Barang diterima lengkap, segel utuh.',
        cargoReceived: true,
        containerVerified: true,
        sealVerified: true,
        submittedAt: hoursAgo(12 + idx * 4),
      })
      auditLog.push({
        id: `AUD-POD-${assignmentId}`,
        timestamp: hoursAgo(12 + idx * 4),
        user: driver.name,
        action: 'POD_SUBMITTED',
        entity: shipment.id,
        description: `Proof of delivery submitted for ${container.number}`,
      })
    } else {
      notifications.push({
        id: `NTF-REM-${assignmentId}`,
        severity: 'INFO',
        title: 'Checkpoint Reminder',
        message: `Shipment ${shipment.id}. Please update your current checkpoint.`,
        createdAt: hoursAgo(1),
        read: false,
        driverId: driver.id,
        linkType: 'container',
        linkId: container.id,
      })
    }

    auditLog.push({
      id: `AUD-ASG-${assignmentId}`,
      timestamp: assignedAt,
      user: 'Supervisor',
      action: 'SHIPMENT_ASSIGNED',
      entity: shipment.id,
      description: `${shipment.id} assigned to ${driver.name} (${driver.driverId})`,
    })
  })

  return {
    drivers,
    vehicles,
    driverAssignments,
    driverCheckpoints,
    proofOfDeliveries,
    notifications,
    containers: nextContainers,
    shipments: nextShipments,
    timeline,
    auditLog,
  }
}

