import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { buildInitialDataset } from '@/mock'
import { pointOnRoute, portForCity } from '@/mock/geo'
import { usePhotoStore } from './photoStore'
import { buildItemCategorySeed, categoryIdFor } from '@/mock/products'
import { seedDriverPortal } from '@/mock/drivers'
import type {
  AlertItem,
  AlertStatus,
  AppNotification,
  AuditLogEntry,
  BasicSealStockItem,
  CargoLine,
  Container,
  Driver,
  DriverAssignment,
  DriverCheckpoint,
  ESealDevice,
  Geofence,
  ItemCategory,
  Port,
  ProofOfDelivery,
  RouteDefinition,
  Shipment,
  TimelineEvent,
  Vehicle,
  Vessel,
} from '@/types'
import { translate } from '@/i18n'

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
  itemCategories: ItemCategory[]
  shipments: Shipment[]
  timeline: TimelineEvent[]
  auditLog: AuditLogEntry[]
  notifications: AppNotification[]
  routes: RouteDefinition[]
  ports: Port[]
  warehouses: Record<string, { lat: number; lng: number }>
  basicSealStock: BasicSealStockItem[]
  drivers: Driver[]
  vehicles: Vehicle[]
  driverAssignments: DriverAssignment[]
  driverCheckpoints: DriverCheckpoint[]
  proofOfDeliveries: ProofOfDelivery[]
  hydrated: boolean

  updateContainer: (id: string, patch: Partial<Container>) => void
  updateDevice: (id: string, patch: Partial<ESealDevice>) => void
  updateVessel: (id: string, patch: Partial<Vessel>) => void
  driftVessels: (deltaMs: number, excludeIds: string[]) => void
  addCargoLine: (line: Omit<CargoLine, 'id'>) => void
  updateCargoLine: (id: string, patch: Partial<CargoLine>) => void
  removeCargoLine: (id: string) => void
  addItemCategory: (input: { name: string; color: string; active: boolean }) => { ok: boolean; error?: string }
  updateItemCategory: (id: string, patch: { name?: string; color?: string; active?: boolean }) => { ok: boolean; error?: string }
  removeItemCategory: (id: string) => { ok: boolean; error?: string }
  addContainer: (input: { number: string; isoType: string; originCity: string; destinationCity: string; shipper: string; consignee: string; eta?: string }) => Container
  addBasicSealBatch: (items: { id: string; barcode: string }[]) => void
  addAlert: (alert: Omit<AlertItem, 'id' | 'createdAt' | 'status'> & Partial<Pick<AlertItem, 'status'>>) => AlertItem
  setAlertStatus: (id: string, status: AlertStatus) => void
  addTimelineEvent: (event: Omit<TimelineEvent, 'id' | 'timestamp'> & { timestamp?: string }) => void
  addAuditLogEntry: (entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) => void
  addNotification: (n: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => void
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void
  // Driver Portal raw mutations. Rules (sequence, permissions, validation) live in
  // services/*; these only write state.
  addDriver: (driver: Driver) => void
  updateDriver: (id: string, patch: Partial<Driver>) => void
  addDriverAssignment: (assignment: DriverAssignment) => void
  updateDriverAssignment: (id: string, patch: Partial<DriverAssignment>) => void
  addDriverCheckpoint: (checkpoint: DriverCheckpoint) => void
  addProofOfDelivery: (pod: ProofOfDelivery) => void
  updateShipment: (id: string, patch: Partial<Shipment>) => void
  resetAll: () => void
}

