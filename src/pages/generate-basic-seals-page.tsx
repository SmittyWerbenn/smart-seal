import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Download, Printer, RotateCcw } from 'lucide-react'
import { useDataStore } from '@/store/dataStore'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/input'
import { BarcodeGraphic } from '@/components/shared/barcode-graphic'
import { barcodeFor } from '@/lib/barcode'
import { downloadCsv } from '@/lib/utils'

function nextBatch(startAt: number, quantity: number) {
  return Array.from({ length: quantity }, (_, i) => {
    const num = startAt + i
    const id = `SEAL-${num.toString().padStart(6, '0')}`
    return { id, barcode: barcodeFor(id) }
  })
}

function parseSealNumber(id: string) {
  const n = parseInt(id.replace('SEAL-', ''), 10)
  return Number.isNaN(n) ? 0 : n
}

export default function GenerateBasicSealsPage() {
  const containers = useDataStore((s) => s.containers)
  const basicSealStock = useDataStore((s) => s.basicSealStock)
  const addBasicSealBatch = useDataStore((s) => s.addBasicSealBatch)
  const navigate = useNavigate()

  const nextAvailable = useMemo(() => {
    const fromContainers = containers.map((c) => c.regularSealId).filter((id): id is string => !!id).map(parseSealNumber)
    const fromStock = basicSealStock.map((s) => s.id).map(parseSealNumber)
    const all = [...fromContainers, ...fromStock]
    return (all.length ? Math.max(...all) : 0) + 1
  }, [containers, basicSealStock])

  const [quantity, setQuantity] = useState(50)
  const [batch, setBatch] = useState<{ id: string; barcode: string }[]>([])

  const generate = () => {
    const generated = nextBatch(nextAvailable, Math.max(1, Math.min(500, quantity)))
    setBatch(generated)
    // Provisioned the moment they're generated — they show up in Seal
    // Devices immediately, as "In Stock" until scanned during stuffing.
    addBasicSealBatch(generated)
  }

  return (
    <div className="pb-10">
      <div className="print:hidden">
        <button onClick={() => navigate('/eseals')} className="mb-1 ml-4 mt-4 flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-navy-800 md:ml-6">
          <ArrowLeft size={14} /> Back to Seal Inventory
        </button>
        <PageHeader
          title="Generate Basic Seal Barcodes"
          description="Basic Seals are single-use — provision a new batch of unique barcodes to send to your seal manufacturer/vendor for printing."
        />

        <Card className="mx-4 mb-4 md:mx-6">
          <CardContent className="flex flex-wrap items-end gap-3 py-4">
            <div>
              <Label htmlFor="qty">Quantity</Label>
              <Input id="qty" type="number" min={1} max={500} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} className="w-32" />
            </div>
            <p className="pb-2 text-xs text-slate-500">Next available: {`SEAL-${nextAvailable.toString().padStart(6, '0')}`}</p>
            <div className="ml-auto flex gap-2">
              <Button onClick={generate}>
                <RotateCcw size={14} /> Generate Batch
              </Button>
              {batch.length > 0 && (
                <>
                  <Button
                    variant="secondary"
                    onClick={() => downloadCsv(`basic-seal-barcodes-${batch[0].id}-${batch[batch.length - 1].id}.csv`, batch.map((b) => ({ seal_id: b.id, barcode: b.barcode })))}
                  >
                    <Download size={14} /> Export CSV
                  </Button>
                  <Button variant="secondary" onClick={() => window.print()}>
                    <Printer size={14} /> Print
                  </Button>
                  <Button onClick={() => navigate('/eseals?type=Basic')}>
                    View in Seal Inventory <ArrowRight size={14} />
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {batch.length === 0 ? (
        <p className="px-4 text-sm text-slate-500 md:px-6 print:hidden">Set a quantity and click Generate Batch to provision new Basic Seal barcodes.</p>
      ) : (
        <div className="px-4 md:px-6">
          <p className="mb-3 text-xs text-slate-400 print:hidden">
            {batch.length} barcodes generated ({batch[0].id} – {batch[batch.length - 1].id}) and added to Seal Inventory as "In Stock". Export CSV for your
            inventory system, or Print to hand a printable sheet to your seal vendor.
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 print:grid-cols-3">
            {batch.map((b) => (
              <div key={b.id} className="flex flex-col items-center rounded-md border border-slate-200 bg-white p-3 print:break-inside-avoid">
                <BarcodeGraphic code={b.barcode} />
                <p className="mt-1 text-xs font-medium text-navy-800">{b.id}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
