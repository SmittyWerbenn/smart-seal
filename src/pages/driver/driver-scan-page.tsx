import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDataStore } from '@/store/dataStore'
import { useCurrentDriver } from '@/hooks/useCurrentDriver'
import { SealScanFlow } from '@/components/shared/seal-scan-flow'
import { translate } from '@/i18n'

export default function DriverScanPage() {
  const navigate = useNavigate()
  const driver = useCurrentDriver()
  const assignments = useDataStore((s) => s.driverAssignments)
  const containers = useDataStore((s) => s.containers)
  const [message, setMessage] = useState<string | null>(null)

  // Scanning opens tracking only for containers assigned to this driver.
  const openTracking = (containerId: string) => {
    const container = containers.find((c) => c.id === containerId)
    const mine = assignments.find((a) => a.driverId === driver?.id && a.containerId === containerId && a.status === 'ACTIVE')
    if (mine) {
      navigate(`/driver/shipments/${mine.shipmentId}`)
      return
    }
    setMessage(`${container?.number ?? 'Container ini'} tidak di-assign kepada Anda. Hubungi Control Tower.`)
  }

  return (
    <div className="space-y-4 p-4">
      <div>
        <h1 className="text-lg font-semibold text-navy-900">{translate('ui.scanSealContainer')}</h1>
        <p className="text-sm text-slate-500">{translate('ui.smartSealOpensTrackingBasic')}</p>
      </div>
      {message && <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-900">{message}</p>}
      <SealScanFlow onViewLiveTracking={openTracking} />
    </div>
  )
}
