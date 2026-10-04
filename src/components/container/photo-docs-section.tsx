import { useMemo, useState } from 'react'
import { AlertTriangle, Camera } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PhotoGrid, type GalleryPhoto } from '@/components/shared/photo-ui'
import { IssueReportModal } from '@/components/shared/issue-report-modal'
import { DOC_PHOTO_META, hasSealDocs, hasUnlockDocs, latestPhoto } from '@/lib/documentation'
import { usePhotoStore } from '@/store/photoStore'
import { formatDateTime } from '@/lib/utils'
import type { Container, ContainerPhoto, DocPhotoType } from '@/types'
import { translate } from '@/i18n'

function toGallery(p: ContainerPhoto): GalleryPhoto {
  const meta = DOC_PHOTO_META[p.type]
  return { id: p.id, src: p.dataUrl, label: meta.label, takenAt: p.takenAt, takenBy: p.takenBy, activity: meta.activity }
}

function Group({ title, complete, required, children }: { title: string; complete: boolean; required: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <h4 className="text-sm font-semibold text-navy-900">{title}</h4>
        {complete ? <Badge variant="success">{translate('ui.documentationComplete')}</Badge> : <Badge variant="warning">{required}</Badge>}
      </div>
      {children}
    </div>
  )
}

// Only photos whose containerId matches this container are ever read.
export function PhotoDocsSection({ container, canManage }: { container: Container; canManage: boolean }) {
  const photos = usePhotoStore((s) => s.photos)
  const issues = usePhotoStore((s) => s.issues)
  const [issueOpen, setIssueOpen] = useState(false)

  const mine = useMemo(() => photos.filter((p) => p.containerId === container.id), [photos, container.id])
  const pick = (types: DocPhotoType[]) =>
    types.map((t) => latestPhoto(mine, container.id, t)).filter((p): p is ContainerPhoto => !!p).map(toGallery)
  const sealPhotos = pick(['SEAL_BEFORE', 'SEAL_AFTER'])
  const unlockPhotos = pick(['UNLOCK_BEFORE', 'UNLOCK_AFTER'])
  const myIssues = issues.filter((i) => i.containerId === container.id)

  return (
    <Card className="lg:col-span-3">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera size={15} className="text-brand-600" /> {translate('ui.photoDocumentation')}
        </CardTitle>
        {canManage && (
          <Button size="sm" variant="secondary" onClick={() => setIssueOpen(true)}>
            <AlertTriangle size={13} /> {translate('ui.issueReported')}
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        <Group title={translate('ui.seal')} complete={hasSealDocs(mine, container.id)} required="2 Foto Diperlukan">
          {sealPhotos.length > 0 ? (
            <PhotoGrid photos={sealPhotos} columns="grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" />
          ) : (
            <p className="rounded-md bg-slate-50 p-3 text-xs text-slate-500">{translate('ui.noSealDocumentationYetTaken')}</p>
          )}
        </Group>
        <Group title={translate('ui.unlock')} complete={hasUnlockDocs(mine, container.id)} required="2 Foto Diperlukan">
          {unlockPhotos.length > 0 ? (
            <PhotoGrid photos={unlockPhotos} columns="grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" />
          ) : (
            <p className="rounded-md bg-slate-50 p-3 text-xs text-slate-500">{translate('ui.noUnlockDocumentationYetTaken')}</p>
          )}
        </Group>
        <Group title={translate('ui.issue')} complete={myIssues.length > 0} required="Tidak ada kendala tercatat">
          {myIssues.length === 0 ? (
            <p className="rounded-md bg-slate-50 p-3 text-xs text-slate-500">{translate('ui.noIssuesReported')}</p>
          ) : (
            <div className="space-y-4">
              {myIssues.map((issue) => {
                const issuePhotos = mine.filter((p) => p.issueId === issue.id).map(toGallery)
                return (
                  <div key={issue.id} className="rounded-md border border-amber-200 bg-warning-100/40 p-3">
                    <p className="text-xs text-slate-500">
                      <span className="font-medium text-amber-800">{translate('ui.issuePhoto')}</span> · {issue.context === 'SEAL' ? 'saat Seal' : issue.context === 'UNLOCK' ? 'saat Unlock' : 'umum'} ·{' '}
                      {formatDateTime(issue.createdAt)} · {issue.createdBy} · {issuePhotos.length} foto
                    </p>
                    {issue.note && <p className="mt-1 text-sm text-navy-800">{issue.note}</p>}
                    <div className="mt-2">
                      <PhotoGrid photos={issuePhotos} columns="grid-cols-3 sm:grid-cols-4 lg:grid-cols-6" />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Group>
      </CardContent>
      {canManage && <IssueReportModal open={issueOpen} onClose={() => setIssueOpen(false)} container={container} context="GENERAL" />}
    </Card>
  )
}
