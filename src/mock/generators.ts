import { makeRng } from './rng'
import { CITIES, DOMESTIC_ROUTES, INTERNATIONAL_ROUTES, PORTS, ROUTES, WAREHOUSES, pointOnRoute, portForCity } from './geo'
import { CLIENT_NAMES, clientIdFor } from './clients'
import { PRODUCT_CATALOG, skuFromProduct, type ProductDef } from './products'
import { barcodeFor } from '@/lib/barcode'
import type {
  AlertItem,
  AuditLogEntry,
  CargoLine,
  Container,
  ContainerStatus,
  ESealDevice,
  Geofence,
  HistoryPoint,
  RiskFactor,
  RouteDefinition,
  Shipment,
  TimelineEvent,
  Vessel,
} from '@/types'

const rng = makeRng(1337)

const CONTAINER_PREFIXES = ['MSCU', 'TCLU', 'OOLU', 'HJCU', 'CMAU', 'EGHU', 'SEGU']
// Foreign exporters/factories used as the "shipper" for import containers.
const FOREIGN_SHIPPERS: Record<string, string[]> = {
  'Shenzhen, China': ['Shenzhen Foxlink Electronics Co.', 'Huawei Technologies Co.', 'Shenzhen Everwin Precision'],
  'Ho Chi Minh City, Vietnam': ['Saigon Precision Manufacturing', 'Vietnam Electronics Export JSC', 'Hoa Phat Trading Co.'],
  Singapore: ['Singapore Global Trading Pte Ltd', 'Flex Singapore Pte Ltd'],
  'Busan, South Korea': ['Hanjin Precision Co.', 'Busan Global Electronics Ltd'],
}
const VESSEL_NAMES = [
  'KM Meratus Prima',
  'MV Spil Nias',
  'MV Tanto Ekspress',
  'KM Caraka Jaya Niaga',
  'MV Temas Ekspres',
  'KM Dharma Kencana',
  'MV Sinar Bangun',
  'KM Pelni Nusantara',
  'MV Mentari Perkasa',
  'KM Samudra Indah',
  'MV Berlian Segara',
  'KM Bahtera Adiguna',
  'MV Nusantara Jaya',
  'KM Segara Putih',
  'MV Andalas Perkasa',
  'KM Cakra Samudra',
  'MV Garuda Lintas Laut',
  'KM Wira Samudra',
]
const VESSEL_OPERATORS = ['Meratus Line', 'Spil Shipping', 'Tanto Intim Line', 'Temas Line', 'Pelni', 'Samudera Indonesia']
const VESSEL_TYPES: Vessel['vesselType'][] = ['Container Ship', 'Container Ship', 'Container Ship', 'Feeder', 'RoRo', 'Bulk Carrier']
const VESSEL_COUNT = VESSEL_NAMES.length

// International carriers calling at Pelindo ports — used for vessels sailing
// INTERNATIONAL_ROUTES so the fleet visibly includes foreign-flagged ships.
const INTL_VESSEL_NAMES = [
  'COSCO Shenzhen',
  'COSCO Ningbo',
  'Yang Ming Wisdom',
  'Yang Ming Harmony',
  'Evergreen Grace',
  'Evergreen Marvel',
  'ONE Innovation',
  'ONE Falcon',
  'Wan Hai 313',
  'Wan Hai 289',
  'HMM Busan',
  'HMM Garam',
]
const INTL_VESSEL_OPERATORS = ['COSCO Shipping', 'Yang Ming Marine', 'Evergreen Marine', 'Ocean Network Express (ONE)', 'Wan Hai Lines', 'HMM']

function pad(n: number, len: number) {
  return n.toString().padStart(len, '0')
}

function isoNow(offsetMinutes = 0): string {
  return new Date(Date.now() + offsetMinutes * 60000).toISOString()
}

function makeHistory(base: number, points: number, spread: number, step: number): HistoryPoint[] {
  const out: HistoryPoint[] = []
  let value = base
  for (let i = points - 1; i >= 0; i--) {
    value = Math.max(0, Math.min(100, value + rng.float(-spread, spread)))
    out.push({ timestamp: isoNow(-i * step), value: Math.round(value) })
  }
  return out
}

