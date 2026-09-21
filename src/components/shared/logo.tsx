import { cn } from '@/lib/utils'

export function AppLogo({ className, iconOnly }: { className?: string; iconOnly?: boolean }) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-brand-600 text-sm font-bold text-white">
        S
      </span>
      {!iconOnly && (
        <span className="flex flex-col leading-none">
          <span className="text-base font-bold tracking-tight text-navy-900">Smart Container</span>
          <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Seal &amp; Tracking</span>
        </span>
      )}
    </div>
  )
}
