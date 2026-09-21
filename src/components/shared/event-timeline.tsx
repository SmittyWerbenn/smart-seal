import { CheckCircle2 } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'
import type { TimelineEvent } from '@/types'
import { EmptyState } from './states'

export function EventTimeline({ events, dense }: { events: TimelineEvent[]; dense?: boolean }) {
  if (events.length === 0) return <EmptyState title="No events yet" description="Timeline events will appear here as this container progresses." />
  return (
    <ol className="relative border-s border-slate-200 ps-4">
      {events.map((event) => (
        <li key={event.id} className={dense ? 'mb-3' : 'mb-5'}>
          <span className="absolute -start-[7px] mt-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-brand-600 ring-4 ring-white">
            <CheckCircle2 size={0} />
          </span>
          <p className="text-sm font-medium text-navy-900">{event.label}</p>
          <p className="text-xs text-slate-500">
            {formatDateTime(event.timestamp)} · {event.actor}
          </p>
          {event.description && <p className="mt-0.5 text-xs text-slate-600">{event.description}</p>}
        </li>
      ))}
    </ol>
  )
}
