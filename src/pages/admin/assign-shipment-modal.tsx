import { useMemo, useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Label, Select } from '@/components/ui/input'
import { useDataStore } from '@/store/dataStore'
import { driverAssignmentService, activeAssignmentForShipment } from '@/services/driverAssignmentService'
import { ArrowRight } from 'lucide-react'
import { translate } from '@/i18n'

interface AssignShipmentModalProps {
  open: boolean
  onClose: () => void
  presetDriverId?: string // Driver.id when opened from a driver row
}

export function AssignShipmentModal({ open, onClose, presetDriverId }: AssignShipmentModalProps) {
  const drivers = useDataStore((s) => s.drivers)
  const vehicles = useDataStore((s) => s.vehicles)
  const shipments = useDataStore((s) => s.shipments)
  const containers = useDataStore((s) => s.containers)
  const routes = useDataStore((s) => s.routes)
  const assignments = useDataStore((s) => s.driverAssignments)
  // Parent mounts this modal only while it is open, so the form starts empty each time.
  const [driverId, setDriverId] = useState(presetDriverId ?? '')
  const [vehicleId, setVehicleId] = useState('')
  const [shipmentId, setShipmentId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const availableDrivers = drivers.filter((d) => d.status === 'AVAILABLE' || d.id === presetDriverId)
  const busyVehicles = new Set(assignments.filter((a) => a.status === 'ACTIVE').map((a) => a.vehicleId))
  const freeVehicles = vehicles.filter((v) => !busyVehicles.has(v.id))
  const selectableShipments = shipments.filter((s) => s.status !== 'DELIVERED')

  const driver = drivers.find((d) => d.id === driverId)
  const shipment = shipments.find((s) => s.id === shipmentId)
  const container = containers.find((c) => c.id === shipment?.containerId)
  const route = routes.find((r) => r.id === container?.routeId)
  const reassignFrom = shipment ? activeAssignmentForShipment(shipment.id) : undefined
  const previousDriver = reassignFrom ? drivers.find((d) => d.id === reassignFrom.driverId) : undefined

  // Pre-fill vehicle with the driver's own unit when it is free.
  const defaultVehicle = useMemo(() => {
    if (!driver?.vehicleId) return ''
    return freeVehicles.some((v) => v.id === driver.vehicleId) ? driver.vehicleId : ''
  }, [driver, freeVehicles])
  const effectiveVehicle = vehicleId || defaultVehicle

  const submit = async () => {
    setBusy(true)
    setError(null)
    const result = await driverAssignmentService.assign({ driverId, vehicleId: effectiveVehicle, shipmentId })
    setBusy(false)
    if (!result.ok) {
      setError(result.error ?? 'Assignment gagal.')
      return
    }
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={translate('ui.assignShipment')}
      className="max-w-lg"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>{translate('ui.cancel2')}</Button>
          <Button onClick={submit} disabled={busy || !driverId || !effectiveVehicle || !shipmentId}>
            {busy ? 'Menyimpan…' : 'Assign'}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <Label htmlFor="as-driver">{translate('ui.driver2')}</Label>
          <Select id="as-driver" value={driverId} onChange={(e) => setDriverId(e.target.value)}>
            <option value="">{translate('ui.selectDriverStatusAvailable')}</option>
            {availableDrivers.map((d) => (
              <option key={d.id} value={d.id}>{d.name} ({d.driverId})</option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="as-vehicle">{translate('ui.vehicle3')}</Label>
          <Select id="as-vehicle" value={effectiveVehicle} onChange={(e) => setVehicleId(e.target.value)}>
            <option value="">{translate('ui.selectVehicle')}</option>
            {freeVehicles.map((v) => (
              <option key={v.id} value={v.id}>{v.plate} · {v.vehicleType} · {v.capacityTon} ton</option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="as-shipment">{translate('ui.shipment2')}</Label>
          <Select id="as-shipment" value={shipmentId} onChange={(e) => setShipmentId(e.target.value)}>
            <option value="">{translate('ui.selectShipment')}</option>
            {selectableShipments.map((s) => {
              const holder = activeAssignmentForShipment(s.id)
              return (
                <option key={s.id} value={s.id}>
                  {s.id} · {s.originCity} → {s.destinationCity}{holder ? ` (reassign dari ${drivers.find((d) => d.id === holder.driverId)?.driverId ?? '—'})` : ''}
                </option>
              )
            })}
          </Select>
        </div>

        {shipment && container && (
          <div className="rounded-lg bg-slate-50 p-3 text-sm text-navy-800">
            <p className="font-mono font-semibold">{container.number}</p>
            <p className="flex items-center gap-1.5 text-slate-600">
              {shipment.originCity} <ArrowRight size={12} /> {shipment.destinationCity}
              {route && <span className="text-xs text-slate-400">· {route.name}</span>}
            </p>
            {previousDriver && (
              <p className="mt-2 rounded bg-amber-50 p-2 text-xs text-amber-900">
                Shipment ini sedang dipegang {previousDriver.name}. Assign akan me-reassign dan melepas driver sebelumnya.
              </p>
            )}
          </div>
        )}
        {driver && <p className="text-xs text-slate-500">Driver: {driver.name} · {driver.phone}</p>}
        {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      </div>
    </Modal>
  )
}
