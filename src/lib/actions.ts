// Shared mutation helpers usable against ANY container (not just the simulation
// engine's single active/hero container). Used by Container Detail, Field App,
// and anywhere a direct device/container action is triggered outside the guided
// journey in simulationStore.
import { useDataStore } from '@/store/dataStore'

export function armContainer(containerId: string, actor = 'Warehouse Operator') {
  const container = useDataStore.getState().containers.find((c) => c.id === containerId)
  if (!container) return
  useDataStore.getState().updateContainer(containerId, { status: 'SEALED', isArmed: true })
  useDataStore.getState().addTimelineEvent({ containerId, type: 'CONTAINER_ARMED', label: 'Container armed & sealed', actor })
  useDataStore.getState().addAuditLogEntry({ user: actor, action: 'CONTAINER_ARMED', entity: container.number, description: `${container.number} armed and sealed` })
}

// After unlock, a Smart Seal's physical IoT device is detached and returned
// to the available pool (Reverse Logistics) for reuse on a future container.
// A Basic Seal has no device — it's a single-use tag, so unlock just flags
// the container/seal as unsealed; it can never be picked up again.
function releaseSealAfterUnlock(containerId: string, actor: string) {
  const container = useDataStore.getState().containers.find((c) => c.id === containerId)
  if (!container || container.securityMode === 'BASIC_SEAL' || !container.eSealId) return
  const device = useDataStore.getState().devices.find((d) => d.id === container.eSealId)
  if (!device) return
  useDataStore.getState().updateDevice(device.id, {
    containerId: null,
    lifecycle: 'IDLE_AT_DESTINATION',
    motion: 'NO_MOTION',
    daysIdle: 0,
    returnStatus: 'PENDING',
  })
  useDataStore.getState().addTimelineEvent({
    containerId,
    type: 'SEAL_DETACHED',
    label: `Smart Seal ${device.id} detached — available for reuse`,
    actor,
    sealId: device.id,
  })
  useDataStore.getState().addAuditLogEntry({
    user: actor,
    action: 'SEAL_DETACHED',
    entity: device.id,
    description: `${device.id} detached from ${container.number} and returned to the reuse pool (Reverse Logistics)`,
  })
}

export function requestAndConfirmUnlock(containerId: string, actor = 'Supervisor') {
  const container = useDataStore.getState().containers.find((c) => c.id === containerId)
  if (!container) return
  useDataStore.getState().updateContainer(containerId, { status: 'UNLOCKED', isUnlocked: true })
  useDataStore.getState().addTimelineEvent({ containerId, type: 'CONTAINER_UNLOCKED', label: 'Container unlocked', actor })
  useDataStore.getState().addAuditLogEntry({ user: actor, action: 'UNLOCK_APPROVED', entity: container.number, description: `Unlock approved for ${container.number}` })
  if (container.securityMode === 'BASIC_SEAL') {
    useDataStore.getState().addAuditLogEntry({
      user: actor,
      action: 'SEAL_FLAGGED_UNSEALED',
      entity: container.regularSealId ?? container.number,
      description: `Basic Seal ${container.regularSealId ?? ''} flagged as unsealed — single-use, cannot be reused`,
    })
  } else {
    releaseSealAfterUnlock(containerId, actor)
  }
}

export function offlineUnlock(containerId: string) {
  const container = useDataStore.getState().containers.find((c) => c.id === containerId)
  if (!container) return
  useDataStore.getState().updateContainer(containerId, { status: 'UNLOCKED', isUnlocked: true, offlineMode: true })
  useDataStore.getState().addTimelineEvent({ containerId, type: 'OFFLINE_UNLOCK', label: 'Offline unlock successful (PIN verified)', actor: 'Driver' })
  useDataStore.getState().addAuditLogEntry({ user: 'Driver', action: 'OFFLINE_UNLOCK', entity: container.number, description: `${container.number} unlocked offline via static PIN` })
  releaseSealAfterUnlock(containerId, 'Driver')
}

export function simulateTamper(containerId: string) {
  const container = useDataStore.getState().containers.find((c) => c.id === containerId)
  if (!container) return
  const device = useDataStore.getState().devices.find((d) => d.containerId === containerId)
  useDataStore.getState().updateContainer(containerId, {
    markerState: 'CRITICAL',
    riskLevel: 'CRITICAL',
    riskFactors: [{ label: 'Tamper detected', detail: 'Physical seal tamper signal received from device', weight: 60 }],
  })
  if (device) useDataStore.getState().updateDevice(device.id, { status: 'TAMPER' })
  useDataStore.getState().addAlert({
    category: 'TAMPER',
    severity: 'CRITICAL',
    containerId,
    deviceId: device?.id,
    location: container.currentLocation,
    message: `Tamper signal detected on ${device?.id ?? 'smart e-seal'}`,
  })
  useDataStore.getState().addTimelineEvent({ containerId, type: 'TAMPER_DETECTED', label: 'Tamper detected', actor: 'System' })
  useDataStore.getState().addNotification({ severity: 'CRITICAL', title: 'Tamper detected', message: `${container.number} reported a tamper event.`, linkType: 'container', linkId: containerId })
}

export function simulateOffline(containerId: string) {
  const device = useDataStore.getState().devices.find((d) => d.containerId === containerId)
  if (!device) return
  useDataStore.getState().updateDevice(device.id, { status: 'OFFLINE', signal: 0 })
  useDataStore.getState().updateContainer(containerId, { markerState: 'OFFLINE' })
  useDataStore.getState().addAlert({ category: 'DEVICE_OFFLINE', severity: 'WARNING', containerId, deviceId: device.id, message: `${device.id} stopped reporting a heartbeat` })
}

export function simulateLowBattery(containerId: string) {
  const device = useDataStore.getState().devices.find((d) => d.containerId === containerId)
  if (!device) return
  useDataStore.getState().updateDevice(device.id, { battery: 75, status: 'LOW_BATTERY' })
  useDataStore.getState().addAlert({ category: 'LOW_BATTERY', severity: 'WARNING', containerId, deviceId: device.id, message: `${device.id} battery dropped to 75%` })
}
