import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts'
import {
  ShieldCheck,
  WifiOff,
  Maximize2,
  Tags,
  ScanLine,
  Unlock,
  Satellite,
  Radio,
  Navigation,
  Barcode as BarcodeIcon,
  FilePlus2,
  Package,
  PackageCheck,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react'
import { useDataStore } from '@/store/dataStore'
import { useAuthStore } from '@/store/authStore'
import { KpiCard } from '@/components/shared/kpi-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/shared/page-header'
import { SeverityBadge } from '@/components/shared/status-badge'
import { EmptyState } from '@/components/shared/states'
import { TrackingMap } from '@/components/map/tracking-map'
import { BatteryIndicator, SignalIndicator, deviceHealthStatus, type DeviceHealth } from '@/components/shared/indicators'
import { cn, formatDateTime, sealIdFor, timeAgo, titleCase } from '@/lib/utils'
import type { ContainerStatus } from '@/types'

const STATUS_GROUPS: { label: string; statuses: ContainerStatus[]; color: string }[] = [
  { label: 'Created', statuses: ['CREATED', 'STUFFING'], color: '#94a3b8' },
  { label: 'Sealed', statuses: ['SEALED'], color: '#2563eb' },
  { label: 'In Transit', statuses: ['IN_TRANSIT_ORIGIN', 'GATE_IN_ORIGIN', 'IN_TRANSIT_DESTINATION'], color: '#568bff' },
  { label: 'At Port', statuses: ['AT_ORIGIN_PORT', 'ARRIVED_DESTINATION_PORT'], color: '#1741b0' },
  { label: 'On Vessel', statuses: ['LOADED_ON_BOARD', 'OCEAN_TRANSIT'], color: '#0891b2' },
  { label: 'Delivered', statuses: ['AT_DESTINATION', 'UNLOCKED', 'DELIVERED'], color: '#16a34a' },
]

const WORKFLOW_STEPS: { step: number; icon: LucideIcon; title: string; description: string; path: string }[] = [
  { step: 1, icon: BarcodeIcon, title: 'Generate Barcode', description: 'Provision a batch of Basic Seal barcodes ahead of time, ready for stuffing.', path: '/eseals/generate' },
  { step: 2, icon: FilePlus2, title: 'Create Container', description: 'Register a new container and pick its shipping route.', path: '/stuffing' },
  { step: 3, icon: Package, title: 'Input Cargo', description: 'Record what is being loaded: product, DO number, quantity.', path: '/cargo' },
  { step: 4, icon: ShieldCheck, title: 'Choose Seal Type', description: 'Pick a Smart Seal (IoT, live-tracked) or a Basic Seal (barcode-only).', path: '/stuffing' },
  { step: 5, icon: ScanLine, title: 'Attach Seal', description: 'Scan the seal to attach it to this container, check battery (Smart Seal), then arm it.', path: '/stuffing' },
  { step: 6, icon: Satellite, title: 'In Transit', description: 'The sealed container is moving — tracked live on the map.', path: '/containers' },
  { step: 7, icon: PackageCheck, title: 'Arrive & Unlock', description: 'Reaches its destination, the seal is opened, cargo is handed to the consignee.', path: '/containers' },
]

export default function DashboardPage() {
  const { containers, devices, alerts, timeline, vessels } = useDataStore()
  const currentUser = useAuthStore((s) => s.currentUser)
  const navigate = useNavigate()

  const visibleContainers = useMemo(() => {
    if (currentUser?.role !== 'CLIENT') return containers
    return containers // client dashboard still shows aggregate counts; cargo detail is masked elsewhere
  }, [containers, currentUser])

  const kpis = useMemo(() => {
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
    const aisTracked = visibleContainers.filter((c) => c.trackingMode === 'AIS').length
    const iotTracked = visibleContainers.filter((c) => c.trackingMode === 'IOT_GPS').length

    return {
      smartSeals,
      basicSeals,
      totalSeals,
      notSealed,
      liveTracked,
      noTracking,
      aisTracked,
      iotTracked,
    }
  }, [visibleContainers])

  const statusChartData = STATUS_GROUPS.map((g) => ({
    label: g.label,
    value: visibleContainers.filter((c) => g.statuses.includes(c.status)).length,
    color: g.color,
  }))

  const recentAlerts = [...alerts].slice(0, 6)
  const recentActivity = [...timeline].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 8)

  const deviceHealthList = useMemo(() => {
    const now = Date.now()
    return devices.map((d) => {
      const lastSeenMinutes = (now - new Date(d.lastSeen).getTime()) / 60000
      return { device: d, health: deviceHealthStatus(d.battery, d.signal, lastSeenMinutes), lastSeenMinutes }
    })
  }, [devices])

  const healthSummary = useMemo(() => {
    const count = (h: DeviceHealth) => deviceHealthList.filter((d) => d.health === h).length
    return { healthy: count('HEALTHY'), warning: count('WARNING'), critical: count('CRITICAL') }
  }, [deviceHealthList])

  const priorityDevices = useMemo(() => {
    const rank: Record<DeviceHealth, number> = { CRITICAL: 0, WARNING: 1, HEALTHY: 2 }
    return [...deviceHealthList].sort((a, b) => rank[a.health] - rank[b.health]).slice(0, 6)
  }, [deviceHealthList])

  return (
    <div className="pb-10">
      <PageHeader title={`Welcome back, ${currentUser?.name?.split(' ')[0] ?? ''}`} description="Seal fleet overview — what's sealed, how it's tracked, and where it is." />

      <div className="px-4 md:px-6">
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Workflow: From Stuffing to Delivery</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
              {WORKFLOW_STEPS.map((s, i) => {
                const Icon = s.icon
                return (
                  <div key={s.step} className="relative">
                    <button
                      onClick={() => navigate(s.path)}
                      className="flex h-full w-full flex-col items-start gap-2 rounded-lg border border-slate-200 p-3 text-left transition hover:border-brand-400 hover:bg-brand-50"
                    >
                      <div className="flex w-full items-center justify-between">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white">{s.step}</span>
                        <Icon size={18} className="text-brand-600" />
                      </div>
                      <p className="text-sm font-semibold text-navy-900">{s.title}</p>
                      <p className="text-xs leading-snug text-slate-500">{s.description}</p>
                    </button>
                    {i < WORKFLOW_STEPS.length - 1 && (
                      <ChevronRight size={16} className="absolute -right-2.5 top-1/2 hidden -translate-y-1/2 text-slate-300 lg:block" />
                    )}
                  </div>
                )
              })}
            </div>
            <p className="mt-3 text-xs text-slate-400">
              Click any step to jump straight to that page. Basic Seals skip live tracking (step 5) — their status is still confirmed by scanning the barcode at each checkpoint.
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-md bg-slate-50 p-3">
              <p className="text-xs text-slate-500">
                <span className="font-semibold text-navy-700">Note:</span> the scan in step 4 is specifically for <em>attaching</em> a seal during stuffing, so it
                requires a login. Scanning to <em>verify</em> a seal afterward — check its status and declared contents — can be done anytime, by anyone, no login
                needed, on the public page below.
              </p>
              <a
                href={`${window.location.origin}${window.location.pathname}#/scan`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex shrink-0 items-center gap-1.5 rounded-md border border-brand-200 bg-white px-3 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-50"
              >
                <ScanLine size={14} /> Open Public Verification Page
              </a>
            </div>
          </CardContent>
        </Card>
      </div>

      <p className="px-4 pb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400 md:px-6">Seal Overview</p>
      <div className="grid grid-cols-2 gap-3 px-4 md:grid-cols-4 md:px-6">
        <KpiCard label="Total Seals" value={kpis.totalSeals} icon={Tags} tone="brand" onClick={() => navigate('/containers')} />
        <KpiCard label="Smart Seals" value={kpis.smartSeals} icon={ShieldCheck} tone="brand" onClick={() => navigate('/eseals?type=Smart')} />
        <KpiCard label="Basic Seals" value={kpis.basicSeals} icon={ScanLine} tone="default" onClick={() => navigate('/eseals?type=Basic')} />
        <KpiCard label="Not Sealed" value={kpis.notSealed} icon={Unlock} tone="default" onClick={() => navigate('/stuffing')} />
      </div>

      <p className="mt-4 px-4 pb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400 md:px-6">Tracking</p>
      <div className="grid grid-cols-2 gap-3 px-4 md:grid-cols-4 md:px-6">
        <KpiCard label="Live Tracked" value={kpis.liveTracked} icon={Satellite} tone="brand" onClick={() => navigate('/containers?tracking=LIVE')} />
        <KpiCard label="No Tracking" value={kpis.noTracking} icon={WifiOff} tone="default" onClick={() => navigate('/containers?tracking=NONE')} />
        <KpiCard label="AIS Tracked" value={kpis.aisTracked} icon={Radio} tone="default" onClick={() => navigate('/containers?tracking=AIS')} />
        <KpiCard label="IoT GPS Tracked" value={kpis.iotTracked} icon={Navigation} tone="default" onClick={() => navigate('/containers?tracking=IOT_GPS')} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 px-4 md:grid-cols-3 md:px-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Fleet at Sea</CardTitle>
            <button
              onClick={() => navigate('/containers')}
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
            <CardTitle>Device Health</CardTitle>
            <button
              onClick={() => navigate('/containers')}
              className="flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:underline"
            >
              View All Seals
            </button>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-md bg-success-100 py-2">
                <p className="text-lg font-semibold text-green-700">{healthSummary.healthy}</p>
                <p className="text-[11px] font-medium uppercase tracking-wide text-green-700">Healthy</p>
              </div>
              <div className="rounded-md bg-warning-100 py-2">
                <p className="text-lg font-semibold text-amber-700">{healthSummary.warning}</p>
                <p className="text-[11px] font-medium uppercase tracking-wide text-amber-700">Warning</p>
              </div>
              <div className="rounded-md bg-critical-100 py-2">
                <p className="text-lg font-semibold text-red-700">{healthSummary.critical}</p>
                <p className="text-[11px] font-medium uppercase tracking-wide text-red-700">Critical</p>
              </div>
            </div>

            <div className="max-h-56 space-y-2 overflow-y-auto">
              {priorityDevices.length === 0 ? (
                <EmptyState title="No devices yet" />
              ) : (
                priorityDevices.map(({ device, health }) => (
                  <button
                    key={device.id}
                    onClick={() => navigate('/containers')}
                    className="flex w-full items-center justify-between gap-2 rounded-md border border-slate-100 p-2.5 text-left hover:bg-slate-50"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-navy-900">{device.id}</p>
                      <div className="mt-0.5 flex items-center gap-2">
                        <BatteryIndicator value={device.battery} />
                        <SignalIndicator value={device.signal} />
                      </div>
                    </div>
                    <span
                      className={cn(
                        'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium',
                        health === 'CRITICAL' ? 'bg-critical-100 text-red-800' : health === 'WARNING' ? 'bg-warning-100 text-amber-800' : 'bg-success-100 text-green-800',
                      )}
                    >
                      {health}
                    </span>
                  </button>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 px-4 md:px-6">
        <Card>
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
