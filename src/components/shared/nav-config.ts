import {
  LayoutDashboard,
  Radar,
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
  type LucideIcon,
} from 'lucide-react'
import type { Role } from '@/types'

export interface NavItem {
  label: string
  path: string
  icon: LucideIcon
  roles: Role[]
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'CONTROL_TOWER', 'WAREHOUSE', 'SUPERVISOR', 'CLIENT', 'AUDITOR'] },
  { label: 'Seal Monitoring', path: '/containers', icon: Tags, roles: ['SUPER_ADMIN', 'CONTROL_TOWER', 'WAREHOUSE', 'SUPERVISOR', 'AUDITOR'] },
  { label: 'Seal Devices', path: '/eseals', icon: ShieldCheck, roles: ['SUPER_ADMIN', 'CONTROL_TOWER', 'WAREHOUSE', 'SUPERVISOR'] },
  { label: 'Control Tower', path: '/control-tower', icon: Radar, roles: ['SUPER_ADMIN', 'CONTROL_TOWER', 'SUPERVISOR'] },
  { label: 'Shipments', path: '/shipments', icon: Ship, roles: ['SUPER_ADMIN', 'CONTROL_TOWER', 'WAREHOUSE', 'SUPERVISOR', 'CLIENT', 'AUDITOR'] },
  { label: 'Cargo / DO', path: '/cargo', icon: FileStack, roles: ['SUPER_ADMIN', 'CONTROL_TOWER', 'WAREHOUSE', 'SUPERVISOR', 'CLIENT'] },
  { label: 'Vessels / AIS', path: '/vessels', icon: Sailboat, roles: ['SUPER_ADMIN', 'CONTROL_TOWER', 'SUPERVISOR'] },
  { label: 'Alerts', path: '/alerts', icon: BellRing, roles: ['SUPER_ADMIN', 'CONTROL_TOWER', 'SUPERVISOR', 'AUDITOR'] },
  { label: 'Geofences', path: '/geofences', icon: MapPinned, roles: ['SUPER_ADMIN', 'CONTROL_TOWER', 'SUPERVISOR'] },
  { label: 'Reverse Logistics', path: '/reverse-logistics', icon: Recycle, roles: ['SUPER_ADMIN', 'WAREHOUSE', 'SUPERVISOR'] },
  { label: 'Reports', path: '/reports', icon: FileBarChart, roles: ['SUPER_ADMIN', 'CONTROL_TOWER', 'WAREHOUSE', 'SUPERVISOR', 'CLIENT', 'AUDITOR'] },
  { label: 'Audit Logs', path: '/audit-logs', icon: ScrollText, roles: ['SUPER_ADMIN', 'SUPERVISOR', 'AUDITOR'] },
  { label: 'Users & Roles', path: '/users', icon: Users, roles: ['SUPER_ADMIN'] },
  { label: 'Settings', path: '/settings', icon: Settings, roles: ['SUPER_ADMIN', 'CONTROL_TOWER', 'WAREHOUSE', 'SUPERVISOR', 'CLIENT', 'AUDITOR'] },
]

export function navForRole(role: Role): NavItem[] {
  return NAV_ITEMS.filter((item) => item.roles.includes(role))
}
