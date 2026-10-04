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
  PackageCheck,
  ChevronRight,
  Camera,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
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
import { cn, formatDateTime, sealIdFor, timeAgo } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { useUiStore } from '@/store/uiStore'
import { sealPhotoText, unlockPhotoText } from '@/lib/documentation'
import type { ContainerStatus } from '@/types'
import { translate, enumLabel } from '@/i18n'

const STATUS_GROUPS: { label: string; statuses: ContainerStatus[]; color: string }[] = [
  { get label() { return translate('ui.created') }, statuses: ['CREATED', 'STUFFING'], color: '#94a3b8' },
  { get label() { return translate('ui.sealed') }, statuses: ['SEALED'], color: '#2563eb' },
  { get label() { return translate('ui.inTransit') }, statuses: ['IN_TRANSIT_ORIGIN', 'GATE_IN_ORIGIN', 'IN_TRANSIT_DESTINATION'], color: '#568bff' },
  { get label() { return translate('ui.atPort') }, statuses: ['AT_ORIGIN_PORT', 'ARRIVED_DESTINATION_PORT'], color: '#1741b0' },
  { get label() { return translate('ui.onVessel') }, statuses: ['LOADED_ON_BOARD', 'OCEAN_TRANSIT'], color: '#0891b2' },
  { get label() { return translate('ui.delivered') }, statuses: ['AT_DESTINATION', 'UNLOCKED', 'DELIVERED'], color: '#16a34a' },
]

type DocFlowStep = { label: string; kind: 'photo' | 'action' | 'done'; tag?: string }
const DOC_FLOWS: { key: string; title: string; icon: LucideIcon; tone: string; badge: string; note: string; steps: DocFlowStep[] }[] = [
  {
    key: 'seal',
    get title() { return translate('ui.seal2') },
    icon: ShieldCheck,
    tone: 'border-brand-200 bg-brand-50/40',
    get badge() { return translate('ui.n2PhotosRequired') },
    get note() { return sealPhotoText() },
    steps: [
      { get label() { return translate('ui.photoOfCargoBeforeSealing') }, kind: 'photo', get tag() { return translate('ui.photoRequired') } },
      { get label() { return translate('ui.attachSeal') }, kind: 'action' },
      { get label() { return translate('ui.photoOfContainerAfterSeal') }, kind: 'photo', get tag() { return translate('ui.photoRequired') } },
      { get label() { return translate('ui.sealComplete') }, kind: 'done', get tag() { return translate('ui.documentationComplete') } },
    ],
  },
  {
    key: 'unlock',
    get title() { return translate('ui.unlock2') },
    icon: Unlock,
    tone: 'border-green-200 bg-success-100/30',
    get badge() { return translate('ui.n2PhotosRequired') },
    get note() { return unlockPhotoText() },
    steps: [
      { get label() { return translate('ui.photoOfContainerBeforeUnlock') }, kind: 'photo', get tag() { return translate('ui.photoRequired') } },
      { get label() { return translate('ui.openSeal') }, kind: 'action' },
      { get label() { return translate('ui.photoOfCargoAfterSeal') }, kind: 'photo', get tag() { return translate('ui.photoRequired') } },
      { get label() { return translate('ui.unlockComplete') }, kind: 'done', get tag() { return translate('ui.documentationComplete') } },
    ],
  },
  {
    key: 'issue',
    get title() { return translate('ui.issue2') },
    icon: AlertTriangle,
    tone: 'border-amber-200 bg-warning-100/40',
    get badge() { return translate('ui.issuePhotos') },
    get note() { return translate('ui.issueDocumentationCanUseSeveral') },
    steps: [
      { get label() { return translate('ui.markIssue') }, kind: 'action' },
      { get label() { return translate('ui.upload1OrSeveralPhotos') }, kind: 'photo', get tag() { return translate('ui.issuePhotos') } },
      { get label() { return translate('ui.addIssueNote') }, kind: 'action' },
      { get label() { return translate('ui.saveDocumentation') }, kind: 'done', get tag() { return translate('ui.documentationComplete') } },
    ],
  },
]

