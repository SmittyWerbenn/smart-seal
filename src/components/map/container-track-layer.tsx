import { useEffect, useRef } from 'react'
import L from 'leaflet'
import { useMap } from 'react-leaflet'
import { buildMarkerIcon } from './marker-icon'
import { bearing, pointOnRoute } from '@/mock/geo'
import type { Container, GeoPoint, RouteDefinition } from '@/types'

interface ContainerTrackLayerProps {
  container: Container | undefined
  route: RouteDefinition | undefined
  follow: boolean
  onUserMove: () => void // user dragged/zoomed the map: stop following
}

const SAMPLES = 24

/** Points along the route between two progress values (0..1), used to draw completed/remaining lines. */
function routeSlice(waypoints: GeoPoint[], from: number, to: number): [number, number][] {
  const out: [number, number][] = []
  for (let i = 0; i <= SAMPLES; i++) {
    const t = from + ((to - from) * i) / SAMPLES
    const { point } = pointOnRoute(waypoints, t)
    out.push([point.lat, point.lng])
  }
  return out
}

/**
 * Animated tracking marker for the selected container. The simulation engine owns the position;
 * this layer only interpolates the drawn marker toward it with requestAnimationFrame (one loop).
 */
export function ContainerTrackLayer({ container, route, follow, onUserMove }: ContainerTrackLayerProps) {
  const map = useMap()
  const target = useRef<GeoPoint | null>(null)
  const progress = useRef(0)
  const followRef = useRef(follow)
  followRef.current = follow
  const layers = useRef<{ marker: L.Marker; done: L.Polyline; todo: L.Polyline } | null>(null)

  // Engine position → animation target (no React state, so the loop never re-renders the page).
  useEffect(() => {
    if (!container) return
    target.current = { lat: container.currentLocation.lat, lng: container.currentLocation.lng }
    progress.current = container.routeProgress
  }, [container?.currentLocation.lat, container?.currentLocation.lng, container?.routeProgress, container])

  // Create / destroy the Leaflet layers for the selected container.
  useEffect(() => {
    if (!container || !route) return
    const marker = L.marker([container.currentLocation.lat, container.currentLocation.lng], {
      icon: buildMarkerIcon('container', container.markerState, true, true),
      zIndexOffset: 1000,
      interactive: false,
    }).addTo(map)
    const done = L.polyline(routeSlice(route.waypoints, 0, container.routeProgress), { color: '#1d4ed8', weight: 4, opacity: 0.9 }).addTo(map)
    const todo = L.polyline(routeSlice(route.waypoints, container.routeProgress, 1), { color: '#94a3b8', weight: 3, dashArray: '6 6', opacity: 0.9 }).addTo(map)
    layers.current = { marker, done, todo }
    return () => {
      marker.remove()
      done.remove()
      todo.remove()
      layers.current = null
    }
    // Only the container/route identity recreates layers; positions are handled by the loop below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, container?.id, route?.id])

  // One animation loop per selected container; cancelled on change or unmount.
  useEffect(() => {
    if (!route) return
    let raf = 0
    let last = performance.now()
    let drawn: { lat: number; lng: number } | null = null
    let drawnProgress = -1

    const frame = (now: number) => {
      const dt = Math.min(now - last, 100)
      last = now
      const l = layers.current
      const t = target.current
      if (l && t) {
        if (!drawn) drawn = { ...t }
        // Exponential easing: ~180 ms to close the gap, independent of frame rate.
        const k = 1 - Math.exp(-dt / 180)
        const prev = { ...drawn }
        drawn = { lat: drawn.lat + (t.lat - drawn.lat) * k, lng: drawn.lng + (t.lng - drawn.lng) * k }
        l.marker.setLatLng([drawn.lat, drawn.lng])

        const moved = Math.abs(drawn.lat - prev.lat) + Math.abs(drawn.lng - prev.lng) > 1e-7
        if (moved) {
          const el = l.marker.getElement()?.querySelector<HTMLElement>('div')
          if (el) el.style.transform = `rotate(${Math.round(bearing(prev, drawn))}deg)`
        }
        if (Math.abs(progress.current - drawnProgress) > 1e-3) {
          drawnProgress = progress.current
          l.done.setLatLngs(routeSlice(route.waypoints, 0, drawnProgress))
          l.todo.setLatLngs(routeSlice(route.waypoints, drawnProgress, 1))
        }
        if (followRef.current && moved) {
          const ll = L.latLng(drawn.lat, drawn.lng)
          // Keep the camera calm: only pan once the marker leaves the inner part of the view.
          if (!map.getBounds().pad(-0.25).contains(ll)) map.panTo(ll, { animate: true, duration: 0.6 })
        }
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [map, route])

  // Dragging or zooming manually turns Follow off.
  useEffect(() => {
    map.on('dragstart', onUserMove)
    map.on('zoomstart', onUserMove)
    return () => {
      map.off('dragstart', onUserMove)
      map.off('zoomstart', onUserMove)
    }
  }, [map, onUserMove])

  return null
}
