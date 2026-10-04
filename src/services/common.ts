import { useAuthStore } from '@/store/authStore'
import { can, type Permission } from '@/lib/permissions'
import { translate } from '@/i18n'

export interface ServiceResult<T = undefined> {
  ok: boolean
  error?: string
  value?: T
  code?: 'INVALID_CREDENTIALS' | 'SUSPENDED' // machine-readable reason for login failures
}

export const ok = <T = undefined>(value?: T): ServiceResult<T> => ({ ok: true, value })
export const fail = <T = undefined>(error: string): ServiceResult<T> => ({ ok: false, error })
export const failWith = <T = undefined>(error: string, code: ServiceResult<T>['code']): ServiceResult<T> => ({ ok: false, error, code })

/** Name written to timeline and audit entries for the signed-in user. */
export function actorName(fallback = 'System'): string {
  return useAuthStore.getState().currentUser?.name ?? fallback
}

/** Services enforce permissions too, so a direct call cannot bypass a hidden button. */
export function requirePermission<T = undefined>(permission: Permission): ServiceResult<T> | null {
  const role = useAuthStore.getState().currentUser?.role
  return can(role, permission) ? null : fail<T>(translate('ui.youDoNotHavePermission'))
}
