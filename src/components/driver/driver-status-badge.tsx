import { Badge } from '@/components/ui/badge'
import type { DriverStatus } from '@/types'

const LABEL: Record<DriverStatus, { text: string; variant: 'success' | 'brand' | 'offline' | 'critical' }> = {
  AVAILABLE: { text: 'Available', variant: 'success' },
  ON_DELIVERY: { text: 'On Delivery', variant: 'brand' },
  OFFLINE: { text: 'Offline', variant: 'offline' },
  SUSPENDED: { text: 'Suspended', variant: 'critical' },
}

export function DriverStatusBadge({ status }: { status: DriverStatus }) {
  return <Badge variant={LABEL[status].variant}>{LABEL[status].text}</Badge>
}
