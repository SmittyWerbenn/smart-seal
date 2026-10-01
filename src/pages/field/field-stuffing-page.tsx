import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AlertTriangle, BatteryWarning, CheckCircle2, ShieldCheck, WifiOff } from 'lucide-react'
import { useDataStore } from '@/store/dataStore'
import { Button } from '@/components/ui/button'
import { ScannerModal } from '@/components/shared/scanner-modal'
import { PhotoSlot } from '@/components/shared/photo-ui'
import { IssueReportModal } from '@/components/shared/issue-report-modal'
import { saveSealPhotos, SEAL_PHOTO_TEXT } from '@/lib/documentation'
import { EmptyState } from '@/components/shared/states'
import { cn } from '@/lib/utils'
import type { SecurityMode } from '@/types'

type Step = 'container' | 'security' | 'photo-before' | 'scan' | 'battery' | 'photo-after' | 'success'

export default function FieldStuffingPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const containers = useDataStore((s) => s.containers)
  const updateContainer = useDataStore((s) => s.updateContainer)
  const addTimelineEvent = useDataStore((s) => s.addTimelineEvent)
  const addAuditLogEntry = useDataStore((s) => s.addAuditLogEntry)

  const eligible = containers.filter((c) => !c.isArmed)
  const [step, setStep] = useState<Step>(id ? 'security' : 'container')
  const [containerId, setContainerId] = useState<string | null>(id ?? null)
  const [securityMode, setSecurityMode] = useState<SecurityMode | null>(null)
  const [esealScanOpen, setEsealScanOpen] = useState(false)
  const [esealCode, setEsealCode] = useState<string | null>(null)
  const [regularCode, setRegularCode] = useState<string | null>(null)
  const [regularScanOpen, setRegularScanOpen] = useState(false)
  const [battery, setBattery] = useState(88)
  const [photoBefore, setPhotoBefore] = useState<string | null>(null)
  const [photoAfter, setPhotoAfter] = useState<string | null>(null)
  const [photoError, setPhotoError] = useState('')
  const [issueOpen, setIssueOpen] = useState(false)

  const container = containers.find((c) => c.id === containerId)
  const sealsComplete = securityMode === 'BASIC_SEAL' ? !!regularCode : !!esealCode

  const arm = () => {
    if (!container) return
    const saved = saveSealPhotos(container.id, photoBefore, photoAfter, 'Driver')
    if (!saved.ok) {
      setPhotoError(saved.error ?? 'Foto gagal disimpan.')
      return
    }
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
    addTimelineEvent({ containerId: container.id, type: 'CONTAINER_ARMED', label: 'Container armed & sealed', actor: 'Driver' })
    addAuditLogEntry({ user: 'Driver', action: 'CONTAINER_ARMED', entity: container.number, description: `${container.number} armed via field app` })
    setStep('success')
  }

  if (step === 'container') {
    return (
      <div className="p-4">
        <h1 className="mb-3 text-lg font-semibold text-navy-900">Select Container</h1>
        {eligible.length === 0 ? (
          <EmptyState title="No containers available" />
        ) : (
          <div className="space-y-2">
            {eligible.slice(0, 8).map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setContainerId(c.id)
                  setStep('security')
                }}
                className="w-full rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm"
              >
                <p className="text-base font-semibold text-navy-900">{c.number}</p>
                <p className="text-sm text-slate-500">{c.originCity} → {c.destinationCity}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  if (!container) return <EmptyState title="Container not found" />

  if (step === 'security') {
    return (
      <div className="p-4">
        <h1 className="mb-3 text-lg font-semibold text-navy-900">{container.number}</h1>
        <p className="mb-4 text-sm text-slate-500">Select security mode</p>
        <div className="space-y-3">
          {(['SINGLE_SEAL', 'BASIC_SEAL'] as SecurityMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => {
                setSecurityMode(mode)
                setStep('photo-before')
              }}
              className="w-full rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm"
            >
              <p className="text-base font-semibold text-navy-900">{mode === 'SINGLE_SEAL' ? 'Smart Seal' : 'Basic Seal'}</p>
              <p className="text-sm text-slate-500">{mode === 'SINGLE_SEAL' ? 'IoT e-seal, live tracked' : 'No electronics — not trackable'}</p>
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (step === 'photo-before') {
    return (
      <div className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-navy-900">Foto Barang Sebelum Seal</h1>
          <span className="rounded-full bg-warning-100 px-2 py-0.5 text-[11px] font-medium text-amber-800">Foto Wajib</span>
        </div>
        <div className="mb-3 rounded-md bg-brand-50 p-2.5 text-xs text-brand-700">
          <span className="font-semibold">Seal membutuhkan 2 foto.</span> {SEAL_PHOTO_TEXT}
        </div>
        <PhotoSlot step={1} label="Foto Barang di Dalam Container (Sebelum Seal)" value={photoBefore} onChange={setPhotoBefore} />
        <Button size="lg" className="mt-4 w-full" disabled={!photoBefore} onClick={() => setStep('scan')}>
          Lanjut ke Pasang Seal
        </Button>
      </div>
    )
  }

  if (step === 'photo-after') {
    return (
      <div className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-navy-900">Foto Container Setelah Seal</h1>
          <span className="rounded-full bg-warning-100 px-2 py-0.5 text-[11px] font-medium text-amber-800">Foto Wajib</span>
        </div>
        <PhotoSlot step={2} label="Foto Container Setelah Seal Terpasang" value={photoAfter} onChange={setPhotoAfter} />
        {photoError && <p className="mt-2 text-xs text-critical-500">{photoError}</p>}
        <Button size="lg" className="mt-4 w-full" disabled={!photoBefore || !photoAfter} onClick={arm}>
          <ShieldCheck size={16} /> ARM CONTAINER
        </Button>
        <button type="button" onClick={() => setIssueOpen(true)} className="mt-3 flex w-full items-center justify-center gap-1.5 text-sm font-medium text-amber-700">
          <AlertTriangle size={14} /> Ada Kendala
        </button>
        <IssueReportModal open={issueOpen} onClose={() => setIssueOpen(false)} container={container} context="SEAL" />
      </div>
    )
  }

  if (step === 'scan' && securityMode === 'BASIC_SEAL') {
    const regularResultCode = container.regularSealId ?? `SEAL-${container.id.replace('CNT-', '')}`
    return (
      <div className="p-4">
        <h1 className="mb-4 text-lg font-semibold text-navy-900">Scan Basic Seal</h1>
        <div className="space-y-3">
          <Button size="lg" className="w-full justify-between" variant={regularCode ? 'secondary' : 'primary'} onClick={() => setRegularScanOpen(true)}>
            {regularCode ? `Seal Scanned: ${regularCode}` : 'Scan Basic Seal'}
            {regularCode && <CheckCircle2 size={18} />}
          </Button>
          <div className="flex items-center gap-2 rounded-md bg-slate-100 p-3 text-xs text-slate-600">
            <WifiOff size={16} /> No battery check needed — this seal has no IoT device.
          </div>
          <Button size="lg" className="w-full" disabled={!sealsComplete} onClick={() => setStep('photo-after')}>
            Continue to Foto Container
          </Button>
        </div>
        <ScannerModal open={regularScanOpen} onClose={() => setRegularScanOpen(false)} title="Scan Basic Seal" resultCode={regularResultCode} onScanned={setRegularCode} />
      </div>
    )
  }

  if (step === 'scan') {
    const esealResultCode = container.eSealId ?? `ESEAL-${container.id.replace('CNT-', '')}`
    return (
      <div className="p-4">
        <h1 className="mb-4 text-lg font-semibold text-navy-900">Scan Smart Seal</h1>
        <div className="space-y-3">
          <Button size="lg" className="w-full justify-between" variant={esealCode ? 'secondary' : 'primary'} onClick={() => setEsealScanOpen(true)}>
            {esealCode ? `Smart E-Seal Scanned: ${esealCode}` : 'Scan Smart E-Seal'}
            {esealCode && <CheckCircle2 size={18} />}
          </Button>
          <Button size="lg" className="w-full" disabled={!sealsComplete} onClick={() => setStep('battery')}>
            Continue
          </Button>
        </div>
        <ScannerModal open={esealScanOpen} onClose={() => setEsealScanOpen(false)} title="Scan Smart E-Seal" scannerType="QR" resultCode={esealResultCode} onScanned={setEsealCode} />
      </div>
    )
  }

  if (step === 'battery') {
    const ok = battery >= 80
    return (
      <div className="p-4">
        <h1 className="mb-4 text-lg font-semibold text-navy-900">Battery Check</h1>
        <div className="rounded-lg border border-slate-200 bg-white p-5 text-center shadow-sm">
          <p className={cn('text-4xl font-bold', ok ? 'text-success-500' : 'text-critical-500')}>{battery}%</p>
          <input type="range" min={10} max={100} value={battery} onChange={(e) => setBattery(Number(e.target.value))} className="mt-4 w-full accent-brand-600" />
        </div>
        {!ok && (
          <div className="mt-3 flex items-center gap-2 rounded-md bg-critical-100 p-3 text-sm text-red-800">
            <BatteryWarning size={18} /> Battery low — recharge before arming.
          </div>
        )}
        <Button size="lg" className="mt-4 w-full" disabled={!ok} onClick={() => setStep('photo-after')}>
          Continue to Foto Container
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-3 p-8 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-success-100 text-success-500">
        <CheckCircle2 size={32} />
      </span>
      <h1 className="text-lg font-semibold text-navy-900">Container Armed</h1>
      <p className="text-sm text-slate-500">{container.number} is sealed and ready for departure.</p>
      <Button className="w-full" onClick={() => navigate('/field')}>
        Back to Home
      </Button>
    </div>
  )
}
