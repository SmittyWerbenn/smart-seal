import L from 'leaflet'
import { renderToStaticMarkup } from 'react-dom/server'
import { Container as ContainerIcon, Ship, Truck, Warehouse } from 'lucide-react'
import { MARKER_COLOR } from '@/components/shared/status-badge'
import type { MarkerState } from '@/types'

type Kind = 'container' | 'vessel' | 'truck' | 'warehouse' | 'port'

const KIND_ICON: Record<Kind, typeof ContainerIcon> = {
  container: ContainerIcon,
  vessel: Ship,
  truck: Truck,
  warehouse: Warehouse,
  port: Warehouse,
}

export function buildMarkerIcon(kind: Kind, state: MarkerState = 'NORMAL', selected = false, animate = false) {
  const Icon = KIND_ICON[kind]
  const color = MARKER_COLOR[state]
  const size = selected ? 38 : 30
  const html = renderToStaticMarkup(
    <div
      className={animate ? 'marker-pulse' : ''}
      style={{
        position: 'relative',
        width: size,
        height: size,
        borderRadius: '9999px',
        background: color,
        border: selected ? '3px solid #0f1b2e' : '2px solid white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 1px 4px rgba(15,23,42,0.35)',
        color: 'white',
      }}
    >
      <Icon size={size * 0.52} strokeWidth={2.25} />
    </div>,
  )
  return L.divIcon({
    html,
    className: 'scissor-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  })
}

export function buildDotIcon(color: string, size = 10) {
  const html = renderToStaticMarkup(
    <div style={{ width: size, height: size, borderRadius: '9999px', background: color, border: '2px solid white', boxShadow: '0 1px 3px rgba(15,23,42,0.4)' }} />,
  )
  return L.divIcon({ html, className: 'scissor-marker', iconSize: [size, size], iconAnchor: [size / 2, size / 2] })
}