export function generateGeofences(): Geofence[] {
  const list: Geofence[] = PORTS.map((p) => ({
    id: `geo-${p.id}`,
    name: p.name,
    type: 'PORT',
    center: p.position,
    radiusMeters: 3000,
    status: 'ACTIVE',
  }))
  Object.entries(WAREHOUSES).forEach(([name, pos], i) => {
    list.push({
      id: `geo-wh-${i}`,
      name,
      type: 'WAREHOUSE',
      center: pos,
      radiusMeters: 800,
      status: 'ACTIVE',
    })
  })
  return list
}

const CONTAINER_STATUS_CYCLE: ContainerStatus[] = [
  'CREATED',
  'STUFFING',
  'SEALED',
  'IN_TRANSIT_ORIGIN',
  'GATE_IN_ORIGIN',
  'AT_ORIGIN_PORT',
  'LOADED_ON_BOARD',
  'OCEAN_TRANSIT',
  'ARRIVED_DESTINATION_PORT',
  'IN_TRANSIT_DESTINATION',
  'AT_DESTINATION',
  'UNLOCKED',
  'DELIVERED',
]

// Weighted so the demo dataset leans toward vessels-at-sea (LOADED_ON_BOARD /
// OCEAN_TRANSIT / ARRIVED_DESTINATION_PORT) rather than a flat distribution
// across every lifecycle stage — the ocean leg is the centerpiece of the demo.
// This is a port-authority (Pelindo) prototype, so the dataset should read as
// "containers moving through ports and across the ocean," not sitting in
// warehouses. Port + sea stages (AT_ORIGIN_PORT..ARRIVED_DESTINATION_PORT)
// carry roughly two-thirds of the weight.
const STATUS_WEIGHTS = [1, 1, 1, 1, 1, 3, 4, 7, 3, 1, 1, 1, 1]
const WEIGHTED_STATUS_INDICES: number[] = STATUS_WEIGHTS.flatMap((weight, idx) => Array(weight).fill(idx))
// Import containers have no Indonesian warehouse origin leg — their mock
// lifecycle starts at the foreign origin port (AT_ORIGIN_PORT) and is heavily
// weighted toward the ocean crossing itself.
const IMPORT_STATUS_ENTRIES: [number, number][] = [
  [5, 2], // AT_ORIGIN_PORT
  [6, 5], // LOADED_ON_BOARD
  [7, 8], // OCEAN_TRANSIT
  [8, 3], // ARRIVED_DESTINATION_PORT
  [9, 2], // IN_TRANSIT_DESTINATION
  [10, 1], // AT_DESTINATION
  [11, 1], // UNLOCKED
  [12, 1], // DELIVERED
]
const IMPORT_STATUS_INDICES: number[] = IMPORT_STATUS_ENTRIES.flatMap(([idx, weight]) => Array(weight).fill(idx))

function riskForStatus(): { level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'; factors: RiskFactor[] } {
  const roll = rng.float()
  if (roll > 0.94) {
    return {
      level: 'CRITICAL',
      factors: [
        { label: 'Tamper detected', detail: 'Physical seal tamper signal received from device', weight: 60 },
        { label: 'Device offline', detail: 'No heartbeat for 42 minutes', weight: 25 },
      ],
    }
  }
  if (roll > 0.85) {
    return {
      level: 'HIGH',
      factors: [
        { label: 'Route deviation detected', detail: 'Container moved 4.2km outside expected corridor', weight: 35 },
        { label: 'Signal weak', detail: 'GPS signal below 30% for over 1 hour', weight: 15 },
      ],
    }
  }
  if (roll > 0.65) {
    return {
      level: 'MEDIUM',
      factors: [{ label: 'Low battery', detail: 'Smart E-Seal battery below 30%', weight: 20 }],
    }
  }
  return { level: 'LOW', factors: [] }
}

