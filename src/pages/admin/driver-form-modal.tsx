import { useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input, Label, Select, Textarea } from '@/components/ui/input'
import { useDataStore } from '@/store/dataStore'
import { driverService, type DriverInput } from '@/services/driverService'
import type { Driver, DriverStatus } from '@/types'
import { translate } from '@/i18n'

interface DriverFormModalProps {
  open: boolean
  onClose: () => void
  driver?: Driver // undefined = create
}

const EMPTY: DriverInput = {
  driverId: '',
  name: '',
  username: '',
  password: '',
  phone: '',
  email: '',
  licenseNumber: '',
  licenseExpiry: '',
  emergencyContact: '',
  vehicleId: '',
  status: 'AVAILABLE',
}

// Mounted fresh by the parent each time it opens, so form state starts from the driver record.
function initialForm(driver?: Driver): DriverInput {
  if (!driver) return EMPTY
  return {
    driverId: driver.driverId,
    name: driver.name,
    username: driver.username,
    phone: driver.phone,
    email: driver.email ?? '',
    licenseNumber: driver.licenseNumber ?? '',
    licenseExpiry: driver.licenseExpiry ?? '',
    emergencyContact: driver.emergencyContact ?? '',
    vehicleId: driver.vehicleId ?? '',
    status: driver.status,
  }
}

export function DriverFormModal({ open, onClose, driver }: DriverFormModalProps) {
  const vehicles = useDataStore((s) => s.vehicles)
  const [form, setForm] = useState<DriverInput>(() => initialForm(driver))
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const editing = !!driver

  const set = (patch: Partial<DriverInput>) => setForm((f) => ({ ...f, ...patch }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const result = editing ? await driverService.updateDriver(driver!.id, form) : await driverService.createDriver(form)
    setBusy(false)
    if (!result.ok) {
      setError(result.error ?? 'Gagal menyimpan driver.')
      return
    }
    onClose()
  }

  const statusOptions: { value: DriverStatus; label: string }[] = [
    { value: 'AVAILABLE', get label() { return translate('ui.available') } },
    { value: 'OFFLINE', get label() { return translate('ui.offline') } },
    { value: 'SUSPENDED', get label() { return translate('ui.suspended') } },
  ]
  if (driver?.status === 'ON_DELIVERY') statusOptions.unshift({ value: 'ON_DELIVERY', get label() { return translate('ui.onDeliveryAutomatic') } })

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? translate('misc.editDriverTitle', { id: driver?.driverId ?? '' }) : translate('misc.addDriverTitle')}
      className="max-w-2xl"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>{translate('ui.cancel2')}</Button>
          <Button type="submit" form="driver-form" disabled={busy}>{busy ? translate('misc.savingDriver') : translate('misc.saveDriver')}</Button>
        </div>
      }
    >
      <form id="driver-form" onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="df-driverid">{translate('ui.driverId')}</Label>
          <Input id="df-driverid" placeholder={translate('ui.drv006')} value={form.driverId} disabled={editing} onChange={(e) => set({ driverId: e.target.value.toUpperCase() })} />
        </div>
        <div>
          <Label htmlFor="df-name">{translate('ui.fullName')}</Label>
          <Input id="df-name" value={form.name} onChange={(e) => set({ name: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="df-username">{translate('ui.username2')}</Label>
          <Input id="df-username" placeholder={translate('ui.driver06')} value={form.username} disabled={editing} onChange={(e) => set({ username: e.target.value.toLowerCase() })} />
        </div>
        {!editing && (
          <div>
            <Label htmlFor="df-password">{translate('ui.password2')}</Label>
            <Input id="df-password" type="password" value={form.password ?? ''} onChange={(e) => set({ password: e.target.value })} />
          </div>
        )}
        <div>
          <Label htmlFor="df-phone">{translate('ui.phone2')}</Label>
          <Input id="df-phone" inputMode="tel" placeholder="081234567890" value={form.phone} onChange={(e) => set({ phone: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="df-email">{translate('ui.email')}</Label>
          <Input id="df-email" type="email" value={form.email ?? ''} onChange={(e) => set({ email: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="df-license">{translate('ui.licenseNumber')}</Label>
          <Input id="df-license" value={form.licenseNumber ?? ''} onChange={(e) => set({ licenseNumber: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="df-expiry">{translate('ui.licenseExpiry')}</Label>
          <Input id="df-expiry" type="date" value={form.licenseExpiry ?? ''} onChange={(e) => set({ licenseExpiry: e.target.value })} />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="df-emergency">{translate('ui.emergencyContact')}</Label>
          <Textarea id="df-emergency" rows={2} value={form.emergencyContact ?? ''} onChange={(e) => set({ emergencyContact: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="df-vehicle">{translate('ui.assignedVehicle')}</Label>
          <Select id="df-vehicle" value={form.vehicleId ?? ''} onChange={(e) => set({ vehicleId: e.target.value })}>
            <option value="">{translate('ui.noneYet')}</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>{v.plate} · {v.vehicleType}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="df-status">{translate('ui.status')}</Label>
          <Select id="df-status" value={form.status} onChange={(e) => set({ status: e.target.value as DriverStatus })}>
            {statusOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </Select>
        </div>
        {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700 sm:col-span-2">{error}</p>}
      </form>
    </Modal>
  )
}
