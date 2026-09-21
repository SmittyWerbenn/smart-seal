import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface KpiCardProps {
  label: string
  value: string | number
  icon?: LucideIcon
  tone?: 'default' | 'brand' | 'success' | 'warning' | 'critical'
  trend?: string
  onClick?: () => void
}

const TONE_CLASSES: Record<NonNullable<KpiCardProps['tone']>, string> = {
  default: 'bg-slate-100 text-navy-700',
  brand: 'bg-brand-50 text-brand-700',
  success: 'bg-success-100 text-green-700',
  warning: 'bg-warning-100 text-amber-700',
  critical: 'bg-critical-100 text-red-700',
}

export function KpiCard({ label, value, icon: Icon, tone = 'default', trend, onClick }: KpiCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        'flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm transition-shadow',
        onClick && 'hover:shadow-md cursor-pointer',
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</span>
        {Icon && (
          <span className={cn('flex h-7 w-7 items-center justify-center rounded-md', TONE_CLASSES[tone])}>
            <Icon size={15} />
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-semibold text-navy-900">{value}</span>
        {trend && <span className="text-xs text-slate-400">{trend}</span>}
      </div>
    </button>
  )
}
