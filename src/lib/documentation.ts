// Photo documentation of the Seal / Unlock process. Validation lives here (not only
// in the UI) so a process can never be completed without its required photos.
import { useDataStore } from '@/store/dataStore'
import { usePhotoStore, type PhotoResult } from '@/store/photoStore'
import type { ContainerPhoto, DocPhotoType, IssueContext } from '@/types'
import { translate } from '@/i18n'

export const DOC_PHOTO_META: Record<DocPhotoType, { label: string; activity: 'Seal' | 'Unlock' | 'Kendala' }> = {
  SEAL_BEFORE: { get label() { return translate('ui.cargoPhotoBeforeSeal') }, activity: 'Seal' },
  SEAL_AFTER: { get label() { return translate('ui.containerPhotoAfterSeal') }, activity: 'Seal' },
  UNLOCK_BEFORE: { get label() { return translate('ui.containerPhotoBeforeUnlock') }, activity: 'Unlock' },
  UNLOCK_AFTER: { get label() { return translate('ui.cargoPhotoAfterSealOpened') }, activity: 'Unlock' },
  ISSUE: { get label() { return translate('ui.issuePhoto') }, activity: 'Kendala' },
}

export function sealPhotoText() {
  return translate('msg.msg024')
}
export function unlockPhotoText() {
  return translate('msg.msg025')
}

/** Latest photo of a type for one container (never mixes containers or activities). */
export function latestPhoto(photos: ContainerPhoto[], containerId: string, type: DocPhotoType): ContainerPhoto | undefined {
  return photos
    .filter((p) => p.containerId === containerId && p.type === type)
    .sort((a, b) => b.takenAt.localeCompare(a.takenAt))[0]
}

export function hasSealDocs(photos: ContainerPhoto[], containerId: string) {
  return !!latestPhoto(photos, containerId, 'SEAL_BEFORE') && !!latestPhoto(photos, containerId, 'SEAL_AFTER')
}

export function hasUnlockDocs(photos: ContainerPhoto[], containerId: string) {
  return !!latestPhoto(photos, containerId, 'UNLOCK_BEFORE') && !!latestPhoto(photos, containerId, 'UNLOCK_AFTER')
}

export function saveSealPhotos(containerId: string, before: string | null, after: string | null, actor: string): PhotoResult {
  if (!before || !after) return { ok: false, error: translate('ui.theSealStepRequires2') }
  const container = useDataStore.getState().containers.find((c) => c.id === containerId)
  if (!container) return { ok: false, error: translate('ui.containerNotFound2') }
  const res = usePhotoStore.getState().addPhotos(containerId, [{ type: 'SEAL_BEFORE', dataUrl: before }, { type: 'SEAL_AFTER', dataUrl: after }], actor)
  if (res.ok) {
    useDataStore.getState().addTimelineEvent({ containerId, type: 'SEAL_PHOTOS_DOCUMENTED', get label() { return translate('ui.sealDocumentationSaved2Photos') }, actor })
    useDataStore.getState().addAuditLogEntry({ user: actor, action: 'SEAL_PHOTOS_SAVED', entity: container.number, description: `${container.number}: 2 foto dokumentasi Seal tersimpan` })
  }
  return res
}

export function saveUnlockPhotos(containerId: string, before: string | null, after: string | null, actor: string): PhotoResult {
  if (!before || !after) return { ok: false, error: translate('ui.theUnlockStepRequires2') }
  const container = useDataStore.getState().containers.find((c) => c.id === containerId)
  if (!container) return { ok: false, error: translate('ui.containerNotFound2') }
  const res = usePhotoStore.getState().addPhotos(containerId, [{ type: 'UNLOCK_BEFORE', dataUrl: before }, { type: 'UNLOCK_AFTER', dataUrl: after }], actor)
  if (res.ok) {
    useDataStore.getState().addTimelineEvent({ containerId, type: 'UNLOCK_PHOTOS_DOCUMENTED', get label() { return translate('ui.unlockDocumentationSaved2Photos') }, actor })
    useDataStore.getState().addAuditLogEntry({ user: actor, action: 'UNLOCK_PHOTOS_SAVED', entity: container.number, description: `${container.number}: 2 foto dokumentasi Unlock tersimpan` })
  }
  return res
}

export function reportIssue(containerId: string, context: IssueContext, note: string, dataUrls: string[], actor: string): PhotoResult {
  if (dataUrls.length < 1) return { ok: false, error: translate('ui.uploadAtLeast1Issue') }
  const container = useDataStore.getState().containers.find((c) => c.id === containerId)
  if (!container) return { ok: false, error: translate('ui.containerNotFound2') }
  const res = usePhotoStore.getState().addIssue({ containerId, context, note, dataUrls, actor })
  if (res.ok) {
    useDataStore.getState().addTimelineEvent({ containerId, type: 'ISSUE_REPORTED', label: `Kendala dilaporkan (${dataUrls.length} foto)`, description: note.trim() || undefined, actor })
    useDataStore.getState().addAuditLogEntry({ user: actor, action: 'ISSUE_REPORTED', entity: container.number, description: `${container.number}: kendala dilaporkan dengan ${dataUrls.length} foto` })
  }
  return res
}
