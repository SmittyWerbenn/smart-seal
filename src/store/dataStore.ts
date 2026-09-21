import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { buildInitialDataset } from '@/mock'
import { pointOnRoute } from '@/mock/geo'
import type {
  AlertItem,
  AlertStatus,
  AppNotification,
  AuditLogEntry,
  CargoLine,
  Container,
  ESealDevice,
  Geofence,
  Port,
  RouteDefinition,
  Shipment,
  TimelineEvent,
  Vessel,
} from '@/types'

let idCounter = 1
function nextId(prefix: string) {
  idCounter += 1
  return `${prefix}-${Date.now().toString(36)}${idCounter}`
}

interface DataState {
  containers: Container[]
  devices: ESealDevice[]
  vessels: Vessel[]
  alerts: AlertItem[]
  geofences: Geofence[]
  cargo: CargoLine[]
  shipments: Shipment[]
  timeline: TimelineEvent[]
  auditLog: AuditLogEntry[]
  notifications: AppNotification[]
  routes: RouteDefinition[]
  ports: Port[]
  warehouses: Record<string, { lat: number; lng: number }>
  hydrated: boolean

  updateContainer: (id: string, patch: Partial<Container>) => void
  updateDevice: (id: string, patch: Partial<ESealDevice>) => void
  updateVessel: (id: string, patch: Partial<Vessel>) => void
  driftVessels: (deltaMs: number, excludeIds: string[]) => void
  addCargoLine: (line: Omit<CargoLine, 'id'>) => void
  updateCargoLine: (id: string, patch: Partial<CargoLine>) => void
  removeCargoLine: (id: string) => void
  addAlert: (alert: Omit<AlertItem, 'id' | 'createdAt' | 'status'> & Partial<Pick<AlertItem, 'status'>>) => AlertItem
  setAlertStatus: (id: string, status: AlertStatus) => void
  addTimelineEvent: (event: Omit<TimelineEvent, 'id' | 'timestamp'> & { timestamp?: string }) => void
  addAuditLogEntry: (entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) => void
  addNotification: (n: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => void
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void
  resetAll: () => void
}

function seedState() {
  const data = buildInitialDataset()
  return {
    ...data,
    notifications: [] as AppNotification[],
    hydrated: true,
  }
}

export const useDataStore = create<DataState>()(
  persist(
    (set) => ({
      ...seedState(),

      updateContainer: (id, patch) =>
        set((state) => ({
          containers: state.containers.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        })),

      updateDevice: (id, patch) =>
        set((state) => ({
          devices: state.devices.map((d) => (d.id === id ? { ...d, ...patch } : d)),
        })),

      updateVessel: (id, patch) =>
        set((state) => ({
          vessels: state.vessels.map((v) => (v.id === id ? { ...v, ...patch } : v)),
        })),

      // Ambient sea traffic: every underway vessel not currently driving the
      // guided simulation slowly advances along its route so the map/Vessels
      // pages feel like a live shipping network instead of static pins.
      driftVessels: (deltaMs, excludeIds) =>
        set((state) => ({
          vessels: state.vessels.map((v) => {
            if (v.status !== 'UNDERWAY' || excludeIds.includes(v.id)) return v
            const route = state.routes.find((r) => r.id === v.routeId)
            if (!route) return v
            const ratePerSecond = v.speedKn / 9000
            let nextProgress = v.routeProgress + ratePerSecond * (deltaMs / 1000)
            if (nextProgress >= 1) nextProgress = 0
            const { point, heading } = pointOnRoute(route.waypoints, nextProgress)
            return { ...v, routeProgress: nextProgress, position: point, heading, lastAisUpdate: new Date().toISOString() }
          }),
        })),

      addCargoLine: (line) => set((state) => ({ cargo: [...state.cargo, { id: nextId('CRG'), ...line }] })),

      updateCargoLine: (id, patch) =>
        set((state) => ({
          cargo: state.cargo.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        })),

      removeCargoLine: (id) => set((state) => ({ cargo: state.cargo.filter((c) => c.id !== id) })),

      addAlert: (alert) => {
        const full: AlertItem = {
          id: nextId('ALT'),
          createdAt: new Date().toISOString(),
          status: 'OPEN',
          ...alert,
        }
        set((state) => ({ alerts: [full, ...state.alerts] }))
        return full
      },

      setAlertStatus: (id, status) =>
        set((state) => ({
          alerts: state.alerts.map((a) =>
            a.id === id
              ? {
                  ...a,
                  status,
                  acknowledgedAt: status === 'ACKNOWLEDGED' ? new Date().toISOString() : a.acknowledgedAt,
                  resolvedAt: status === 'RESOLVED' ? new Date().toISOString() : a.resolvedAt,
                }
              : a,
          ),
        })),

      addTimelineEvent: (event) =>
        set((state) => ({
          timeline: [
            ...state.timeline,
            { id: nextId('EVT'), timestamp: event.timestamp ?? new Date().toISOString(), ...event },
          ],
        })),

      addAuditLogEntry: (entry) =>
        set((state) => ({
          auditLog: [{ id: nextId('AUD'), timestamp: new Date().toISOString(), ...entry }, ...state.auditLog],
        })),

      addNotification: (n) =>
        set((state) => ({
          notifications: [
            { id: nextId('NTF'), createdAt: new Date().toISOString(), read: false, ...n },
            ...state.notifications,
          ].slice(0, 50),
        })),

      markNotificationRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
        })),

      markAllNotificationsRead: () =>
        set((state) => ({ notifications: state.notifications.map((n) => ({ ...n, read: true })) })),

      resetAll: () => {
        idCounter = 1
        set(seedState())
      },
    }),
    {
      name: 'smartseal-data-v9',
      partialize: (state) => {
        const { hydrated, ...rest } = state
        void hydrated
        return rest
      },
    },
  ),
)
