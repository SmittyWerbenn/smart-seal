# Smart Seal & Container Tracking — Wiki Teknis

> Diperbarui dari source branch `main` (commit `e56f119`) + fitur **Driver Portal & Driver Management** (belum di-commit). Dibaca: konfigurasi, store, router, tipe, lib, dan sebagian halaman UI. Hal yang tidak terverifikasi ditandai "Perlu verifikasi".

## 1. Overview

| Item | Isi |
|---|---|
| Tujuan | Prototype demo platform keamanan & pelacakan kontainer (Smart E-Seal IoT + Basic Seal mekanik) untuk presentasi ke stakeholder (operator pelabuhan, logistik, vendor IoT) — `README.md` |
| Masalah | Visibilitas & keamanan kontainer end-to-end: stuffing → segel → transit darat/laut → unlock di tujuan → pengembalian device |
| Sifat | **Frontend-only**. Tidak ada backend, DB, API, auth asli. Semua data mock + state lokal (localStorage) |
| Stack | React 19, TypeScript ~6, Vite 8, Tailwind CSS v4, React Router v7 (HashRouter), Zustand 5, Recharts, Leaflet/react-leaflet, Lucide, jsPDF, date-fns, class-variance-authority, tailwind-merge |
| Tooling | oxlint (`.oxlintrc.json`), `tsc -b` |
| Bahasa UI | Toggle **ID / EN** di topbar (default ID). Cakupan terjemahan belum menyeluruh (lihat §9) |

## 2. Repository Structure

| Path | Fungsi |
|---|---|
| `index.html`, `src/main.tsx` | Entry point; `src/App.tsx` = router + guard |
| `src/pages/` | Satu file per route; `pages/field/*` = Field App mobile (lama); `pages/driver/*` = Driver Portal; `pages/admin/*` = Driver Management |
| `src/components/ui/` | Primitif design system (Button, Card, Modal, Tabs, Input, Badge, Progress) |
| `src/components/shared/` | App shell, sidebar/topbar, `nav-config.ts`, data-table, scanner-modal, seal-scan-flow, barcode-graphic, status/category badge, notifikasi, global search, `photo-ui.tsx` (picker & grid foto), `issue-report-modal.tsx` |
| `src/components/driver/` | Komponen Driver Portal: checkpoint wizard, panel verifikasi segel, form POD, signature pad, journey steps |
| `src/components/container/` | Tab detail kontainer (overview, tracking, cargo, seals, events, documents), `photo-docs-section.tsx`, unlock-panel, form cargo, modal create |
| `src/components/map/` | Peta Leaflet (`tracking-map.tsx`), marker icon |
| `src/store/` | Zustand: `authStore`, `dataStore` (termasuk slice driver), `photoStore`, `simulationStore`, `uiStore` |
| `src/services/` | Layer "API" palsu berbasis Promise di atas store (`delay.ts` menambah latensi). Driver: `driverService`, `driverAssignmentService`, `checkpointService`, `proofOfDeliveryService`, `driverNotificationService`, `common.ts` (permission & hasil) |
| `src/mock/` | Generator dataset awal deterministik (`rng.ts`, `generators.ts`, `geo.ts` rute/pelabuhan, `users.ts`, `clients.ts`, `products.ts` katalog produk & kategori, `drivers.ts` driver/kendaraan/assignment demo) |
| `src/lib/` | `actions.ts` (mutasi langsung), `seal-lookup.ts`, `barcode.ts`, `pdf-export.ts`, `documentation.ts` (aturan dokumentasi foto), `image.ts` (kompresi foto), `i18n.ts` (label ID/EN), `driver-workflow.ts` (urutan checkpoint, pemetaan status, lokasi simulasi), `driver-view.ts`, `permissions.ts` (matriks permission), `utils.ts` |
| `src/hooks/` (tambahan) | `useCurrentDriver` (Driver record dari user yang login) |
| `src/hooks/` | `useAsync`, `useSimulationEngine` |
| `src/types/index.ts` | Semua tipe domain |
| `src/i18n/index.ts` | **Tidak ter-track git dan tidak di-import** siapa pun. Kemungkinan sisa eksperimen; yang dipakai adalah `src/lib/i18n.ts` |
| `public/CNAME` | Custom domain `smart-seal.frel.cloud` |
| `.github/workflows/deploy.yml` | CI/CD GitHub Pages |
| `WIKI.md` | Dokumen ini |

