import { useMemo, useState } from 'react'
import { Package, ScanLine, ShieldCheck, WifiOff } from 'lucide-react'
import { useDataStore } from '@/store/dataStore'
import { AppLogo } from '@/components/shared/logo'
import { ScannerModal } from '@/components/shared/scanner-modal'
import { ContainerStatusBadge } from '@/components/shared/status-badge'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/input'
import { EmptyState } from '@/components/shared/states'
import { findContainerBySealCode, type SealLookupResult } from '@/lib/seal-lookup'
import { titleCase } from '@/lib/utils'

export default function PublicScanPage() {
  const containers = useDataStore((s) => s.containers)
  const cargo = useDataStore((s) => s.cargo)

  const [scannerOpen, setScannerOpen] = useState(false)
  const [manualCode, setManualCode] = useState('')
  const [manualError, setManualError] = useState('')
  const [result, setResult] = useState<SealLookupResult>(null)
  const [notFound, setNotFound] = useState(false)

  const smartSampleCode = useMemo(() => containers.find((c) => c.eSealId)?.eSealId ?? 'ESEAL-000001', [containers])
  const regularSampleCode = useMemo(() => containers.find((c) => c.regularSealId)?.regularSealId ?? 'SEAL-000001', [containers])
  // A real scanner doesn't know in advance what kind of seal is in frame — pick
  // whichever type this simulated scan happens to land on.
  const [scanSampleCode, setScanSampleCode] = useState(smartSampleCode)

  const lookup = (code: string) => {
    const found = findContainerBySealCode(containers, code)
    setResult(found)
    setNotFound(!found)
  }

  // Public, unauthenticated lookup — contents are always shown at a
  // category/quantity level only, never the owning client, DO number or
  // delivery address. Full manifest detail requires signing in to the app.
  const manifest = result ? cargo.filter((c) => c.containerId === result.container.id) : []

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-4 py-3">
        <AppLogo />
      </header>

      <main className="mx-auto max-w-md px-4 py-8">
        <h1 className="text-lg font-semibold text-navy-900">Public Seal Verification</h1>
        <p className="mt-1 text-sm text-slate-500">
          Scan a seal's barcode or QR code to verify a container. No account required. Cargo details shown here are summarized —
          sign in to the full platform for complete manifest access.
        </p>

        {!result && !notFound && (
          <div className="mt-6 space-y-3">
            <Button
              size="lg"
              className="w-full justify-start gap-3"
              onClick={() => {
                setScanSampleCode(Math.random() < 0.5 ? smartSampleCode : regularSampleCode)
                setScannerOpen(true)
              }}
            >
              <ScanLine size={20} />
              <span className="flex flex-col items-start text-left">
                <span className="text-sm font-semibold">Scan Seal</span>
                <span className="text-xs font-normal text-brand-100">Works for both Smart and Basic seals</span>
              </span>
            </Button>

            <div className="flex items-center gap-3 py-1 text-xs text-slate-400">
              <span className="h-px flex-1 bg-slate-200" /> or enter manually <span className="h-px flex-1 bg-slate-200" />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="manual-code">Seal code / barcode</Label>
                <Input
                  id="manual-code"
                  placeholder="e.g. ESEAL-000123 or SEAL-000045"
                  value={manualCode}
                  onChange={(e) => {
                    setManualCode(e.target.value)
                    setManualError('')
                  }}
                />
              </div>
              <Button
                className="mt-[22px]"
                onClick={() => {
                  if (!manualCode.trim()) return
                  lookup(manualCode.trim())
                  if (!findContainerBySealCode(containers, manualCode.trim())) setManualError('Seal not recognized.')
                }}
              >
                Verify
              </Button>
            </div>
            {manualError && <p className="text-xs text-critical-500">{manualError}</p>}
          </div>
        )}

        {notFound && (
          <div className="mt-6">
            <EmptyState title="Seal not recognized" description="Double-check the code and try again." />
            <Button
              variant="outline"
              className="mt-3 w-full"
              onClick={() => {
                setNotFound(false)
                setManualCode('')
              }}
            >
              Try Again
            </Button>
          </div>
        )}

        {result && (
          <div className="mt-6 space-y-3">
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-base font-semibold text-navy-900">{result.container.number}</p>
                <ContainerStatusBadge status={result.container.status} />
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {result.container.originCity} → {result.container.destinationCity}
              </p>

              {result.kind === 'smart' ? (
                <div className="mt-3 flex items-center gap-2 rounded-md bg-success-100 p-3 text-sm text-green-800">
                  <ShieldCheck size={16} /> Verified Smart Seal — live GPS/AIS tracked.
                </div>
              ) : (
                <div className="mt-3 flex items-center gap-2 rounded-md bg-slate-100 p-3 text-sm text-slate-600">
                  <WifiOff size={16} /> Verified Basic Seal — no electronics, no live tracking.
                </div>
              )}

              <div className="mt-3 space-y-2">
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <Package size={12} /> Declared Contents ({manifest.length})
                </p>
                {manifest.length === 0 ? (
                  <p className="text-xs text-slate-500">No cargo recorded for this container.</p>
                ) : (
                  manifest.map((line) => (
                    <div key={line.id} className="rounded-md border border-slate-100 p-2.5 text-xs">
                      <p className="font-medium text-navy-800">{line.productName}</p>
                      <p className="text-slate-500">
                        {titleCase(line.category)} · {line.quantity.toLocaleString()} {line.unit}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setResult(null)
                setManualCode('')
              }}
            >
              Scan Another Seal
            </Button>
          </div>
        )}

        <ScannerModal
          open={scannerOpen}
          onClose={() => setScannerOpen(false)}
          title="Scan Seal"
          scannerType="Barcode"
          resultCode={scanSampleCode}
          onScanned={(code) => lookup(code)}
        />
      </main>
    </div>
  )
}
