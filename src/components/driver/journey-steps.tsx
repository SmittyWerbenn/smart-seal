import { Check, Circle, Dot } from 'lucide-react'
import { CHECKPOINT_META, CHECKPOINT_SEQUENCE, nextCheckpoint } from '@/lib/driver-workflow'
import type { CheckpointType } from '@/types'
import { cn } from '@/lib/utils'

/** Vertical journey checklist: ✓ done, ● next, ○ pending. Only the next step can be confirmed. */
export function JourneySteps({ completed }: { completed: CheckpointType[] }) {
  const next = nextCheckpoint(completed)
  return (
    <ol className="space-y-1">
      {CHECKPOINT_SEQUENCE.map((type) => {
        const done = completed.includes(type)
        const current = type === next
        return (
          <li key={type} className={cn('flex min-h-9 items-center gap-3 rounded-md px-2 text-sm', current && 'bg-brand-50 font-semibold text-brand-800')}>
            {done ? (
              <Check size={16} className="shrink-0 text-success-600" />
            ) : current ? (
              <Dot size={22} className="-mx-1.5 shrink-0 text-brand-600" />
            ) : (
              <Circle size={14} className="shrink-0 text-slate-300" />
            )}
            <span className={cn(!done && !current && 'text-slate-400')}>{CHECKPOINT_META[type].label}</span>
          </li>
        )
      })}
    </ol>
  )
}
