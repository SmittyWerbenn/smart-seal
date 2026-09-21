import type { ReactNode } from 'react'

export function PageHeader({ title, description, below, actions }: { title: string; description?: string; below?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 px-4 pb-4 pt-5 md:px-6">
      <div>
        <h1 className="text-lg font-semibold text-navy-900">{title}</h1>
        {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
        {below}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}
