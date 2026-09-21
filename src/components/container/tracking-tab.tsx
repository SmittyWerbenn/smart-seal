import { useEffect, useRef, useState } from 'react'
import { Play, Square, WifiOff } from 'lucide-react'
import { TrackingMap } from '@/components/map/tracking-map'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/shared/states'
import { pointOnRoute } from '@/mock/geo'
import { formatDateTime } from '@/lib/utils'
import type { Container, RouteDefinition } from '@/types'

export function TrackingTab({ container, route }: { container: Container; route?: RouteDefinition }) {
  const [playing, setPlaying] = useState(false)
  const [animatedProgress, setAnimatedProgress] = useState(container.routeProgress)
  const frameRef = useRef<number | null>(null)

  useEffect(() => {
    if (!playing || !route) return
    const start = performance.now()
    const duration = 4000
    const from = 0
    const to = container.routeProgress
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      setAnimatedProgress(from + (to - from) * t)
      if (t < 1) {
        frameRef.current = requestAnimationFrame(step)
      } else {
        setPlaying(false)
      }
    }
    frameRef.current = requestAnimationFrame(step)
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing])

  if (container.trackingMode === 'NONE') {
    return (
      <Card>
        <CardContent>
          <EmptyState
            icon={WifiOff}
            title="Not Trackable"
            description="This container uses a basic seal with no IoT device attached, so live GPS tracking is not available. Scan the seal on-site or check the Cargo tab to verify its contents."
          />
        </CardContent>
      </Card>
    )
  }

  if (!route) return <p className="text-sm text-slate-500">No route data available for this container.</p>

  const displayProgress = playing ? animatedProgress : container.routeProgress
  const { point } = pointOnRoute(route.waypoints, displayProgress)
  const ghostContainer: Container = { ...container, currentLocation: point }
  const waypoints = route.waypoints.map((w) => [w.lat, w.lng] as [number, number])

  const historySteps = 8
  const historyPoints = Array.from({ length: historySteps + 1 }, (_, i) => {
    const t = (i / historySteps) * container.routeProgress
    const { point: p } = pointOnRoute(route.waypoints, t)
    return { t, point: p, timestamp: new Date(Date.now() - (historySteps - i) * 1000 * 60 * 37).toISOString() }
  })

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Live Map</CardTitle>
          <Button size="sm" variant={playing ? 'secondary' : 'primary'} onClick={() => setPlaying((p) => !p)}>
            {playing ? (
              <>
                <Square size={14} /> Stop
              </>
            ) : (
              <>
                <Play size={14} /> Play Route
              </>
            )}
          </Button>
        </CardHeader>
        <CardContent className="h-[420px] p-0">
          <TrackingMap containers={[ghostContainer]} routeWaypoints={waypoints} height="420px" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tracking Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-slate-500">Mode</span><span className="font-medium">{container.trackingMode === 'AIS' ? 'AIS (Vessel)' : 'IoT GPS'}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Route</span><span className="font-medium">{route.name}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Progress</span><span className="font-medium">{Math.round(container.routeProgress * 100)}%</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Coordinates</span><span className="font-medium">{point.lat.toFixed(4)}, {point.lng.toFixed(4)}</span></div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle>Route History &amp; GPS Points</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="relative flex flex-col gap-3 border-s border-slate-200 ps-4">
            {historyPoints.map((h, i) => (
              <li key={i} className="text-xs">
                <span className="absolute -start-[5px] mt-1 h-2.5 w-2.5 rounded-full bg-brand-600 ring-4 ring-white" />
                <span className="font-medium text-navy-800">{h.point.lat.toFixed(4)}, {h.point.lng.toFixed(4)}</span>
                <span className="ml-2 text-slate-400">{formatDateTime(h.timestamp)}</span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}
