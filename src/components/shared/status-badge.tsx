import { Badge } from '@/components/ui/badge'
import { titleCase } from '@/lib/utils'
import type { AlertSeverity, ContainerStatus, DeviceStatus, MarkerState, RiskLevel } from '@/types'

export function ContainerStatusBadge({ status }: { status: ContainerStatus }) {
  const variant =
    status === 'DELIVERED' || status === 'UNLOCKED'
      ? 'success'
      : status === 'OCEAN_TRANSIT' || status === 'LOADED_ON_BOARD'
        ? 'brand'
        : status === 'CREATED' || status === 'STUFFING'
          ? 'neutral'
          : 'outline'
  return <Badge variant={variant}>{titleCase(status)}</Badge>
}

export function RiskBadge({ level }: { level: RiskLevel }) {
  const variant = level === 'CRITICAL' ? 'critical' : level === 'HIGH' ? 'warning' : level === 'MEDIUM' ? 'brand' : 'success'
  return <Badge variant={variant}>{titleCase(level)} RISK</Badge>
}

export function SeverityBadge({ severity }: { severity: AlertSeverity }) {
  const variant = severity === 'CRITICAL' ? 'critical' : severity === 'WARNING' ? 'warning' : 'brand'
  return <Badge variant={variant}>{severity}</Badge>
}

export function MarkerStateBadge({ state }: { state: MarkerState }) {
  const variant =
    state === 'CRITICAL' ? 'critical' : state === 'WARNING' ? 'warning' : state === 'OFFLINE' ? 'offline' : state === 'DELIVERED' ? 'success' : 'brand'
  return <Badge variant={variant}>{titleCase(state)}</Badge>
}

export function DeviceStatusBadge({ status }: { status: DeviceStatus }) {
  const variant = status === 'TAMPER' ? 'critical' : status === 'OFFLINE' ? 'offline' : status === 'LOW_BATTERY' ? 'warning' : status === 'DEEP_SLEEP' ? 'neutral' : 'success'
  return <Badge variant={variant}>{titleCase(status)}</Badge>
}

export const MARKER_COLOR: Record<MarkerState, string> = {
  NORMAL: '#2563eb',
  WARNING: '#d97706',
  CRITICAL: '#dc2626',
  OFFLINE: '#64748b',
  DELIVERED: '#16a34a',
}
