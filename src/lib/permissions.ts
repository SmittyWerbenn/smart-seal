// Permission matrix for the Driver Portal and Driver Management. Used by route guards,
// sidebar items, buttons and data filters — never only to hide a menu.
import type { Role } from '@/types'

export type Permission =
  | 'driver.portal' // use the Driver Portal (own shipments only)
  | 'driver.checkpoint' // confirm checkpoints and submit POD
  | 'driver.manage' // create / edit drivers and vehicles
  | 'driver.suspend' // suspend / reactivate driver
  | 'driver.credentials' // reset driver passwords
  | 'driver.assign' // assign or reassign shipments
  | 'driver.view_all' // see every driver and their activity
  | 'driver.approve_exception' // override a blocked checkpoint (tamper, etc.)

const MATRIX: Record<Role, Permission[]> = {
  SUPER_ADMIN: ['driver.manage', 'driver.suspend', 'driver.credentials', 'driver.assign', 'driver.view_all', 'driver.approve_exception'],
  SUPERVISOR: ['driver.view_all', 'driver.assign', 'driver.approve_exception'],
  CONTROL_TOWER: [],
  DRIVER: ['driver.portal', 'driver.checkpoint'],
  WAREHOUSE: ['driver.assign'], // stuffing wizard assigns the driver after sealing
  CLIENT: [],
  AUDITOR: [],
}

export function can(role: Role | undefined, permission: Permission): boolean {
  if (!role) return false
  return MATRIX[role].includes(permission)
}
