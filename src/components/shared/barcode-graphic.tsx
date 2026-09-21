import { qrPattern } from '@/lib/barcode'

export function BarcodeGraphic({ code, className }: { code: string; className?: string }) {
  const grid = qrPattern(code)
  return (
    <div className={className}>
      <div
        className="grid aspect-square w-24 gap-0 bg-white p-1.5"
        style={{ gridTemplateColumns: `repeat(${grid.length}, 1fr)`, gridTemplateRows: `repeat(${grid.length}, 1fr)` }}
      >
        {grid.map((row, r) =>
          row.map((on, c) => <div key={`${r}-${c}`} className={on ? 'bg-navy-950' : 'bg-white'} />),
        )}
      </div>
      <p className="mt-1 text-center font-mono text-[11px] tracking-widest text-navy-700">{code}</p>
    </div>
  )
}