export function generateContainersAndRelated(vessels: Vessel[], count = 32) {
  const containers: Container[] = []
  const shipments: Shipment[] = []
  const cargo: CargoLine[] = []
  const timeline: TimelineEvent[] = []

  for (let i = 0; i < count; i++) {
    const num = i === 0 ? '1234567' : pad(1234568 + i, 7)
    const prefix = i === 0 ? 'MSCU' : rng.pick(CONTAINER_PREFIXES)
    const containerNumber = `${prefix}${num}`
    // ~30% of non-showcase containers are international imports arriving from
    // major Asian manufacturing hubs (China, Vietnam, Singapore, South Korea) —
    // this is what makes the ocean leg and international vessels the centerpiece.
    const isImport = i !== 0 && rng.bool(0.3)

    let originCity: string
    let destinationCity: string
    let resolvedRoute: RouteDefinition

    if (isImport) {
      resolvedRoute = rng.pick(INTERNATIONAL_ROUTES)
      originCity = resolvedRoute.originLabel
      destinationCity = resolvedRoute.destinationLabel
    } else {
      originCity = i === 0 ? 'Jakarta' : rng.pick(CITIES)
      destinationCity = i === 0 ? 'Surabaya' : rng.pick(CITIES.filter((c) => c !== originCity))
      resolvedRoute =
        DOMESTIC_ROUTES.find((r) => r.originLabel === originCity && r.destinationLabel === destinationCity) ?? rng.pick(DOMESTIC_ROUTES)
    }

    const originPort = portForCity(originCity)
    const destinationPort = portForCity(destinationCity)

    const statusIdx = i === 0 ? 3 : isImport ? rng.pick(IMPORT_STATUS_INDICES) : rng.pick(WEIGHTED_STATUS_INDICES)
    const status = CONTAINER_STATUS_CYCLE[statusIdx]
    const progress = statusIdx / (CONTAINER_STATUS_CYCLE.length - 1)
    const { point } = pointOnRoute(resolvedRoute.waypoints, progress)
    // ~1 in 5 domestic containers use a basic seal with no IoT
    // device (not live-trackable). Imports always carry a Smart Seal — the
    // whole point of this dataset is showing them tracked across the ocean.
    const securityMode = isImport
      ? i % 2 === 0
        ? 'DUAL_SEAL'
        : 'SINGLE_SEAL'
      : i === 0
        ? 'DUAL_SEAL'
        : i % 5 === 0
          ? 'BASIC_SEAL'
          : i % 5 === 1
            ? 'SINGLE_SEAL'
            : 'DUAL_SEAL'
    // Only live-tracked once actually sealed (statusIdx >= 2, same gate as
    // eSealId below) — a CREATED/STUFFING container has no device attached
    // yet, so it can't be tracked regardless of which seal type it'll get.
    const trackingMode =
      securityMode === 'BASIC_SEAL' || statusIdx < 2
        ? 'NONE'
        : status === 'OCEAN_TRANSIT' || status === 'LOADED_ON_BOARD'
          ? 'AIS'
          : 'IOT_GPS'
    const risk = securityMode === 'BASIC_SEAL' ? { level: 'LOW' as const, factors: [] } : riskForStatus()
    const markerState =
      risk.level === 'CRITICAL'
        ? 'CRITICAL'
        : risk.level === 'HIGH'
          ? 'WARNING'
          : status === 'DELIVERED'
            ? 'DELIVERED'
            : securityMode === 'BASIC_SEAL' || rng.bool(0.06)
              ? 'OFFLINE'
              : 'NORMAL'

    const id = `CNT-${pad(i + 1, 4)}`
    const shipmentId = `SHP-${pad(i + 1, 4)}`
    const eSealId = `ESEAL-${pad(i + 1, 6)}`
    const boltSealId = securityMode === 'DUAL_SEAL' ? `BOLT-${pad(i + 1, 6)}` : null
    const regularSealId = securityMode === 'BASIC_SEAL' ? `SEAL-${pad(i + 1, 6)}` : null

    containers.push({
      id,
      number: containerNumber,
      isoType: rng.pick(['20GP', '40GP', '40HC', '20RF']),
      originCity,
      originPort: originPort.name,
      destinationCity,
      destinationPort: destinationPort.name,
      status,
      trackingMode,
      securityMode,
      eSealId: statusIdx >= 2 && securityMode !== 'BASIC_SEAL' ? eSealId : null,
      boltSealId: statusIdx >= 2 ? boltSealId : null,
      regularSealId: statusIdx >= 2 ? regularSealId : null,
      currentLocation: point,
      routeId: resolvedRoute.id,
      routeProgress: progress,
      eta: isoNow(rng.int(60, 4000)),
      riskLevel: risk.level,
      riskFactors: risk.factors,
      markerState,
      lastUpdate: isoNow(-rng.int(0, 30)),
      offlineMode: false,
      isArmed: statusIdx >= 2,
      isUnlocked: status === 'UNLOCKED' || status === 'DELIVERED',
      insideDestinationGeofence: status === 'AT_DESTINATION' || status === 'UNLOCKED' || status === 'DELIVERED',
      vesselId:
        trackingMode === 'AIS'
          ? (rng.pick(vessels.filter((v) => v.routeId === resolvedRoute.id)) ?? rng.pick(vessels))?.id
          : undefined,
      shipmentId,
    })

    shipments.push({
      id: shipmentId,
      containerId: id,
      bookingNumber: `BKG-${pad(20260000 + i, 8)}`,
      shipper: isImport ? rng.pick(FOREIGN_SHIPPERS[originCity] ?? CLIENT_NAMES) : rng.pick(CLIENT_NAMES),
      consignee: rng.pick(CLIENT_NAMES),
      originCity,
      destinationCity,
      status,
      createdAt: isoNow(-rng.int(500, 20000)),
    })

    const cargoOwners = i === 0 ? 3 : rng.int(1, 3)
    const usedClients = new Set<string>()
    // Showcase container always carries an iPhone electronics line front and center.
    const demoProducts: ProductDef[] = [
      PRODUCT_CATALOG.find((p) => p.product === 'iPhone 15 Pro')!,
      PRODUCT_CATALOG.find((p) => p.product === 'MacBook Air 13" M3')!,
      PRODUCT_CATALOG.find((p) => p.product === 'Batik Textile Bundles')!,
    ]
    // Imports from Asian manufacturing hubs skew heavily toward electronics.
    const electronicsCatalog = PRODUCT_CATALOG.filter((p) => p.category === 'Electronics')
    // Cargo is tagged to whichever seal is actually on this container.
    const taggedSealId = statusIdx < 2 ? null : securityMode === 'BASIC_SEAL' ? regularSealId : eSealId
    for (let c = 0; c < cargoOwners; c++) {
      let client = rng.pick(CLIENT_NAMES)
      while (usedClients.has(client) && usedClients.size < CLIENT_NAMES.length) client = rng.pick(CLIENT_NAMES)
      usedClients.add(client)
      const productDef = i === 0 ? demoProducts[c] : isImport && rng.bool(0.75) ? rng.pick(electronicsCatalog) : rng.pick(PRODUCT_CATALOG)
      cargo.push({
        id: `CRG-${id}-${c}`,
        containerId: id,
        sealId: taggedSealId,
        clientId: clientIdFor(client),
        clientName: i === 0 ? ['PT Sinar Nusantara', 'PT Bahari Jaya Logistik', 'PT Karya Mandiri Sejahtera'][c] : client,
        doNumber: `DO-${pad(i * 10 + c + 1, 3)}`,
        productName: productDef.product,
        category: productDef.category,
        sku: skuFromProduct(productDef.product, c + 1),
        quantity: rng.int(productDef.qty[0], productDef.qty[1]),
        unit: productDef.unit,
        address: `${rng.pick(['Jl. Industri Raya', 'Jl. Pelabuhan No.', 'Kawasan Industri Blok', 'Jl. Gudang Terpadu'])} ${rng.int(1, 99)}, ${destinationCity}`,
      })
    }

    // Seed a short timeline history consistent with current status
    const historyTypes: { type: string; label: string }[] = [
      { type: 'CONTAINER_CREATED', label: 'Container created' },
      { type: 'CARGO_STUFFED', label: 'Cargo stuffed' },
      { type: 'CONTAINER_ARMED', label: 'Container armed & sealed' },
      { type: 'GATE_OUT_WAREHOUSE', label: 'Departed warehouse' },
      { type: 'GEOFENCE_ENTERED', label: `Entered ${originPort.name}` },
      { type: 'GATE_IN', label: 'Gate-in completed' },
      { type: 'LOADED_ON_BOARD', label: 'Loaded on vessel' },
      { type: 'AIS_HANDOFF', label: 'Tracking handoff to AIS' },
      { type: 'ARRIVED_PORT', label: `Arrived ${destinationPort.name}` },
      { type: 'IOT_HANDOFF', label: 'Tracking handoff to IoT GPS' },
      { type: 'DESTINATION_GEOFENCE', label: `Entered ${destinationCity} geofence` },
      { type: 'CONTAINER_UNLOCKED', label: 'Container unlocked' },
      { type: 'DELIVERED', label: 'Delivered to consignee' },
    ]
    const eventsToShow = Math.min(statusIdx + 1, historyTypes.length)
    for (let e = 0; e < eventsToShow; e++) {
      timeline.push({
        id: `EVT-${id}-${e}`,
        containerId: id,
        type: historyTypes[e].type,
        label: historyTypes[e].label,
        actor: e < 3 ? 'Warehouse Operator' : e < 8 ? 'System' : 'Control Tower',
        timestamp: isoNow(-(eventsToShow - e) * rng.int(30, 180)),
        // Tag the arming event with the seal that was attached, so its
        // cross-container Seal History has real seed data to show.
        ...(historyTypes[e].type === 'CONTAINER_ARMED' && taggedSealId ? { sealId: taggedSealId } : {}),
      })
    }
  }

  return { containers, shipments, cargo, timeline }
}

