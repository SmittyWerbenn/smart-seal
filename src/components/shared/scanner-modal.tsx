import { useState } from 'react'
import { Barcode, CheckCircle2, ScanLine } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { BarcodeGraphic } from './barcode-graphic'
import { barcodeFor } from '@/lib/barcode'

interface ScannerModalProps {
  open: boolean
  onClose: () => void
  title: string
  scannerType?: 'Barcode' | 'QR' | 'NFC'
  resultCode: string
  onScanned: (code: string) => void
}

export function ScannerModal({ open, onClose, title, scannerType = 'Barcode', resultCode, onScanned }: ScannerModalProps) {
  const [scanning, setScanning] = useState(false)
  const [scanned, setScanned] = useState(false)

  const runScan = () => {
    setScanning(true)
    setTimeout(() => {
      setScanning(false)
      setScanned(true)
      onScanned(resultCode)
    }, 900)
  }

  const reset = () => {
    setScanning(false)
    setScanned(false)
    onClose()
  }

  return (
    <Modal open={open} onClose={reset} title={title}>
      <div className="flex flex-col items-center gap-4">
        <div className="relative flex h-56 w-full items-center justify-center overflow-hidden rounded-lg bg-navy-950">
          <div
            className="absolute inset-0 opacity-30"
            style={{ backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 1px, transparent 1px, transparent 3px)' }}
          />
          <div className={`relative flex h-32 w-44 items-center justify-center rounded-lg border-2 ${scanning ? 'border-brand-400' : 'border-white/60'}`}>
            <span className="absolute -left-0.5 -top-0.5 h-4 w-4 border-l-2 border-t-2 border-brand-400" />
            <span className="absolute -right-0.5 -top-0.5 h-4 w-4 border-r-2 border-t-2 border-brand-400" />
            <span className="absolute -bottom-0.5 -left-0.5 h-4 w-4 border-b-2 border-l-2 border-brand-400" />
            <span className="absolute -bottom-0.5 -right-0.5 h-4 w-4 border-b-2 border-r-2 border-brand-400" />
            {scanning && <div className="absolute left-0 right-0 top-1/2 h-0.5 animate-pulse bg-brand-400" />}
            {!scanning && !scanned && scannerType === 'Barcode' && (
              <div className="opacity-70">
                <BarcodeGraphic code={barcodeFor(resultCode)} />
              </div>
            )}
            {scanned && (
              <div className="absolute inset-0 flex items-center justify-center text-success-500">
                <CheckCircle2 size={32} />
              </div>
            )}
          </div>
          <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium text-white">
            <Barcode size={11} /> {scannerType}
          </span>
        </div>

        {!scanned ? (
          <>
            <p className="flex items-center gap-1.5 text-center text-xs text-slate-500">
              <ScanLine size={14} /> Position the barcode inside the frame
            </p>
            <Button className="w-full" onClick={runScan} disabled={scanning}>
              {scanning ? 'Scanning…' : 'Simulate Scan'}
            </Button>
          </>
        ) : (
          <>
            <div className="w-full rounded-md bg-success-100 p-3 text-center text-sm font-medium text-green-800">
              Scanned: {resultCode}
              <p className="mt-0.5 font-mono text-[11px] font-normal tracking-wide text-green-700">Barcode {barcodeFor(resultCode)}</p>
            </div>
            <Button className="w-full" variant="secondary" onClick={reset}>
              Done
            </Button>
          </>
        )}
      </div>
    </Modal>
  )
}
