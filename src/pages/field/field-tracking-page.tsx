import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { WifiOff } from 'lucide-react'
import { useDataStore } from '@/store/dataStore'
import { TrackingMap } from '@/components/map/tracking-map'
import { ContainerStatusBadge } from '@/components/shared/status-badge'
import { Select } from '@/components/ui/input'
import { EmptyState } from '@/components/shared/states'
import { formatDateTime } from '@/lib/utils'
import { translate } from '@/i18n'

export default function FieldTrackingPage() {
  const containers = useDataStore((s) => s.containers)
  const [params] = useSearchParams()
  const preselect = params.get('container')
  const inTransit = containers.filter((c) => c.status.includes('IN_TRANSIT') || c.status === 'SEALED')
  const [selectedId, setSelectedId] = useState(preselect ?? inTransit[0]?.id ?? containers[0]?.id)
  const container = containers.find((c) => c.id === selectedId)

  if (!container) return <EmptyState title={translate('ui.noActiveContainer')} />

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-200 bg-white p-4">
        <Select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
          {containers.slice(0, 30).map((c) => (
            <option key={c.id} value={c.id}>
              {c.number}
            </option>
          ))}
        </Select>
        <div className="mt-2 flex items-center justify-between">
          <ContainerStatusBadge status={container.status} />
          <span className="text-xs text-slate-500">Updated {formatDateTime(container.lastUpdate)}</span>
        </div>
      </div>
      <div className="flex-1">
        {container.trackingMode === 'NONE' ? (
          <EmptyState icon={WifiOff} title={translate('ui.notTrackable')} description={translate('ui.thisContainerUsesABasic2')} />
        ) : (
          <TrackingMap containers={[container]} height="100%" />
        )}
      </div>
    </div>
  )
}
