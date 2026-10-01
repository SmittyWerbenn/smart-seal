export type Lang = 'id' | 'en'
export const LABELS = {
  id: { language: 'Bahasa', english: 'English', indonesian: 'Bahasa Indonesia', photoIssueNote: 'Dokumentasi kendala dapat menggunakan beberapa foto (minimal 1), plus catatan kendala.' },
  en: { language: 'Language', english: 'English', indonesian: 'Bahasa Indonesia', photoIssueNote: 'Issue documentation can use several photos (minimum 1), plus an issue note.' },
}
export const t = (lang: Lang = 'id') => LABELS[lang]