Alias import: `@` → `src` (`vite.config.ts`, `tsconfig*.json`).

## 3. Architecture

```
Browser (SPA, HashRouter)
 ├─ Pages / Components (React)
 │    └─ baca/tulis ──► Zustand stores
 │                        ├─ dataStore      (entitas; persist "smartseal-data-v13")
 │                        ├─ photoStore     (foto & laporan kendala; persist "smartseal-photos-v1", key terpisah)
 │                        ├─ authStore      (persist "smartseal-auth-v1")
 │                        ├─ uiStore        (persist "smartseal-ui-v1": selectedContainerId, sidebarCollapsed, lang)
 │                        └─ simulationStore (tidak dipersist; mesin demo)
 ├─ services/*  ─► dataStore (Promise + delay)  ← titik swap ke API nyata (klaim README)
 ├─ useSimulationEngine: setInterval 200ms → simulationStore.tick + dataStore.driftVessels
 └─ Eksternal: tile OpenStreetMap (satu-satunya network call di source)
```

- Backend: **Tidak ditemukan**. Database: **Tidak ditemukan** (hanya localStorage). External service: hanya tile OSM.
- Catatan: banyak halaman membaca `useDataStore` langsung, bukan lewat `services/`, sehingga layer service tidak konsisten dipakai (Perlu verifikasi cakupan).

## 4. Routing & Access

| Route | Halaman | Catatan |
|---|---|---|
| `/login` | `login-page` | Publik |
| `/scan`, `/scan-barcode` | `public-scan-page` | Publik, tanpa login |
| `/dashboard` | `dashboard-page` | |
| `/containers`, `/containers/:id` | Seal Monitoring, detail kontainer | |
| `/containers/:id/stuffing`, `/stuffing` | `stuffing-wizard-page` | |
| `/shipments`, `/cargo` | Shipments, Cargo / DO | |
| `/eseals`, `/eseals/:id`, `/eseals/generate` | Seal Inventory, detail device, generate Basic Seal + PDF | |
| `/vessels`, `/vessels/:id` | Kapal / AIS | |
| `/alerts`, `/geofences`, `/reverse-logistics`, `/reports` | | |
| `/master/item-categories` | Master Kategori Barang | Menu "Master Data" |
| `/audit-logs`, `/users`, `/settings`, `/simulation` | | |
| `/control-tower` | Redirect ke `/containers` | Sisa dari fitur yang digabung |
| `/field/*` | Field App (mobile lama): home, stuffing (`/field/stuffing/:id`), scanner, tracking, alerts | Dapat dibuka driver dari Profile |
| `/driver` | Driver Portal: home (kendaraan, shipment aktif), `shipments`, `shipments/:id` (overview, journey, tracking, cargo, seal, events), `scan`, `alerts`, `profile` | Hanya role DRIVER (`RequireDriver`) |
| `/admin/drivers`, `/admin/drivers/:id` | Driver Management (list, KPI, filter, tambah/edit, assign, suspend, reset password; detail dengan tab) | `driver.view_all` (`RequirePermission`) |

Menu per role ada di `shared/nav-config.ts` (`navForRole`).

## 5. Application Flow

Semuanya in-memory / localStorage:

