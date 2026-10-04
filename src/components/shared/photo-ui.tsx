import { useCallback, useEffect, useRef, useState } from 'react'
import { Camera, CheckCircle2, ChevronLeft, ChevronRight, ImagePlus, RefreshCw, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn, formatDateTime } from '@/lib/utils'
import { fileToCompressedDataUrl } from '@/lib/image'
import { translate } from '@/i18n'

/** One required photo. Value is a compressed data URL (null until taken). */
export function PhotoSlot({
  label,
  hint,
  value,
  onChange,
  step,
}: {
  label: string
  hint?: string
  value: string | null
  onChange: (dataUrl: string | null) => void
  step?: number
}) {
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const pick = async (file?: File) => {
    if (!file) return
    setBusy(true)
    setError('')
    try {
      onChange(await fileToCompressedDataUrl(file))
    } catch (e) {
      setError(e instanceof Error ? e.message : translate('ui.failedToProcessPhoto'))
    } finally {
      setBusy(false)
      if (input.current) input.current.value = ''
    }
  }

  return (
    <div className={cn('rounded-lg border p-3', value ? 'border-success-500/40 bg-success-100/30' : 'border-slate-200 bg-white')}>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-medium text-navy-800">
          {step !== undefined && <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-[11px] font-semibold text-white">{step}</span>}
          {label}
        </p>
        {value ? (
          <Badge variant="success">
            <CheckCircle2 size={12} /> {translate('ui.photoReady')}
          </Badge>
        ) : (
          <Badge variant="warning">{translate('ui.photoRequired')}</Badge>
        )}
      </div>
      {hint && <p className="mb-2 text-xs text-slate-500">{hint}</p>}
      <div className="flex items-center gap-3">
        <div className="flex h-24 w-32 shrink-0 items-center justify-center overflow-hidden rounded-md border border-dashed border-slate-300 bg-slate-50">
          {value ? <img src={value} alt={label} className="h-full w-full object-cover" /> : <Camera size={22} className="text-slate-300" />}
        </div>
        <div className="flex flex-col gap-1.5">
          <Button type="button" size="sm" variant={value ? 'secondary' : 'primary'} disabled={busy} onClick={() => input.current?.click()}>
            {value ? <RefreshCw size={13} /> : <Camera size={13} />} {busy ? 'Memproses…' : value ? 'Ganti Foto' : 'Ambil / Pilih Foto'}
          </Button>
          {error && <p className="text-xs text-critical-500">{error}</p>}
        </div>
        <input ref={input} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
      </div>
    </div>
  )
}

/** One or many photos (issue documentation). */
export function MultiPhotoPicker({ value, onChange }: { value: string[]; onChange: (urls: string[]) => void }) {
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const pick = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setBusy(true)
    setError('')
    const added: string[] = []
    for (const f of Array.from(files)) {
      try {
        added.push(await fileToCompressedDataUrl(f))
      } catch (e) {
        setError(e instanceof Error ? e.message : translate('ui.somePhotosFailedToProcess'))
      }
    }
    onChange([...value, ...added])
    setBusy(false)
    if (input.current) input.current.value = ''
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {value.map((url, i) => (
          <div key={i} className="relative aspect-square overflow-hidden rounded-md border border-slate-200">
            <img src={url} alt={`Foto kendala ${i + 1}`} className="h-full w-full object-cover" />
            <button
              type="button"
              aria-label={translate('ui.deletePhotoAria', { n: i + 1 })}
              onClick={() => onChange(value.filter((_, idx) => idx !== i))}
              className="absolute right-1 top-1 rounded-full bg-navy-950/70 p-1 text-white hover:bg-navy-950"
            >
              <X size={12} />
            </button>
          </div>
        ))}
        <button
          type="button"
          disabled={busy}
          onClick={() => input.current?.click()}
          className="flex aspect-square flex-col items-center justify-center gap-1 rounded-md border border-dashed border-slate-300 text-xs text-slate-500 hover:border-brand-400 hover:bg-brand-50 disabled:opacity-50"
        >
          <ImagePlus size={18} />
          {busy ? 'Memproses…' : 'Tambah Foto'}
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-critical-500">{error}</p>}
      <input ref={input} type="file" accept="image/*" multiple className="hidden" onChange={(e) => pick(e.target.files)} />
    </div>
  )
}

export interface GalleryPhoto {
  id: string
  src: string
  label: string
  takenAt: string
  takenBy: string
  activity: string
}

/** Thumbnail grid; clicking a thumbnail opens the lightbox. */
export function PhotoGrid({ photos, columns = 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4' }: { photos: GalleryPhoto[]; columns?: string }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  return (
    <>
      <div className={cn('grid gap-3', columns)}>
        {photos.map((p, i) => (
          <button key={p.id} onClick={() => setOpenIndex(i)} className="group text-left">
            <div className="aspect-[4/3] overflow-hidden rounded-md border border-slate-200 bg-slate-50">
              <img src={p.src} alt={p.label} loading="lazy" className="h-full w-full object-cover transition group-hover:scale-105" />
            </div>
            <p className="mt-1 text-xs font-medium leading-snug text-navy-800">{p.label}</p>
            <p className="text-[11px] leading-snug text-slate-500">
              {formatDateTime(p.takenAt)} · {p.takenBy}
            </p>
          </button>
        ))}
      </div>
      {openIndex !== null && <Lightbox photos={photos} index={openIndex} onIndex={setOpenIndex} onClose={() => setOpenIndex(null)} />}
    </>
  )
}

function Lightbox({ photos, index, onIndex, onClose }: { photos: GalleryPhoto[]; index: number; onIndex: (i: number) => void; onClose: () => void }) {
  const photo = photos[index]
  const prev = useCallback(() => onIndex((index - 1 + photos.length) % photos.length), [index, photos.length, onIndex])
  const next = useCallback(() => onIndex((index + 1) % photos.length), [index, photos.length, onIndex])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, prev, next])

  if (!photo) return null
  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-navy-950/90 p-3 sm:p-6" role="dialog" aria-label={photo.label}>
      <div className="flex items-start justify-between gap-3 pb-3 text-white">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{photo.label}</p>
          <p className="text-xs text-slate-300">
            {photo.activity} · {formatDateTime(photo.takenAt)} · {photo.takenBy}
          </p>
        </div>
        <button onClick={onClose} aria-label={translate('ui.close2')} className="rounded-md p-1.5 hover:bg-white/10">
          <X size={20} />
        </button>
      </div>
      <div className="relative flex min-h-0 flex-1 items-center justify-center" onClick={onClose}>
        <img src={photo.src} alt={photo.label} onClick={(e) => e.stopPropagation()} className="max-h-full max-w-full rounded-md object-contain" />
        {photos.length > 1 && (
          <>
            <button onClick={(e) => { e.stopPropagation(); prev() }} aria-label={translate('ui.previous')} className="absolute left-0 rounded-full bg-white/10 p-2 text-white hover:bg-white/20">
              <ChevronLeft size={22} />
            </button>
            <button onClick={(e) => { e.stopPropagation(); next() }} aria-label={translate('ui.next')} className="absolute right-0 rounded-full bg-white/10 p-2 text-white hover:bg-white/20">
              <ChevronRight size={22} />
            </button>
          </>
        )}
      </div>
      <p className="pt-2 text-center text-xs text-slate-400">
        {index + 1} / {photos.length}
      </p>
    </div>
  )
}
