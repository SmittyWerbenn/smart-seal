# Smart Seal & Container Tracking — Wiki Teknis

> Dibuat dari analisis source (branch `main`, 14 commit). Hanya konfigurasi, store, service, router, dan tipe yang dibaca; halaman UI dibaca sebagian. Hal yang tidak terverifikasi ditandai "Perlu verifikasi".

## 1. Overview

| Item | Isi |
|---|---|
| Tujuan | Prototype demo platform keamanan & pelacakan kontainer (Smart E-Seal IoT + Basic Seal mekanik) untuk presentasi ke stakeholder (operator pelabuhan, logistik, vendor IoT) — `README.md` |
| Masalah | Visibilitas & keamanan kontainer end-to-end: stuffing → segel → transit darat/laut → unlock di tujuan → pengembalian device |
| Sifat | **Frontend-only**. Tidak ada backend, DB, API, auth asli. Semua data mock + state lokal (localStorage) |
| Stack | React 19, TypeScript ~6, Vite 8, Tailwind CSS v4, React Router v7 (HashRouter), Zustand 5, Recharts, Leaflet/react-leaflet, Lucide, jsPDF, date-fns, class-variance-authority, tailwind-merge |
| Tooling | oxlint (`.oxlintrc.json`), `tsc -b` |

## 2. Repository Structure

| Path | Fungsi |
|---|---|
| `index.html`, `src/main.tsx` | Entry point; `src/App.tsx` = router + guard |
| `src/pages/` | Satu file per route; `pages/field/*` = Field App mobile (driver) |
| `src/components/ui/` | Primitif design system (Button, Card, Modal, Tabs, Input, Badge, Progress) |
| `src/components/shared/` | App shell, sidebar/topbar, `nav-config.ts`, data-table, scanner-modal, seal-scan-flow, barcode-graphic, status badge, notifikasi, global search |
| `src/components/container/` | Tab detail kontainer (overview, tracking, cargo, seals, events, documents), unlock-panel, form cargo, modal create |
| `src/components/map/` | Peta Leaflet (`tracking-map.tsx`), marker icon |
| `src/store/` | Zustand: `authStore`, `dataStore`, `simulationStore`, `uiStore` |
| `src/services/` | Layer "API" palsu berbasis Promise di atas store (`delay.ts` menambah latensi) |
| `src/mock/` | Generator dataset awal deterministik (`rng.ts`, `generators.ts`, `geo.ts` rute/pelabuhan, `users.ts`, `clients.ts`, `products.ts`) |
| `src/lib/` | `actions.ts` (mutasi langsung), `seal-lookup.ts`, `barcode.ts`, `pdf-export.ts`, `utils.ts` |
| `src/hooks/` | `useAsync`, `useSimulationEngine` |
| `src/types/index.ts` | Semua tipe domain |
| `public/CNAME` | Custom domain `smart-seal.frel.cloud` |
| `.github/workflows/deploy.yml` | CI/CD GitHub Pages |
| `.claude/` | Folder kosong (tidak ada isi yang ter-track) |

Alias import: `@` → `src` (`vite.config.ts`, `tsconfig*.json`).

## 3. Architecture

```
Browser (SPA, HashRouter)
 ├─ Pages / Components (React)
 │    └─ baca/tulis ──► Zustand stores
 │                        ├─ dataStore  (entitas; persist localStorage "smartseal-data-v13")
 │                        ├─ authStore  (persist "smartseal-auth-v1")
 │                        ├─ uiStore    (persist "smartseal-ui-v1", sebagian field)
 │                        └─ simulationStore (tidak dipersist; mesin demo)
 ├─ services/*  ─► dataStore (Promise + delay)  ← titik swap ke API nyata (klaim README)
 ├─ useSimulationEngine: setInterval 200ms → simulationStore.tick + dataStore.driftVessels
 └─ Eksternal: tile OpenStreetMap (satu-satunya network call di source)
```

- Backend: **Tidak ditemukan**. Database: **Tidak ditemukan** (hanya localStorage). External service: hanya tile OSM.
- Catatan: banyak halaman membaca `useDataStore` langsung (mis. `public-scan-page.tsx`), bukan lewat `services/`, sehingga layer service tidak konsisten dipakai (Perlu verifikasi cakupan).

## 4. Application Flow

Flow yang ditemukan di source (semuanya in-memory):

