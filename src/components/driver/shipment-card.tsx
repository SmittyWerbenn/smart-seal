import { ArrowRight, Anchor } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ContainerStatusBadge } from '@/components/shared/status-badge'
import { Button } from '@/components/ui/button'
import { CHECKPOINT_SEQUENCE } from '@/lib/driver-workflow'
import { formatDate } from '@/lib/utils'
import type { Container, CheckpointType, Shipment } from '@/types'
import { translate } from '@/i18n'

interface ShipmentCardProps {
  shipment: Shipment
  container?: Container
  sealId: string | null
  completed: CheckpointType[]
  active: boolean
  showCheckpointAction?: boolean // Home shows one large CTA instead of a button per card
}

/** One assigned shipment: AWB, container, seal, route, ETA, status and checkpoint progress. */
export function ShipmentCard({ shipment, container, sealId, completed, active, showCheckpointAction = true }: ShipmentCardProps) {
  const navigate = useNavigate()
  const progress = Math.round((completed.length / CHECKPOINT_SEQUENCE.length) * 100)
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{shipment.id}</p>
          <p className="font-mono text-base font-semibold text-navy-900">{container?.number ?? '—'}</p>
        </div>
        {container && <ContainerStatusBadge status={container.status} />}
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div>
          <dt className="text-xs text-slate-500">{translate('ui.seal')}</dt>
          <dd className="font-mono text-navy-800">{sealId ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">{translate('ui.eta')}</dt>
          <dd className="text-navy-800">{container ? formatDate(container.eta) : '—'}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-xs text-slate-500">{translate('ui.route')}</dt>
          <dd className="flex items-center gap-1.5 text-navy-800">
            {shipment.originCity} <ArrowRight size={12} className="text-slate-400" /> {shipment.destinationCity}
          </dd>
        </div>
      </dl>

      <div className="mt-3">
        <div className="mb-1 flex justify-between text-xs text-slate-500">
          <span>{translate('ui.checkpointProgress')}</span>
          <span>{completed.length}/{CHECKPOINT_SEQUENCE.length}</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-brand-600" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <Button variant="secondary" className="min-h-11 w-full" onClick={() => navigate(`/driver/shipments/${shipment.id}`)}>
          <Anchor size={16} /> {translate('ui.detail')}
        </Button>
        {active && showCheckpointAction && (
          <Button className="min-h-11 w-full" onClick={() => navigate(`/driver/shipments/${shipment.id}?checkpoint=1`)}>
            {translate('ui.updateCheckpoint')}
          </Button>
        )}
      </div>
    </div>
  )
}
