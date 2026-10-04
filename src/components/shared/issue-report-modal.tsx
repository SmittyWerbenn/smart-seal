import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Label, Textarea } from '@/components/ui/input'
import { MultiPhotoPicker } from './photo-ui'
import { reportIssue } from '@/lib/documentation'
import { useAuthStore } from '@/store/authStore'
import type { Container, IssueContext } from '@/types'
import { translate } from '@/i18n'

const CONTEXT_LABEL: Record<IssueContext, string> = { SEAL: 'proses Seal', UNLOCK: 'proses Unlock', GENERAL: 'container ini' }

// "Ada Kendala": 1..n photos + optional note, tied to a specific container.
export function IssueReportModal({ open, onClose, container, context }: { open: boolean; onClose: () => void; container: Container; context: IssueContext }) {
  const actor = useAuthStore((s) => s.currentUser?.name ?? 'User')
  const [photos, setPhotos] = useState<string[]>([])
  const [note, setNote] = useState('')
  const [error, setError] = useState('')

  const close = () => {
    setPhotos([])
    setNote('')
    setError('')
    onClose()
  }

  const submit = () => {
    const res = reportIssue(container.id, context, note, photos, actor)
    if (!res.ok) {
      setError(res.error ?? 'Gagal menyimpan.')
      return
    }
    close()
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title={translate('ui.issueReported')}
      className="max-h-[90vh] max-w-lg overflow-y-auto"
      footer={
        <>
          <Button variant="secondary" onClick={close}>
            {translate('ui.cancel')}
          </Button>
          <Button onClick={submit} disabled={photos.length === 0}>
            {translate('ui.saveDocumentation')}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="flex items-start gap-2 rounded-md bg-warning-100 p-2.5 text-xs text-amber-800">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <span>
            Kendala pada {CONTEXT_LABEL[context]} — <span className="font-medium">{container.number}</span>. {translate('ui.issueDocsSentence')} <span className="font-medium">{translate('ui.severalPhotos')}</span>.
          </span>
        </div>
        <div>
          <Label>
            {translate('ui.issuePhoto')} <span className="text-critical-500">*</span> <span className="font-normal text-slate-400">{translate('ui.minOnePhotos')}</span>
          </Label>
          <MultiPhotoPicker value={photos} onChange={setPhotos} />
        </div>
        <div>
          <Label htmlFor="issue-note">{translate('ui.issueNotes')}</Label>
          <Textarea id="issue-note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder={translate('ui.describeTheIssueOptional')} />
        </div>
        {error && <p className="text-xs text-critical-500">{error}</p>}
      </div>
    </Modal>
  )
}
