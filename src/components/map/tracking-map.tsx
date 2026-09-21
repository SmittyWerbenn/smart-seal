import { useEffect, useMemo, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from 'react-leaflet'
import type { LatLngExpression } from 'leaflet'
import { buildMarkerIcon, buildDotIcon } from './marker-icon'
import type { Container, Geofence, Vessel } from '@/types'

interface TrackingMapProps {
  containers?: Container[]
  vessels?: Vessel[]
  geofences?: Geofence[]
  selectedContainerId?: string | null
  selectedVesselId?: string | null
  onSelectContainer?: (id: string) => void
  onSelectVessel?: (id: string) => void
  routeWaypoints?: LatLngExpression[]
  center?: LatLngExpression
  zoom?: number
  height?: string
  className?: string
}

function FitToRoute({ waypoints }: { waypoints?: LatLngExpression[] }) {
  const map = useMap()
  useEffect(() => {
    if (waypoints && waypoints.length > 1) {
      map.fitBounds(waypoints as [number, number][], { padding: [40, 40] })
    }
  }, [map, waypoints])
  return null
}

export function TrackingMap({
  containers = [],
  vessels = [],
  geofences = [],
  selectedContainerId,
  selectedVesselId,
  onSelectContainer,
  onSelectVessel,
  routeWaypoints,
  center = [-3.5, 108],
  zoom = 5,
  height = '100%',
  className,
}: TrackingMapProps) {
  const mapRef = useRef(null)

  const geofenceColor = (type: Geofence['type']) => (type === 'PORT' ? '#1d4ed8' : type === 'WAREHOUSE' ? '#16a34a' : '#64748b')

  const routeLine = useMemo(() => routeWaypoints, [routeWaypoints])

  return (
    <div className={className} style={{ height }}>
      <MapContainer center={center} zoom={zoom} className="rounded-lg" ref={mapRef} scrollWheelZoom>
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {geofences.map((g) => (
          <Circle
            key={g.id}
            center={[g.center.lat, g.center.lng]}
            radius={g.radiusMeters}
            pathOptions={{ color: geofenceColor(g.type), fillColor: geofenceColor(g.type), fillOpacity: 0.08, weight: 1.5, dashArray: '4 4' }}
          >
            <Popup>
              <strong>{g.name}</strong>
              <br />
              {g.type} · {(g.radiusMeters / 1000).toFixed(1)} km radius
            </Popup>
          </Circle>
        ))}

        {routeLine && <Polyline positions={routeLine} pathOptions={{ color: '#2563eb', weight: 3, opacity: 0.6, dashArray: '1 8' }} />}

        {containers.map((c) => (
          <Marker
            key={c.id}
            position={[c.currentLocation.lat, c.currentLocation.lng]}
            icon={buildMarkerIcon('container', c.markerState, c.id === selectedContainerId, c.markerState === 'CRITICAL')}
            eventHandlers={{ click: () => onSelectContainer?.(c.id) }}
          >
            <Popup>
              <div className="min-w-[160px] text-sm">
                <strong>{c.number}</strong>
                <br />
                {c.originCity} → {c.destinationCity}
                <br />
                <span className="text-slate-500">{c.status.replaceAll('_', ' ')}</span>
              </div>
            </Popup>
          </Marker>
        ))}

        {vessels.map((v) => (
          <Marker
            key={v.id}
            position={[v.position.lat, v.position.lng]}
            icon={buildMarkerIcon('vessel', 'NORMAL', v.id === selectedVesselId)}
            eventHandlers={{ click: () => onSelectVessel?.(v.id) }}
          >
            <Popup>
              <div className="min-w-[160px] text-sm">
                <strong>{v.name}</strong>
                <br />
                {v.speedKn} kn · heading {Math.round(v.heading)}°<br />
                <span className="text-slate-500">To {v.destinationPort}</span>
              </div>
            </Popup>
          </Marker>
        ))}

        {routeLine && <FitToRoute waypoints={routeLine} />}
      </MapContainer>
    </div>
  )
}

export { buildDotIcon }
