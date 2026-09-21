import { useState, type ReactNode } from 'react'
import { Lock, Package, Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RiskBadge } from '@/components/shared/status-badge'
import { BatteryIndicator, SignalIndicator } from '@/components/shared/indicators'
import { EmptyState } from '@/components/shared/states'
import { useAuthStore } from '@/store/authStore'
import { formatDateTime, securityModeLabel, titleCase } from '@/lib/utils'
import { CargoFormModal } from './cargo-form-modal'
import type { CargoLine, Container, ESealDevice } from '@/types'

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-50 py-2 text-sm last:border-0">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-medium text-navy-800">{value}</span>
    </div>
  )
}

export function OverviewTab({ container, device, cargo }: { container: Container; device?: ESealDevice; cargo: CargoLine[] }) {
  const currentUser = useAuthStore((s) => s.currentUser)
  const isClient = currentUser?.role === 'CLIENT'
  const canManage = currentUser?.role !== 'CLIENT' && currentUser?.role !== 'AUDITOR'
  const [formOpen, setFormOpen] = useState(false)

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Container Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
          <div>
            <Field label="Container Number" value={container.number} />
            <Field label="ISO Type" value={container.isoType} />
            <Field label="Origin" value={`${container.originCity} (${container.originPort})`} />
            <Field label="Destination" value={`${container.destinationCity} (${container.destinationPort})`} />
            <Field label="Current Status" value={titleCase(container.status)} />
          </div>
          <div>
            <Field label="Current Location" value={`${container.currentLocation.lat.toFixed(3)}, ${container.currentLocation.lng.toFixed(3)}`} />
            <Field
              label="Tracking Mode"
              value={container.trackingMode === 'AIS' ? 'AIS (Vessel)' : container.trackingMode === 'IOT_GPS' ? 'IoT GPS' : 'Not Trackable'}
            />
            <Field label="Security Mode" value={securityModeLabel(container.securityMode)} />
            {container.securityMode === 'BASIC_SEAL' ? (
              <Field label="Basic Seal" value={container.regularSealId ?? '—'} />
            ) : (
              <>
                <Field label="Smart E-Seal" value={container.eSealId ?? '—'} />
                {container.securityMode === 'DUAL_SEAL' && <Field label="Bolt Seal" value={container.boltSealId ?? '—'} />}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle>Cargo Contents</CardTitle>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">{cargo.length} {cargo.length === 1 ? 'line' : 'lines'}</span>
            {canManage && (
              <Button size="sm" variant="secondary" onClick={() => setFormOpen(true)}>
                <Plus size={13} /> Add
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {cargo.length === 0 ? (
            <EmptyState icon={Package} title="No cargo recorded" description="Cargo lines will appear here once stuffing is completed." />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {cargo.map((line) => {
                const owned = !isClient || line.clientId === currentUser?.clientId
                return (
                  <div key={line.id} className="flex items-start justify-between gap-2 rounded-md border border-slate-100 p-3">
                    {owned ? (
                      <div>
                        <p className="text-sm font-medium text-navy-900">{line.productName}</p>
                        <p className="mt-0.5 text-xs text-slate-500">{line.clientName}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {line.quantity.toLocaleString()} {line.unit} · {line.doNumber}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <Badge variant="brand">{line.category}</Badge>
                          {line.sealId && <Badge variant="outline">{line.sealId}</Badge>}
                        </div>
                      </div>
                    ) : (
                      <p className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Lock size={12} /> Consolidated cargo (other client)
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {container.securityMode === 'BASIC_SEAL' && (
        <Card className="lg:col-span-3 border-amber-200 bg-warning-100/40">
          <CardContent className="py-3 text-sm text-amber-900">
            This container is secured with a basic seal — no IoT device is attached. It cannot be live-tracked or monitored
            remotely; scan the seal on-site to verify its contents.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Risk Level</CardTitle>
        </CardHeader>
        <CardContent>
          <RiskBadge level={container.riskLevel} />
          {container.riskFactors.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {container.riskFactors.map((f) => (
                <li key={f.label} className="rounded-md bg-slate-50 p-2 text-xs">
                  <p className="font-medium text-navy-800">{f.label}</p>
                  <p className="text-slate-500">{f.detail}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-xs text-slate-500">No active risk factors detected for this container.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Device Telemetry</CardTitle>
        </CardHeader>
        <CardContent>
          {device ? (
            <>
              <Field label="Battery" value={<BatteryIndicator value={device.battery} />} />
              <Field label="Signal" value={<SignalIndicator value={device.signal} />} />
              <Field label="Temperature" value={`${device.temperature}°C`} />
              <Field label="Last Update" value={formatDateTime(device.lastSeen)} />
            </>
          ) : (
            <p className="text-xs text-slate-500">
              {container.securityMode === 'BASIC_SEAL' ? 'This container has no IoT device — telemetry is not available.' : 'No smart e-seal attached yet.'}
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Shipment</CardTitle>
        </CardHeader>
        <CardContent>
          <Field label="Last Update" value={formatDateTime(container.lastUpdate)} />
          <Field label="ETA" value={formatDateTime(container.eta)} />
          <Field label="Offline Mode" value={container.offlineMode ? 'Enabled' : 'Disabled'} />
        </CardContent>
      </Card>

      {canManage && <CargoFormModal open={formOpen} onClose={() => setFormOpen(false)} container={container} />}
    </div>
  )
}
