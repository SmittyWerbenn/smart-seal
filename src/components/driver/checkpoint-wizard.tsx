import { useMemo, useState } from 'react'
import { MapPin, Clock } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Label, Textarea } from '@/components/ui/input'
import { useDataStore } from '@/store/dataStore'
import { CHECKPOINT_META, completedCheckpointTypes, locationForCheckpoint, nextCheckpoint, requiresSealVerification } from '@/lib/driver-workflow'
import { checkpointService, sealStatusFor, type SealStatus } from '@/services/checkpointService'
import { SealVerificationPanel } from './seal-verification-panel'
import { PodForm, type PodFormValue } from './pod-form'
import { EMPTY_POD } from './pod-defaults'
import { formatDateTime } from '@/lib/utils'
import type { DriverAssignment } from '@/types'
import { translate } from '@/i18n'
import { useGpsPosition } from '@/hooks/useGpsPosition'

interface CheckpointWizardProps {
  open: boolean
  onClose: () => void
  assignment: DriverAssignment
  receiverHint?: string
}

/** Guided checkpoint confirmation. Shows only the next allowed step; the service re-checks everything. */
export function CheckpointWizard({ open, onClose, assignment, receiverHint }: CheckpointWizardProps) {
  const checkpoints = useDataStore((s) => s.driverCheckpoints)
  const shipment = useDataStore((s) => s.shipments.find((x) => x.id === assignment.shipmentId))
  const container = useDataStore((s) => s.containers.find((c) => c.id === assignment.containerId))
  const routes = useDataStore((s) => s.routes)
  const [notes, setNotes] = useState('')
  const [sealVerified, setSealVerified] = useState(false)
  const [pod, setPod] = useState<PodFormValue>(EMPTY_POD)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  // Device GPS is requested when the wizard opens. A failure keeps the simulated point, shown to the driver.
  const gps = useGpsPosition(open)

  const completed = useMemo(() => completedCheckpointTypes(checkpoints, assignment.id), [checkpoints, assignment.id])
  const next = nextCheckpoint(completed)

  if (!container || !shipment || !next) return null

  const route = routes.find((r) => r.id === container.routeId)
  const location = locationForCheckpoint(next, container, route)
  const seal: SealStatus = sealStatusFor(container)
  const needsSeal = requiresSealVerification(next)
  const isDelivery = next === 'DELIVERED'

  const confirm = async () => {
    setSubmitting(true)
    setError(null)
    const result = await checkpointService.confirmCheckpoint({
      assignmentId: assignment.id,
      type: next,
      notes,
      sealVerified,
      pod: isDelivery ? pod : undefined,
      gps: gps.state.status === 'ok' ? { lat: gps.state.fix.lat, lng: gps.state.fix.lng, accuracyM: gps.state.fix.accuracyM } : undefined,
    })
    setSubmitting(false)
    if (!result.ok) {
      setError(result.error ?? 'Checkpoint gagal dikonfirmasi.')
      return
    }
    setNotes('')
    setSealVerified(false)
    setPod(EMPTY_POD)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isDelivery ? translate('misc.completeDelivery') : translate('misc.updateCheckpoint')}
      className="max-w-lg"
      footer={
        <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" className="min-h-11" onClick={onClose}>
            {translate('ui.cancel2')}
          </Button>
          <Button className="min-h-11" onClick={confirm} disabled={submitting}>
            {submitting ? translate('misc.savingDriver') : isDelivery ? translate('misc.confirmDelivery') : translate('misc.confirmCheckpoint')}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="rounded-lg bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">{translate('ui.container')}</p>
          <p className="font-semibold text-navy-900">{container.number}</p>
          <p className="mt-3 text-xs uppercase tracking-wide text-slate-500">{translate('ui.checkpoint')}</p>
          <p className="text-lg font-semibold text-brand-700">{CHECKPOINT_META[next].label}</p>
          <div className="mt-2 flex flex-col gap-1 text-sm text-navy-800">
            <span className="flex items-center gap-1.5"><MapPin size={14} className="text-slate-400" /> {location.name}</span>
            {gps.state.status === 'loading' && <span className="text-[12px] text-slate-500">{translate('misc.gpsAcquiring')}</span>}
            {gps.state.status === 'ok' && (
              <span className="text-[12px] text-success-600">
                {translate('misc.gpsSourceGps')}: {gps.state.fix.lat.toFixed(5)}, {gps.state.fix.lng.toFixed(5)} · {translate('misc.gpsAccuracy', { m: gps.state.fix.accuracyM })}
              </span>
            )}
            {gps.state.status === 'error' && (
              <span className="flex flex-wrap items-center gap-2 text-[12px] text-amber-700">
                {translate(gps.state.reason === 'denied' ? 'misc.gpsDenied' : gps.state.reason === 'timeout' ? 'misc.gpsTimeout' : gps.state.reason === 'unsupported' ? 'misc.gpsUnsupported' : 'misc.gpsUnavailable')}
                <button type="button" onClick={gps.retry} className="font-medium underline">{translate('misc.gpsRetry')}</button>
              </span>
            )}
            <span className="flex items-center gap-1.5"><Clock size={14} className="text-slate-400" /> {formatDateTime(new Date().toISOString())}</span>
          </div>
        </div>

        {needsSeal && <SealVerificationPanel status={seal} verified={sealVerified} onVerified={setSealVerified} />}

        {isDelivery && <PodForm value={pod} onChange={setPod} receiverHint={receiverHint} />}

        <div>
          <Label htmlFor="checkpoint-notes">{translate('ui.notesOptional')}</Label>
          <Textarea id="checkpoint-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={translate('ui.eGQueuedAtGate')} />
        </div>

        {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      </div>
    </Modal>
  )
}