1. **Login** (`login-page.tsx`) → `authStore.login(role)` → `userForRole`. DRIVER diarahkan ke `/field`.
2. **Stuffing** (`stuffing-wizard-page.tsx`, `field-stuffing-page.tsx`): pilih kontainer → mode (SINGLE/DUAL/BASIC) → scan seal → cek baterai (smart seal saja) → `armContainer` (`lib/actions.ts`). Dokumentasi foto Seal diminta di tahap ini (§6).
3. **Simulasi perjalanan** (`simulationStore.ts`): `startJourney` → GATE_IN/origin port → `loadOnVessel` (handoff IOT_GPS→AIS) → `startOceanTransit` → `arriveDestinationPort` (handoff AIS→IOT_GPS) → `startDestinationDelivery` → `enterDestinationGeofence` → `enableUnlock` → `requestAndConfirmUnlock` → `completeDelivery` (+ `simulateDeviceReturn`). `runFullDemo` merangkai 16 langkah otomatis. Posisi dihitung dari `routeProgress` (0..1) pada waypoint rute (`mock/geo.ts: pointOnRoute`).
4. **Unlock**: geofence tujuan → konfirmasi supervisor (`requestAndConfirmUnlock`), atau offline PIN (`offlineUnlock`, PIN demo hard-coded di `components/container/unlock-panel.tsx`). Dokumentasi foto Unlock diminta sebelum seal dibuka (§6). Smart Seal dilepas ke pool reuse (Reverse Logistics); Basic Seal ditandai sekali-pakai (audit `SEAL_FLAGGED_UNSEALED`).
5. **Scan seal** (`lib/seal-lookup.ts`): kode → cari `eSealId`/`boltSealId` (smart → tracking live) atau `regularSealId` (basic → isi cargo saja). Tersedia publik di `/scan`, `/scan-barcode`, dan di Field App.
6. **Gangguan simulasi**: tamper / low battery / offline → update device + alert + timeline + notifikasi. Kendala lapangan bisa dilaporkan lewat `issue-report-modal`.
7. **Generate Basic Seal Barcodes** (`generate-basic-seals-page.tsx`): `addBasicSealBatch` → stok di `dataStore.basicSealStock`; ekspor PDF via `lib/pdf-export.ts` (jsPDF). Barcode = angka 13 digit deterministik dari hash (`lib/barcode.ts`, bukan simbologi barcode asli).
8. Setiap aksi menulis timeline event + audit log ke `dataStore`.
9. **Driver Portal** (`/driver`): login driver (username + password demo) → admin meng-assign shipment (`driverAssignmentService.assign`) → driver melakukan checkpoint berurutan (`checkpointService.confirmCheckpoint`) → checkpoint `ARRIVED_DESTINATION` & `DELIVERED` wajib verifikasi segel → `DELIVERED` wajib Proof of Delivery → assignment COMPLETED, driver kembali AVAILABLE.
   - Aturan urutan: hanya checkpoint berikutnya (`nextCheckpoint`) yang bisa dikonfirmasi; checkpoint tidak dapat dilompati.
   - Setiap checkpoint: menulis `driverCheckpoints`, memperbarui container (status, progres, posisi simulasi, marker), timeline event, audit `CHECKPOINT_UPDATED`. Checkpoint kedatangan & delivery juga membuat notifikasi untuk staff (topbar bell).
   - **Posisi GPS:** wizard meminta `navigator.geolocation` saat dibuka. Jika berhasil, koordinat perangkat dipakai sebagai posisi checkpoint dan posisi kontainer (`positionSource: 'GPS'`, `accuracyM`). Jika ditolak, gagal, atau tidak didukung, dipakai titik rute simulasi (`positionSource: 'SIMULATED'`) dan layar menampilkan alasannya. Nama lokasi tetap dari titik rute. Butuh HTTPS atau localhost, dan izin lokasi dari browser.
   - Tamper pada Smart Seal memblokir checkpoint sampai supervisor menekan **Approve Exception** (`checkpointService.approveException`, tersimpan di `shipment.exceptionApproved`).
   - Status driver `OFFLINE` atau `SUSPENDED` memblokir checkpoint di service (tidak hanya di UI).

## 6. Dokumentasi Foto

Fitur foto dibuat setelah versi wiki sebelumnya. Aturan validasi ada di `lib/documentation.ts`, bukan hanya di UI, sehingga proses tidak bisa selesai tanpa foto wajib.

| Proses | Foto | Fungsi simpan |
|---|---|---|
| **Seal** | 2 wajib: `SEAL_BEFORE` (barang sebelum seal) + `SEAL_AFTER` (container setelah seal) | `saveSealPhotos` |
| **Unlock** | 2 wajib: `UNLOCK_BEFORE` (container sebelum dibuka) + `UNLOCK_AFTER` (barang setelah seal dibuka) | `saveUnlockPhotos` |
| **Kendala** | Minimal 1 foto `ISSUE` + catatan; konteks `SEAL` / `UNLOCK` / `GENERAL` | `reportIssue` |

