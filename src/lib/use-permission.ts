import { useAuthStore } from '@/store/authStore'
import { can, type Permission } from '@/lib/permissions'

/** Reactive permission check for buttons and actions. */
export function usePermission(permission: Permission): boolean {
  const role = useAuthStore((s) => s.currentUser?.role)
  return can(role, permission)
}
