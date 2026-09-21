import type { GeoPoint, Port, RouteDefinition } from '@/types'

export const PORTS: Port[] = [
  { id: 'port-priok', name: 'Tanjung Priok', city: 'Jakarta', country: 'Indonesia', position: { lat: -6.1045, lng: 106.8798 } },
  { id: 'port-perak', name: 'Tanjung Perak', city: 'Surabaya', country: 'Indonesia', position: { lat: -7.1978, lng: 112.7378 } },
  { id: 'port-belawan', name: 'Belawan', city: 'Medan', country: 'Indonesia', position: { lat: 3.7826, lng: 98.6885 } },
  { id: 'port-makassar', name: 'Makassar (Soekarno-Hatta)', city: 'Makassar', country: 'Indonesia', position: { lat: -5.1387, lng: 119.4092 } },
  // International gateways — imports feeding Indonesian ports from major Asian trade hubs.
  { id: 'port-shenzhen', name: 'Yantian, Shenzhen', city: 'Shenzhen, China', country: 'China', position: { lat: 22.5769, lng: 114.2381 } },
  { id: 'port-hcmc', name: 'Cat Lai, Ho Chi Minh City', city: 'Ho Chi Minh City, Vietnam', country: 'Vietnam', position: { lat: 10.75, lng: 106.77 } },
  { id: 'port-singapore', name: 'Port of Singapore', city: 'Singapore', country: 'Singapore', position: { lat: 1.29, lng: 103.85 } },
  { id: 'port-busan', name: 'Busan New Port', city: 'Busan, South Korea', country: 'South Korea', position: { lat: 35.1, lng: 129.04 } },
]

export const WAREHOUSES: Record<string, GeoPoint> = {
  'Warehouse Jakarta': { lat: -6.211, lng: 106.9223 },
  'Warehouse Surabaya': { lat: -7.2647, lng: 112.7456 },
  'Warehouse Bekasi': { lat: -6.2383, lng: 107.0 },
  'Warehouse Medan': { lat: 3.6, lng: 98.68 },
  'Warehouse Makassar': { lat: -5.16, lng: 119.45 },
}

export const CITIES = ['Jakarta', 'Bekasi', 'Surabaya', 'Medan', 'Makassar']

// Predefined multi-leg demo routes: warehouse -> origin port -> ocean -> destination port -> warehouse
export const DOMESTIC_ROUTES: RouteDefinition[] = [
  {
    id: 'route-jkt-sub',
    name: 'Jakarta → Surabaya',
    originLabel: 'Jakarta',
    destinationLabel: 'Surabaya',
    corridorRadiusMeters: 15000,
    waypoints: [
      { lat: -6.211, lng: 106.9223 }, // Warehouse Jakarta
      { lat: -6.1045, lng: 106.8798 }, // Tanjung Priok
      { lat: -6.35, lng: 107.9 },
      { lat: -6.6, lng: 108.6 },
      { lat: -6.85, lng: 110.2 },
      { lat: -6.95, lng: 111.3 },
      { lat: -7.05, lng: 112.2 },
      { lat: -7.1978, lng: 112.7378 }, // Tanjung Perak
      { lat: -7.2647, lng: 112.7456 }, // Warehouse Surabaya
    ],
  },
  {
    id: 'route-sub-jkt',
    name: 'Surabaya → Jakarta',
    originLabel: 'Surabaya',
    destinationLabel: 'Jakarta',
    corridorRadiusMeters: 15000,
    waypoints: [
      { lat: -7.2647, lng: 112.7456 },
      { lat: -7.1978, lng: 112.7378 },
      { lat: -7.05, lng: 112.2 },
      { lat: -6.95, lng: 111.3 },
      { lat: -6.85, lng: 110.2 },
      { lat: -6.6, lng: 108.6 },
      { lat: -6.35, lng: 107.9 },
      { lat: -6.1045, lng: 106.8798 },
      { lat: -6.211, lng: 106.9223 },
    ],
  },
  {
    id: 'route-jkt-medan',
    name: 'Jakarta → Medan',
    originLabel: 'Jakarta',
    destinationLabel: 'Medan',
    corridorRadiusMeters: 20000,
    waypoints: [
      { lat: -6.211, lng: 106.9223 },
      { lat: -6.1045, lng: 106.8798 },
      { lat: -4.5, lng: 103.5 },
      { lat: -1.5, lng: 101.0 },
      { lat: 1.5, lng: 99.8 },
      { lat: 3.7826, lng: 98.6885 },
      { lat: 3.6, lng: 98.68 },
    ],
  },
  {
    id: 'route-jkt-makassar',
    name: 'Jakarta → Makassar',
    originLabel: 'Jakarta',
    destinationLabel: 'Makassar',
    corridorRadiusMeters: 20000,
    waypoints: [
      { lat: -6.211, lng: 106.9223 },
      { lat: -6.1045, lng: 106.8798 },
      { lat: -6.8, lng: 110.5 },
      { lat: -6.5, lng: 114.5 },
      { lat: -5.8, lng: 117.5 },
      { lat: -5.1387, lng: 119.4092 },
      { lat: -5.16, lng: 119.45 },
    ],
  },
  {
    id: 'route-bekasi-sub',
    name: 'Bekasi → Surabaya',
    originLabel: 'Bekasi',
    destinationLabel: 'Surabaya',
    corridorRadiusMeters: 15000,
    waypoints: [
      { lat: -6.2383, lng: 107.0 },
      { lat: -6.1045, lng: 106.8798 },
      { lat: -6.6, lng: 108.6 },
      { lat: -6.95, lng: 111.3 },
      { lat: -7.1978, lng: 112.7378 },
      { lat: -7.2647, lng: 112.7456 },
    ],
  },
]