- Setiap simpan menulis timeline event dan audit log.
- Foto dikompres di browser (`lib/image.ts`): sisi maksimum 960 px, JPEG kualitas 0.65.
- Penyimpanan foto di `photoStore` terpisah dari `dataStore`. Jika kuota localStorage penuh, penulisan dibatalkan (rollback) dan pengguna diberi pesan untuk menghapus data prototype lama.
- UI: `photo-docs-section.tsx` di detail kontainer dan dashboard; galeri di `photo-ui.tsx`.

## 7. Master Kategori Barang

- Kategori barang disimpan di `dataStore.itemCategories` (`id`, `name`, `color` hex, `active`). Warna adalah sumber tunggal untuk semua badge kategori.
- Seed awal dibuat dari katalog produk (`mock/products.ts`). Kategori bebas dari data lama dimigrasikan ke `categoryId` (lihat §9 migrasi).
- Validasi (`validateCategory` di `dataStore.ts`): nama wajib, nama tidak boleh duplikat, warna harus hex (mis. `#dc2626`).
- Hapus kategori yang masih dipakai item ditolak (`category_in_use`). Hak hapus: admin/supervisor. Hak tambah dan edit: semua role dengan akses Master Data.
- Dipakai di kargo dan halaman scan (`shared/category-badge.tsx`).

## 8. Data Model

Entitas (`src/types/index.ts`): `Container`, `ESealDevice`, `CargoLine`, `Shipment`, `Vessel`, `AlertItem`, `Geofence`, `TimelineEvent`, `AuditLogEntry`, `AppNotification`, `RouteDefinition`, `Port`, `BasicSealStockItem`, `ItemCategory`, `ContainerPhoto`, `IssueReport`, dan entitas driver: `Driver` (`driverId` DRV-001, `username`, `password` plain text demo), `Vehicle`, `DriverAssignment` (ACTIVE/COMPLETED/REASSIGNED), `DriverCheckpoint`, `ProofOfDelivery`.

Relasi utama:
- `Container.shipmentId` → `Shipment`; `CargoLine.containerId` → `Container`; `CargoLine.categoryId` → `ItemCategory.id` (null = tanpa kategori).
- `Container.eSealId`/`boltSealId` → `ESealDevice.id`; `ESealDevice.containerId` (null saat idle/pool).
- `Container.regularSealId` → kode Basic Seal.
- `Container.routeId` → `RouteDefinition` (waypoint); `Container.vesselId` → `Vessel` (saat AIS).
- `ContainerPhoto.containerId` → `Container`; `ContainerPhoto.issueId` → `IssueReport.id` (hanya foto ISSUE).
- `DriverAssignment.shipmentId` / `containerId` / `driverId` / `vehicleId`; `Shipment.driverId` & `vehicleId` terisi hanya saat assignment ACTIVE.
- `AppNotification.driverId` → notifikasi privat driver (tidak tampil di bell staff).
- Alert/Timeline/Audit merujuk `containerId`/`deviceId`.

Enum penting: `ContainerStatus`, `SecurityMode` (SINGLE_SEAL/DUAL_SEAL/BASIC_SEAL), `TrackingMode` (IOT_GPS/AIS/NONE), `RiskLevel`, `MarkerState`, `DeviceStatus`, `DeviceLifecycle`, `DocPhotoType`, `IssueContext`.

## 9. State & Persistensi

| Store | Key localStorage | Isi | Versi / migrasi |
|---|---|---|---|
| `dataStore` | `smartseal-data-v13` | Entitas utama + kategori + slice driver (`drivers`, `vehicles`, `driverAssignments`, `driverCheckpoints`, `proofOfDeliveries`) | `version: 2`; `migrateDataState` (`store/dataStore.ts`): v0→v1 kategori; v1→v2 menambah data driver demo di atas data tersimpan (kontainer & shipment ikut diperbarui sesuai checkpoint demo) |
| `photoStore` | `smartseal-photos-v1` | Foto & laporan kendala | `version: 1`; key terpisah agar kuota penuh tidak merusak data utama |
| `authStore` | `smartseal-auth-v1` | Sesi demo | Tidak ada token |
| `uiStore` | `smartseal-ui-v1` | `selectedContainerId`, `sidebarCollapsed`, `lang` | Hanya field itu yang dipersist |
| `simulationStore` | — | State mesin demo | Tidak dipersist |

