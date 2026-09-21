import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts'
import {
  Container as ContainerIcon,
  Ship,
  Anchor,
  Sailboat,
  MapPin,
  ShieldCheck,
  BatteryWarning,
  AlertOctagon,
  WifiOff,
  Gauge,
  Maximize2,
  Tags,
  ScanLine,
  Unlock,
  Satellite,
} from 'lucide-react'
import { useDataStore } from '@/store/dataStore'
import { useAuthStore } from '@/store/authStore'
import { KpiCard } from '@/components/shared/kpi-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/shared/page-header'
import { SeverityBadge } from '@/components/shared/status-badge'
import { EmptyState } from '@/components/shared/states'
import { TrackingMap } from '@/components/map/tracking-map'
import { Progress } from '@/components/ui/progress'
import { formatDateTime, sealIdFor, timeAgo, titleCase } from '@/lib/utils'
import type { ContainerStatus } from '@/types'

const STATUS_GROUPS: { label: string; statuses: ContainerStatus[]; color: string }[] = [
  { label: 'Created', statuses: ['CREATED', 'STUFFING'], color: '#94a3b8' },
  { label: 'Sealed', statuses: ['SEALED'], color: '#2563eb' },
  { label: 'In Transit', statuses: ['IN_TRANSIT_ORIGIN', 'GATE_IN_ORIGIN', 'IN_TRANSIT_DESTINATION'], color: '#568bff' },
  { label: 'At Port', statuses: ['AT_ORIGIN_PORT', 'ARRIVED_DESTINATION_PORT'], color: '#1741b0' },
  { label: 'On Vessel', statuses: ['LOADED_ON_BOARD', 'OCEAN_TRANSIT'], color: '#0891b2' },
  { label: 'Delivered', statuses: ['AT_DESTINATION', 'UNLOCKED', 'DELIVERED'], color: '#16a34a' },
]

const DEVICE_HEALTH_COLORS = { Online: '#16a34a', Offline: '#64748b', 'Low Battery': '#d97706', Tamper: '#dc2626' }

