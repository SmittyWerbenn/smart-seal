import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, ScanLine, ShieldAlert, ShieldCheck, Unlock, Wifi, WifiOff } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Input, Label } from '@/components/ui/input'
import { Switch } from '@/components/ui/progress'
import { BatteryIndicator, SignalIndicator } from '@/components/shared/indicators'
import { DeviceStatusBadge } from '@/components/shared/status-badge'
import { BarcodeGraphic } from '@/components/shared/barcode-graphic'
import { barcodeFor } from '@/lib/barcode'
import { useDataStore } from '@/store/dataStore'
import { offlineUnlock, requestAndConfirmUnlock, simulateLowBattery, simulateOffline, simulateTamper } from '@/lib/actions'
import type { Container, ESealDevice } from '@/types'

const OFFLINE_PIN = '123456'

function RegularSealTab({ container }: { container: Container }) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const isUnlocked = container.isUnlocked

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

      <Card>
        <CardHeader>
          <CardTitle>Manual Unlock</CardTitle>
        </CardHeader>
        <CardContent>
          {isUnlocked ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 rounded-md bg-success-100 p-3 text-sm text-green-800">
                <Unlock size={16} /> Container unlocked (manual supervisor override).
              </div>
              <div className="flex items-start gap-2 rounded-md bg-slate-100 p-3 text-xs text-slate-600">
                <Lock size={14} className="mt-0.5 shrink-0" />
                Basic Seal {container.regularSealId} flagged as <span className="font-medium text-navy-700">unsealed</span> — it's a single-use
                tag with no electronics, so it cannot be reused on another container.
              </div>
            </div>
          ) : (
            <>
              <p className="mb-3 text-xs text-slate-500">
                Since this seal cannot be tracked, destination-geofence detection is unavailable. Unlock requires a supervisor to
                manually confirm the container has reached its destination.
              </p>
              <Button onClick={() => setConfirmOpen(true)}>
                <ShieldCheck size={14} /> Manual Unlock (Supervisor Override)
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Confirm Manual Unlock"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button
              onClick={() => {
                requestAndConfirmUnlock(container.id)
                setConfirmOpen(false)
              }}
            >
              Confirm Unlock
            </Button>
          </>
        }
      >
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between"><dt className="text-slate-500">Container</dt><dd className="font-medium">{container.number}</dd></div>
          <div className="flex justify-between"><dt className="text-slate-500">Seal</dt><dd className="font-medium">{container.regularSealId ?? '—'}</dd></div>
          <div className="flex justify-between"><dt className="text-slate-500">Verification</dt><dd className="font-medium">Manual (no GPS available)</dd></div>
        </dl>
      </Modal>
    </div>
  )
}

export function SealsTab({ container, device }: { container: Container; device?: ESealDevice }) {
  const navigate = useNavigate()
  const updateContainer = useDataStore((s) => s.updateContainer)
  const [requestOpen, setRequestOpen] = useState(false)
  const [offlineOpen, setOfflineOpen] = useState(false)
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState('')
  const [offlineSuccess, setOfflineSuccess] = useState(false)

  const canUnlock = container.insideDestinationGeofence && !container.isUnlocked
  const isUnlocked = container.isUnlocked

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

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Destination Unlock</CardTitle>
        </CardHeader>
        <CardContent>
          {isUnlocked ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 rounded-md bg-success-100 p-3 text-sm text-green-800">
                <Unlock size={16} /> Container unlocked{container.offlineMode ? ' via offline PIN' : ''}.
              </div>
              <div className="flex items-start gap-2 rounded-md bg-slate-100 p-3 text-xs text-slate-600">
                <ShieldCheck size={14} className="mt-0.5 shrink-0" />
                Smart Seal {container.eSealId} has been <span className="font-medium text-navy-700">detached and returned to the available pool</span> for
                reuse — track its pickup in{' '}
                <button onClick={() => navigate('/reverse-logistics')} className="font-medium text-brand-600 hover:underline">
                  Reverse Logistics
                </button>
                .
              </div>
            </div>
          ) : (
            <>
              <div className={`mb-3 flex items-center gap-2 rounded-md p-3 text-sm ${container.insideDestinationGeofence ? 'bg-success-100 text-green-800' : 'bg-slate-100 text-slate-600'}`}>
                {container.insideDestinationGeofence ? <Wifi size={16} /> : <WifiOff size={16} />}
                {container.insideDestinationGeofence ? 'Inside destination geofence' : 'Outside destination geofence'}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button disabled={!canUnlock} onClick={() => setRequestOpen(true)}>
                  <Unlock size={14} /> Request Unlock
                </Button>
                <Button variant="outline" onClick={() => setOfflineOpen(true)}>
                  <WifiOff size={14} /> Offline Unlock
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Modal
        open={requestOpen}
        onClose={() => setRequestOpen(false)}
        title="Confirm Unlock"
        footer={
          <>
            <Button variant="secondary" onClick={() => setRequestOpen(false)}>Cancel</Button>
            <Button
              onClick={() => {
                requestAndConfirmUnlock(container.id)
                setRequestOpen(false)
              }}
            >
              Confirm Unlock
            </Button>
          </>
        }
      >
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between"><dt className="text-slate-500">Container</dt><dd className="font-medium">{container.number}</dd></div>
          <div className="flex justify-between"><dt className="text-slate-500">Current location</dt><dd className="font-medium">{container.currentLocation.lat.toFixed(3)}, {container.currentLocation.lng.toFixed(3)}</dd></div>
          <div className="flex justify-between"><dt className="text-slate-500">Geofence status</dt><dd className="font-medium text-green-700">Inside destination geofence</dd></div>
          <div className="flex justify-between"><dt className="text-slate-500">Seal status</dt><dd className="font-medium">{container.eSealId ?? '—'} armed</dd></div>
        </dl>
      </Modal>

      <Modal
        open={offlineOpen}
        onClose={() => {
          setOfflineOpen(false)
          setOfflineSuccess(false)
          setPin('')
          setPinError('')
        }}
        title="Offline Unlock"
      >
        {offlineSuccess ? (
          <div className="rounded-md bg-success-100 p-3 text-sm text-green-800">Offline Unlock Successful.</div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-md bg-slate-100 p-3 text-sm text-slate-600">
              <WifiOff size={16} /> No Internet Connection
            </div>
            <div>
              <Label htmlFor="pin">Enter static PIN</Label>
              <Input id="pin" value={pin} onChange={(e) => { setPin(e.target.value); setPinError('') }} placeholder="6-digit PIN" maxLength={6} />
              {pinError && <p className="mt-1 text-xs text-critical-500">{pinError}</p>}
              <p className="mt-1 text-[11px] text-slate-400">Demo PIN: {OFFLINE_PIN}</p>
            </div>
            <Button
              className="w-full"
              onClick={() => {
                if (pin === OFFLINE_PIN) {
                  offlineUnlock(container.id)
                  setOfflineSuccess(true)
                } else {
                  setPinError('Incorrect PIN. Please try again.')
                }
              }}
            >
              Unlock
            </Button>
          </div>
        )}
      </Modal>

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