- Saat struktur state berubah: tambah `version` + blok di `migrateDataState`. `resetAll` membersihkan foto juga dan mengembalikan seluruh data driver ke seed.
- Tidak ada database, migration server, atau backup.

## 10. Bahasa (i18n)

- Pilihan bahasa disimpan di `uiStore.lang` (default `id`). Toggle ada di `topbar.tsx`.
- Label ada di `src/lib/i18n.ts` (`LABELS`, ID dan EN). Saat ini yang memakai hanya bagian yang sudah diterjemahkan (mis. menu, label kategori, dokumentasi foto di dashboard).
- Banyak teks UI masih hard-coded dalam bahasa Indonesia atau Inggris. Cakupan penuh **Perlu verifikasi**.
- `src/i18n/index.ts` tidak dipakai dan tidak ter-track; bisa dihapus setelah dipastikan.

## 11. Authentication & Authorization

- Login staff: **demo saja**, tanpa password/kredensial; satu-klik pilih role (`authStore.login(role)`), user dari `mock/users.ts`. Role bisa diganti via `switchRole` (topbar / Users & Roles).
- Login driver: username + password dicek terhadap record `Driver` (`driverService.authenticate`). Akun demo `driver01`…`driver06`, password `driver123`. Role DRIVER di Users & Roles / tombol Driver login sebagai Agus Prasetyo (DRV-006, `user-driver`), yang punya shipment aktif SHP-0012 sehingga bisa langsung update status dan checkpoint. Driver SUSPENDED tidak bisa masuk. Sesi driver disimpan dengan `loginDriver` (`currentUser.driverId`).
- Matriks permission: `src/lib/permissions.ts`. SUPER_ADMIN: kelola driver, suspend, reset password, assign, lihat semua, approve exception. SUPERVISOR: lihat semua, assign, approve exception. DRIVER: portal & checkpoint (hanya shipment miliknya). Dipakai di route guard, sidebar, tombol, dan service (bukan hanya menu).
- Role (`ALL_ROLES`): SUPER_ADMIN, CONTROL_TOWER, WAREHOUSE, DRIVER, SUPERVISOR, CLIENT, AUDITOR. Yang punya akun demo: CONTROL_TOWER, WAREHOUSE, DRIVER, CLIENT.
- Guard (`App.tsx`): `RequireAuth` (harus login; DRIVER → `/field`), `RequireFieldAuth` (harus login). `/login`, `/scan`, `/scan-barcode` publik.
- Permission: menu difilter per role di `shared/nav-config.ts`. Guard route per role **hanya** untuk DRIVER; role lain bisa membuka URL halaman yang tak ada di menu (Perlu verifikasi di tiap halaman). Semua ini client-side, tidak aman sebagai kontrol akses nyata.
- Role CLIENT hanya melihat kargo miliknya. Kargo lain tampil sebagai "Consolidated Cargo" (`cargo-tab.tsx`, `overview-tab.tsx`, `seal-scan-flow.tsx`).

## 12. API

**Tidak ditemukan** API HTTP. Tidak ada `fetch`/axios di source. "API" = `src/services/*` (mock): `containerService`, `deviceService`, `vesselService`, `alertService`, `geofenceService`, `auditService`, `trackingService` — semua mengembalikan data dari `dataStore` setelah `delay()`.

## 13. Configuration & Environment

- Env variable: **Tidak ditemukan** (tidak ada `import.meta.env`, tidak ada `.env*` ter-track).
- `vite.config.ts`: `base: '/'` (wajib untuk custom domain), dev server `host: true`, port 5173, alias `@`.
- Konstanta hard-coded: PIN offline demo di `unlock-panel.tsx`; tile URL OSM di `tracking-map.tsx`.

## 14. Deployment & Infrastructure

- `.github/workflows/deploy.yml`: push ke `main` (atau manual) → Node 22 → `npm ci` → `npm run build` → upload `dist` → deploy GitHub Pages.
- Domain: `public/CNAME` = `smart-seal.frel.cloud`.
- HashRouter dipakai sehingga tidak perlu konfigurasi fallback SPA di Pages.
- Docker/K8s: **Tidak ditemukan**. Tidak ada step lint/test di CI (hanya build, yang menjalankan `tsc -b`).