// Dashboard "Device Health" summary is derived straight from battery/signal/
// lastSeen via deviceHealthStatus() — pinned here so the demo always reads as
// 2 critical, 5 warning, the rest healthy, instead of a random mix.
const CRITICAL_DEVICE_COUNT = 2
const WARNING_DEVICE_COUNT = 5

export function generateDevices(containers: Container[], count = 42): ESealDevice[] {
  const devices: ESealDevice[] = []
  const assignedContainerIds = new Set(
    containers.filter((c) => c.eSealId).map((c) => c.eSealId as string),
  )

  for (let i = 0; i < count; i++) {
    const id = `ESEAL-${pad(i + 1, 6)}`
    const owner = containers.find((c) => c.eSealId === id)
    const healthTier: 'CRITICAL' | 'WARNING' | 'HEALTHY' =
      i < CRITICAL_DEVICE_COUNT ? 'CRITICAL' : i < CRITICAL_DEVICE_COUNT + WARNING_DEVICE_COUNT ? 'WARNING' : 'HEALTHY'
    // Signal/last-seen stay in safe ranges outside HEALTHY too, so battery is
    // the only lever — keeps each device pinned to exactly its intended tier.
    const battery =
      healthTier === 'CRITICAL' ? rng.int(3, 14) : healthTier === 'WARNING' ? rng.int(20, 34) : owner ? rng.int(55, 100) : rng.int(36, 100)
    const signal = healthTier === 'HEALTHY' ? rng.int(50, 100) : rng.int(40, 90)
    const lastSeenMinutesAgo = healthTier === 'HEALTHY' ? rng.int(0, 25) : rng.int(0, 20)
    const lifecycle: ESealDevice['lifecycle'] = owner
      ? 'IN_TRANSIT'
      : rng.pick(['IN_WAREHOUSE', 'IDLE_AT_DESTINATION', 'MAINTENANCE', 'BROKEN', 'IN_WAREHOUSE'])
    const status: ESealDevice['status'] =
      lifecycle === 'BROKEN' ? 'OFFLINE' : battery < 20 ? 'LOW_BATTERY' : rng.bool(0.08) ? 'OFFLINE' : 'ONLINE'

    devices.push({
      id,
      barcode: barcodeFor(id),
      serialNumber: `SN-${pad(100000 + i, 6)}`,
      firmware: rng.pick(['v2.4.1', 'v2.4.3', 'v2.5.0', 'v2.3.9']),
      containerId: owner?.id ?? null,
      battery,
      temperature: rng.int(24, 34),
      signal,
      status,
      motion: owner ? 'MOTION_DETECTED' : rng.pick(['NO_MOTION', 'DEEP_SLEEP']),
      lifecycle,
      location: owner ? owner.currentLocation : rng.pick(Object.values(WAREHOUSES)),
      lastSeen: isoNow(-lastSeenMinutesAgo),
      batteryHistory: makeHistory(battery, 24, 3, 60),
      signalHistory: makeHistory(70, 24, 8, 60),
      temperatureHistory: makeHistory(28, 24, 2, 60),
      daysIdle: lifecycle === 'IDLE_AT_DESTINATION' ? rng.int(1, 14) : 0,
      returnStatus:
        lifecycle === 'IDLE_AT_DESTINATION'
          ? rng.pick(['PENDING', 'IN_PROGRESS'])
          : lifecycle === 'MAINTENANCE'
            ? 'IN_PROGRESS'
            : 'NOT_APPLICABLE',
    })
  }
  assignedContainerIds.forEach(() => {})
  return devices
}

