export interface DemoClient {
  id: string
  name: string
}

export const CLIENT_NAMES = [
  'PT Sinar Nusantara',
  'PT Bahari Jaya Logistik',
  'PT Karya Mandiri Sejahtera',
  'PT Global Cipta Trading',
  'PT Andalan Sumber Makmur',
  'PT Cakrawala Ekspor Impor',
  'PT Nusa Perkasa Industri',
  'PT Mitra Sejati Cargo',
]

export function clientIdFor(name: string): string {
  return `client-${name.replace(/\s+/g, '-').toLowerCase()}`
}

export const CLIENTS: DemoClient[] = CLIENT_NAMES.map((name) => ({ id: clientIdFor(name), name }))
