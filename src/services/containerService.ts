import { useDataStore } from '@/store/dataStore'
import { delay } from './delay'
import type { Container } from '@/types'

export const containerService = {
  async getContainers(): Promise<Container[]> {
    return delay(useDataStore.getState().containers)
  },
  async getContainer(id: string): Promise<Container | undefined> {
    return delay(useDataStore.getState().containers.find((c) => c.id === id || c.number === id))
  },
  async getCargoForContainer(containerId: string) {
    return delay(useDataStore.getState().cargo.filter((c) => c.containerId === containerId))
  },
  async getTimelineForContainer(containerId: string) {
    return delay(
      useDataStore
        .getState()
        .timeline.filter((e) => e.containerId === containerId)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),
    )
  },
  async getShipmentForContainer(containerId: string) {
    return delay(useDataStore.getState().shipments.find((s) => s.containerId === containerId))
  },
}