/**
 * Vessels are generated before containers so an import container can pick a
 * vessel that actually sails its route — `containerIds` is filled in by
 * `attachContainersToVessels` once containers exist.
 */
export function generateVessels(count = VESSEL_COUNT): Vessel[] {
  const vessels: Vessel[] = []
  // Guarantee every route (especially each international one) has at least
  // one vessel on it, then fill the rest randomly.
  const routeAssignments = [...ROUTES.map((r) => r), ...Array.from({ length: Math.max(0, count - ROUTES.length) }, () => rng.pick(ROUTES))]

  for (let i = 0; i < count; i++) {
    const id = `VSL-${pad(i + 1, 3)}`
    const route = routeAssignments[i] ?? rng.pick(ROUTES)
    const isIntl = INTERNATIONAL_ROUTES.some((r) => r.id === route.id)
    // Bias toward mid-voyage so most vessels are visibly out at sea rather than
    // clustered right at a port — the ocean leg is the centerpiece of the demo.
    const progress = rng.float(0.15, 0.85)
    const { point, heading } = pointOnRoute(route.waypoints, progress)
    const originPort = portForCity(route.originLabel)
    const destPort = portForCity(route.destinationLabel)
    const vesselType = VESSEL_TYPES[i % VESSEL_TYPES.length]
    vessels.push({
      id,
      name: isIntl ? INTL_VESSEL_NAMES[i % INTL_VESSEL_NAMES.length] : VESSEL_NAMES[i % VESSEL_NAMES.length],
      vesselType,
      operator: isIntl ? rng.pick(INTL_VESSEL_OPERATORS) : rng.pick(VESSEL_OPERATORS),
      voyageNumber: `V${pad(rng.int(1, 48), 3)}${rng.pick(['N', 'S', 'E', 'W'])}`,
      capacityTeu: vesselType === 'Bulk Carrier' ? 0 : rng.pick([800, 1200, 1800, 2500, 4200]),
      imo: `IMO${9000000 + rng.int(10000, 99999)}`,
      mmsi: `${rng.int(500000000, 599999999)}`,
      position: point,
      speedKn: rng.int(10, 18),
      heading,
      originPort: originPort.name,
      destinationPort: destPort.name,
      eta: isoNow(rng.int(200, 4000)),
      routeId: route.id,
      routeProgress: progress,
      lastAisUpdate: isoNow(-rng.int(1, 25)),
      status: 'UNDERWAY',
      containerIds: [],
    })
  }
  return vessels
}

