import type { Container } from '@/types'

export type SealLookupResult = { container: Container; kind: 'smart' | 'regular' } | null

/** Resolves a scanned seal code to its container and whether it's live-trackable. */
export function findContainerBySealCode(containers: Container[], code: string): SealLookupResult {
  const trimmed = code.trim().toUpperCase()
  const smart = containers.find((c) => c.eSealId === trimmed || c.boltSealId === trimmed)
  if (smart) return { container: smart, kind: 'smart' }
  const regular = containers.find((c) => c.regularSealId === trimmed)
  if (regular) return { container: regular, kind: 'regular' }
  return null
}
