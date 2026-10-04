import type { LucideIcon } from 'lucide-react'
import { AlertTriangle, Inbox, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useT } from '@/i18n'

export function LoadingState({ label }: { label?: string }) {
  const t = useT()
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-400">
      <Loader2 className="animate-spin" size={28} />
      <p className="text-sm">{label ?? t('common.loading')}</p>
    </div>
  )
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
}: {
  icon?: LucideIcon
  title?: string
  description?: string
  action?: { label: string; onClick: () => void }
}) {
  const t = useT()
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
      <span className="mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <Icon size={22} />
      </span>
      <p className="text-sm font-medium text-navy-800">{title ?? t('common.nothingYet')}</p>
      {description && <p className="max-w-xs text-xs text-slate-500">{description}</p>}
      {action && (
        <Button size="sm" variant="secondary" className="mt-2" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  const t = useT()
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
      <span className="mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-critical-100 text-critical-500">
        <AlertTriangle size={22} />
      </span>
      <p className="text-sm font-medium text-navy-800">{message ?? t('common.somethingWrong')}</p>
      {onRetry && (
        <Button size="sm" variant="secondary" className="mt-2" onClick={onRetry}>
          {t('common.retry')}
        </Button>
      )}
    </div>
  )
}
