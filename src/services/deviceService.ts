import { useDataStore } from '@/store/dataStore'
import { delay } from './delay'

export const deviceService = {
  async getDevices() {
    return delay(useDataStore.getState().devices)
  },
  async getDevice(id: string) {
    return delay(useDataStore.getState().devices.find((d) => d.id === id))
  },
}

export const vesselService = {
  async getVessels() {
    return delay(useDataStore.getState().vessels)
  },
  async getVessel(id: string) {
    return delay(useDataStore.getState().vessels.find((v) => v.id === id))
  },
}

export const alertService = {
  async getAlerts() {
    return delay(useDataStore.getState().alerts)
  },
}

export const geofenceService = {
  async getGeofences() {
    return delay(useDataStore.getState().geofences)
  },
}

export const auditService = {
  async getAuditLog() {
    return delay(useDataStore.getState().auditLog)
  },
}

export const trackingService = {
  async getTrackingHistory(containerId: string) {
    const container = useDataStore.getState().containers.find((c) => c.id === containerId)
    if (!container) return delay([])
    const route = useDataStore.getState().routes.find((r) => r.id === container.routeId)
    if (!route) return delay([])
    const steps = 12
    const points = Array.from({ length: steps + 1 }, (_, i) => {
      const t = (i / steps) * container.routeProgress
      return t
    })
    return delay(points)
  },
}
