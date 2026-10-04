import { useAuthStore } from '@/store/authStore'
import { useDataStore } from '@/store/dataStore'

/** The Driver record behind the signed-in DRIVER user (reactive to store changes). */
export function useCurrentDriver() {
  const driverId = useAuthStore((s) => s.currentUser?.driverId)
  return useDataStore((s) => s.drivers.find((d) => d.id === driverId))
}
