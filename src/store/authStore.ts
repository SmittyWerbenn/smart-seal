import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DemoUser, Driver, Role } from '@/types'
import { userForRole } from '@/mock/users'

interface AuthState {
  isAuthenticated: boolean
  currentUser: DemoUser | null
  login: (role: Role) => void
  loginDriver: (driver: Driver) => void
  logout: () => void
  switchRole: (role: Role) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      currentUser: null,
      login: (role) => set({ isAuthenticated: true, currentUser: userForRole(role) }),
      // Driver logins are individual accounts (DRV-00x), not the shared demo driver user.
      loginDriver: (driver) =>
        set({
          isAuthenticated: true,
          currentUser: {
            id: driver.id,
            name: driver.name,
            email: driver.email ?? driver.username,
            role: 'DRIVER',
            driverId: driver.id,
            username: driver.username,
            avatarColor: '#16a34a',
          },
        }),
      logout: () => set({ isAuthenticated: false, currentUser: null }),
      switchRole: (role) => set({ currentUser: userForRole(role) }),
    }),
    { name: 'smartseal-auth-v1' },
  ),
)
