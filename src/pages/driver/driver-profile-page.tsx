import { useNavigate } from 'react-router-dom'
import { Smartphone, LogOut, ShieldAlert } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useDataStore } from '@/store/dataStore'
import { useCurrentDriver } from '@/hooks/useCurrentDriver'
import { DriverStatusBadge } from '@/components/driver/driver-status-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { driverService } from '@/services/driverService'
import { useState } from 'react'
import { translate } from '@/i18n'

export default function DriverProfilePage() {
  const driver = useCurrentDriver()
  const vehicles = useDataStore((s) => s.vehicles)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()
  const [message, setMessage] = useState<string | null>(null)
  if (!driver) return null

  const vehicle = vehicles.find((v) => v.id === driver.vehicleId)
  const online = driver.status !== 'OFFLINE'

  const toggle = async () => {
    const result = await driverService.setOwnOnline(driver.id, !online)
    setMessage(result.ok ? null : (result.error ?? 'Gagal mengubah status.'))
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-navy-900">{driver.name}</h1>
          <p className="font-mono text-sm text-slate-500">{driver.driverId}</p>
        </div>
        <DriverStatusBadge status={driver.status} />
      </div>

      <Card>
        <CardContent className="space-y-3 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-navy-900">{translate('ui.onlineStatus')}</p>
              <p className="text-xs text-slate-500">{translate('ui.whenOfflineCheckpointsAreDisabled')}</p>
            </div>
            <button
              onClick={toggle}
              disabled={driver.status === 'SUSPENDED' || driver.status === 'ON_DELIVERY'}
              className={online ? 'h-7 w-12 rounded-full bg-success-500 p-0.5 transition disabled:opacity-50' : 'h-7 w-12 rounded-full bg-slate-300 p-0.5 transition disabled:opacity-50'}
              aria-label={translate('ui.toggleOnline')}
            >
              <span className={online ? 'block h-6 w-6 translate-x-5 rounded-full bg-white transition' : 'block h-6 w-6 rounded-full bg-white transition'} />
            </button>
          </div>
          {driver.status === 'ON_DELIVERY' && <p className="text-xs text-slate-500">{translate('ui.completeTheActiveShipmentTo')}</p>}
          {message && <p className="text-sm text-red-700">{message}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid grid-cols-2 gap-4 py-4 text-sm">
          <Field label={translate('ui.phoneNo')} value={driver.phone} />
          <Field label={translate('ui.email')} value={driver.email ?? '—'} />
          <Field label={translate('ui.licenseNo')} value={driver.licenseNumber ?? '—'} />
          <Field label={translate('ui.validUntil')} value={driver.licenseExpiry ?? '—'} />
          <Field label={translate('ui.emergencyContact2')} value={driver.emergencyContact ?? '—'} />
          <Field label={translate('ui.vehicle')} value={vehicle ? `${vehicle.plate} · ${vehicle.vehicleType}` : '—'} />
        </CardContent>
      </Card>
      <p className="flex items-start gap-2 text-xs text-slate-500">
        <ShieldAlert size={14} className="mt-0.5 shrink-0" /> {translate('ui.administrativeDataCanOnlyBe')}
      </p>

      <Button variant="secondary" className="min-h-11 w-full" onClick={() => navigate('/field')}>
        <Smartphone size={16} /> {translate('ui.openFieldAppMobile')}
      </Button>
      <Button
        variant="danger"
        className="min-h-11 w-full"
        onClick={() => {
          logout()
          navigate('/driver')
        }}
      >
        <LogOut size={16} /> {translate('ui.logout')}
      </Button>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="break-words text-navy-900">{value}</p>
    </div>
  )
}