/** Fills in each vessel's `containerIds` once containers (with vesselId set) exist. */
export function attachContainersToVessels(vessels: Vessel[], containers: Container[]): Vessel[] {
  return vessels.map((v) => ({ ...v, containerIds: containers.filter((c) => c.vesselId === v.id).map((c) => c.id) }))
}

export function generateAlerts(containers: Container[], devices: ESealDevice[], count = 24): AlertItem[] {
  const categories: AlertItem['category'][] = [
    'TAMPER',
    'LOW_BATTERY',
    'DEVICE_OFFLINE',
    'GEOFENCE_VIOLATION',
    'SEAL_MISMATCH',
    'AIS_DELAY',
    'DEVICE_MALFUNCTION',
    'UNAUTHORIZED_UNLOCK',
    'ROUTE_DEVIATION',
  ]
  const messages: Record<AlertItem['category'], string> = {
    TAMPER: 'Tamper signal detected on smart e-seal',
    LOW_BATTERY: 'Device battery has dropped below safe threshold',
    DEVICE_OFFLINE: 'Device has not reported a heartbeat',
    GEOFENCE_VIOLATION: 'Container exited an expected geofence',
    SEAL_MISMATCH: 'Bolt seal and smart e-seal readings do not match',
    AIS_DELAY: 'AIS position update overdue for vessel',
    DEVICE_MALFUNCTION: 'Device diagnostics report a hardware malfunction',
    UNAUTHORIZED_UNLOCK: 'Unlock attempted outside destination geofence',
    ROUTE_DEVIATION: 'Container detected outside expected route corridor',
  }
  const alerts: AlertItem[] = []
  for (let i = 0; i < count; i++) {
    const category = rng.pick(categories)
    const severity: AlertItem['severity'] =
      category === 'TAMPER' || category === 'UNAUTHORIZED_UNLOCK'
        ? 'CRITICAL'
        : category === 'LOW_BATTERY' || category === 'AIS_DELAY'
          ? 'WARNING'
          : rng.pick(['WARNING', 'CRITICAL', 'INFO'])
    const container = rng.pick(containers)
    const device = devices.find((d) => d.containerId === container.id) ?? rng.pick(devices)
    const status: AlertItem['status'] = rng.pick(['OPEN', 'OPEN', 'ACKNOWLEDGED', 'RESOLVED'])
    alerts.push({
      id: `ALT-${pad(i + 1, 4)}`,
      category,
      severity,
      status,
      containerId: container.id,
      deviceId: device.id,
      location: container.currentLocation,
      message: messages[category],
      createdAt: isoNow(-rng.int(1, 3000)),
      acknowledgedAt: status !== 'OPEN' ? isoNow(-rng.int(1, 1000)) : undefined,
      resolvedAt: status === 'RESOLVED' ? isoNow(-rng.int(1, 500)) : undefined,
    })
  }
  return alerts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export function generateAuditLog(containers: Container[], count = 40): AuditLogEntry[] {
  const actions: { action: string; description: (c: Container) => string }[] = [
    { action: 'SEAL_ATTACHED', description: (c) => `Smart e-seal attached to ${c.number}` },
    { action: 'GEOFENCE_ENTERED', description: (c) => `${c.number} entered ${c.originPort}` },
    { action: 'AIS_HANDOFF', description: (c) => `${c.number} tracking handed off to AIS` },
    { action: 'UNLOCK_APPROVED', description: (c) => `Unlock approved for ${c.number}` },
    { action: 'CONTAINER_ARMED', description: (c) => `${c.number} armed and sealed` },
    { action: 'ALERT_ACKNOWLEDGED', description: (c) => `Alert acknowledged for ${c.number}` },
    { action: 'ROLE_SWITCHED', description: (c) => `Demo role switched while viewing ${c.number}` },
    { action: 'DEVICE_RETURNED', description: (c) => `Device returned from ${c.destinationCity}` },
  ]
  const actors = ['Control Tower', 'System', 'Supervisor', 'Warehouse Operator', 'Driver', 'Auditor']
  const log: AuditLogEntry[] = []
  for (let i = 0; i < count; i++) {
    const container = rng.pick(containers)
    const entry = rng.pick(actions)
    log.push({
      id: `AUD-${pad(i + 1, 4)}`,
      timestamp: isoNow(-rng.int(1, 5000)),
      user: rng.pick(actors),
      action: entry.action,
      entity: container.number,
      description: entry.description(container),
    })
  }
  return log.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}
