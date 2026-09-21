import { barcodePattern } from '@/lib/barcode'

export function BarcodeGraphic({ code, className }: { code: string; className?: string }) {
  const bars = barcodePattern(code)
  return (
    <div className={className}>
      <div className="flex h-12 items-stretch gap-[1.5px] bg-white px-2">
        {bars.map((w, i) => (
          <div key={i} style={{ width: `${w * 2}px` }} className={i % 2 === 0 ? 'bg-navy-950' : 'bg-white'} />
        ))}
      </div>
      <p className="mt-1 text-center font-mono text-[11px] tracking-widest text-navy-700">{code}</p>
    </div>
  )
}