export default function DashboardPage() {
  const { containers, devices, alerts, timeline, vessels } = useDataStore()
  const currentUser = useAuthStore((s) => s.currentUser)
  const navigate = useNavigate()

  const visibleContainers = useMemo(() => {
    if (currentUser?.role !== 'CLIENT') return containers
    return containers // client dashboard still shows aggregate counts; cargo detail is masked elsewhere
  }, [containers, currentUser])

  const kpis = useMemo(() => {
    const active = visibleContainers.filter((c) => c.status !== 'DELIVERED').length
    const inTransit = visibleContainers.filter((c) => ['IN_TRANSIT_ORIGIN', 'IN_TRANSIT_DESTINATION'].includes(c.status)).length
    const atPort = visibleContainers.filter((c) => ['AT_ORIGIN_PORT', 'ARRIVED_DESTINATION_PORT'].includes(c.status)).length
    const onVessel = visibleContainers.filter((c) => ['LOADED_ON_BOARD', 'OCEAN_TRANSIT'].includes(c.status)).length
    const atDestination = visibleContainers.filter((c) => ['AT_DESTINATION', 'UNLOCKED', 'DELIVERED'].includes(c.status)).length
    const lowBattery = devices.filter((d) => d.battery < 30).length
    const criticalAlerts = alerts.filter((a) => a.severity === 'CRITICAL' && a.status === 'OPEN').length

    // Seal composition — this is the primary lens for the dashboard: what's
    // sealed, with which kind of seal, before anything about its journey.
    const smartSeals = visibleContainers.filter((c) => c.eSealId).length
    const basicSeals = visibleContainers.filter((c) => c.regularSealId).length
    const totalSeals = smartSeals + basicSeals
    const notSealed = visibleContainers.filter((c) => !c.eSealId && !c.regularSealId).length

    // Tracking capability follows directly from seal type — smart seals are
    // live-tracked, basic seals and un-sealed containers are not.
    const liveTracked = visibleContainers.filter((c) => c.trackingMode !== 'NONE').length
    const noTracking = visibleContainers.filter((c) => c.trackingMode === 'NONE' && c.status !== 'DELIVERED').length

    return { active, inTransit, atPort, onVessel, atDestination, lowBattery, criticalAlerts, smartSeals, basicSeals, totalSeals, notSealed, liveTracked, noTracking }
  }, [visibleContainers, devices, alerts])

  const statusChartData = STATUS_GROUPS.map((g) => ({
    label: g.label,
    value: visibleContainers.filter((c) => g.statuses.includes(c.status)).length,
    color: g.color,
  }))

  const deviceHealthData = [
    { name: 'Online', value: devices.filter((d) => d.status === 'ONLINE').length },
    { name: 'Offline', value: devices.filter((d) => d.status === 'OFFLINE').length },
    { name: 'Low Battery', value: devices.filter((d) => d.status === 'LOW_BATTERY').length },
    { name: 'Tamper', value: devices.filter((d) => d.status === 'TAMPER').length },
  ].filter((d) => d.value > 0)

  const recentAlerts = [...alerts].slice(0, 6)
  const recentActivity = [...timeline].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 8)
  const activeVoyages = [...vessels].sort((a, b) => new Date(a.eta).getTime() - new Date(b.eta).getTime()).slice(0, 6)

  return (
    <div className="pb-10">
      <PageHeader title={`Welcome back, ${currentUser?.name?.split(' ')[0] ?? ''}`} description="Seal fleet overview — what's sealed, how it's tracked, and where it is." />

      <p className="px-4 pb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400 md:px-6">Seal Overview</p>
      <div className="grid grid-cols-2 gap-3 px-4 md:grid-cols-4 md:px-6">
        <KpiCard label="Total Seals" value={kpis.totalSeals} icon={Tags} tone="brand" onClick={() => navigate('/containers')} />
        <KpiCard label="Smart Seals" value={kpis.smartSeals} icon={ShieldCheck} tone="brand" onClick={() => navigate('/eseals')} />
        <KpiCard label="Basic Seals" value={kpis.basicSeals} icon={ScanLine} tone="default" onClick={() => navigate('/containers')} />
        <KpiCard label="Not Sealed" value={kpis.notSealed} icon={Unlock} tone="default" onClick={() => navigate('/stuffing')} />
      </div>

      <p className="mt-4 px-4 pb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400 md:px-6">Tracking &amp; Health</p>
      <div className="grid grid-cols-2 gap-3 px-4 md:grid-cols-4 md:px-6">
        <KpiCard label="Live Tracked" value={kpis.liveTracked} icon={Satellite} tone="brand" onClick={() => navigate('/control-tower')} />
        <KpiCard label="No Tracking" value={kpis.noTracking} icon={WifiOff} tone="default" onClick={() => navigate('/containers')} />
        <KpiCard label="Low Battery" value={kpis.lowBattery} icon={BatteryWarning} tone="warning" onClick={() => navigate('/eseals')} />
        <KpiCard label="Critical Alerts" value={kpis.criticalAlerts} icon={AlertOctagon} tone="critical" onClick={() => navigate('/alerts')} />
      </div>

      <p className="mt-4 px-4 pb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400 md:px-6">Container Journey</p>
      <div className="grid grid-cols-2 gap-3 px-4 md:grid-cols-5 md:px-6">
        <KpiCard label="Active Containers" value={kpis.active} icon={ContainerIcon} tone="default" onClick={() => navigate('/containers')} />
        <KpiCard label="In Transit" value={kpis.inTransit} icon={Ship} tone="default" onClick={() => navigate('/control-tower')} />
        <KpiCard label="At Port" value={kpis.atPort} icon={Anchor} tone="default" onClick={() => navigate('/containers')} />
        <KpiCard label="On Vessel" value={kpis.onVessel} icon={Sailboat} tone="default" onClick={() => navigate('/vessels')} />
        <KpiCard label="At Destination" value={kpis.atDestination} icon={MapPin} tone="success" onClick={() => navigate('/containers')} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 px-4 md:grid-cols-3 md:px-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Fleet at Sea</CardTitle>
            <button
              onClick={() => navigate('/control-tower')}
              className="flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:underline"
            >
              <Maximize2 size={12} /> Open Full Map
            </button>
          </CardHeader>
          <CardContent className="h-96 p-0">
            <TrackingMap vessels={vessels} center={[-3.5, 108]} zoom={5} height="100%" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Voyages</CardTitle>
          </CardHeader>
          <CardContent className="max-h-80 space-y-3 overflow-y-auto">
            {activeVoyages.length === 0 ? (
              <EmptyState title="No vessels underway" />
            ) : (
              activeVoyages.map((v) => (
                <button
                  key={v.id}
                  onClick={() => navigate(`/vessels/${v.id}`)}
                  className="flex w-full flex-col gap-1.5 rounded-md border border-slate-100 p-2.5 text-left hover:bg-slate-50"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-navy-900">{v.name}</span>
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <Gauge size={12} /> {v.speedKn} kn
                    </span>
                  </div>
                  <span className="text-xs text-slate-500">
                    {v.originPort} → {v.destinationPort}
                  </span>
                  <Progress value={v.routeProgress * 100} colorClassName="bg-brand-500" />
                  <span className="text-[11px] text-slate-400">{v.containerIds.length} containers · ETA {formatDateTime(v.eta)}</span>
                </button>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 px-4 md:grid-cols-3 md:px-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Container Status</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusChartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {statusChartData.map((entry) => (
                    <Cell key={entry.label} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Device Health</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {deviceHealthData.length === 0 ? (
              <EmptyState title="No device data" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={deviceHealthData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
                    {deviceHealthData.map((entry) => (
                      <Cell key={entry.name} fill={DEVICE_HEALTH_COLORS[entry.name as keyof typeof DEVICE_HEALTH_COLORS]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
            <div className="mt-2 flex flex-wrap justify-center gap-3 text-xs text-slate-500">
              {deviceHealthData.map((d) => (
                <span key={d.name} className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ background: DEVICE_HEALTH_COLORS[d.name as keyof typeof DEVICE_HEALTH_COLORS] }} />
                  {d.name} ({d.value})
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 px-4 md:grid-cols-2 md:px-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Alerts</CardTitle>
          </CardHeader>
          <CardContent className="max-h-80 space-y-3 overflow-y-auto">
            {recentAlerts.length === 0 ? (
              <EmptyState title="No alerts" description="All quiet across the network." />
            ) : (
              recentAlerts.map((a) => (
                <button
                  key={a.id}
                  onClick={() => navigate('/alerts')}
                  className="flex w-full items-start justify-between gap-3 rounded-md border border-slate-100 p-2.5 text-left hover:bg-slate-50"
                >
                  <div>
                    <p className="text-sm font-medium text-navy-900">{titleCase(a.category)}</p>
                    <p className="text-xs text-slate-500">{a.message}</p>
                    <p className="mt-0.5 text-[11px] text-slate-400">{timeAgo(a.createdAt)}</p>
                  </div>
                  <SeverityBadge severity={a.severity} />
                </button>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Seal Activity</CardTitle>
          </CardHeader>
          <CardContent className="max-h-80 space-y-3 overflow-y-auto">
            {recentActivity.length === 0 ? (
              <EmptyState title="No activity" />
            ) : (
              recentActivity.map((event) => {
                const container = containers.find((c) => c.id === event.containerId)
                const seal = container ? sealIdFor(container) : null
                return (
                  <button
                    key={event.id}
                    onClick={() => container && navigate(`/containers/${container.id}`)}
                    className="flex w-full flex-col rounded-md border border-slate-100 p-2.5 text-left hover:bg-slate-50"
                  >
                    <span className="text-sm font-medium text-navy-900">{seal ?? container?.number ?? event.containerId}</span>
                    <span className="text-xs text-slate-500">{event.label}</span>
                    <span className="mt-0.5 text-[11px] text-slate-400">{formatDateTime(event.timestamp)}</span>
                  </button>
                )
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
