import { useDataStore } from '@/store/dataStore'
import { useAuthStore } from '@/store/authStore'
import { delay } from './delay'
import { actorName, fail, ok, requirePermission, type ServiceResult } from './common'
import { findDriver } from './driverService'
import { activeAssignmentForShipment } from './driverAssignmentService'
import { validatePod, type PodInput } from './proofOfDeliveryService'
import {
  CHECKPOINT_META,
  completedCheckpointTypes,
  containerPatchForCheckpoint,
  locationForCheckpoint,
  nextCheckpoint,
  requiresSealVerification,
} from '@/lib/driver-workflow'
import type { CheckpointType, DriverAssignment, DriverCheckpoint, ESealDevice, Container } from '@/types'
import { translate } from '@/i18n'

export type SealState = 'SECURE' | 'LOW_BATTERY' | 'TAMPER' | 'OFFLINE' | 'MANUAL'

export interface SealStatus {
  kind: 'SMART' | 'BASIC' | 'NONE'
  sealId: string | null
  state: SealState
  device?: ESealDevice
  message: string
}

export interface ConfirmCheckpointInput {
  assignmentId: string
  type: CheckpointType
  notes?: string
  sealVerified?: boolean // driver ran the seal verification step in the wizard
  pod?: PodInput // required for DELIVERED
  gps?: { lat: number; lng: number; accuracyM: number } // device position at confirmation; omitted = simulated
}

const LOW_BATTERY_THRESHOLD = 20
const STAFF_NOTIFY: CheckpointType[] = ['ARRIVED_ORIGIN_PORT', 'ARRIVED_DESTINATION_PORT', 'ARRIVED_DESTINATION', 'DELIVERED']

export function sealStatusFor(container: Container): SealStatus {
  const device = container.eSealId ? useDataStore.getState().devices.find((d) => d.id === container.eSealId) : undefined
  if (device) {
    if (device.status === 'TAMPER') return { kind: 'SMART', sealId: device.id, state: 'TAMPER', device, message: 'Tamper terdeteksi pada segel.' }
    if (device.status === 'OFFLINE') return { kind: 'SMART', sealId: device.id, state: 'OFFLINE', device, message: 'Device offline. Posisi terakhir diketahui; verifikasi online dibatasi.' }
    if (device.battery < LOW_BATTERY_THRESHOLD) return { kind: 'SMART', sealId: device.id, state: 'LOW_BATTERY', device, message: `Baterai segel ${device.battery}%. Laporkan ke Control Tower.` }
    return { kind: 'SMART', sealId: device.id, state: 'SECURE', device, message: 'Segel aman, tidak ada tamper.' }
  }
  if (container.regularSealId) {
    return { kind: 'BASIC', sealId: container.regularSealId, state: 'MANUAL', message: 'Basic Seal: verifikasi manual diperlukan (cocokkan nomor segel dengan fisik).' }
  }
  return { kind: 'NONE', sealId: null, state: 'MANUAL', message: 'Tidak ada segel terpasang pada container ini.' }
}

function assignmentOwnedByCurrentUser(assignment: DriverAssignment): string | null {
  const user = useAuthStore.getState().currentUser
  if (user?.role === 'DRIVER' && user.driverId !== assignment.driverId) return translate('msg.msg015')
  return null
}

