import { create } from 'zustand'
import { useDataStore } from './dataStore'
import { pointOnRoute, progressAtWaypointIndex } from '@/mock/geo'
import type { ContainerStatus } from '@/types'

type ArrivalAction = 'GATE_IN' | 'ARRIVE_DEST_PORT' | 'AT_DESTINATION' | null

export interface FullDemoStep {
  key: string
  label: string
  done: boolean
}

const FULL_DEMO_STEPS: Omit<FullDemoStep, 'done'>[] = [
  { key: 'created', label: 'Container created' },
  { key: 'cargo', label: 'Cargo loaded' },
  { key: 'seal', label: 'Seal attached' },
  { key: 'armed', label: 'Container armed' },
  { key: 'moving', label: 'Truck starts moving' },
  { key: 'origin-port', label: 'Origin port reached' },
  { key: 'gate-in', label: 'Gate-in completed' },
  { key: 'loaded', label: 'Loaded on vessel' },
  { key: 'ais-handoff', label: 'AIS handoff completed' },
  { key: 'ocean', label: 'Vessel moves across ocean' },
  { key: 'dest-port', label: 'Destination port reached' },
  { key: 'iot-handoff', label: 'IoT GPS handoff completed' },
  { key: 'dest-geofence', label: 'Destination geofence entered' },
  { key: 'unlock-enabled', label: 'Unlock enabled' },
  { key: 'unlocked', label: 'Container unlocked' },
  { key: 'delivered', label: 'Delivered & device returned' },
]

interface SimulationState {
  activeContainerId: string
  isPlaying: boolean
  speed: 1 | 5 | 20
  movementTarget: number | null
  arrivalAction: ArrivalAction
  offlineModeEnabled: boolean
  fullDemoRunning: boolean
  fullDemoSteps: FullDemoStep[]

  setActiveContainer: (id: string) => void
  setSpeed: (speed: 1 | 5 | 20) => void
  pause: () => void
  tick: (deltaMs: number) => void

  startJourney: () => void
  moveToOriginPort: () => void
  loadOnVessel: () => void
  startOceanTransit: () => void
  arriveDestinationPort: () => void
  startDestinationDelivery: () => void
  enterDestinationGeofence: () => void
  enableUnlock: () => void
  requestAndConfirmUnlock: () => void
  completeDelivery: () => void

  simulateTamper: () => void
  simulateLowBattery: () => void
  simulateOffline: () => void
  simulateDeviceReturn: () => void
  toggleOfflineMode: () => void

