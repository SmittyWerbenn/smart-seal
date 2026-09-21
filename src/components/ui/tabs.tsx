import { cn } from '@/lib/utils'

interface TabsProps {
  tabs: { key: string; label: string }[]
  active: string
  onChange: (key: string) => void
  className?: string
}

export function Tabs({ tabs, active, onChange, className }: TabsProps) {
  return (
    <div className={cn('flex gap-1 overflow-x-auto border-b border-slate-200', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={cn(
            'whitespace-nowrap border-b-2 px-3.5 py-2.5 text-sm font-medium transition-colors',
            active === tab.key
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-slate-500 hover:text-navy-800',
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