export const checkpointService = {
  async getSealStatus(containerId: string): Promise<SealStatus | undefined> {
    const container = useDataStore.getState().containers.find((c) => c.id === containerId)
    return delay(container ? sealStatusFor(container) : undefined)
  },

  async getCheckpoints(assignmentId: string): Promise<DriverCheckpoint[]> {
    return delay(
      useDataStore
        .getState()
        .driverCheckpoints.filter((c) => c.assignmentId === assignmentId)
        .sort((a, b) => a.timestamp.localeCompare(b.timestamp)),
    )
  },

  /** Confirms the next checkpoint in sequence and writes every side effect in one place. */
  async confirmCheckpoint(input: ConfirmCheckpointInput): Promise<ServiceResult> {
    const denied = requirePermission('driver.checkpoint')
    if (denied) return delay(denied)
    const store = useDataStore.getState()
    const assignment = store.driverAssignments.find((a) => a.id === input.assignmentId)
    if (!assignment) return delay(fail(translate('ui.assignmentNotFound')))
    const notOwner = assignmentOwnedByCurrentUser(assignment)
    if (notOwner) return delay(fail(notOwner))
    if (assignment.status !== 'ACTIVE') return delay(fail(translate('ui.thisAssignmentIsNoLonger')))

    const driver = findDriver(assignment.driverId)
    if (!driver) return delay(fail(translate('ui.driverNotFound2')))
    if (driver.status === 'SUSPENDED') return delay(fail(translate('ui.accountSuspendedCheckpointCannotBe')))
    if (driver.status === 'OFFLINE') return delay(fail(translate('ui.youAreOfflineSetYour')))

    const shipment = store.shipments.find((s) => s.id === assignment.shipmentId)
    const container = store.containers.find((c) => c.id === assignment.containerId)
    if (!shipment || !container) return delay(fail(translate('ui.shipmentOrContainerDataIs')))

    const completed = completedCheckpointTypes(store.driverCheckpoints, assignment.id)
    const expected = nextCheckpoint(completed)
    if (!expected) return delay(fail(translate('ui.allCheckpointsAreAlreadyCompleted')))
    if (input.type !== expected) {
      return delay(fail(`Checkpoint harus berurutan. Berikutnya: ${CHECKPOINT_META[expected].label}.`))
    }

    const seal = sealStatusFor(container)
    if (seal.state === 'TAMPER' && !shipment.exceptionApproved) {
      return delay(fail(translate('ui.tamperDetectedTheCheckpointCannot')))
    }
    if (requiresSealVerification(input.type)) {
      if (!input.sealVerified) return delay(fail(translate('ui.sealVerificationIsRequiredBefore')))
      if (seal.state === 'OFFLINE' && input.type === 'ARRIVED_DESTINATION') {
        return delay(fail(translate('ui.deviceOfflineOnlineVerificationIs')))
      }
    }
    if (input.type === 'DELIVERED') {
      if (!input.pod) return delay(fail(translate('ui.proofOfDeliveryIsRequired')))
      const podError = validatePod(input.pod)
      if (podError) return delay(fail(podError))
    }

    const now = new Date().toISOString()
    const route = store.routes.find((r) => r.id === container.routeId)
    const simulated = locationForCheckpoint(input.type, container, route)
    // Device GPS wins when the driver allowed it; the simulated point keeps its name for the timeline.
    const location = input.gps ? { lat: input.gps.lat, lng: input.gps.lng, name: simulated.name } : simulated
    const label = CHECKPOINT_META[input.type].label
    const actor = driver.name

    store.addDriverCheckpoint({
      id: `CKP-${assignment.id}-${input.type}`,
      assignmentId: assignment.id,
      shipmentId: shipment.id,
      containerId: container.id,
      driverId: driver.id,
      type: input.type,
      location,
      positionSource: input.gps ? 'GPS' : 'SIMULATED',
      accuracyM: input.gps?.accuracyM,
      timestamp: now,
      notes: input.notes?.trim() || undefined,
    })
    store.updateContainer(container.id, { ...containerPatchForCheckpoint(input.type, container, route, now, input.gps ? { lat: input.gps.lat, lng: input.gps.lng } : undefined) })
    store.updateShipment(shipment.id, { status: CHECKPOINT_META[input.type].containerStatus })
    store.addTimelineEvent({
      containerId: container.id,
      type: 'DRIVER_CHECKPOINT',
      label: `Checkpoint: ${label}`,
      description: `Driver ${driver.name} (${driver.driverId}) — ${location.name}${input.notes ? ` · ${input.notes.trim()}` : ''}`,
      actor,
      location: { lat: location.lat, lng: location.lng },
    })
    store.addAuditLogEntry({ user: actor, action: 'CHECKPOINT_UPDATED', entity: shipment.id, description: `Checkpoint ${input.type} (${label}) at ${location.name}` })

    if (STAFF_NOTIFY.includes(input.type)) {
      store.addNotification({
        severity: 'INFO',
        title: 'Driver checkpoint',
        message: `Driver ${driver.name} reported ${label.toLowerCase()} for ${container.number}.`,
        linkType: 'container',
        linkId: container.id,
      })
    }

    if (input.type === 'DELIVERED' && input.pod) {
      store.addProofOfDelivery({
        id: `POD-${Date.now().toString(36)}`,
        shipmentId: shipment.id,
        containerId: container.id,
        driverId: driver.id,
        ...input.pod,
        receiverName: input.pod.receiverName.trim(),
        receiverPhone: input.pod.receiverPhone?.trim() || undefined,
        notes: input.pod.notes?.trim() || undefined,
        submittedAt: now,
      })
      store.updateDriverAssignment(assignment.id, { status: 'COMPLETED', completedAt: now })
      store.updateDriver(driver.id, { status: 'AVAILABLE' })
      store.updateShipment(shipment.id, { driverId: undefined, vehicleId: undefined })
      store.addAuditLogEntry({ user: actor, action: 'POD_SUBMITTED', entity: shipment.id, description: `POD submitted — received by ${input.pod.receiverName.trim()}` })
      store.addAuditLogEntry({ user: actor, action: 'DELIVERY_COMPLETED', entity: shipment.id, description: `${container.number} delivered` })
      store.addNotification({ driverId: driver.id, severity: 'INFO', title: 'Delivery Completed', message: `Shipment ${shipment.id} selesai. Terima kasih.`, linkType: 'container', linkId: container.id })
    }

    return delay(ok())
  },

  /** Supervisor-only override for a blocked checkpoint (e.g. tamper). */
  async approveException(shipmentId: string): Promise<ServiceResult> {
    const denied = requirePermission('driver.approve_exception')
    if (denied) return delay(denied)
    const shipment = useDataStore.getState().shipments.find((s) => s.id === shipmentId)
    if (!shipment) return delay(fail(translate('ui.shipmentNotFound')))
    if (!activeAssignmentForShipment(shipmentId)) return delay(fail(translate('ui.shipmentHasNoActiveAssignment')))
    useDataStore.getState().updateShipment(shipmentId, { exceptionApproved: true })
    useDataStore.getState().addAuditLogEntry({ user: actorName(), action: 'EXCEPTION_APPROVED', entity: shipmentId, description: `Supervisor approved checkpoint exception for ${shipmentId}` })
    return delay(ok())
  },
}
