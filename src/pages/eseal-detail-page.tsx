import { useMemo, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Link2, Moon, Radio, ShieldAlert, Unlink, WifiOff } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { useDataStore } from '@/store/dataStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BatteryIndicator, SignalIndicator } from '@/components/shared/indicators'
import { DeviceStatusBadge } from '@/components/shared/status-badge'
import { BarcodeGraphic } from '@/components/shared/barcode-graphic'
import { EmptyState } from '@/components/shared/states'
import { cn, formatDateTime, formatTime, titleCase } from '@/lib/utils'
import { simulateLowBattery, simulateOffline, simulateTamper } from '@/lib/actions'

function MiniChart({ data, color, unit }: { data: { timestamp: string; value: number }[]; color: string; unit: string }) {
  return (
    <ResponsiveContainer width="100%" height={140}>
      <LineChart data={data} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis dataKey="timestamp" tickFormatter={formatTime} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} minTickGap={30} />
        <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={30} />
        <Tooltip labelFormatter={(v) => formatDateTime(v as string)} formatter={(v) => [`${v}${unit}`, '']} contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
        <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}

export default function ESealDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const devices = useDataStore((s) => s.devices)
  const containers = useDataStore((s) => s.containers)
  const timeline = useDataStore((s) => s.timeline)
  const updateDevice = useDataStore((s) => s.updateDevice)

  const device = devices.find((d) => d.id === id)
  const container = containers.find((c) => c.id === device?.containerId)

  // Full lifecycle across every container this physical seal has ever been
  // attached to or detached from — not just the container it's on right now.
  // Smart Seals get detached and reused (Reverse Logistics), so a single
  // container's Events tab only shows part of the story.
  const sealHistory = useMemo(() => {
    if (!device) return []
    return timeline
      .filter((e) => e.sealId === device.id)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }, [timeline, device])

  if (!device) {
    return <EmptyState title="Device not found" action={{ label: 'Back to E-Seals', onClick: () => navigate('/eseals') }} />
  }

  return (
    <div className="pb-10">
      <div className="border-b border-slate-200 bg-white px-4 pb-4 pt-4 md:px-6">
        <button onClick={() => navigate(-1)} className="mb-2 flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-navy-800">
          <ArrowLeft size={14} /> Back
        </button>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-navy-900">{device.id}</h1>
              <DeviceStatusBadge status={device.status} />
            </div>
            <p className="mt-1 text-sm text-slate-500">
              {container ? `Attached to ${container.number}` : 'Not currently attached to a container'} · Firmware {device.firmware}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-3 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>Device Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Serial Number" value={device.serialNumber} />
            <Row label="Barcode" value={<span className="font-mono text-xs">{device.barcode}</span>} />
            <Row label="Firmware" value={device.firmware} />
            <Row label="Battery" value={<BatteryIndicator value={device.battery} />} />
            <Row label="Temperature" value={`${device.temperature}°C`} />
            <Row label="Signal" value={<SignalIndicator value={device.signal} />} />
            <Row label="Current Container" value={container?.number ?? '—'} />
            <Row label="Location" value={`${device.location.lat.toFixed(3)}, ${device.location.lng.toFixed(3)}`} />
            <Row label="Last Seen" value={formatDateTime(device.lastSeen)} />
            <Row label="Lifecycle" value={titleCase(device.lifecycle)} />
            <div className="flex flex-col items-center border-t border-slate-100 pt-3">
              <BarcodeGraphic code={device.barcode} />
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Simulation Controls</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Button variant="danger" size="sm" onClick={() => container && simulateTamper(container.id)} disabled={!container}>
              <ShieldAlert size={14} /> Simulate Tamper
            </Button>
            <Button variant="outline" size="sm" onClick={() => container && simulateLowBattery(container.id)} disabled={!container}>
              Simulate Low Battery
            </Button>
            <Button variant="secondary" size="sm" onClick={() => container && simulateOffline(container.id)} disabled={!container}>
              <WifiOff size={14} /> Simulate Offline
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => updateDevice(device.id, { motion: device.motion === 'DEEP_SLEEP' ? 'MOTION_DETECTED' : 'DEEP_SLEEP', status: device.motion === 'DEEP_SLEEP' ? 'ONLINE' : device.status })}
            >
              <Moon size={14} /> {device.motion === 'DEEP_SLEEP' ? 'Wake (Motion Detected)' : 'Deep Sleep'}
            </Button>
          </CardContent>
          <CardContent className="flex items-center gap-2 pt-0 text-xs text-slate-500">
            <Radio size={14} /> Motion state: <span className="font-medium text-navy-700">{titleCase(device.motion)}</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Battery History</CardTitle>
          </CardHeader>
          <CardContent>
            <MiniChart data={device.batteryHistory} color="#16a34a" unit="%" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Signal History</CardTitle>
          </CardHeader>
          <CardContent>
            <MiniChart data={device.signalHistory} color="#2563eb" unit="%" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Temperature History</CardTitle>
          </CardHeader>
          <CardContent>
            <MiniChart data={device.temperatureHistory} color="#d97706" unit="°C" />
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Seal History</CardTitle>
          </CardHeader>
          <CardContent>
            {sealHistory.length === 0 ? (
              <EmptyState title="No history yet" description="Attach and detach events for this seal will appear here as it's used across containers." />
            ) : (
              <ol className="space-y-2">
                {sealHistory.map((event) => {
                  const evtContainer = containers.find((c) => c.id === event.containerId)
                  return (
                    <li key={event.id} className="flex items-start gap-3 rounded-md border border-slate-100 p-3">
                      <span
                        className={cn(
                          'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
                          event.type === 'SEAL_ATTACHED' ? 'bg-brand-50 text-brand-600' : 'bg-slate-100 text-slate-500',
                        )}
                      >
                        {event.type === 'SEAL_ATTACHED' ? <Link2 size={13} /> : <Unlink size={13} />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-navy-900">{event.label}</p>
                        <p className="text-xs text-slate-500">
                          {formatDateTime(event.timestamp)} · {event.actor}
                        </p>
                      </div>
                      {evtContainer && (
                        <button
                          onClick={() => navigate(`/containers/${evtContainer.id}`)}
                          className="shrink-0 text-xs font-medium text-brand-600 hover:underline"
                        >
                          {evtContainer.number}
                        </button>
                      )}
                    </li>
                  )
                })}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-navy-800">{value}</span>
    </div>
  )
}