function validateCategory(list: ItemCategory[], input: { name: string; color: string }, selfId?: string): string | null {
  const name = input.name.trim()
  if (!name) return translate('msg.msg016')
  if (list.some((c) => c.id !== selfId && c.name.trim().toLowerCase() === name.toLowerCase())) return translate('msg.msg017')
  if (!/^#[0-9a-f]{6}$/i.test(input.color)) return translate('msg.msg018')
  return null
}

function seedState() {
  const data = buildInitialDataset()
  const driver = seedDriverPortal({ containers: data.containers, shipments: data.shipments, routes: data.routes })
  return {
    ...data,
    containers: driver.containers,
    shipments: driver.shipments,
    timeline: [...driver.timeline, ...data.timeline],
    auditLog: [...driver.auditLog, ...data.auditLog],
    notifications: driver.notifications as AppNotification[],
    basicSealStock: [] as BasicSealStockItem[],
    drivers: driver.drivers,
    vehicles: driver.vehicles,
    driverAssignments: driver.driverAssignments,
    driverCheckpoints: driver.driverCheckpoints,
    proofOfDeliveries: driver.proofOfDeliveries,
    hydrated: true,
  }
}

export function migrateDataState(persisted: unknown, version: number): DataState {
  const state = (persisted ?? {}) as Record<string, unknown>
  if (version < 1) {
    const oldCargo = (Array.isArray(state.cargo) ? state.cargo : []) as (Record<string, unknown> & { category?: string })[]
    state.itemCategories = buildItemCategorySeed(oldCargo.map((c) => String(c.category ?? '')))
    state.cargo = oldCargo.map((c) => {
      const { category, ...rest } = c
      const name = String(category ?? '').trim()
      return { ...rest, categoryId: name ? categoryIdFor(name) : null }
    })
  }
  if (version < 2) {
    const containers = (Array.isArray(state.containers) ? state.containers : []) as Container[]
    const shipments = (Array.isArray(state.shipments) ? state.shipments : []) as Shipment[]
    const routes = (Array.isArray(state.routes) ? state.routes : []) as RouteDefinition[]
    const driver = seedDriverPortal({ containers, shipments, routes })
    Object.assign(state, {
      containers: driver.containers,
      shipments: driver.shipments,
      timeline: [...driver.timeline, ...((state.timeline as TimelineEvent[]) ?? [])],
      auditLog: [...driver.auditLog, ...((state.auditLog as AuditLogEntry[]) ?? [])],
      notifications: [...driver.notifications, ...((state.notifications as AppNotification[]) ?? [])],
      drivers: driver.drivers,
      vehicles: driver.vehicles,
      driverAssignments: driver.driverAssignments,
      driverCheckpoints: driver.driverCheckpoints,
      proofOfDeliveries: driver.proofOfDeliveries,
    })
  }
  if (version < 3) {
    // v2 -> v3: adds the demo driver Agus Prasetyo (DRV-006) with an active assignment on SHP-0012.
    // Only that driver's records are added, so progress of the other drivers is kept.
    const containers = (Array.isArray(state.containers) ? state.containers : []) as Container[]
    const shipments = (Array.isArray(state.shipments) ? state.shipments : []) as Shipment[]
    const routes = (Array.isArray(state.routes) ? state.routes : []) as RouteDefinition[]
    const existing = (Array.isArray(state.drivers) ? state.drivers : []) as Driver[]
    if (!existing.some((d) => d.driverId === 'DRV-006')) {
      const demo = seedDriverPortal({ containers, shipments, routes })
      const agus = demo.drivers.find((d) => d.driverId === 'DRV-006')
      const agusAssignments = demo.driverAssignments.filter((a) => a.driverId === agus?.id)
      const agusContainerIds = new Set(agusAssignments.map((a) => a.containerId))
      const agusShipmentIds = new Set(agusAssignments.map((a) => a.shipmentId))
      const agusCheckpoints = demo.driverCheckpoints.filter((c) => c.driverId === agus?.id)
      const agusNotifications = demo.notifications.filter((n) => n.driverId === agus?.id)
      const agusAudit = demo.auditLog.filter((e) => e.description.includes('DRV-006'))
      Object.assign(state, {
        drivers: agus ? [...existing, agus] : existing,
        driverAssignments: [...agusAssignments, ...((state.driverAssignments as DriverAssignment[]) ?? [])],
        driverCheckpoints: [...agusCheckpoints, ...((state.driverCheckpoints as DriverCheckpoint[]) ?? [])],
        notifications: [...agusNotifications, ...((state.notifications as AppNotification[]) ?? [])],
        auditLog: [...agusAudit, ...((state.auditLog as AuditLogEntry[]) ?? [])],
        containers: containers.map((c) => (agusContainerIds.has(c.id) ? demo.containers.find((x) => x.id === c.id) ?? c : c)),
        shipments: shipments.map((x) => (agusShipmentIds.has(x.id) ? demo.shipments.find((y) => y.id === x.id) ?? x : x)),
      })
    }
  }
  return state as unknown as DataState
}

export const useDataStore = create<DataState>()(
  persist(
    (set, get) => ({
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

      addContainer: (input) => {
        const originCity = input.originCity.trim()
        const destinationCity = input.destinationCity.trim()
        // The city names are free text (custom data entry, not picked from a
        // fixed route list) — match them to a real route for map waypoints
        // when possible, and fall back to a generic domestic route otherwise
        // so the container is still creatable and shows up on the map.
        const matchedRoute = get().routes.find(
          (r) => r.originLabel.toLowerCase() === originCity.toLowerCase() && r.destinationLabel.toLowerCase() === destinationCity.toLowerCase(),
        )
        const route = matchedRoute ?? get().routes[0]
        const originPort = portForCity(originCity)
        const destinationPort = portForCity(destinationCity)
        const id = nextId('CNT')
        const shipmentId = nextId('SHP')
        const container: Container = {
          id,
          number: input.number,
          isoType: input.isoType,
          originCity,
          originPort: originPort.name,
          destinationCity,
          destinationPort: destinationPort.name,
          status: 'CREATED',
          trackingMode: 'NONE',
          securityMode: 'SINGLE_SEAL',
          eSealId: null,
          boltSealId: null,
          regularSealId: null,
          currentLocation: route.waypoints[0],
          routeId: route.id,
          routeProgress: 0,
          eta: input.eta ?? new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString(),
          riskLevel: 'LOW',
          riskFactors: [],
          markerState: 'OFFLINE',
          lastUpdate: new Date().toISOString(),
          offlineMode: false,
          isArmed: false,
          isUnlocked: false,
          insideDestinationGeofence: false,
          shipmentId,
        }
        const shipment: Shipment = {
          id: shipmentId,
          containerId: id,
          bookingNumber: `BK-${id.replace('CNT-', '')}`,
          shipper: input.shipper,
          consignee: input.consignee,
          originCity,
          destinationCity,
          status: 'CREATED',
          createdAt: new Date().toISOString(),
        }
        set((state) => ({ containers: [container, ...state.containers], shipments: [shipment, ...state.shipments] }))
        get().addTimelineEvent({ containerId: id, type: 'CONTAINER_CREATED', label: 'Container created', actor: 'Warehouse Operator' })
        get().addAuditLogEntry({ user: 'Warehouse Operator', action: 'CONTAINER_CREATED', entity: container.number, description: `${container.number} created for stuffing` })
        return container
      },

      addItemCategory: (input) => {
        const err = validateCategory(get().itemCategories, input)
        if (err) return { ok: false, error: err }
        const cat: ItemCategory = { id: nextId('cat'), name: input.name.trim(), color: input.color.toLowerCase(), active: input.active }
        set((state) => ({ itemCategories: [...state.itemCategories, cat] }))
        get().addAuditLogEntry({ user: 'Admin', action: 'CATEGORY_CREATED', entity: cat.name, description: `Item category "${cat.name}" created` })
        return { ok: true }
      },

      updateItemCategory: (id, patch) => {
        const current = get().itemCategories.find((c) => c.id === id)
        if (!current) return { ok: false, error: 'Category not found.' }
        const next = { name: current.name, color: current.color, active: current.active, ...patch }
        const err = validateCategory(get().itemCategories, next, id)
        if (err) return { ok: false, error: err }
        set((state) => ({
          itemCategories: state.itemCategories.map((c) =>
            c.id === id ? { ...c, name: next.name.trim(), color: next.color.toLowerCase(), active: next.active } : c,
          ),
        }))
        get().addAuditLogEntry({ user: 'Admin', action: 'CATEGORY_UPDATED', entity: next.name.trim(), description: `Item category "${current.name}" updated` })
        return { ok: true }
      },

      // Deleting a category that cargo still references is blocked (deactivate instead)
      // so existing items never end up pointing at a missing category.
      removeItemCategory: (id) => {
        const current = get().itemCategories.find((c) => c.id === id)
        if (!current) return { ok: false, error: 'Category not found.' }
        const used = get().cargo.filter((l) => l.categoryId === id).length
        if (used > 0) return { ok: false, error: `Category is used by ${used} cargo item(s). Deactivate it instead.` }
        set((state) => ({ itemCategories: state.itemCategories.filter((c) => c.id !== id) }))
        get().addAuditLogEntry({ user: 'Admin', action: 'CATEGORY_DELETED', entity: current.name, description: `Item category "${current.name}" deleted` })
        return { ok: true }
      },

      addBasicSealBatch: (items) =>
        set((state) => ({
          basicSealStock: [...items.map((i) => ({ ...i, createdAt: new Date().toISOString() })), ...state.basicSealStock],
        })),

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

      addDriver: (driver) => set((state) => ({ drivers: [driver, ...state.drivers] })),

      updateDriver: (id, patch) =>
        set((state) => ({
          drivers: state.drivers.map((d) => (d.id === id ? { ...d, ...patch, updatedAt: new Date().toISOString() } : d)),
        })),

      addDriverAssignment: (assignment) => set((state) => ({ driverAssignments: [assignment, ...state.driverAssignments] })),

      updateDriverAssignment: (id, patch) =>
        set((state) => ({
          driverAssignments: state.driverAssignments.map((a) => (a.id === id ? { ...a, ...patch } : a)),
        })),

      addDriverCheckpoint: (checkpoint) => set((state) => ({ driverCheckpoints: [...state.driverCheckpoints, checkpoint] })),

      addProofOfDelivery: (pod) => set((state) => ({ proofOfDeliveries: [pod, ...state.proofOfDeliveries] })),

      updateShipment: (id, patch) =>
        set((state) => ({ shipments: state.shipments.map((s) => (s.id === id ? { ...s, ...patch } : s)) })),

      resetAll: () => {
        idCounter = 1
        usePhotoStore.getState().clearAll() // photos reference seeded containers, so they reset together
        set(seedState())
      },
    }),
    {
      name: 'smartseal-data-v13',
      version: 3,
      // v0 -> v1: cargo.category (free text) became cargo.categoryId -> itemCategories master.
      // Existing items keep their category (derived from the old text); empty text becomes null.
      // v1 -> v2: Driver Portal slices added. Seeds the driver demo on top of the saved data.
      // v2 -> v3: demo driver Agus Prasetyo (DRV-006) added for the DRIVER role.
      migrate: (persisted, version) => migrateDataState(persisted, version),
      partialize: (state) => {
        const { hydrated, ...rest } = state
        void hydrated
        return rest
      },
    },
  ),
)
