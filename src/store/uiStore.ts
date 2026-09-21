import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UiState {
  selectedContainerId: string | null
  selectedVesselId: string | null
  sidebarCollapsed: boolean
  mobileNavOpen: boolean
  setSelectedContainer: (id: string | null) => void
  setSelectedVessel: (id: string | null) => void
  toggleSidebar: () => void
  setMobileNavOpen: (open: boolean) => void
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      selectedContainerId: null,
      selectedVesselId: null,
      sidebarCollapsed: false,
      mobileNavOpen: false,
      setSelectedContainer: (id) => set({ selectedContainerId: id }),
      setSelectedVessel: (id) => set({ selectedVesselId: id }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setMobileNavOpen: (open) => set({ mobileNavOpen: open }),
    }),
    { name: 'smartseal-ui-v1', partialize: (s) => ({ selectedContainerId: s.selectedContainerId, sidebarCollapsed: s.sidebarCollapsed }) },
  ),
)
