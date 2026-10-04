import { useMemo, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label, Select } from '@/components/ui/input'
import { useDataStore } from '@/store/dataStore'
import { driverAssignmentService } from '@/services/driverAssignmentService'
import { translate } from '@/i18n'
import type { Container } from '@/types'

interface AssignDriverStepProps {
  container: Container
  onDone: () => void
}

/** Stuffing step after the seal is fitted: pick the driver and truck for this container's shipment. */
export function AssignDriverStep({ container, onDone }: AssignDriverStepProps) {
  const drivers = useDataStore((s) => s.drivers)
  const vehicles = useDataStore((s) => s.vehicles)
  const assignments = useDataStore((s) => s.driverAssignments)
  const shipments = useDataStore((s) => s.shipments)
  const shipment = shipments.find((s) => s.id === container.shipmentId)
  const [driverId, setDriverId] = useState('')
  const [vehicleId, setVehicleId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const availableDrivers = useMemo(() => drivers.filter((d) => d.status === 'AVAILABLE'), [drivers])
  const busyVehicles = useMemo(() => new Set(assignments.filter((a) => a.status === 'ACTIVE').map((a) => a.vehicleId)), [assignments])
  const freeVehicles = vehicles.filter((v) => !busyVehicles.has(v.id))

  const assign = async () => {
    if (!shipment) return
    setBusy(true)
    setError(null)
    const result = await driverAssignmentService.assign({ driverId, vehicleId, shipmentId: shipment.id })
    setBusy(false)
    if (!result.ok) {
      setError(result.error ?? translate('misc.assignFailed'))
      return
    }
    onDone()
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">{translate('misc.assignDriverHint')}</p>
      {shipment && (
        <div className="rounded-md bg-slate-50 p-3 text-sm text-navy-800">
          <p className="font-mono font-semibold">{shipment.id} · {container.number}</p>
          <p className="flex items-center gap-1.5 text-slate-600">
            {shipment.originCity} <ArrowRight size={12} /> {shipment.destinationCity}
          </p>
        </div>
      )}
      {availableDrivers.length === 0 && <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-900">{translate('misc.noAvailableDrivers')}</p>}
      <div>
        <Label htmlFor="stuffing-driver">Driver</Label>
        <Select id="stuffing-driver" value={driverId} onChange={(e) => setDriverId(e.target.value)}>
          <option value="">{translate('misc.selectDriverAvailable')}</option>
          {availableDrivers.map((d) => (
            <option key={d.id} value={d.id}>{d.name} ({d.driverId})</option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="stuffing-vehicle">{translate('ui.vehicle')}</Label>
        <Select id="stuffing-vehicle" value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
          <option value="">{translate('misc.selectVehicle')}</option>
          {freeVehicles.map((v) => (
            <option key={v.id} value={v.id}>{v.plate} · {v.vehicleType} · {v.capacityTon} ton</option>
          ))}
        </Select>
      </div>
      {error && <p className="text-sm text-critical-500">{error}</p>}
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onDone}>{translate('misc.skipAssignLater')}</Button>
        <Button disabled={busy || !driverId || !vehicleId || !shipment} onClick={assign}>
          {busy ? translate('misc.savingDriver') : translate('misc.assignAndContinue')}
        </Button>
      </div>
    </div>
  )
}