1. **Login** (`login-page.tsx`) → `authStore.login(role)` → `userForRole`. DRIVER diarahkan ke `/field`.
2. **Stuffing** (`stuffing-wizard-page.tsx`, `field-stuffing-page.tsx`): pilih kontainer → mode (SINGLE/DUAL/BASIC) → scan seal → cek baterai (smart seal saja) → `armContainer` (`lib/actions.ts`).
3. **Simulasi perjalanan** (`simulationStore.ts`): `startJourney` → GATE_IN/origin port → `loadOnVessel` (handoff tracking IOT_GPS→AIS) → `startOceanTransit` → `arriveDestinationPort` (handoff AIS→IOT_GPS) → `startDestinationDelivery` → `enterDestinationGeofence` → `enableUnlock` → `requestAndConfirmUnlock` → `completeDelivery` (+ `simulateDeviceReturn`). `runFullDemo` merangkai 16 langkah otomatis. Posisi dihitung dari `routeProgress` (0..1) pada waypoint rute (`mock/geo.ts: pointOnRoute`).
4. **Unlock**: geofence tujuan → konfirmasi supervisor (`requestAndConfirmUnlock`), atau offline PIN (`offlineUnlock`, PIN demo hard-coded di `components/container/unlock-panel.tsx`). Smart Seal dilepas ke pool reuse (Reverse Logistics); Basic Seal ditandai sekali-pakai (audit `SEAL_FLAGGED_UNSEALED`).
5. **Scan seal** (`lib/seal-lookup.ts`): kode → cari `eSealId`/`boltSealId` (smart → tracking live) atau `regularSealId` (basic → isi cargo saja). Tersedia publik di `/scan`, `/scan-barcode`.
6. **Gangguan simulasi**: tamper / low battery / offline → update device + alert + timeline + notifikasi.
7. **Generate Basic Seal Barcodes** (`generate-basic-seals-page.tsx`): `addBasicSealBatch` → stok di `dataStore.basicSealStock`; ekspor PDF via `lib/pdf-export.ts` (jsPDF). Barcode = angka 13 digit deterministik dari hash (`lib/barcode.ts`, bukan simbologi barcode asli).
8. Setiap aksi menulis timeline event + audit log ke `dataStore`.

## 5. Modules / Features

| Fitur | File utama |
|---|---|
| Dashboard KPI | `pages/dashboard-page.tsx`, `shared/kpi-card.tsx` |
| Seal Monitoring (kontainer + peta) | `containers-list-page.tsx`, `map/tracking-map.tsx` |
| Detail kontainer | `container-detail-page.tsx`, `components/container/*` |
| Seal Inventory / E-Seal | `eseals-list-page.tsx`, `eseal-detail-page.tsx` |
| Generate Basic Seal + PDF | `generate-basic-seals-page.tsx`, `lib/pdf-export.ts`, `lib/barcode.ts` |
| Stuffing wizard | `stuffing-wizard-page.tsx` |
| Shipments / Cargo (DO, multi-owner) | `shipments-page.tsx`, `cargo-page.tsx`, `container/cargo-*.tsx` |
| Vessels / AIS | `vessels-list-page.tsx`, `vessel-detail-page.tsx` |
| Alerts (OPEN/ACK/RESOLVED) | `alerts-page.tsx` |
| Geofences | `geofences-page.tsx` |
| Reverse Logistics | `reverse-logistics-page.tsx` |
| Reports (CSV in-browser) | `reports-page.tsx` |
| Audit Logs | `audit-logs-page.tsx` |
| Users & Roles, Settings (reset data) | `users-roles-page.tsx`, `settings-page.tsx` |
| Demo Simulation `/simulation` | `simulation-page.tsx`, `store/simulationStore.ts` |
| Field App (driver, mobile) | `pages/field/*` |
| Scan publik | `public-scan-page.tsx`, `shared/scanner-modal.tsx`, `shared/seal-scan-flow.tsx` |
| Pencarian global, notifikasi | `shared/global-search.tsx`, `shared/notification-bell.tsx` |

Aturan bisnis penting: kontainer multi-client; role `CLIENT` hanya melihat cargo miliknya, sisanya "Consolidated Cargo" (`cargo-tab.tsx`, `overview-tab.tsx`, `seal-scan-flow.tsx`). Dua tipe seal: Smart (single/dual, IoT) vs Basic (tanpa elektronik, tak bisa dilacak live).

## 6. API

**Tidak ditemukan** API HTTP. Tidak ada `fetch`/axios di source. "API" = `src/services/*` (mock): `containerService`, `deviceService`, `vesselService`, `alertService`, `geofenceService`, `auditService`, `trackingService` — semua mengembalikan data dari `dataStore` setelah `delay()`.

## 7. Database

Tidak ada DB/migration. Persistensi = `localStorage` (3 key di atas). Versi skema data ditandai di nama key (`smartseal-data-v13`); saat struktur state berubah, key dinaikkan agar data lama tidak dipakai (Perlu verifikasi: tidak ada `migrate` di persist config).

Entitas (`src/types/index.ts`): `Container`, `ESealDevice`, `CargoLine`, `Shipment`, `Vessel`, `AlertItem`, `Geofence`, `TimelineEvent`, `AuditLogEntry`, `AppNotification`, `RouteDefinition`, `Port`, `BasicSealStockItem`.

Relasi utama:
- `Container.shipmentId` → `Shipment`; `CargoLine` → `containerId`.
- `Container.eSealId`/`boltSealId` → `ESealDevice.id`; `ESealDevice.containerId` (null saat idle/pool).
- `Container.regularSealId` → kode Basic Seal.
- `Container.routeId` → `RouteDefinition` (waypoint); `Container.vesselId` → `Vessel` (saat AIS).
- Alert/Timeline/Audit merujuk `containerId`/`deviceId`.

