# Smart Seal & Container Tracking

Container IoT & Supply-Chain Tracking

A fully interactive, frontend-only prototype of an enterprise container security and supply-chain visibility platform. Built to be demoed to stakeholders (port operators, logistics companies, IoT vendors) without any backend, database, or real hardware integration.

> This is a prototype / proof of concept. Every device, vessel, alert and event is simulated in the browser with mock data and local React state. Nothing here talks to a real server.

---

## Features

- **Dashboard** — fleet-wide KPIs, container status breakdown, device health, recent alerts & activity.
- **Control Tower** — the primary live map: filters, container/vessel/geofence layers, event timeline.
- **Seals** — full list of containers led by their seal ID, plus a detail page per seal/container (Overview, Tracking, Cargo, Seals, Events, Documents tabs).
- **Two seal types**:
  - **Smart Seal** (Single or Dual) — an IoT e-seal with live GPS/AIS tracking, battery, signal and tamper detection.
  - **Basic Seal** — a plain mechanical seal with no electronics. It cannot be live-tracked; instead it's scanned on-site to verify the container's manifest/contents.
- **Scan Seal** — available in the Field App and from the Containers page. Scanning a Smart Seal opens live tracking; scanning a Basic Seal shows the container's cargo contents (masked per client, see below).
- **New Stuffing workflow** — guided wizard: select container → security mode (Single / Dual / Basic) → scan seal(s) → battery check (smart seals only) → arm container.
- **Smart E-Seal management** — device list, battery/signal/temperature history, tamper/offline/low-battery/motion simulation.
- **Vessels / AIS** — vessel list, live position, AIS polling simulation panel.
- **Alerts** — categorized, severity-ranked, acknowledge/resolve workflow.
- **Geofences** — ports & warehouses on the map with radius detail.
- **Destination unlock** — request/confirm unlock once inside the destination geofence, plus an **offline PIN unlock** flow (demo PIN `123456`) and a manual supervisor override for Basic Seal containers.
- **Reverse Logistics** — idle/returned device tracking.
- **Reports** — CSV export generated entirely in-browser.
- **Audit Logs** — every simulated action is recorded here.
- **Users & Roles** — 7 demo roles that immediately change the accessible UI.
- **Field App** — a mobile-first experience for drivers (assigned containers, stuffing, scanner, tracking, alerts).
- **Demo Simulation Panel** (`/simulation`) — drive the entire container journey step-by-step, or hit **RUN FULL DEMO** for a one-click, 16-step automated walkthrough — the main feature for stakeholder presentations.

Cargo/DO data supports multiple owners per container; a `CLIENT` demo role only ever sees its own cargo — other lines show as **Consolidated Cargo**.

---

## Tech Stack

- React 19 + TypeScript + Vite
- Tailwind CSS v4 (white + blue enterprise theme)
- React Router v7
- Zustand (with `localStorage` persistence)
- Recharts (charts) + Leaflet / react-leaflet (maps)
- Lucide icons

All data lives in `src/mock/*`, served through Promise-based services in `src/services/*` so the UI could later be repointed at a real API without rewriting components.

---

## Installation & Run

```bash
npm install
npm run dev
```

Then open the printed local URL (defaults to `http://localhost:5173`).

```bash
npm run build     # production build
npm run preview   # preview the production build
npm run lint       # oxlint
```

---

## Demo Accounts

Login screen has one-click demo shortcuts. Switching roles is entirely frontend — it just swaps the active demo user.

| Role | Shortcut | What you'll see |
|---|---|---|
| Control Tower | ✅ on login screen | Full monitoring, alerts, control tower map |
| Warehouse Operator | ✅ on login screen | Stuffing workflow, seal management |
| Driver | ✅ on login screen | Mobile Field App (redirects to `/field`) |
| Client | ✅ on login screen | Own shipments/cargo only, masked otherwise |
| Super Admin / Supervisor / Auditor | via **Users & Roles** page or the topbar role switcher | Full admin, unlock approvals, read-only audit |

---

## Demo Flow (recommended walkthrough)

1. **Login** as Control Tower.
2. **Dashboard** → glance at KPIs and recent activity.
3. **Control Tower** → pick a container marker, see live panel + event timeline.
4. Open **Container Detail** → Cargo tab (multi-client masking) → Seals tab.
5. Go to **Containers → New Stuffing**: pick a container, choose Dual Seal, scan Bolt Seal then Smart E-Seal, run the battery check, arm the container.
6. Go to **Simulation** (`/simulation`): select the armed container and click **RUN FULL DEMO**. Watch it move from warehouse → origin port → vessel (AIS handoff) → ocean transit → destination port (IoT handoff) → destination geofence → unlock → delivered → device return.
7. Check **Alerts**, **Reverse Logistics**, **Audit Logs** to see everything that just happened was recorded.
8. Switch role to **Driver** to see the mobile Field App, or to **Client** to see cargo masking in action.
9. Try **Scan Seal** (Containers page or Field App → Scanner): scan a Smart Seal to jump into live tracking, or a Basic Seal to see a contents-only lookup with no map.

---

## Simulation Instructions

The `/simulation` page exposes every control described in the product brief:

- `RESET DEMO`, `START JOURNEY`, `PAUSE`
- `MOVE TO ORIGIN PORT`, `LOAD ON VESSEL`, `START OCEAN TRANSIT`, `ARRIVE DESTINATION PORT`, `START DESTINATION DELIVERY`
- `ENTER DESTINATION GEOFENCE`, `ENABLE UNLOCK`, `COMPLETE DELIVERY`
- `SIMULATE TAMPER`, `SIMULATE LOW BATTERY`, `SIMULATE OFFLINE`, `SIMULATE DEVICE RETURN`
- Speed ×1 / ×5 / ×20, and a container picker so you can drive any container's journey.

**RUN FULL DEMO** chains all of the above automatically with a live progress checklist — this is the button to press in front of stakeholders.

All simulated devices, alerts, timelines and audit entries persist to `localStorage`. Use **Settings → Reset Prototype Data** to restore the original mock dataset at any time.

---

## Project Structure

```
src/
  types/            Domain types shared across the app
  mock/             Seeded mock data generators (containers, devices, vessels, alerts, geofences…)
  services/         Promise-based mock "API" layer over the store
  store/            Zustand stores: auth, data (entities), ui, simulation engine
  lib/               Shared helpers (formatting, CSV export, seal lookup, direct actions)
  hooks/             useAsync, useSimulationEngine
  components/
    ui/              Design-system primitives (Button, Card, Modal, Tabs, Input…)
    shared/          App shell, nav, KPI cards, data table, status badges, scanner modal…
    map/             Leaflet tracking map + marker icons
    container/       Container detail page tabs
  pages/             One file per route, plus pages/field/* for the mobile Field App
```

---

## Explicitly Out of Scope

Per the product brief, this prototype does **not** include and will never call: a backend server, database (PostgreSQL/TimescaleDB), Redis, an MQTT broker, real IoT device integration, a real AIS feed, real authentication, payments, or cloud infrastructure. Everything is mock data and local state — designed to be swappable for real services later without changing the UI layer.