const WORKFLOW_STEPS: { step: number; icon: LucideIcon; title: string; description: string; path: string; photo?: string }[] = [
  { step: 1, icon: BarcodeIcon, get title() { return translate('ui.generateBarcode') }, get description() { return translate('ui.provisionABatchOfBasic') }, path: '/eseals/generate' },
  { step: 2, icon: FilePlus2, get title() { return translate('ui.createContainerCargo') }, get description() { return translate('ui.registerANewContainerAnd') }, path: '/stuffing' },
  { step: 3, icon: ShieldCheck, get title() { return translate('ui.chooseSealType') }, get description() { return translate('ui.pickASmartSealIot') }, path: '/stuffing' },
  { step: 4, icon: ScanLine, get title() { return translate('ui.attachSeal') }, get description() { return translate('ui.takeTheCargoPhotoScan') }, path: '/stuffing', get photo() { return translate('ui.n2PhotosRequired') } },
  { step: 5, icon: Satellite, get title() { return translate('ui.inTransit') }, get description() { return translate('ui.theSealedContainerIsMoving') }, path: '/containers' },
  { step: 6, icon: PackageCheck, get title() { return translate('ui.arriveUnlock') }, get description() { return translate('ui.reachesItsDestinationPhotographThe') }, path: '/containers', get photo() { return translate('ui.n2PhotosRequired') } },
]

