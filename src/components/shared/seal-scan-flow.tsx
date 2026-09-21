import { useMemo, useState } from 'react'
import { Lock, MapPin, ScanLine, ShieldCheck, WifiOff } from 'lucide-react'
import { useDataStore } from '@/store/dataStore'
import { useAuthStore } from '@/store/authStore'
import { ScannerModal } from './scanner-modal'
import { Button } from '@/components/ui/button'
import { ContainerStatusBadge } from './status-badge'
import { findContainerBySealCode, type SealLookupResult } from '@/lib/seal-lookup'

interface SealScanFlowProps {
  onViewLiveTracking: (containerId: string) => void
  onViewContainer?: (containerId: string) => void
}

export function SealScanFlow({ onViewLiveTracking, onViewContainer }: SealScanFlowProps) {
  const containers = useDataStore((s) => s.containers)
  const cargo = useDataStore((s) => s.cargo)
  const currentUser = useAuthStore((s) => s.currentUser)
  const [smartOpen, setSmartOpen] = useState(false)
  const [regularOpen, setRegularOpen] = useState(false)
  const [result, setResult] = useState<SealLookupResult>(null)
  const [scannedCode, setScannedCode] = useState<string | null>(null)

  const smartSampleCode = useMemo(() => containers.find((c) => c.eSealId)?.eSealId ?? 'ESEAL-000001', [containers])
  const regularSampleCode = useMemo(() => containers.find((c) => c.regularSealId)?.regularSealId ?? 'SEAL-000001', [containers])

  const isClient = currentUser?.role === 'CLIENT'
  // Only show cargo actually tagged to the seal that was scanned.
  const manifest = result ? cargo.filter((c) => c.containerId === result.container.id && (!scannedCode || c.sealId === scannedCode)) : []

  if (result) {
    const { container, kind } = result
    return (
      <div className="space-y-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-base font-semibold text-navy-900">{container.number}</p>
            <ContainerStatusBadge status={container.status} />
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {container.originCity} → {container.destinationCity}
          </p>

          {kind === 'smart' ? (
            <div className="mt-3 flex items-center gap-2 rounded-md bg-success-100 p-3 text-sm text-green-800">
              <ShieldCheck size={16} /> Smart Seal {scannedCode} verified — live GPS tracking available.
            </div>
          ) : (
            <div className="mt-3 flex items-center gap-2 rounded-md bg-slate-100 p-3 text-sm text-slate-600">
              <WifiOff size={16} /> Basic seal {scannedCode} verified — no live tracking, contents shown below.
            </div>
          )}

          {kind === 'regular' && (
            <div className="mt-3 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Contents</p>
              {manifest.length === 0 ? (
                <p className="text-xs text-slate-500">No cargo recorded for this container.</p>
              ) : (
                manifest.map((line) => {
                  const owned = !isClient || line.clientId === currentUser?.clientId
                  return (
                    <div key={line.id} className="rounded-md border border-slate-100 p-2.5 text-xs">
                      {owned ? (
                        <>
                          <p className="font-medium text-navy-800">{line.productName}</p>
                          <p className="text-slate-500">
                            {line.clientName} · {line.doNumber} · {line.quantity.toLocaleString()} {line.unit}
                          </p>
                        </>
                      ) : (
                        <p className="flex items-center gap-1.5 text-slate-400">
                          <Lock size={12} /> Consolidated cargo (other client)
                        </p>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            {kind === 'smart' && (
              <Button size="sm" onClick={() => onViewLiveTracking(container.id)}>
                <MapPin size={14} /> View Live Tracking
              </Button>
            )}
            {onViewContainer && (
              <Button size="sm" variant="secondary" onClick={() => onViewContainer(container.id)}>
                View Container Detail
              </Button>
            )}
          </div>
        </div>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => {
            setResult(null)
            setScannedCode(null)
          }}
        >
          Scan Another Seal
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <Button size="lg" variant="secondary" className="w-full justify-start gap-3" onClick={() => setSmartOpen(true)}>
        <ShieldCheck size={20} className="text-brand-600" />
        <span className="flex flex-col items-start text-left">
          <span className="text-sm font-semibold text-navy-900">Scan Smart Seal</span>
          <span className="text-xs font-normal text-slate-500">Live GPS tracking</span>
        </span>
      </Button>
      <Button size="lg" variant="secondary" className="w-full justify-start gap-3" onClick={() => setRegularOpen(true)}>
        <ScanLine size={20} className="text-slate-500" />
        <span className="flex flex-col items-start text-left">
          <span className="text-sm font-semibold text-navy-900">Scan Basic Seal</span>
          <span className="text-xs font-normal text-slate-500">No tracking — view contents only</span>
        </span>
      </Button>

      <ScannerModal
        open={smartOpen}
        onClose={() => setSmartOpen(false)}
        title="Scan Smart Seal"
        scannerType="QR"
        resultCode={smartSampleCode}
        onScanned={(code) => {
          setScannedCode(code)
          setResult(findContainerBySealCode(containers, code))
        }}
      />
      <ScannerModal
        open={regularOpen}
        onClose={() => setRegularOpen(false)}
        title="Scan Basic Seal"
        scannerType="Barcode"
        resultCode={regularSampleCode}
        onScanned={(code) => {
          setScannedCode(code)
          setResult(findContainerBySealCode(containers, code))
        }}
      />
    </div>
  )
}