// International ocean legs — the long-haul sea journey is the majority of
// these routes' distance, which is the point: Pelindo's ports are the
// gateway for imports arriving from major Asian manufacturing/trade hubs.
export const INTERNATIONAL_ROUTES: RouteDefinition[] = [
  {
    id: 'route-shenzhen-jkt',
    name: 'Shenzhen, China → Jakarta',
    originLabel: 'Shenzhen, China',
    destinationLabel: 'Jakarta',
    corridorRadiusMeters: 30000,
    waypoints: [
      { lat: 22.5769, lng: 114.2381 }, // Yantian, Shenzhen (origin port)
      { lat: 22.5769, lng: 114.2381 }, // duplicate: no domestic warehouse leg for imports
      { lat: 18.5, lng: 114.2 }, // South China Sea
      { lat: 13.5, lng: 111.8 },
      { lat: 9.5, lng: 109.2 }, // off Vietnam coast
      { lat: 4.8, lng: 107.4 }, // Natuna Sea
      { lat: 1.2, lng: 104.3 }, // Singapore Strait
      { lat: -2.8, lng: 105.6 }, // Karimata Strait
      { lat: -5.6, lng: 106.5 }, // Java Sea
      { lat: -6.1045, lng: 106.8798 }, // Tanjung Priok
      { lat: -6.211, lng: 106.9223 }, // Warehouse Jakarta
    ],
  },
  {
    id: 'route-hcmc-jkt',
    name: 'Ho Chi Minh City, Vietnam → Jakarta',
    originLabel: 'Ho Chi Minh City, Vietnam',
    destinationLabel: 'Jakarta',
    corridorRadiusMeters: 25000,
    waypoints: [
      { lat: 10.75, lng: 106.77 }, // Cat Lai, Ho Chi Minh City (origin port)
      { lat: 10.75, lng: 106.77 }, // duplicate: no domestic warehouse leg for imports
      { lat: 7.8, lng: 107.3 }, // South China Sea
      { lat: 4.2, lng: 107.0 }, // Natuna Sea
      { lat: 0.8, lng: 105.5 }, // near Singapore Strait
      { lat: -3.2, lng: 106.0 }, // Karimata Strait
      { lat: -5.8, lng: 106.5 }, // Java Sea
      { lat: -6.1045, lng: 106.8798 }, // Tanjung Priok
      { lat: -6.211, lng: 106.9223 }, // Warehouse Jakarta
    ],
  },
  {
    id: 'route-singapore-sub',
    name: 'Singapore → Surabaya',
    originLabel: 'Singapore',
    destinationLabel: 'Surabaya',
    corridorRadiusMeters: 20000,
    waypoints: [
      { lat: 1.29, lng: 103.85 }, // Port of Singapore (origin port)
      { lat: 1.29, lng: 103.85 }, // duplicate: no domestic warehouse leg for imports
      { lat: -1.0, lng: 106.2 }, // Karimata Strait
      { lat: -3.8, lng: 109.0 }, // Java Sea
      { lat: -5.9, lng: 111.2 },
      { lat: -7.1978, lng: 112.7378 }, // Tanjung Perak
      { lat: -7.2647, lng: 112.7456 }, // Warehouse Surabaya
    ],
  },
  {
    id: 'route-busan-jkt',
    name: 'Busan, South Korea → Jakarta',
    originLabel: 'Busan, South Korea',
    destinationLabel: 'Jakarta',
    corridorRadiusMeters: 35000,
    waypoints: [
      { lat: 35.1, lng: 129.04 }, // Busan New Port (origin port)
      { lat: 35.1, lng: 129.04 }, // duplicate: no domestic warehouse leg for imports
      { lat: 28.0, lng: 124.8 }, // East China Sea
      { lat: 20.5, lng: 117.5 }, // South China Sea
      { lat: 13.5, lng: 112.5 },
      { lat: 7.5, lng: 108.8 }, // off Vietnam coast
      { lat: 2.5, lng: 106.0 }, // Natuna Sea
      { lat: -2.5, lng: 105.8 }, // Karimata Strait
      { lat: -5.6, lng: 106.5 }, // Java Sea
      { lat: -6.1045, lng: 106.8798 }, // Tanjung Priok
      { lat: -6.211, lng: 106.9223 }, // Warehouse Jakarta
    ],
  },
]