  resetDemo: () => void
  runFullDemo: () => Promise<void>
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function activeContainer() {
  const { containers } = useDataStore.getState()
  return containers.find((c) => c.id === useSimulationStore.getState().activeContainerId)
}

function activeRoute() {
  const container = activeContainer()
  const { routes } = useDataStore.getState()
  return routes.find((r) => r.id === container?.routeId)
}

function activeDevice() {
  const container = activeContainer()
  const { devices } = useDataStore.getState()
  return devices.find((d) => d.containerId === container?.id)
}

function pushNotification(severity: 'INFO' | 'WARNING' | 'CRITICAL', title: string, message: string, linkId?: string) {
  useDataStore.getState().addNotification({
    severity,
    title,
    message,
    linkType: 'container',
    linkId,
  })
}

export const useSimulationStore = create<SimulationState>()((set, get) => ({
  activeContainerId: 'CNT-0001',
  isPlaying: false,
  speed: 5,
  movementTarget: null,
  arrivalAction: null,
  offlineModeEnabled: false,
  fullDemoRunning: false,
  fullDemoSteps: FULL_DEMO_STEPS.map((s) => ({ ...s, done: false })),

  setActiveContainer: (id) => set({ activeContainerId: id, isPlaying: false, movementTarget: null, arrivalAction: null }),
  setSpeed: (speed) => set({ speed }),
  pause: () => set({ isPlaying: false }),

  tick: (deltaMs) => {
    const state = get()
    if (!state.isPlaying || state.movementTarget === null) return
    const container = activeContainer()
    const route = activeRoute()
    if (!container || !route) return

    const ratePerSecond = 0.012 * state.speed
    const direction = state.movementTarget >= container.routeProgress ? 1 : -1
    let nextProgress = container.routeProgress + direction * ratePerSecond * (deltaMs / 1000)
    const reached =
      (direction > 0 && nextProgress >= state.movementTarget) || (direction < 0 && nextProgress <= state.movementTarget)
    if (reached) nextProgress = state.movementTarget

    const { point, heading } = pointOnRoute(route.waypoints, nextProgress)
    useDataStore.getState().updateContainer(container.id, {
      routeProgress: nextProgress,
      currentLocation: point,
      lastUpdate: new Date().toISOString(),
    })
    if (container.vesselId && container.trackingMode === 'AIS') {
      useDataStore.getState().updateVessel(container.vesselId, {
        routeProgress: nextProgress,
        position: point,
        heading,
        lastAisUpdate: new Date().toISOString(),
      })
    }

    if (reached) {
      const action = state.arrivalAction
      set({ isPlaying: false, movementTarget: null, arrivalAction: null })
      if (action === 'GATE_IN') get().moveToOriginPort()
      else if (action === 'ARRIVE_DEST_PORT') get().arriveDestinationPort()
      else if (action === 'AT_DESTINATION') get().enterDestinationGeofence()
    }
  },

  startJourney: () => {
    const container = activeContainer()
    const route = activeRoute()
    if (!container || !route) return
    const target = progressAtWaypointIndex(route.waypoints, 1)
    useDataStore.getState().updateContainer(container.id, { status: 'IN_TRANSIT_ORIGIN' as ContainerStatus })
    useDataStore.getState().addTimelineEvent({
      containerId: container.id,
      type: 'GATE_OUT_WAREHOUSE',
      label: 'Departed warehouse',
      actor: 'Driver',
    })
    set({ isPlaying: true, movementTarget: target, arrivalAction: 'GATE_IN' })
  },

  moveToOriginPort: () => {
    const container = activeContainer()
    const route = activeRoute()
    if (!container || !route) return
    const target = progressAtWaypointIndex(route.waypoints, 1)
    const { point } = pointOnRoute(route.waypoints, target)
    useDataStore.getState().updateContainer(container.id, {
      status: 'AT_ORIGIN_PORT',
      routeProgress: target,
      currentLocation: point,
    })
    useDataStore.getState().addTimelineEvent({
      containerId: container.id,
      type: 'GEOFENCE_ENTERED',
      label: `Entered ${container.originPort}`,
      actor: 'System',
    })
    useDataStore.getState().addAuditLogEntry({
      user: 'System',
      action: 'GEOFENCE_ENTERED',
      entity: container.number,
      description: `${container.number} entered ${container.originPort}`,
    })
    set({ isPlaying: false, movementTarget: null, arrivalAction: null })
  },

  loadOnVessel: () => {
    const container = activeContainer()
    if (!container) return
    const { vessels } = useDataStore.getState()
    const vessel = vessels.find((v) => v.routeId === container.routeId) ?? vessels[0]
    useDataStore.getState().updateContainer(container.id, {
      status: 'LOADED_ON_BOARD',
      trackingMode: 'AIS',
      vesselId: vessel?.id,
    })
    useDataStore.getState().addTimelineEvent({
      containerId: container.id,
      type: 'LOADED_ON_BOARD',
      label: 'Loaded on vessel',
      actor: 'Control Tower',
    })
    useDataStore.getState().addTimelineEvent({
      containerId: container.id,
      type: 'AIS_HANDOFF',
      label: 'Tracking handoff to AIS',
      actor: 'System',
    })
    useDataStore.getState().addAuditLogEntry({
      user: 'System',
      action: 'AIS_HANDOFF',
      entity: container.number,
      description: `${container.number} tracking handed off to AIS`,
    })
    pushNotification('INFO', 'Tracking handoff completed', 'Container tracking is now using vessel AIS.', container.id)
  },

  startOceanTransit: () => {
    const container = activeContainer()
    const route = activeRoute()
    if (!container || !route) return
    const target = progressAtWaypointIndex(route.waypoints, route.waypoints.length - 2)
    useDataStore.getState().updateContainer(container.id, { status: 'OCEAN_TRANSIT' })
    set({ isPlaying: true, movementTarget: target, arrivalAction: 'ARRIVE_DEST_PORT' })
  },

  arriveDestinationPort: () => {
    const container = activeContainer()
    const route = activeRoute()
    if (!container || !route) return
    const target = progressAtWaypointIndex(route.waypoints, route.waypoints.length - 2)
    const { point } = pointOnRoute(route.waypoints, target)
    useDataStore.getState().updateContainer(container.id, {
      status: 'ARRIVED_DESTINATION_PORT',
      trackingMode: 'IOT_GPS',
      routeProgress: target,
      currentLocation: point,
    })
    useDataStore.getState().addTimelineEvent({
      containerId: container.id,
      type: 'ARRIVED_PORT',
      label: `Arrived ${container.destinationPort}`,
      actor: 'System',
    })
    useDataStore.getState().addTimelineEvent({
      containerId: container.id,
      type: 'IOT_HANDOFF',
      label: 'Tracking handoff to IoT GPS',
      actor: 'System',
    })
    pushNotification('INFO', 'Tracking handoff completed', 'Container tracking has switched back to IoT GPS.', container.id)
    set({ isPlaying: false, movementTarget: null, arrivalAction: null })
  },

  startDestinationDelivery: () => {
    const container = activeContainer()
    const route = activeRoute()
    if (!container || !route) return
    const target = progressAtWaypointIndex(route.waypoints, route.waypoints.length - 1)
    useDataStore.getState().updateContainer(container.id, { status: 'IN_TRANSIT_DESTINATION' })
    set({ isPlaying: true, movementTarget: target, arrivalAction: 'AT_DESTINATION' })
  },

  enterDestinationGeofence: () => {
    const container = activeContainer()
    const route = activeRoute()
    if (!container || !route) return
    const target = progressAtWaypointIndex(route.waypoints, route.waypoints.length - 1)
    const { point } = pointOnRoute(route.waypoints, target)
    useDataStore.getState().updateContainer(container.id, {
      status: 'AT_DESTINATION',
      insideDestinationGeofence: true,
      routeProgress: target,
      currentLocation: point,
    })
    useDataStore.getState().addTimelineEvent({
      containerId: container.id,
      type: 'DESTINATION_GEOFENCE',
      label: `Entered ${container.destinationCity} geofence`,
      actor: 'System',
    })
    set({ isPlaying: false, movementTarget: null, arrivalAction: null })
  },

  enableUnlock: () => {
    const container = activeContainer()
    if (!container) return
    useDataStore.getState().updateContainer(container.id, { insideDestinationGeofence: true })
  },

  requestAndConfirmUnlock: () => {
    const container = activeContainer()
    if (!container) return
    useDataStore.getState().updateContainer(container.id, { status: 'UNLOCKED', isUnlocked: true })
    useDataStore.getState().addTimelineEvent({
      containerId: container.id,
      type: 'CONTAINER_UNLOCKED',
      label: 'Container unlocked',
      actor: 'Supervisor',
    })
    useDataStore.getState().addAuditLogEntry({
      user: 'Supervisor',
      action: 'UNLOCK_APPROVED',
      entity: container.number,
      description: `Unlock approved for ${container.number}`,
    })
  },

  completeDelivery: () => {
    const container = activeContainer()
    if (!container) return
    if (!container.isUnlocked) get().requestAndConfirmUnlock()
    useDataStore.getState().updateContainer(container.id, { status: 'DELIVERED' })
    useDataStore.getState().addTimelineEvent({
      containerId: container.id,
      type: 'DELIVERED',
      label: 'Delivered to consignee',
      actor: 'System',
    })
    get().simulateDeviceReturn()
  },

  simulateTamper: () => {
    const container = activeContainer()
    const device = activeDevice()
    if (!container) return
    useDataStore.getState().updateContainer(container.id, {
      markerState: 'CRITICAL',
      riskLevel: 'CRITICAL',
      riskFactors: [
        { label: 'Tamper detected', detail: 'Physical seal tamper signal received from device', weight: 60 },
      ],
    })
    if (device) useDataStore.getState().updateDevice(device.id, { status: 'TAMPER' })
    useDataStore.getState().addAlert({
      category: 'TAMPER',
      severity: 'CRITICAL',
      containerId: container.id,
      deviceId: device?.id,
      location: container.currentLocation,
      message: `Tamper signal detected on ${device?.id ?? 'smart e-seal'}`,
    })
    useDataStore.getState().addTimelineEvent({
      containerId: container.id,
      type: 'TAMPER_DETECTED',
      label: 'Tamper detected',
      actor: 'System',
    })
    pushNotification('CRITICAL', 'Tamper detected', `${container.number} reported a tamper event.`, container.id)
  },

  simulateLowBattery: () => {
    const device = activeDevice()
    const container = activeContainer()
    if (!device || !container) return
    useDataStore.getState().updateDevice(device.id, { battery: 75, status: 'LOW_BATTERY' })
    useDataStore.getState().addAlert({
      category: 'LOW_BATTERY',
      severity: 'WARNING',
      containerId: container.id,
      deviceId: device.id,
      message: `${device.id} battery dropped to 75%`,
    })
    pushNotification('WARNING', 'Low battery', `${device.id} battery is now at 75%.`, container.id)
  },

  simulateOffline: () => {
    const device = activeDevice()
    const container = activeContainer()
    if (!device || !container) return
    useDataStore.getState().updateDevice(device.id, { status: 'OFFLINE', signal: 0 })
    useDataStore.getState().updateContainer(container.id, { markerState: 'OFFLINE' })
    useDataStore.getState().addAlert({
      category: 'DEVICE_OFFLINE',
      severity: 'WARNING',
      containerId: container.id,
      deviceId: device.id,
      message: `${device.id} stopped reporting a heartbeat`,
    })
    pushNotification('WARNING', 'Device offline', `${device.id} has gone offline.`, container.id)
  },

  simulateDeviceReturn: () => {
    const device = activeDevice()
    if (!device) return
    useDataStore.getState().updateDevice(device.id, {
      lifecycle: 'IDLE_AT_DESTINATION',
      returnStatus: 'IN_PROGRESS',
      containerId: null,
    })
    useDataStore.getState().addAuditLogEntry({
      user: 'Warehouse Operator',
      action: 'DEVICE_RETURNED',
      entity: device.id,
      description: `${device.id} returned from destination warehouse`,
    })
  },

  toggleOfflineMode: () => set((s) => ({ offlineModeEnabled: !s.offlineModeEnabled })),

  resetDemo: () => {
    const container = activeContainer()
    if (!container) return
    useDataStore.getState().updateContainer(container.id, {
      status: 'SEALED',
      trackingMode: 'IOT_GPS',
      routeProgress: 0,
      isUnlocked: false,
      insideDestinationGeofence: false,
      markerState: 'NORMAL',
      riskLevel: 'LOW',
      riskFactors: [],
    })
    set({ isPlaying: false, movementTarget: null, arrivalAction: null, fullDemoSteps: FULL_DEMO_STEPS.map((s) => ({ ...s, done: false })) })
  },

  runFullDemo: async () => {
    if (get().fullDemoRunning) return
    set({ fullDemoRunning: true, fullDemoSteps: FULL_DEMO_STEPS.map((s) => ({ ...s, done: false })) })
    const markDone = (key: string) =>
      set((s) => ({ fullDemoSteps: s.fullDemoSteps.map((st) => (st.key === key ? { ...st, done: true } : st)) }))
    const waitForArrival = async () => {
      while (get().movementTarget !== null) await wait(150)
    }

    get().resetDemo()
    await wait(400)
    markDone('created')
    await wait(300)
    markDone('cargo')

    const container = activeContainer()
    if (container) {
      useDataStore.getState().updateContainer(container.id, { status: 'SEALED', isArmed: true })
      useDataStore.getState().addTimelineEvent({ containerId: container.id, type: 'SEAL_ATTACHED', label: 'Smart e-seal attached', actor: 'Warehouse Operator' })
    }
    await wait(300)
    markDone('seal')
    await wait(300)
    markDone('armed')

    set({ speed: 20 })
    get().startJourney()
    await wait(200)
    markDone('moving')
    await waitForArrival()
    markDone('origin-port')
    markDone('gate-in')
    await wait(300)

    get().loadOnVessel()
    markDone('loaded')
    await wait(300)
    markDone('ais-handoff')

    get().startOceanTransit()
    markDone('ocean')
    await waitForArrival()
    markDone('dest-port')
    await wait(200)
    markDone('iot-handoff')
    await wait(300)

    get().startDestinationDelivery()
    await waitForArrival()
    markDone('dest-geofence')
    await wait(200)
    get().enableUnlock()
    markDone('unlock-enabled')
    await wait(400)

    get().requestAndConfirmUnlock()
    markDone('unlocked')
    await wait(400)

    get().completeDelivery()
    markDone('delivered')

    set({ fullDemoRunning: false })
  },
}))
