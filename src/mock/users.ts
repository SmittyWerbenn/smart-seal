import type { DemoUser, Role } from '@/types'

export const DEMO_USERS: DemoUser[] = [
  {
    id: 'user-control-tower',
    name: 'Rangga Saputra',
    email: 'control.tower@smartseal.demo',
    role: 'CONTROL_TOWER',
    avatarColor: '#1d4ed8',
  },
  {
    id: 'user-warehouse',
    name: 'Dewi Anggraini',
    email: 'warehouse@smartseal.demo',
    role: 'WAREHOUSE',
    avatarColor: '#0891b2',
  },
  {
    id: 'user-driver',
    name: 'Agus Prasetyo',
    email: 'driver@smartseal.demo',
    role: 'DRIVER',
    avatarColor: '#16a34a',
  },
  {
    id: 'user-client',
    name: 'Client A — PT Sinar Nusantara',
    email: 'client@smartseal.demo',
    role: 'CLIENT',
    clientId: 'client-pt-sinar-nusantara',
    avatarColor: '#b45309',
  },
]

export const ALL_ROLES: { role: Role; label: string; description: string }[] = [
  { role: 'SUPER_ADMIN', label: 'Super Admin', description: 'Full platform access across all tenants' },
  { role: 'CONTROL_TOWER', label: 'Control Tower', description: 'Monitors fleet, seals, alerts & tracking' },
  { role: 'WAREHOUSE', label: 'Warehouse Operator', description: 'Runs stuffing & sealing workflows' },
  { role: 'DRIVER', label: 'Driver / Field', description: 'Mobile field app for scanning & transit' },
  { role: 'SUPERVISOR', label: 'Supervisor', description: 'Approves unlocks & exceptions' },
  { role: 'CLIENT', label: 'Client', description: 'Views only their own cargo' },
  { role: 'AUDITOR', label: 'Auditor', description: 'Read-only access to audit trail & reports' },
]

export function userForRole(role: Role): DemoUser {
  return DEMO_USERS.find((u) => u.role === role) ?? { ...DEMO_USERS[0], role }
}
