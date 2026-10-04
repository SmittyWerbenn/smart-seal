import { create } from 'zustand'
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware'
import type { ContainerPhoto, DocPhotoType, IssueContext, IssueReport } from '@/types'
import { translate } from '@/i18n'

// Photos live in their own persisted store (separate localStorage key) so that a
// full browser quota can never corrupt the main data store.
let lastWriteOk = true
const safeStorage: StateStorage = {
  getItem: (k) => localStorage.getItem(k),
  setItem: (k, v) => {
    try {
      localStorage.setItem(k, v)
      lastWriteOk = true
    } catch {
      lastWriteOk = false
    }
  },
  removeItem: (k) => localStorage.removeItem(k),
}

export interface PhotoResult {
  ok: boolean
  error?: string
}

function quotaError() {
  return translate('msg.msg023')
}

let counter = 0
function photoId(prefix: string) {
  counter += 1
  return `${prefix}-${Date.now().toString(36)}${counter}`
}

interface PhotoState {
  photos: ContainerPhoto[]
  issues: IssueReport[]
  addPhotos: (containerId: string, items: { type: DocPhotoType; dataUrl: string }[], actor: string) => PhotoResult
  addIssue: (input: { containerId: string; context: IssueContext; note: string; dataUrls: string[]; actor: string }) => PhotoResult
  clearAll: () => void
}

export const usePhotoStore = create<PhotoState>()(
  persist(
    (set, get) => {
      // Commit then verify the write actually reached storage; roll back if not.
      const commit = (next: Pick<PhotoState, 'photos' | 'issues'>): PhotoResult => {
        const prev = { photos: get().photos, issues: get().issues }
        set(next)
        if (!lastWriteOk) {
          set(prev)
          return { ok: false, error: quotaError() }
        }
        return { ok: true }
      }
      return {
        photos: [],
        issues: [],
        addPhotos: (containerId, items, actor) => {
          const now = new Date().toISOString()
          const added: ContainerPhoto[] = items.map((i) => ({ id: photoId('PHT'), containerId, type: i.type, dataUrl: i.dataUrl, takenAt: now, takenBy: actor }))
          return commit({ photos: [...get().photos, ...added], issues: get().issues })
        },
        addIssue: ({ containerId, context, note, dataUrls, actor }) => {
          const now = new Date().toISOString()
          const issue: IssueReport = { id: photoId('ISS'), containerId, context, note: note.trim(), createdAt: now, createdBy: actor }
          const added: ContainerPhoto[] = dataUrls.map((dataUrl) => ({ id: photoId('PHT'), containerId, type: 'ISSUE', dataUrl, takenAt: now, takenBy: actor, issueId: issue.id }))
          return commit({ photos: [...get().photos, ...added], issues: [issue, ...get().issues] })
        },
        clearAll: () => set({ photos: [], issues: [] }),
      }
    },
    { name: 'smartseal-photos-v1', version: 1, storage: createJSONStorage(() => safeStorage) },
  ),
)
