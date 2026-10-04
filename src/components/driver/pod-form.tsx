import { Camera } from 'lucide-react'
import { Input, Label, Textarea } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { SignaturePad } from './signature-pad'
import { fileToCompressedDataUrl } from '@/lib/image'
import { translate } from '@/i18n'

export interface PodFormValue {
  receiverName: string
  receiverPhone: string
  notes: string
  cargoReceived: boolean
  containerVerified: boolean
  sealVerified: boolean
  signature?: string
  photoName?: string
  photoDataUrl?: string
}

export function PodForm({ value, onChange, receiverHint }: { value: PodFormValue; onChange: (v: PodFormValue) => void; receiverHint?: string }) {
  const set = (patch: Partial<PodFormValue>) => onChange({ ...value, ...patch })

  return (
    <div className="space-y-4 rounded-lg border border-brand-200 bg-brand-50/40 p-4">
      <p className="text-sm font-semibold text-navy-900">{translate('ui.proofOfDelivery')}</p>

      <div>
        <Label htmlFor="pod-receiver">{translate('ui.receiverName')}</Label>
        <Input id="pod-receiver" value={value.receiverName} placeholder={receiverHint} onChange={(e) => set({ receiverName: e.target.value })} />
      </div>
      <div>
        <Label htmlFor="pod-phone">{translate('ui.receiverPhone')}</Label>
        <Input id="pod-phone" inputMode="tel" value={value.receiverPhone} onChange={(e) => set({ receiverPhone: e.target.value })} />
      </div>
      <div>
        <Label htmlFor="pod-notes">{translate('ui.deliveryNotes')}</Label>
        <Textarea id="pod-notes" rows={2} value={value.notes} onChange={(e) => set({ notes: e.target.value })} />
      </div>

      <div className="space-y-2">
        {(
          [
            ['cargoReceived', 'Cargo received'],
            ['containerVerified', 'Container condition verified'],
            ['sealVerified', 'Seal verified'],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="flex min-h-11 items-center gap-3 rounded-md bg-white px-3 text-sm text-navy-800">
            <input type="checkbox" className="h-5 w-5 accent-brand-600" checked={value[key]} onChange={(e) => set({ [key]: e.target.checked } as Partial<PodFormValue>)} />
            {label}
          </label>
        ))}
      </div>

      <div>
        <Label>{translate('ui.digitalSignature')}</Label>
        <SignaturePad onChange={(signature) => set({ signature })} />
        {!value.signature && (
          <Button type="button" variant="link" size="sm" className="mt-1" onClick={() => set({ signature: `SIMULATED:${value.receiverName || 'receiver'}` })}>
            {translate('ui.useSimulatedSignature')}
          </Button>
        )}
      </div>

      <div>
        <Label>{translate('ui.deliveryPhotoOptional')}</Label>
        <label className="mt-1 flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-md border border-slate-300 bg-white text-sm font-medium text-navy-700 hover:bg-slate-50">
          <Camera size={16} /> {value.photoName ?? 'Upload foto pengiriman'}
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={async (e) => {
              const file = e.target.files?.[0]
              if (!file) return
              const dataUrl = await fileToCompressedDataUrl(file)
              set({ photoName: file.name, photoDataUrl: dataUrl })
            }}
          />
        </label>
        {value.photoDataUrl && <img src={value.photoDataUrl} alt={translate('ui.deliveryPreview')} className="mt-2 h-28 rounded-md object-cover" />}
        <p className="mt-1 text-[11px] text-slate-400">{translate('ui.localPreviewOnlyPrototypePhotos')}</p>
      </div>
    </div>
  )
}