## 15. External Integrations

| Layanan | Status |
|---|---|
| OpenStreetMap tiles | Dipakai (`tracking-map.tsx`) |
| AIS, MQTT, IoT device, payment, email, storage | Tidak ada — disimulasikan / out of scope (`README.md`) |

## 16. Development Guide

```bash
npm install
npm run dev       # http://localhost:5173 (host: true)
npm run build     # tsc -b && vite build
npm run lint      # oxlint
npm run preview
```
Prasyarat: Node (CI memakai 22). Test: **Tidak ditemukan** (tidak ada script/file test). Reset data demo: Settings → Reset Prototype Data (`dataStore.resetAll`).

## 17. Troubleshooting

| Gejala | Penyebab / solusi |
|---|---|
| Data aneh/lama setelah update kode | localStorage persist; reset di Settings atau hapus key `smartseal-*`, atau naikkan versi key/migrate |
| Foto tidak tersimpan, muncul pesan "penyimpanan penuh" | Kuota localStorage browser habis. Reset data prototype di Settings atau kurangi jumlah foto |
| Aset 404 di deploy | `base` harus `'/'` untuk custom domain (`vite.config.ts`) |
| Peta tidak tampil | Butuh akses ke `tile.openstreetmap.org`; z-index peta pernah diperbaiki (commit `2e271f3`) |
| Barcode kosong saat cetak | Pernah diperbaiki di commit `14aa2e0` (`barcode-graphic`/print) |
| Driver tak bisa buka dashboard | Disengaja: driver diarahkan ke `/driver` (`App.tsx`); staff yang membuka `/driver` diarahkan ke dashboard |
| Checkpoint ditolak "harus berurutan" | Sesuai aturan. Checkpoint berikutnya ditampilkan di tombol Update Checkpoint |
| Checkpoint ditolak "Tamper terdeteksi" | Segel tamper. Supervisor/Super Admin menekan Approve Exception di Driver Management → detail driver |
| Login driver gagal "Akun ditangguhkan" | Driver berstatus SUSPENDED. Aktifkan lagi di Driver Management |
| Teks campur ID/EN | Terjemahan belum menyeluruh (§10) |

## 18. Important Notes

- Prototype: jangan dianggap aman/produksi. Auth, RBAC, dan "unlock" hanya UI.
- Demo PIN offline di-hardcode; README menyebut nilainya, jangan dipakai sebagai pola produksi.
- `simulationStore` hanya menggerakkan satu "active container"; `lib/actions.ts` menduplikasi sebagian logika simulate* (tamper/offline/low battery) dari `simulationStore.ts` — risiko drift.
- `useSimulationEngine` berjalan terus (interval 200ms) selama app terbuka; vessel bergerak ambient (`driftVessels`) dan state disimpan ke localStorage terus-menerus (potensi beban).
- Bundle: jsPDF, Recharts, Leaflet tanpa code-splitting terlihat (semua page di-import statis di `App.tsx`) — Perlu verifikasi ukuran bundle.
- `README.md` masih menyebut "Control Tower" sebagai halaman dan 7 role di Users & Roles; sebagian sudah usang. Wiki ini lebih mutakhir.
- Tidak ada test otomatis di repo, tidak ada lint/test di CI. Pengujian fitur driver dilakukan manual (lint + build + smoke test browser) dan skrip uji service sementara di luar repo.
- Driver Portal: password driver disimpan plain text di localStorage (demo). Jangan dipakai sebagai pola produksi.
- Simulasi (`simulationStore`) dan checkpoint driver sama-sama menulis posisi/status container. Jika RUN FULL DEMO sedang berjalan pada kontainer yang sama, nilai simulasi bisa menimpa hasil checkpoint. **Perlu verifikasi.**
- Belum ada: grafik Recharts di Driver Management, filter status/checkpoint di daftar shipment driver, CRUD kendaraan (kendaraan fixed 5 demo), dan reminder checkpoint berbasis waktu (hanya data seed).
- Barcode adalah angka palsu deterministik (`lib/barcode.ts`), bukan Code128/EAN asli.