export const ROUTES: RouteDefinition[] = [...DOMESTIC_ROUTES, ...INTERNATIONAL_ROUTES]

export function progressAtWaypointIndex(waypoints: GeoPoint[], index: number): number {
  let total = 0
  let toIndex = 0
  for (let i = 0; i < waypoints.length - 1; i++) {
    const d = distanceMeters(waypoints[i], waypoints[i + 1])
    total += d
    if (i < index) toIndex += d
  }
  if (total === 0) return 0
  return toIndex / total
}

export function portForCity(city: string): Port {
  const match = PORTS.find((p) => p.city === city)
  return match ?? PORTS[0]
}

export function distanceMeters(a: GeoPoint, b: GeoPoint): number {
  const R = 6371000
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const lat1 = (a.lat * Math.PI) / 180
  const lat2 = (b.lat * Math.PI) / 180
  const sinDLat = Math.sin(dLat / 2)
  const sinDLng = Math.sin(dLng / 2)
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)))
}

export function bearing(a: GeoPoint, b: GeoPoint): number {
  const lat1 = (a.lat * Math.PI) / 180
  const lat2 = (b.lat * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const y = Math.sin(dLng) * Math.cos(lat2)
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng)
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360
}

/** Returns a point + heading at fraction `t` (0..1) along a waypoint polyline. */
export function pointOnRoute(waypoints: GeoPoint[], t: number): { point: GeoPoint; heading: number } {
  const clamped = Math.max(0, Math.min(1, t))
  const segLengths: number[] = []
  let total = 0
  for (let i = 0; i < waypoints.length - 1; i++) {
    const d = distanceMeters(waypoints[i], waypoints[i + 1])
    segLengths.push(d)
    total += d
  }
  if (total === 0) return { point: waypoints[0], heading: 0 }
  let target = clamped * total
  for (let i = 0; i < segLengths.length; i++) {
    if (target <= segLengths[i] || i === segLengths.length - 1) {
      const segT = segLengths[i] === 0 ? 0 : target / segLengths[i]
      const a = waypoints[i]
      const b = waypoints[i + 1]
      const point = {
        lat: a.lat + (b.lat - a.lat) * segT,
        lng: a.lng + (b.lng - a.lng) * segT,
      }
      return { point, heading: bearing(a, b) }
    }
    target -= segLengths[i]
  }
  return { point: waypoints[waypoints.length - 1], heading: 0 }
}
