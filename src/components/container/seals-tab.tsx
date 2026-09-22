import { useNavigate } from 'react-router-dom'
import { Lock, ScanLine, ShieldAlert, WifiOff } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/progress'
import { BatteryIndicator, SignalIndicator } from '@/components/shared/indicators'
import { DeviceStatusBadge } from '@/components/shared/status-badge'
import { BarcodeGraphic } from '@/components/shared/barcode-graphic'
import { barcodeFor } from '@/lib/barcode'
import { useDataStore } from '@/store/dataStore'
import { simulateLowBattery, simulateOffline, simulateTamper } from '@/lib/actions'
import { UnlockPanel } from './unlock-panel'
import type { Container, ESealDevice } from '@/types'

function RegularSealTab({ container }: { container: Container }) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Basic Seal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center justify-between rounded-md border border-slate-100 p-3">
            <div>
              <p className="font-medium text-navy-800">Basic Seal</p>
              <p className="text-xs text-slate-500">{container.regularSealId ?? 'Not attached'}</p>
            </div>
            <Lock size={16} className="text-slate-400" />
          </div>
          {container.regularSealId && (
            <div className="flex justify-center rounded-md border border-slate-100 bg-white py-3">
              <BarcodeGraphic code={barcodeFor(container.regularSealId)} />
            </div>
          )}
          <div className="flex items-start gap-2 rounded-md bg-slate-100 p-3 text-xs text-slate-600">
            <ScanLine size={16} className="mt-0.5 shrink-0" />
            No IoT device is attached to this seal — there is no battery, signal or live GPS position to report. Scan the seal on-site
            (Field App → Scanner) to verify it matches this container's manifest, or check the Cargo tab for full contents.
          </div>
        </CardContent>
      </Card>

      <UnlockPanel container={container} />
    </div>
  )
}

export function SealsTab({ container, device }: { container: Container; device?: ESealDevice }) {
  const navigate = useNavigate()
  const updateContainer = useDataStore((s) => s.updateContainer)

  if (container.securityMode === 'BASIC_SEAL') return <RegularSealTab container={container} />

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Seal Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center justify-between rounded-md border border-slate-100 p-3">
            <div>
              <p className="font-medium text-navy-800">Smart E-Seal</p>
              <p className="text-xs text-slate-500">{container.eSealId ?? 'Not attached'}</p>
            </div>
            {container.eSealId && (
              <Button size="sm" variant="secondary" onClick={() => navigate(`/eseals/${container.eSealId}`)}>
                View device
              </Button>
            )}
          </div>
          {container.securityMode === 'DUAL_SEAL' && (
            <div className="flex items-center justify-between rounded-md border border-slate-100 p-3">
              <div>
                <p className="font-medium text-navy-800">Bolt Seal</p>
                <p className="text-xs text-slate-500">{container.boltSealId ?? 'Not attached'}</p>
              </div>
              <Lock size={16} className="text-slate-400" />
            </div>
          )}
          {device && (
            <div className="grid grid-cols-2 gap-3 rounded-md bg-slate-50 p-3">
              <div>
                <p className="text-xs text-slate-500">Battery</p>
                <BatteryIndicator value={device.battery} />
              </div>
              <div>
                <p className="text-xs text-slate-500">Signal</p>
                <SignalIndicator value={device.signal} />
              </div>
              <div>
                <p className="text-xs text-slate-500">Status</p>
                <DeviceStatusBadge status={device.status} />
              </div>
              <div>
                <p className="text-xs text-slate-500">Lifecycle</p>
                <p className="text-xs font-medium text-navy-800">{device.lifecycle.replaceAll('_', ' ')}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Device Simulation</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <Button variant="danger" size="sm" onClick={() => simulateTamper(container.id)}>
            <ShieldAlert size={14} /> Simulate Tamper
          </Button>
          <Button variant="outline" size="sm" onClick={() => simulateLowBattery(container.id)}>
            Simulate Low Battery
          </Button>
          <Button variant="secondary" size="sm" onClick={() => simulateOffline(container.id)}>
            <WifiOff size={14} /> Simulate Offline
          </Button>
        </CardContent>
      </Card>

      <div className="lg:col-span-2">
        <UnlockPanel container={container} />
      </div>

      <OfflineModeToggle containerId={container.id} enabled={container.offlineMode} onToggle={(v) => updateContainer(container.id, { offlineMode: v })} />
    </div>
  )
}

function OfflineModeToggle({ enabled, onToggle }: { containerId: string; enabled: boolean; onToggle: (v: boolean) => void }) {
  return (
    <Card className="lg:col-span-2">
      <CardContent className="flex items-center justify-between py-3">
        <div>
          <p className="text-sm font-medium text-navy-800">Offline Mode</p>
          <p className="text-xs text-slate-500">Simulate a no-connectivity environment to test PIN-based unlock.</p>
        </div>
        <Switch checked={enabled} onChange={onToggle} />
      </CardContent>
    </Card>
  )
}
