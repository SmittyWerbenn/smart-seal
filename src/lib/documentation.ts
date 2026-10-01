// Photo documentation of the Seal / Unlock process. Validation lives here (not only
// in the UI) so a process can never be completed without its required photos.
import { useDataStore } from '@/store/dataStore'
import { usePhotoStore, type PhotoResult } from '@/store/photoStore'
import type { ContainerPhoto, DocPhotoType, IssueContext } from '@/types'

export const DOC_PHOTO_META: Record<DocPhotoType, { label: string; activity: 'Seal' | 'Unlock' | 'Kendala' }> = {
  SEAL_BEFORE: { label: 'Foto Barang Sebelum Seal', activity: 'Seal' },
  SEAL_AFTER: { label: 'Foto Container Setelah Seal', activity: 'Seal' },
  UNLOCK_BEFORE: { label: 'Foto Container Sebelum Unlock', activity: 'Unlock' },
  UNLOCK_AFTER: { label: 'Foto Barang Setelah Seal Dibuka', activity: 'Unlock' },
  ISSUE: { label: 'Foto Kendala', activity: 'Kendala' },
}

export const SEAL_PHOTO_TEXT = '2 foto: kondisi barang di dalam container sebelum seal + kondisi container setelah seal terpasang.'
export const UNLOCK_PHOTO_TEXT = '2 foto: kondisi container sebelum seal dibuka + kondisi barang di dalam container setelah seal dibuka.'

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
  if (!before || !after) return { ok: false, error: 'Proses Seal memerlukan 2 foto wajib (barang sebelum seal + container setelah seal).' }
  const container = useDataStore.getState().containers.find((c) => c.id === containerId)
  if (!container) return { ok: false, error: 'Container tidak ditemukan.' }
  const res = usePhotoStore.getState().addPhotos(containerId, [{ type: 'SEAL_BEFORE', dataUrl: before }, { type: 'SEAL_AFTER', dataUrl: after }], actor)
  if (res.ok) {
    useDataStore.getState().addTimelineEvent({ containerId, type: 'SEAL_PHOTOS_DOCUMENTED', label: 'Dokumentasi Seal tersimpan (2 foto)', actor })
    useDataStore.getState().addAuditLogEntry({ user: actor, action: 'SEAL_PHOTOS_SAVED', entity: container.number, description: `${container.number}: 2 foto dokumentasi Seal tersimpan` })
  }
  return res
}

export function saveUnlockPhotos(containerId: string, before: string | null, after: string | null, actor: string): PhotoResult {
  if (!before || !after) return { ok: false, error: 'Proses Unlock memerlukan 2 foto wajib (container sebelum dibuka + barang setelah dibuka).' }
  const container = useDataStore.getState().containers.find((c) => c.id === containerId)
  if (!container) return { ok: false, error: 'Container tidak ditemukan.' }
  const res = usePhotoStore.getState().addPhotos(containerId, [{ type: 'UNLOCK_BEFORE', dataUrl: before }, { type: 'UNLOCK_AFTER', dataUrl: after }], actor)
  if (res.ok) {
    useDataStore.getState().addTimelineEvent({ containerId, type: 'UNLOCK_PHOTOS_DOCUMENTED', label: 'Dokumentasi Unlock tersimpan (2 foto)', actor })
    useDataStore.getState().addAuditLogEntry({ user: actor, action: 'UNLOCK_PHOTOS_SAVED', entity: container.number, description: `${container.number}: 2 foto dokumentasi Unlock tersimpan` })
  }
  return res
}

export function reportIssue(containerId: string, context: IssueContext, note: string, dataUrls: string[], actor: string): PhotoResult {
  if (dataUrls.length < 1) return { ok: false, error: 'Unggah minimal 1 foto kendala.' }
  const container = useDataStore.getState().containers.find((c) => c.id === containerId)
  if (!container) return { ok: false, error: 'Container tidak ditemukan.' }
  const res = usePhotoStore.getState().addIssue({ containerId, context, note, dataUrls, actor })
  if (res.ok) {
    useDataStore.getState().addTimelineEvent({ containerId, type: 'ISSUE_REPORTED', label: `Kendala dilaporkan (${dataUrls.length} foto)`, description: note.trim() || undefined, actor })
    useDataStore.getState().addAuditLogEntry({ user: actor, action: 'ISSUE_REPORTED', entity: container.number, description: `${container.number}: kendala dilaporkan dengan ${dataUrls.length} foto` })
  }
  return res
}
