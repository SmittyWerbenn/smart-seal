import { useMemo } from 'react'
import { useUiStore, type Lang } from '@/store/uiStore'
import { en } from './en'
import { id } from './id'

export type { Lang }
export type Dict = typeof en

// Dot-path keys derived from the English dictionary, e.g. 'nav.dashboard'.
type Path<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Path<T[K], `${P}${K}.`>
}[keyof T & string]
export type TKey = Path<Dict>

const dictionaries: Record<Lang, Dict> = { en, id }

export const LOCALE: Record<Lang, string> = { en: 'en-GB', id: 'id-ID' }

function lookup(dict: Dict, key: string): string | undefined {
  let node: unknown = dict
  for (const part of key.split('.')) {
    if (node && typeof node === 'object') node = (node as Record<string, unknown>)[part]
    else return undefined
  }
  return typeof node === 'string' ? node : undefined
}

/** Non-React translation. Reads the active language at call time (services, lib, store messages). */
export function translate(key: TKey | string, params?: Record<string, string | number>, lang?: Lang): string {
  const active = lang ?? useUiStore.getState().lang
  const raw = lookup(dictionaries[active], key) ?? lookup(en, key) ?? key
  if (!params) return raw
  return raw.replace(/\{(\w+)\}/g, (_, name) => (name in params ? String(params[name]) : `{${name}}`))
}

export function currentLang(): Lang {
  return useUiStore.getState().lang
}

/** React hook: re-renders the calling component when the language changes. */
export function useT() {
  const lang = useUiStore((s) => s.lang)
  return useMemo(
    () => (key: TKey | string, params?: Record<string, string | number>) => translate(key, params, lang),
    [lang],
  )
}

export type TFn = ReturnType<typeof useT>

/** Display label for an enum value (e.g. 'ON_DELIVERY'). Internal values are never changed. */
export function enumLabel(group: 'status' | 'checkpoint' | 'alertCategory', value: string): string {
  const key = `${group}.${value}`
  const label = translate(key)
  return label === key ? value.replace(/_/g, ' ') : label
}