export default function DashboardPage() {
  const { containers, devices, alerts, timeline, vessels } = useDataStore()
  const currentUser = useAuthStore((s) => s.currentUser)
  const lang = useUiStore((s) => s.lang)
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
      <PageHeader title={translate('ui.welcomeBack', { name: currentUser?.name?.split(' ')[0] ?? '' })} description={translate('ui.sealFleetOverviewWhatS')} />

      <div className="px-4 md:px-6">
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>{translate('ui.workflowFromStuffingToDelivery')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
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
                      {s.photo && (
                        <Badge variant="warning" className="mt-auto">
                          <Camera size={11} /> {s.photo}
                        </Badge>
                      )}
                    </button>
                    {i < WORKFLOW_STEPS.length - 1 && (
                      <ChevronRight size={16} className="absolute -right-2.5 top-1/2 hidden -translate-y-1/2 text-slate-300 lg:block" />
                    )}
                  </div>
                )
              })}
            </div>
            <div className="mt-4 border-t border-slate-100 pt-4">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                <Camera size={13} /> {translate('ui.photoDocumentationWhenWhatPhoto')}
              </p>
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                {DOC_FLOWS.map((flow) => {
                  const FlowIcon = flow.icon
                  return (
                    <div key={flow.key} className={cn('rounded-lg border p-3', flow.tone)}>
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <p className="flex items-center gap-1.5 text-sm font-semibold text-navy-900">
                          <FlowIcon size={15} /> {flow.title}
                        </p>
                        <Badge variant={flow.key === 'issue' ? 'warning' : 'brand'}>{flow.badge}</Badge>
                      </div>
                      <ol className="space-y-1.5">
                        {flow.steps.map((st, idx) => (
                          <li key={st.label} className="flex items-center gap-2 text-xs">
                            <span
                              className={cn(
                                'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold',
                                st.kind === 'photo' ? 'bg-amber-500 text-white' : st.kind === 'done' ? 'bg-success-500 text-white' : 'bg-slate-200 text-slate-600',
                              )}
                            >
                              {st.kind === 'photo' ? <Camera size={11} /> : st.kind === 'done' ? <CheckCircle2 size={11} /> : <ArrowRight size={11} />}
                            </span>
                            <span className={cn('text-navy-800', st.kind === 'photo' && 'font-medium')}>
                              <span className="text-slate-400">{idx + 1}.</span> {st.label}
                            </span>
                            {st.tag && (
                              <span className={cn('ml-auto shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium', st.kind === 'done' ? 'bg-success-100 text-green-800' : 'bg-warning-100 text-amber-800')}>
                                {st.tag}
                              </span>
                            )}
                          </li>
                        ))}
                      </ol>
                      <p className="mt-2 flex items-start gap-1 text-[11px] leading-snug text-slate-600">
                        <ArrowRight size={11} className="mt-0.5 shrink-0" /> {flow.note}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-400">
              {translate('ui.clickAnyStepToJump')}
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-md bg-slate-50 p-3">
              <p className="text-xs text-slate-500">
                <span className="font-semibold text-navy-700">{translate('ui.note')}</span> {translate('ui.scanNotePart1')} <em>{translate('ui.attaching')}</em> {translate('ui.scanNotePart2')} <em>{translate('ui.verify2')}</em> {translate('ui.scanNotePart3')}
              </p>
              <a
                href={`${window.location.origin}${window.location.pathname}#/scan`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex shrink-0 items-center gap-1.5 rounded-md border border-brand-200 bg-white px-3 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-50"
              >
                <ScanLine size={14} /> {translate('ui.openPublicVerificationPage')}
              </a>
            </div>
          </CardContent>
        </Card>
      </div>

      <p className="px-4 pb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400 md:px-6">{translate('ui.sealOverview')}</p>
      <div className="grid grid-cols-2 gap-3 px-4 md:grid-cols-4 md:px-6">
        <KpiCard label={translate('ui.totalSeals')} value={kpis.totalSeals} icon={Tags} tone="brand" onClick={() => navigate('/containers')} />
        <KpiCard label={translate('ui.smartSeals')} value={kpis.smartSeals} icon={ShieldCheck} tone="brand" onClick={() => navigate('/eseals?type=Smart')} />
        <KpiCard label={translate('ui.basicSeals')} value={kpis.basicSeals} icon={ScanLine} tone="default" onClick={() => navigate('/eseals?type=Basic')} />
        <KpiCard label={translate('ui.notSealed')} value={kpis.notSealed} icon={Unlock} tone="default" onClick={() => navigate('/stuffing')} />
      </div>

      <p className="mt-4 px-4 pb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400 md:px-6">{translate('ui.tracking')}</p>
      <div className="grid grid-cols-2 gap-3 px-4 md:grid-cols-4 md:px-6">
        <KpiCard label={translate('ui.liveTracked')} value={kpis.liveTracked} icon={Satellite} tone="brand" onClick={() => navigate('/containers?tracking=LIVE')} />
        <KpiCard label={translate('ui.noTracking')} value={kpis.noTracking} icon={WifiOff} tone="default" onClick={() => navigate('/containers?tracking=NONE')} />
        <KpiCard label={translate('ui.aisTracked')} value={kpis.aisTracked} icon={Radio} tone="default" onClick={() => navigate('/containers?tracking=AIS')} />
        <KpiCard label={translate('ui.iotGpsTracked')} value={kpis.iotTracked} icon={Navigation} tone="default" onClick={() => navigate('/containers?tracking=IOT_GPS')} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 px-4 md:grid-cols-3 md:px-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>{translate('ui.fleetAtSea')}</CardTitle>
            <button
              onClick={() => navigate('/containers')}
              className="flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:underline"
            >
              <Maximize2 size={12} /> {translate('ui.openFullMap')}
            </button>
          </CardHeader>
          <CardContent className="h-96 p-0">
            <TrackingMap vessels={vessels} center={[-3.5, 108]} zoom={5} height="100%" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{translate('ui.deviceHealth')}</CardTitle>
            <button
              onClick={() => navigate('/containers')}
              className="flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:underline"
            >
              {translate('ui.viewAllSeals')}
            </button>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-md bg-success-100 py-2">
                <p className="text-lg font-semibold text-green-700">{healthSummary.healthy}</p>
                <p className="text-[11px] font-medium uppercase tracking-wide text-green-700">{translate('ui.healthy')}</p>
              </div>
              <div className="rounded-md bg-warning-100 py-2">
                <p className="text-lg font-semibold text-amber-700">{healthSummary.warning}</p>
                <p className="text-[11px] font-medium uppercase tracking-wide text-amber-700">{translate('ui.warning')}</p>
              </div>
              <div className="rounded-md bg-critical-100 py-2">
                <p className="text-lg font-semibold text-red-700">{healthSummary.critical}</p>
                <p className="text-[11px] font-medium uppercase tracking-wide text-red-700">{translate('ui.critical')}</p>
              </div>
            </div>

            <div className="max-h-56 space-y-2 overflow-y-auto">
              {priorityDevices.length === 0 ? (
                <EmptyState title={translate('ui.noDevicesYet')} />
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
            <CardTitle>{translate('ui.containerStatus')}</CardTitle>
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
            <CardTitle>{translate('ui.recentAlerts')}</CardTitle>
          </CardHeader>
          <CardContent className="max-h-80 space-y-3 overflow-y-auto">
            {recentAlerts.length === 0 ? (
              <EmptyState title={translate('ui.noAlerts')} description={translate('ui.allQuietAcrossTheNetwork')} />
            ) : (
              recentAlerts.map((a) => (
                <button
                  key={a.id}
                  onClick={() => navigate('/alerts')}
                  className="flex w-full items-start justify-between gap-3 rounded-md border border-slate-100 p-2.5 text-left hover:bg-slate-50"
                >
                  <div>
                    <p className="text-sm font-medium text-navy-900">{enumLabel('alertCategory', a.category)}</p>
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
            <CardTitle>{translate('ui.recentSealActivity')}</CardTitle>
          </CardHeader>
          <CardContent className="max-h-80 space-y-3 overflow-y-auto">
            {recentActivity.length === 0 ? (
              <EmptyState title={translate('ui.noActivity')} />
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
