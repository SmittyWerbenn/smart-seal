import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EventTimeline } from '@/components/shared/event-timeline'
import type { TimelineEvent } from '@/types'
import { translate } from '@/i18n'

export function EventsTab({ events }: { events: TimelineEvent[] }) {
  const sorted = [...events].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  return (
    <Card>
      <CardHeader>
        <CardTitle>{translate('ui.fullEventHistory')}</CardTitle>
      </CardHeader>
      <CardContent>
        <EventTimeline events={sorted} />
      </CardContent>
    </Card>
  )
}