Enum penting: `ContainerStatus`, `SecurityMode` (SINGLE_SEAL/DUAL_SEAL/BASIC_SEAL), `TrackingMode` (IOT_GPS/AIS/NONE), `RiskLevel`, `MarkerState`, `DeviceStatus`, `DeviceLifecycle`.

## 8. Authentication & Authorization

- Login: **demo saja**, tanpa password/kredensial; satu-klik pilih role (`authStore.login(role)`), user dari `mock/users.ts`. Role bisa diganti via `switchRole` (topbar / Users & Roles).
- Session: state `authStore` dipersist di localStorage (`smartseal-auth-v1`). Tidak ada token.
- Role (`ALL_ROLES`): SUPER_ADMIN, CONTROL_TOWER, WAREHOUSE, DRIVER, SUPERVISOR, CLIENT, AUDITOR. Yang punya akun demo: CONTROL_TOWER, WAREHOUSE, DRIVER, CLIENT.
- Guard (`App.tsx`): `RequireAuth` (harus login; DRIVER → `/field`), `RequireFieldAuth` (harus login). `/login`, `/scan`, `/scan-barcode` publik.
- Permission: menu difilter per role di `shared/nav-config.ts` (`navForRole`). Guard route per role **hanya** DRIVER; role lain bisa membuka URL halaman yang tak ada di menu (Perlu verifikasi di tiap halaman). Semua ini client-side, tidak aman sebagai kontrol akses nyata.

## 9. Configuration & Environment

- Env variable: **Tidak ditemukan** (tidak ada `import.meta.env`, tidak ada `.env*` ter-track).
- `vite.config.ts`: `base: '/'` (wajib untuk custom domain), dev server `host: true`, port 5173, alias `@`.
- Konstanta hard-coded: PIN offline demo di `unlock-panel.tsx`; tile URL OSM di `tracking-map.tsx`.

## 10. Deployment & Infrastructure

- `.github/workflows/deploy.yml`: push ke `main` (atau manual) → Node 22 → `npm ci` → `npm run build` → upload `dist` → deploy GitHub Pages.
- Domain: `public/CNAME` = `smart-seal.frel.cloud`.
- HashRouter dipakai sehingga tidak perlu konfigurasi fallback SPA di Pages.
- Docker/K8s: **Tidak ditemukan**. Tidak ada step lint/test di CI (hanya build, yang menjalankan `tsc -b`).

## 11. External Integrations

| Layanan | Status |
|---|---|
| OpenStreetMap tiles | Dipakai (`tracking-map.tsx`) |
| AIS, MQTT, IoT device, payment, email, storage | Tidak ada — disimulasikan / out of scope (`README.md`) |

## 12. Development Guide

```bash
npm install
npm run dev       # http://localhost:5173 (host: true)
npm run build     # tsc -b && vite build
npm run lint      # oxlint
npm run preview
```
Prasyarat: Node (CI memakai 22). Test: **Tidak ditemukan** (tidak ada script/file test). Reset data demo: Settings → Reset Prototype Data (`dataStore.resetAll`).

## 13. Troubleshooting

| Gejala | Penyebab / solusi |
|---|---|
| Data aneh/lama setelah update kode | localStorage persist; reset di Settings atau hapus key `smartseal-*`, atau naikkan versi key di `dataStore.ts` |
| Aset 404 di deploy | `base` harus `'/'` untuk custom domain (`vite.config.ts`) |
| Peta tidak tampil | Butuh akses ke `tile.openstreetmap.org`; z-index peta pernah diperbaiki (commit `2e271f3`) |
| Barcode kosong saat cetak | Pernah diperbaiki di commit `14aa2e0` (`barcode-graphic`/print) |
| Driver tak bisa buka dashboard | Disengaja: redirect ke `/field` (`App.tsx`) |

## 14. Important Notes

- Prototype: jangan dianggap aman/produksi. Auth, RBAC, dan "unlock" hanya UI.
- Demo PIN offline di-hardcode; README menyebut nilainya, jangan dipakai sebagai pola produksi.
- `simulationStore` hanya menggerakkan satu "active container"; `lib/actions.ts` menduplikasi sebagian logika simulate* (tamper/offline/low battery) dari `simulationStore.ts` — risiko drift.
- `useSimulationEngine` berjalan terus (interval 200ms) selama app terbuka; vessel bergerak ambient (`driftVessels`) dan state disimpan ke localStorage terus-menerus (potensi beban).
- Bundle: jsPDF, Recharts, Leaflet tanpa code-splitting terlihat (semua page di-import statis di `App.tsx`) — Perlu verifikasi ukuran bundle.
- `README.md` menyebut "Control Tower" sebagai halaman; route `/control-tower` kini redirect ke `/containers` (README sebagian usang). README juga menyebut 7 role di Users & Roles.
- Tidak ada test otomatis, tidak ada lint/test di CI.
- Barcode adalah angka palsu deterministik (`lib/barcode.ts`), bukan Code128/EAN asli.
