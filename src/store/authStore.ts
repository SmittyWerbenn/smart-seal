import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DemoUser, Role } from '@/types'
import { userForRole } from '@/mock/users'

interface AuthState {
  isAuthenticated: boolean
  currentUser: DemoUser | null
  login: (role: Role) => void
  logout: () => void
  switchRole: (role: Role) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      currentUser: null,
      login: (role) => set({ isAuthenticated: true, currentUser: userForRole(role) }),
      logout: () => set({ isAuthenticated: false, currentUser: null }),
      switchRole: (role) => set({ currentUser: userForRole(role) }),
    }),
    { name: 'smartseal-auth-v1' },
  ),
)
