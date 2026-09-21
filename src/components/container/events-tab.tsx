import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EventTimeline } from '@/components/shared/event-timeline'
import type { TimelineEvent } from '@/types'

export function EventsTab({ events }: { events: TimelineEvent[] }) {
  const sorted = [...events].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  return (
    <Card>
      <CardHeader>
        <CardTitle>Full Event History</CardTitle>
      </CardHeader>
      <CardContent>
        <EventTimeline events={sorted} />
      </CardContent>
    </Card>
  )
}
