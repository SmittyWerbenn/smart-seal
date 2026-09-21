import { BatteryFull, BatteryLow, BatteryMedium, BatteryWarning, SignalHigh, SignalLow, SignalMedium, SignalZero } from 'lucide-react'
import { cn } from '@/lib/utils'

export function BatteryIndicator({ value, className }: { value: number; className?: string }) {
  const color = value < 20 ? 'text-critical-500' : value < 50 ? 'text-warning-500' : 'text-success-500'
  const Icon = value < 20 ? BatteryWarning : value < 50 ? BatteryLow : value < 85 ? BatteryMedium : BatteryFull
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs font-medium', color, className)}>
      <Icon size={15} />
      {value}%
    </span>
  )
}

export function SignalIndicator({ value, className }: { value: number; className?: string }) {
  const color = value < 20 ? 'text-critical-500' : value < 50 ? 'text-warning-500' : 'text-navy-700'
  const Icon = value < 5 ? SignalZero : value < 40 ? SignalLow : value < 75 ? SignalMedium : SignalHigh
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs font-medium', color, className)}>
      <Icon size={15} />
      {value}%
    </span>
  )
}

export type DeviceHealth = 'HEALTHY' | 'WARNING' | 'CRITICAL'

export function deviceHealthStatus(battery: number, signal: number, lastSeenMinutes: number): DeviceHealth {
  if (battery < 15 || signal < 10 || lastSeenMinutes > 120) return 'CRITICAL'
  if (battery < 35 || signal < 35 || lastSeenMinutes > 30) return 'WARNING'
  return 'HEALTHY'
}

export function DeviceHealthPill({ battery, signal, lastSeenMinutes }: { battery: number; signal: number; lastSeenMinutes: number }) {
  const health = deviceHealthStatus(battery, signal, lastSeenMinutes)
  const colorClass = health === 'CRITICAL' ? 'bg-critical-100 text-red-800' : health === 'WARNING' ? 'bg-warning-100 text-amber-800' : 'bg-success-100 text-green-800'
  return <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', colorClass)}>{health}</span>
}
