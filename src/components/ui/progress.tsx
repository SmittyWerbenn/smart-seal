import { cn } from '@/lib/utils'

interface ProgressProps {
  value: number
  className?: string
  colorClassName?: string
}

export function Progress({ value, className, colorClassName }: ProgressProps) {
  const clamped = Math.max(0, Math.min(100, value))
  const color = colorClassName ?? (clamped < 20 ? 'bg-critical-500' : clamped < 80 ? 'bg-warning-500' : 'bg-success-500')
  return (
    <div className={cn('h-1.5 w-full overflow-hidden rounded-full bg-slate-100', className)}>
      <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${clamped}%` }} />
    </div>
  )
}

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-5 w-9 rounded-full transition-colors',
          checked ? 'bg-brand-600' : 'bg-slate-300',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all',
            checked ? 'left-[18px]' : 'left-0.5',
          )}
        />
      </button>
      {label && <span className="text-sm text-navy-700">{label}</span>}
    </label>
  )
}
