import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { BatteryWarning, CheckCircle2, ChevronRight, PackageCheck, ScanLine, ShieldCheck, WifiOff } from 'lucide-react'
import { useDataStore } from '@/store/dataStore'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScannerModal } from '@/components/shared/scanner-modal'
import { EmptyState } from '@/components/shared/states'
import { cn } from '@/lib/utils'
import type { SecurityMode } from '@/types'

type Step = 'container' | 'security' | 'scan' | 'battery' | 'confirm' | 'success'

export default function StuffingWizardPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const containers = useDataStore((s) => s.containers)
  const devices = useDataStore((s) => s.devices)
  const updateContainer = useDataStore((s) => s.updateContainer)
  const updateDevice = useDataStore((s) => s.updateDevice)
  const addTimelineEvent = useDataStore((s) => s.addTimelineEvent)
  const addAuditLogEntry = useDataStore((s) => s.addAuditLogEntry)

  const eligible = useMemo(() => containers.filter((c) => !c.isArmed), [containers])

  const [step, setStep] = useState<Step>(id ? 'security' : 'container')
  const [containerId, setContainerId] = useState<string | null>(id ?? null)
  const [securityMode, setSecurityMode] = useState<SecurityMode | null>(null)
  const [esealScanOpen, setEsealScanOpen] = useState(false)
  const [esealCode, setEsealCode] = useState<string | null>(null)
  const [regularCode, setRegularCode] = useState<string | null>(null)
  const [regularScanOpen, setRegularScanOpen] = useState(false)
  const [battery, setBattery] = useState(65)

  const container = containers.find((c) => c.id === containerId)
  const esealResultCode = container?.eSealId ?? `ESEAL-${container?.id.replace('CNT-', '') ?? '000000'}`
  const regularResultCode = container?.regularSealId ?? `SEAL-${container?.id.replace('CNT-', '') ?? '000000'}`

  const sealsComplete = securityMode === 'BASIC_SEAL' ? !!regularCode : !!esealCode
  const batteryOk = battery >= 80

  const reset = () => {
    setStep('container')
    setContainerId(null)
    setSecurityMode(null)
    setEsealCode(null)
    setRegularCode(null)
    setBattery(65)
  }

  const armContainerNow = () => {
    if (!container) return
    const isRegular = securityMode === 'BASIC_SEAL'
    updateContainer(container.id, {
      status: 'SEALED',
      securityMode: securityMode ?? container.securityMode,
      trackingMode: isRegular ? 'NONE' : 'IOT_GPS',
      eSealId: isRegular ? null : esealCode,
      boltSealId: null,
      regularSealId: isRegular ? regularCode : null,
      isArmed: true,
    })
    if (!isRegular) {
      const device = devices.find((d) => d.id === esealCode)
      if (device) updateDevice(device.id, { containerId: container.id, battery, lifecycle: 'IN_TRANSIT' })
    }
    addTimelineEvent({ containerId: container.id, type: 'CARGO_STUFFED', label: 'Cargo stuffed', actor: 'Warehouse Operator' })
    addTimelineEvent({
      containerId: container.id,
      type: 'SEAL_ATTACHED',
      label: isRegular ? `Basic seal ${regularCode} attached` : `Smart e-seal ${esealCode} attached`,
      actor: 'Warehouse Operator',
    })
    addTimelineEvent({ containerId: container.id, type: 'CONTAINER_ARMED', label: 'Container armed & sealed', actor: 'Warehouse Operator' })
    addAuditLogEntry({ user: 'Warehouse Operator', action: 'CONTAINER_ARMED', entity: container.number, description: `${container.number} armed and sealed (${securityMode})` })
    setStep('success')
  }

  const steps: { key: Step; label: string }[] = [
    { key: 'container', label: 'Container' },
    { key: 'security', label: 'Security Mode' },
    { key: 'scan', label: 'Scan Seals' },
    ...(securityMode === 'BASIC_SEAL' ? [] : [{ key: 'battery' as Step, label: 'Battery Check' }]),
    { key: 'confirm', label: 'Arm Container' },
  ]

  return (
    <div className="mx-auto max-w-3xl pb-16">
      <PageHeader title="New Stuffing Workflow" description="Attach seals and arm a container before it departs the warehouse." />

      {step !== 'success' && (
        <div className="mb-6 flex items-center gap-1 px-4 md:px-6">
          {steps.map((s, i) => (
            <div key={s.key} className="flex items-center gap-1">
              <span
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold',
                  steps.findIndex((x) => x.key === step) >= i ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-500',
                )}
              >
                {i + 1}
              </span>
              <span className="hidden text-xs text-slate-500 sm:inline">{s.label}</span>
              {i < steps.length - 1 && <ChevronRight size={14} className="mx-1 text-slate-300" />}
            </div>
          ))}
        </div>
      )}

      <div className="px-4 md:px-6">
        {step === 'container' && (
          <Card>
            <CardHeader>
              <CardTitle>Step 1 — Select Container</CardTitle>
            </CardHeader>
            <CardContent>
              {eligible.length === 0 ? (
                <EmptyState title="No containers available" description="All containers are already armed." />
              ) : (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {eligible.slice(0, 12).map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setContainerId(c.id)
                        setStep('security')
                      }}
                      className={cn(
                        'rounded-md border p-3 text-left hover:border-brand-400 hover:bg-brand-50',
                        containerId === c.id ? 'border-brand-500 bg-brand-50' : 'border-slate-200',
                      )}
                    >
                      <p className="text-sm font-medium text-navy-900">{c.number}</p>
                      <p className="text-xs text-slate-500">{c.originCity} → {c.destinationCity}</p>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {step === 'security' && container && (
          <Card>
            <CardHeader>
              <CardTitle>Step 2 — Select Security Mode</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {(['SINGLE_SEAL', 'BASIC_SEAL'] as SecurityMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => {
                    setSecurityMode(mode)
                    setStep('scan')
                  }}
                  className="flex flex-col items-start gap-2 rounded-lg border border-slate-200 p-4 text-left hover:border-brand-400 hover:bg-brand-50"
                >
                  {mode === 'BASIC_SEAL' ? <WifiOff size={20} className="text-slate-500" /> : <ShieldCheck size={20} className="text-brand-600" />}
                  <span className="text-sm font-semibold text-navy-900">{mode === 'SINGLE_SEAL' ? 'Smart Seal' : 'Basic Seal'}</span>
                  <span className="text-xs text-slate-500">
                    {mode === 'SINGLE_SEAL' ? 'IoT e-seal — live GPS/AIS tracked.' : 'No electronics — not trackable, scan-only.'}
                  </span>
                </button>
              ))}
            </CardContent>
          </Card>
        )}

        {step === 'scan' && container && securityMode === 'BASIC_SEAL' && (
          <Card>
            <CardHeader>
              <CardTitle>Step 3 — Scan Basic Seal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ScanRow label="Scan Basic Seal" done={!!regularCode} code={regularCode} onScan={() => setRegularScanOpen(true)} />
              <StepRow label="Arm Container" done={false} pending />
              <div className="flex items-start gap-2 rounded-md bg-slate-100 p-3 text-xs text-slate-600">
                <WifiOff size={16} className="mt-0.5 shrink-0" />
                No battery check needed — this seal has no electronics or IoT device.
              </div>
              <Button className="mt-2 w-full" disabled={!sealsComplete} onClick={() => setStep('confirm')}>
                Continue to Arm Container
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 'scan' && container && securityMode === 'SINGLE_SEAL' && (
          <Card>
            <CardHeader>
              <CardTitle>Step 3 — Scan Smart Seal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ScanRow label="Scan Smart E-Seal" done={!!esealCode} code={esealCode} onScan={() => setEsealScanOpen(true)} />
              <StepRow label="Battery Check" done={false} pending />
              <StepRow label="Arm Container" done={false} pending />

              <Button className="mt-2 w-full" disabled={!sealsComplete} onClick={() => setStep('battery')}>
                Continue to Battery Check
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 'battery' && container && (
          <Card>
            <CardHeader>
              <CardTitle>Step 4 — Battery Check</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Smart E-Seal Battery</span>
                <span className={cn('text-lg font-semibold', batteryOk ? 'text-success-500' : 'text-critical-500')}>{battery}%</span>
              </div>
              <input type="range" min={10} max={100} value={battery} onChange={(e) => setBattery(Number(e.target.value))} className="w-full accent-brand-600" />
              <p className="text-xs text-slate-400">Simulation control — drag to change the device's reported battery level.</p>

              {!batteryOk ? (
                <div className="flex items-start gap-2 rounded-md bg-critical-100 p-3 text-sm text-red-800">
                  <BatteryWarning size={18} className="mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">BATTERY LOW</p>
                    <p className="text-xs">Please recharge the Smart E-Seal before arming.</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-md bg-success-100 p-3 text-sm text-green-800">
                  <CheckCircle2 size={18} /> Battery sufficient for arming.
                </div>
              )}

              <Button className="w-full" disabled={!batteryOk} onClick={() => setStep('confirm')}>
                Continue to Arm Container
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 'confirm' && container && (
          <Card>
            <CardHeader>
              <CardTitle>Step 5 — Arm Container</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <dl className="space-y-2 text-sm">
                <Row label="Container" value={container.number} />
                {securityMode === 'BASIC_SEAL' ? (
                  <Row label="Basic Seal" value={regularCode ?? '—'} />
                ) : (
                  <>
                    <Row label="Smart E-Seal" value={esealCode ?? '—'} />
                    <Row label="Battery" value={`${battery}%`} />
                  </>
                )}
                <Row label="Security Mode" value={securityMode === 'SINGLE_SEAL' ? 'Smart Seal' : 'Basic Seal'} />
              </dl>
              <Button className="w-full" size="lg" onClick={armContainerNow}>
                <ShieldCheck size={16} /> ARM CONTAINER
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 'success' && container && (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-success-100 text-success-500">
                <PackageCheck size={30} />
              </span>
              <h2 className="text-lg font-semibold text-navy-900">Container Armed &amp; Sealed</h2>
              <p className="max-w-sm text-sm text-slate-500">{container.number} is now SEALED and ready for departure.</p>
              <div className="mt-4 flex gap-2">
                <Button variant="secondary" onClick={() => navigate(`/containers/${container.id}`)}>
                  View Container
                </Button>
                <Button onClick={reset}>Start Another Stuffing</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <ScannerModal
        open={esealScanOpen}
        onClose={() => setEsealScanOpen(false)}
        title="Scan Smart E-Seal"
        scannerType="QR"
        resultCode={esealResultCode}
        onScanned={(code) => setEsealCode(code)}
      />
      <ScannerModal
        open={regularScanOpen}
        onClose={() => setRegularScanOpen(false)}
        title="Scan Basic Seal"
        scannerType="Barcode"
        resultCode={regularResultCode}
        onScanned={(code) => setRegularCode(code)}
      />
    </div>
  )
}

function ScanRow({ label, done, code, onScan, disabled }: { label: string; done: boolean; code: string | null; onScan: () => void; disabled?: boolean }) {
  return (
    <div className={cn('flex items-center justify-between rounded-md border p-3', done ? 'border-success-500/40 bg-success-100/40' : 'border-slate-200')}>
      <div className="flex items-center gap-2">
        {done ? <CheckCircle2 size={18} className="text-success-500" /> : <ScanLine size={18} className="text-slate-400" />}
        <div>
          <p className="text-sm font-medium text-navy-800">{label}</p>
          {code && <p className="text-xs text-slate-500">{code}</p>}
        </div>
      </div>
      <Button size="sm" variant={done ? 'secondary' : 'primary'} disabled={disabled} onClick={onScan}>
        {done ? 'Re-scan' : 'Open Scanner'}
      </Button>
    </div>
  )
}

function StepRow({ label, pending }: { label: string; done: boolean; pending?: boolean }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-dashed border-slate-200 p-3 text-slate-400">
      <span className="h-4 w-4 rounded-full border-2 border-slate-300" />
      <p className="text-sm">{label}</p>
      {pending && <span className="ml-auto text-[11px] uppercase tracking-wide">Pending</span>}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium text-navy-800">{value}</dd>
    </div>
  )
}
