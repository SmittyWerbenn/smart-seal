// Selective i18n for the language toggle + photo documentation labels.
export type Lang = 'id' | 'en'

export interface LocaleStrings {
  language: string
  english: string
  indonesian: string

  photoDocsSectionTitle: string
  sealFlow: string
  unlockFlow: string
  issueFlow: string
  photoRequired: string
  docComplete: string
  photoIssue: string
  sealNote: string
  unlockNote: string
  issueNote: string
  photoCargoBefore: string
  photoContainerAfter: string
  photoContainerBeforeUnlock: string
  photoCargoAfterUnlock: string

  masterCategories: string
  masterDesc: (n: number) => string
  addCategory: string
  editCategory: string
  deleteCategory: string
  categoryName: string
  categoryColor: string
  categoryActive: string
  categoryInactive: string
  colorPreview: string
  colorInvalid: string
  nameExists: string
  nameRequired: string
  deleteCategoryTitle: string
  deleteCategoryNote: (name: string) => string
  categoryInUse: (n: number) => string
  save: string
  cancel: string
  required: string
  optional: string
  issueReportTitle: string
  issueReportDesc: (container: string, context: string) => string
  issuePhotos: string
  issuePhotosHint: string
  issueNote: string
  issueNotePlaceholder: string
  saveDocumentation: string
  issueContextSeal: string
  issueContextUnlock: string
  issueContextGeneral: string
  addCategoryTitle: string
  editCategoryTitleShort: string
  categoryNamePlaceholder: string
}

export const STRINGS: Record<Lang, LocaleStrings> = {
  id: {
    language: 'Bahasa',
    english: 'English',
    indonesian: 'Bahasa Indonesia',

    photoDocsSectionTitle: 'Dokumentasi Foto',
    sealFlow: 'PROSES SEAL',
    unlockFlow: 'PROSES UNLOCK',
    issueFlow: 'PROSES KENDALA',
    photoRequired: 'Foto Wajib',
    docComplete: 'Dokumentasi Selesai',
    photoIssue: 'Foto Kendala',
    sealNote: '2 foto: kondisi barang di dalam container sebelum seal + kondisi container setelah seal terpasang.',
    unlockNote: '2 foto: kondisi container sebelum seal dibuka + kondisi barang di dalam container setelah seal dibuka.',
    issueNote: 'Dokumentasi kendala dapat menggunakan beberapa foto (minimal 1), plus catatan kendala.',
    photoCargoBefore: 'Foto Barang Sebelum Seal',
    photoContainerAfter: 'Foto Container Setelah Seal',
    photoContainerBeforeUnlock: 'Foto Container Sebelum Unlock',
    photoCargoAfterUnlock: 'Foto Barang Setelah Seal Dibuka',

    masterCategories: 'Master Kategori Barang',
    masterDesc: (n) => `${n} kategori — nama dan warna didefinisikan di sini dipakai di seluruh aplikasi.`,
    addCategory: 'Tambah Kategori',
    editCategory: 'Edit Kategori',
    deleteCategory: 'Hapus Kategori',
    categoryName: 'Nama Kategori',
    categoryColor: 'Warna',
    categoryActive: 'Aktif',
    categoryInactive: 'Nonaktif',
    colorPreview: 'Pratinjau',
    colorInvalid: 'Warna harus hex seperti #dc2626.',
    nameExists: 'Nama kategori sudah ada.',
    nameRequired: 'Nama kategori wajib diisi.',
    deleteCategoryTitle: 'Hapus Kategori',
    deleteCategoryNote: (name) => `Hapus kategori ${name}? Ini tidak dapat dibatalkan.`,
    categoryInUse: (n) => `Kategori dipakai oleh ${n} item. Nonaktifkan sebagai ganti.`,
    save: 'Simpan',
    cancel: 'Batal',
    required: 'wajib',
    optional: 'opsional',
    issueReportTitle: 'Ada Kendala',
    issueReportDesc: (container, context) => `Kendala pada ${context} — ${container}. Dokumentasi kendala dapat menggunakan beberapa foto.`,
    issuePhotos: 'Foto Kendala',
    issuePhotosHint: 'minimal 1, boleh lebih',
    issueNote: 'Catatan Kendala',
    issueNotePlaceholder: 'Jelaskan kendala yang terjadi (opsional)',
    saveDocumentation: 'Simpan Dokumentasi',
    issueContextSeal: 'proses Seal',
    issueContextUnlock: 'proses Unlock',
    issueContextGeneral: 'container ini',
    addCategoryTitle: 'Tambah Kategori',
    editCategoryTitleShort: 'Edit Kategori',
    categoryNamePlaceholder: 'cth. Kimia',
  },
  en: {
    language: 'Language',
    english: 'English',
    indonesian: 'Bahasa Indonesia',

    photoDocsSectionTitle: 'Photo Documentation',
    sealFlow: 'SEAL PROCESS',
    unlockFlow: 'UNLOCK PROCESS',
    issueFlow: 'ISSUE PROCESS',
    photoRequired: 'Photo Required',
    docComplete: 'Documentation Complete',
    photoIssue: 'Issue Photos',
    sealNote: '2 photos: cargo condition inside the container before sealing + container condition after the seal is fitted.',
    unlockNote: '2 photos: container before the seal is opened + cargo inside the container after the seal is opened.',
    issueNote: 'Issue documentation can use several photos (minimum 1), plus an issue note.',
    photoCargoBefore: 'Photo of Cargo Before Sealing',
    photoContainerAfter: 'Photo of Container After Seal Fitted',
    photoContainerBeforeUnlock: 'Photo of Container Before Unlock',
    photoCargoAfterUnlock: 'Photo of Cargo After Seal Opened',

    masterCategories: 'Master Item Categories',
    masterDesc: (n) => `${n} categories — names and colors defined here are used across the whole app.`,
    addCategory: 'Add Category',
    editCategory: 'Edit Category',
    deleteCategory: 'Delete Category',
    categoryName: 'Category Name',
    categoryColor: 'Color',
    categoryActive: 'Active',
    categoryInactive: 'Inactive',
    colorPreview: 'Preview',
    colorInvalid: 'Color must be a hex value like #dc2626.',
    nameExists: 'Category name already exists.',
    nameRequired: 'Category name is required.',
    deleteCategoryTitle: 'Delete Category',
    deleteCategoryNote: (name) => `Delete ${name}? This cannot be undone.`,
    categoryInUse: (n) => `Category is used by ${n} item(s). Deactivate it instead.`,
    save: 'Save',
    cancel: 'Cancel',
    required: 'required',
    optional: 'optional',
    issueReportTitle: 'Reported Issue',
    issueReportDesc: (container, context) => `Issue in ${context} — ${container}. Issue documentation can use several photos.`,
    issuePhotos: 'Issue Photos',
    issuePhotosHint: 'minimum 1, more allowed',
    issueNote: 'Issue Note',
    issueNotePlaceholder: 'Describe the issue (optional)',
    saveDocumentation: 'Save Documentation',
    issueContextSeal: 'seal process',
    issueContextUnlock: 'unlock process',
    issueContextGeneral: 'this container',
    addCategoryTitle: 'Add Category',
    editCategoryTitleShort: 'Edit Category',
    categoryNamePlaceholder: 'e.g. Chemicals',
  },
}

export const t = (lang: Lang = 'id') => STRINGS[lang]
