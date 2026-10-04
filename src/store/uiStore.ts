import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Lang = 'en' | 'id'

interface UiState {
  selectedContainerId: string | null
  selectedVesselId: string | null
  sidebarCollapsed: boolean
  mobileNavOpen: boolean
  lang: Lang
  setSelectedContainer: (id: string | null) => void
  setSelectedVessel: (id: string | null) => void
  toggleSidebar: () => void
  setMobileNavOpen: (open: boolean) => void
  setLang: (lang: Lang) => void
  followContainer: boolean // monitoring map keeps the tracked container centred
  setFollowContainer: (follow: boolean) => void
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      selectedContainerId: null,
      selectedVesselId: null,
      sidebarCollapsed: false,
      mobileNavOpen: false,
      lang: 'en',
      setSelectedContainer: (id) => set({ selectedContainerId: id }),
      setSelectedVessel: (id) => set({ selectedVesselId: id }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setMobileNavOpen: (open) => set({ mobileNavOpen: open }),
      setLang: (lang) => set({ lang }),
      followContainer: false,
      setFollowContainer: (follow) => set({ followContainer: follow }),
    }),
    { name: 'smartseal-ui-v1', partialize: (s) => ({ selectedContainerId: s.selectedContainerId, sidebarCollapsed: s.sidebarCollapsed, lang: s.lang }) },
  ),
)
