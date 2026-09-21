import { useState } from 'react'
import { useDataStore } from '@/store/dataStore'
import { PageHeader } from '@/components/shared/page-header'
import { TrackingMap } from '@/components/map/tracking-map'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export default function GeofencesPage() {
  const geofences = useDataStore((s) => s.geofences)
  const [selectedId, setSelectedId] = useState(geofences[0]?.id ?? null)
  const selected = geofences.find((g) => g.id === selectedId)

  return (
    <div className="pb-10">
      <PageHeader title="Geofences" description={`${geofences.length} configured zones`} />
      <div className="grid grid-cols-1 gap-4 px-4 md:grid-cols-3 md:px-6">
        <Card className="md:col-span-2">
          <CardContent className="h-[520px] p-0">
            <TrackingMap geofences={geofences} center={[-3.5, 108]} zoom={5} height="520px" />
          </CardContent>
        </Card>
        <div className="space-y-3">
          <Card>
            <CardHeader>
              <CardTitle>All Geofences</CardTitle>
            </CardHeader>
            <CardContent className="max-h-64 space-y-1 overflow-y-auto p-2">
              {geofences.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setSelectedId(g.id)}
                  className={cn('flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left text-sm hover:bg-slate-50', selectedId === g.id && 'bg-brand-50')}
                >
                  <span className="font-medium text-navy-800">{g.name}</span>
                  <Badge variant={g.type === 'PORT' ? 'brand' : 'success'}>{g.type}</Badge>
                </button>
              ))}
            </CardContent>
          </Card>
          {selected && (
            <Card>
              <CardHeader>
                <CardTitle>Geofence Detail</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <Row label="Name" value={selected.name} />
                <Row label="Type" value={selected.type} />
                <Row label="Radius" value={`${(selected.radiusMeters / 1000).toFixed(1)} km`} />
                <Row label="Status" value={selected.status} />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-navy-800">{value}</span>
    </div>
  )
}
