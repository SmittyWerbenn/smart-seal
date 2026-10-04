import { useDataStore } from '@/store/dataStore'
import { useAuthStore } from '@/store/authStore'
import { delay } from './delay'
import { actorName, fail, failWith, ok, requirePermission, type ServiceResult } from './common'
import type { Driver, DriverStatus, Vehicle } from '@/types'
import { translate } from '@/i18n'

export interface DriverInput {
  driverId: string
  name: string
  username: string
  password?: string // required on create, optional on edit
  phone: string
  email?: string
  licenseNumber?: string
  licenseExpiry?: string
  emergencyContact?: string
  vehicleId?: string
  status: DriverStatus
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE = /^0\d{8,13}$/
const DRIVER_ID_RE = /^DRV-\d{3}$/
const USERNAME_RE = /^[a-z0-9_.]{3,30}$/

/** Field-level validation shared by the Add and Edit forms. Returns the first error or null. */
export function validateDriverInput(input: DriverInput, existing: Driver[], selfId?: string, isNew = false): string | null {
  if (!DRIVER_ID_RE.test(input.driverId)) return translate('msg.msg005')
  if (existing.some((d) => d.id !== selfId && d.driverId.toLowerCase() === input.driverId.toLowerCase())) return translate('msg.msg006')
  if (!input.name.trim()) return translate('msg.msg007')
  if (!USERNAME_RE.test(input.username)) return translate('msg.msg008')
  if (existing.some((d) => d.id !== selfId && d.username === input.username)) return translate('msg.msg009')
  if (isNew && !input.password?.trim()) return translate('msg.msg010')
  if (input.password !== undefined && input.password !== '' && input.password.length < 6) return translate('msg.msg011')
  if (!PHONE_RE.test(input.phone.replace(/[\s-]/g, ''))) return translate('msg.msg012')
  if (input.email && !EMAIL_RE.test(input.email)) return translate('msg.msg013')
  if (input.licenseExpiry && new Date(input.licenseExpiry) < new Date(new Date().toDateString())) return translate('msg.msg014')
  if (input.vehicleId && !useDataStore.getState().vehicles.some((v) => v.id === input.vehicleId)) return 'Kendaraan tidak ditemukan.'
  return null
}

/** Accepts either the internal id (drv-001) or the public Driver ID (DRV-001). */
export function findDriver(idOrDriverId: string | undefined): Driver | undefined {
  if (!idOrDriverId) return undefined
  const lower = idOrDriverId.toLowerCase()
  return useDataStore.getState().drivers.find((d) => d.id === lower || d.driverId.toLowerCase() === lower)
}

export function vehicleFor(vehicleId: string | undefined): Vehicle | undefined {
  return useDataStore.getState().vehicles.find((v) => v.id === vehicleId)
}

export const driverService = {
  async getDrivers(): Promise<Driver[]> {
    return delay(useDataStore.getState().drivers)
  },
  async getDriver(idOrDriverId: string): Promise<Driver | undefined> {
    return delay(findDriver(idOrDriverId))
  },
  async getVehicles(): Promise<Vehicle[]> {
    return delay(useDataStore.getState().vehicles)
  },

  /** Demo login: username + password against the Driver records. Suspended drivers cannot sign in. */
  async authenticate(username: string, password: string): Promise<ServiceResult<Driver>> {
    const driver = useDataStore.getState().drivers.find((d) => d.username === username.trim().toLowerCase())
    // OFFLINE is an operational status and does not block login; only SUSPENDED (account access) does.
    if (!driver || driver.password !== password) return delay(failWith<Driver>(translate('driverLogin.invalid'), 'INVALID_CREDENTIALS'), 500)
    if (driver.status === 'SUSPENDED') return delay(failWith<Driver>(translate('driverLogin.suspended'), 'SUSPENDED'), 500)
    useDataStore.getState().addAuditLogEntry({ user: driver.name, action: 'DRIVER_LOGIN', entity: driver.driverId, description: `${driver.driverId} signed in to Driver Portal` })
    return delay(ok(driver), 500)
  },

  async createDriver(input: DriverInput): Promise<ServiceResult<Driver>> {
    const denied = requirePermission<Driver>('driver.manage')
    if (denied) return delay(denied)
    const store = useDataStore.getState()
    const error = validateDriverInput(input, store.drivers, undefined, true)
    if (error) return delay(fail<Driver>(error))
    if (input.status === 'ON_DELIVERY') return delay(fail<Driver>(translate('ui.onDeliveryStatusIsSet')))
    const now = new Date().toISOString()
    const driver: Driver = {
      id: input.driverId.toLowerCase(),
      driverId: input.driverId,
      name: input.name.trim(),
      username: input.username,
      password: input.password!.trim(),
      phone: input.phone.replace(/[\s-]/g, ''),
      email: input.email?.trim() || undefined,
      licenseNumber: input.licenseNumber?.trim() || undefined,
      licenseExpiry: input.licenseExpiry || undefined,
      emergencyContact: input.emergencyContact?.trim() || undefined,
      vehicleId: input.vehicleId || undefined,
      status: input.status,
      createdAt: now,
      updatedAt: now,
    }
    store.addDriver(driver)
    store.addAuditLogEntry({ user: actorName(), action: 'DRIVER_CREATED', entity: driver.driverId, description: `${driver.name} (${driver.driverId}) added` })
    return delay(ok(driver))
  },

  async updateDriver(id: string, input: DriverInput): Promise<ServiceResult<Driver>> {
    const denied = requirePermission<Driver>('driver.manage')
    if (denied) return delay(denied)
    const store = useDataStore.getState()
    const current = findDriver(id)
    if (!current) return delay(fail<Driver>(translate('ui.driverNotFound2')))
    const error = validateDriverInput({ ...input, username: current.username }, store.drivers, current.id)
    if (error) return delay(fail<Driver>(error))
    if (input.status === 'ON_DELIVERY' && current.status !== 'ON_DELIVERY') return delay(fail<Driver>(translate('ui.onDeliveryStatusIsSet')))
    if (current.status === 'ON_DELIVERY' && input.status !== 'ON_DELIVERY') return delay(fail<Driver>(translate('ui.driverStillHasAnActive')))
    const patch: Partial<Driver> = {
      name: input.name.trim(),
      phone: input.phone.replace(/[\s-]/g, ''),
      email: input.email?.trim() || undefined,
      licenseNumber: input.licenseNumber?.trim() || undefined,
      licenseExpiry: input.licenseExpiry || undefined,
      emergencyContact: input.emergencyContact?.trim() || undefined,
      vehicleId: input.vehicleId || undefined,
      status: input.status,
    }
    store.updateDriver(current.id, patch)
    store.addAuditLogEntry({ user: actorName(), action: 'DRIVER_UPDATED', entity: current.driverId, description: `${current.driverId} profile updated` })
    return delay(ok({ ...current, ...patch } as Driver))
  },

  /** Suspend / reactivate / set offline. ON_DELIVERY is never set by hand. */
  async setStatus(id: string, status: DriverStatus): Promise<ServiceResult> {
    const denied = requirePermission(status === 'SUSPENDED' || status === 'AVAILABLE' ? 'driver.suspend' : 'driver.manage')
    if (denied) return delay(denied)
    const store = useDataStore.getState()
    const driver = findDriver(id)
    if (!driver) return delay(fail(translate('ui.driverNotFound2')))
    if (status === 'ON_DELIVERY') return delay(fail(translate('ui.onDeliveryStatusIsSet')))
    if (driver.status === 'ON_DELIVERY') {
      return delay(fail(translate('ui.driverStillHasAnActive')))
    }
    store.updateDriver(driver.id, { status })
    const action = status === 'SUSPENDED' ? 'DRIVER_SUSPENDED' : status === 'AVAILABLE' && driver.status === 'SUSPENDED' ? 'DRIVER_REACTIVATED' : 'DRIVER_STATUS_CHANGED'
    store.addAuditLogEntry({ user: actorName(), action, entity: driver.driverId, description: `${driver.name} status ${driver.status} → ${status}` })
    if (status === 'SUSPENDED') {
      store.addNotification({ driverId: driver.id, severity: 'CRITICAL', title: 'Account Suspended', message: 'Akun Anda ditangguhkan. Hubungi Control Tower.' })
    }
    return delay(ok())
  },

  async resetPassword(id: string): Promise<ServiceResult<string>> {
    const denied = requirePermission<string>('driver.credentials')
    if (denied) return delay(denied)
    const driver = findDriver(id)
    if (!driver) return delay(fail<string>(translate('ui.driverNotFound2')))
    const password = `drv${Math.floor(1000 + Math.random() * 9000)}`
    useDataStore.getState().updateDriver(driver.id, { password })
    useDataStore.getState().addAuditLogEntry({ user: actorName(), action: 'DRIVER_PASSWORD_RESET', entity: driver.driverId, description: `Password reset for ${driver.driverId}` })
    return delay(ok(password))
  },

  /** Simulated driver self-service: toggle between AVAILABLE and OFFLINE only. */
  async setOwnOnline(id: string, online: boolean): Promise<ServiceResult> {
    const driver = findDriver(id)
    if (!driver) return delay(fail(translate('ui.driverNotFound2')))
    if (driver.status === 'SUSPENDED') return delay(fail(translate('ui.accountSuspended')))
    if (driver.status === 'ON_DELIVERY') return delay(fail(translate('ui.anActiveShipmentIsIn')))
    const status: DriverStatus = online ? 'AVAILABLE' : 'OFFLINE'
    useDataStore.getState().updateDriver(driver.id, { status })
    useDataStore.getState().addAuditLogEntry({ user: driver.name, action: 'DRIVER_STATUS_CHANGED', entity: driver.driverId, description: `Driver set status to ${status}` })
    return delay(ok())
  },
}

export function currentDriverId(): string | undefined {
  return useAuthStore.getState().currentUser?.driverId
}
