import {
  LayoutDashboard,
  Tags,
  Ship,
  FileStack,
  ShieldCheck,
  Sailboat,
  BellRing,
  MapPinned,
  Recycle,
  FileBarChart,
  ScrollText,
  Users,
  Settings,
  Palette,
  IdCard,
  type LucideIcon,
} from 'lucide-react'
import type { Role } from '@/types'
import type { TKey } from '@/i18n'

export interface NavItem {
  labelKey: TKey // translation key, see src/i18n
  path: string
  icon: LucideIcon
  roles: Role[]
  group?: TKey // optional section heading (translation key) rendered above the first item of a group
}

export const NAV_ITEMS: NavItem[] = [
  { labelKey: 'nav.dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'CONTROL_TOWER', 'WAREHOUSE', 'SUPERVISOR', 'CLIENT', 'AUDITOR'] },
  { labelKey: 'nav.sealMonitoring', path: '/containers', icon: Tags, roles: ['SUPER_ADMIN', 'CONTROL_TOWER', 'WAREHOUSE', 'SUPERVISOR', 'AUDITOR'] },
  { labelKey: 'nav.sealInventory', path: '/eseals', icon: ShieldCheck, roles: ['SUPER_ADMIN', 'CONTROL_TOWER', 'WAREHOUSE', 'SUPERVISOR'] },
  { labelKey: 'nav.alerts', path: '/alerts', icon: BellRing, roles: ['SUPER_ADMIN', 'CONTROL_TOWER', 'SUPERVISOR', 'AUDITOR'] },
  { labelKey: 'nav.reports', path: '/reports', icon: FileBarChart, roles: ['SUPER_ADMIN', 'CONTROL_TOWER', 'WAREHOUSE', 'SUPERVISOR', 'CLIENT', 'AUDITOR'] },
  { labelKey: 'nav.shipments', path: '/shipments', icon: Ship, roles: ['SUPER_ADMIN', 'CONTROL_TOWER', 'WAREHOUSE', 'SUPERVISOR', 'CLIENT', 'AUDITOR'] },
  { labelKey: 'nav.cargo', path: '/cargo', icon: FileStack, roles: ['SUPER_ADMIN', 'CONTROL_TOWER', 'WAREHOUSE', 'SUPERVISOR', 'CLIENT'] },
  { labelKey: 'nav.vessels', path: '/vessels', icon: Sailboat, roles: ['SUPER_ADMIN', 'CONTROL_TOWER', 'SUPERVISOR'] },
  { labelKey: 'nav.driverManagement', path: '/admin/drivers', icon: IdCard, roles: ['SUPER_ADMIN', 'SUPERVISOR'] },
  { labelKey: 'nav.geofences', path: '/geofences', icon: MapPinned, roles: ['SUPER_ADMIN', 'CONTROL_TOWER', 'SUPERVISOR'] },
  { labelKey: 'nav.reverseLogistics', path: '/reverse-logistics', icon: Recycle, roles: ['SUPER_ADMIN', 'WAREHOUSE', 'SUPERVISOR'] },
  { labelKey: 'nav.itemCategories', path: '/master/item-categories', icon: Palette, group: 'nav.masterData', roles: ['SUPER_ADMIN', 'CONTROL_TOWER', 'WAREHOUSE', 'SUPERVISOR'] },
  { labelKey: 'nav.auditLogs', path: '/audit-logs', icon: ScrollText, roles: ['SUPER_ADMIN', 'SUPERVISOR', 'AUDITOR'] },
  { labelKey: 'nav.usersRoles', path: '/users', icon: Users, roles: ['SUPER_ADMIN'] },
  { labelKey: 'nav.settings', path: '/settings', icon: Settings, roles: ['SUPER_ADMIN', 'CONTROL_TOWER', 'WAREHOUSE', 'SUPERVISOR', 'CLIENT', 'AUDITOR'] },
]

export function navForRole(role: Role): NavItem[] {
  return NAV_ITEMS.filter((item) => item.roles.includes(role))
}
