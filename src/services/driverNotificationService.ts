import { useDataStore } from '@/store/dataStore'
import { delay } from './delay'
import { findDriver } from './driverService'
import type { AppNotification } from '@/types'

/** Notifications addressed to one driver (staff topbar bell ignores these). */
export function notificationsForDriver(driverId: string): AppNotification[] {
  return useDataStore
    .getState()
    .notifications.filter((n) => n.driverId === driverId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export const driverNotificationService = {
  async getForDriver(idOrDriverId: string): Promise<AppNotification[]> {
    const driver = findDriver(idOrDriverId)
    return delay(driver ? notificationsForDriver(driver.id) : [])
  },
  async markRead(id: string): Promise<void> {
    useDataStore.getState().markNotificationRead(id)
    return delay(undefined)
  },
  async markAllRead(idOrDriverId: string): Promise<void> {
    const driver = findDriver(idOrDriverId)
    if (driver) {
      useDataStore.setState((s) => ({
        notifications: s.notifications.map((n) => (n.driverId === driver.id ? { ...n, read: true } : n)),
      }))
    }
    return delay(undefined)
  },
}
