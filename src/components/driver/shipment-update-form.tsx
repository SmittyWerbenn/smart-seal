import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, Label, Select, Textarea } from '@/components/ui/input'
import { shipmentUpdateService, type ShipmentRemark } from '@/services/shipmentUpdateService'
import { formatDateTime } from '@/lib/utils'
import { translate } from '@/i18n'
import type { Container, DriverAssignment, Shipment } from '@/types'

interface ShipmentUpdateFormProps {
  assignment: DriverAssignment
  shipment: Shipment
  container: Container
}

/** Driver-side shipment status: remark, ETA and note. Shown only while the assignment is active. */
export function ShipmentUpdateForm({ assignment, shipment, container }: ShipmentUpdateFormProps) {
  const [remark, setRemark] = useState<ShipmentRemark>(shipment.driverRemark ?? 'ON_TIME')
  const [eta, setEta] = useState(() => toLocalInput(container.eta))
  const [note, setNote] = useState(shipment.driverNote ?? '')
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)

  if (assignment.status !== 'ACTIVE') return null

  const save = async () => {
    setBusy(true)
    setError(null)
    setSaved(false)
    const result = await shipmentUpdateService.updateShipment({
      assignmentId: assignment.id,
      remark,
      eta: eta ? new Date(eta).toISOString() : undefined,
      note,
    })
    setBusy(false)
    if (!result.ok) {
      setError(result.error ?? translate('common.somethingWrong'))
      return
    }
    setSaved(true)
  }

  return (
    <Card>
      <CardContent className="space-y-3 py-4">
        <div>
          <p className="text-sm font-semibold text-navy-900">{translate('misc.shipUpdateTitle')}</p>
          <p className="text-xs text-slate-500">{translate('misc.shipUpdateHint')}</p>
        </div>
        <div>
          <Label htmlFor="ship-remark">{translate('ui.status')}</Label>
          <Select id="ship-remark" value={remark} onChange={(e) => setRemark(e.target.value as ShipmentRemark)}>
            <option value="ON_TIME">{translate('misc.remarkOnTime')}</option>
            <option value="DELAYED">{translate('misc.remarkDelayed')}</option>
            <option value="ISSUE">{translate('misc.remarkIssue')}</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="ship-eta">{translate('misc.newEta')}</Label>
          <Input id="ship-eta" type="datetime-local" value={eta} onChange={(e) => setEta(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="ship-note">{translate('misc.updateNote')}</Label>
          <Textarea id="ship-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        {error && <p className="rounded-md bg-red-50 p-2.5 text-sm text-red-700">{error}</p>}
        {saved && <p className="rounded-md bg-green-50 p-2.5 text-sm text-green-700">{translate('misc.shipmentUpdated')}</p>}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] text-slate-400">
            {shipment.driverUpdatedAt ? translate('misc.lastUpdatedBy', { when: formatDateTime(shipment.driverUpdatedAt) }) : ''}
          </span>
          <Button className="min-h-11" onClick={save} disabled={busy}>{translate('misc.saveShipmentUpdate')}</Button>
        </div>
      </CardContent>
    </Card>
  )
}

function toLocalInput(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
