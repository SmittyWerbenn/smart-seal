import { Globe } from 'lucide-react'
import { useUiStore } from '@/store/uiStore'
import { useT } from '@/i18n'

/** Header language switch (EN ↔ ID). Used by the staff topbar, Driver Portal header and login page. */
export function LanguageToggle({ className }: { className?: string }) {
  const t = useT()
  const lang = useUiStore((s) => s.lang)
  const setLang = useUiStore((s) => s.setLang)
  return (
    <button
      type="button"
      onClick={() => setLang(lang === 'en' ? 'id' : 'en')}
      className={
        className ??
        'flex items-center gap-1.5 rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-navy-700 hover:bg-slate-50'
      }
      aria-label={t('header.switchLanguage')}
      title={t('header.switchLanguage')}
    >
      <Globe size={14} />
      {lang === 'en' ? 'EN' : 'ID'}
    </button>
  )
}
