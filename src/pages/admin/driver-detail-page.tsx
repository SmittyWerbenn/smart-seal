import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Ban, KeyRound, Link2, Pencil, UserCheck } from 'lucide-react'
import { useDataStore } from '@/store/dataStore'
import { usePermission } from '@/lib/use-permission'
import { driverSnapshot, checkpointLabel } from '@/lib/driver-view'
import { driverService } from '@/services/driverService'
import { checkpointService, sealStatusFor } from '@/services/checkpointService'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs } from '@/components/ui/tabs'
import { Modal } from '@/components/ui/modal'
import { EmptyState } from '@/components/shared/states'
import { DataTable, type Column } from '@/components/shared/data-table'
import { DriverStatusBadge } from '@/components/driver/driver-status-badge'
import { ContainerStatusBadge } from '@/components/shared/status-badge'
import { DriverFormModal } from './driver-form-modal'
import { AssignShipmentModal } from './assign-shipment-modal'
import { formatDate, formatDateTime } from '@/lib/utils'
import type { AuditLogEntry, DriverAssignment, DriverCheckpoint } from '@/types'
import { translate } from '@/i18n'

const TABS = [
  { key: 'overview', get label() { return translate('ui.overview') } },
  { key: 'current', get label() { return translate('ui.currentAssignment') } },
  { key: 'shipments', get label() { return translate('ui.shipmentHistory') } },
  { key: 'checkpoints', get label() { return translate('ui.checkpointHistory') } },
  { key: 'vehicle', get label() { return translate('ui.vehicle2') } },
  { key: 'documents', get label() { return translate('ui.documents') } },
  { key: 'activity', get label() { return translate('ui.activity') } },
]

export default function DriverDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [tab, setTab] = useState('overview')
  const [editOpen, setEditOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)
  const [newPassword, setNewPassword] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const canManage = usePermission('driver.manage')
  const canAssign = usePermission('driver.assign')
  const canSuspend = usePermission('driver.suspend')
  const canCredentials = usePermission('driver.credentials')
  const canApproveException = usePermission('driver.approve_exception')

  const driver = useDataStore((s) => s.drivers.find((d) => d.id === id || d.driverId === id.toUpperCase()))
  const vehicles = useDataStore((s) => s.vehicles)
  const assignments = useDataStore((s) => s.driverAssignments)
  const checkpoints = useDataStore((s) => s.driverCheckpoints)
  const shipments = useDataStore((s) => s.shipments)
  const containers = useDataStore((s) => s.containers)
  const pods = useDataStore((s) => s.proofOfDeliveries)
  const auditLog = useDataStore((s) => s.auditLog)

  const snap = useMemo(
    () => (driver ? driverSnapshot(driver, assignments, checkpoints, shipments) : undefined),
    [driver, assignments, checkpoints, shipments],
  )

  if (!driver || !snap) {
    return (
      <div className="p-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/admin/drivers')}><ArrowLeft size={14} /> {translate('ui.driverManagement')}</Button>
        <EmptyState title={translate('ui.driverNotFound')} />
      </div>
    )
  }

  const myAssignments = assignments.filter((a) => a.driverId === driver.id).sort((a, b) => b.assignedAt.localeCompare(a.assignedAt))
  const myCheckpoints = checkpoints.filter((c) => c.driverId === driver.id).sort((a, b) => b.timestamp.localeCompare(a.timestamp))
  const vehicle = vehicles.find((v) => v.id === driver.vehicleId)
  const completed = myAssignments.filter((a) => a.status === 'COMPLETED')
  const onTime = completed.filter((a) => {
    const pod = pods.find((p) => p.shipmentId === a.shipmentId)
    const container = containers.find((c) => c.id === a.containerId)
    return pod && container && pod.submittedAt <= container.eta
  }).length
  const onTimeRate = completed.length ? `${Math.round((onTime / completed.length) * 100)}%` : '—'
  const myActivity = auditLog.filter((e) => e.user === driver.name || e.description.includes(driver.driverId)).slice(0, 60)

  const toggleSuspend = async () => {
    setError(null)
    const next = driver.status === 'SUSPENDED' ? 'AVAILABLE' : 'SUSPENDED'
    const result = await driverService.setStatus(driver.id, next)
    if (!result.ok) setError(result.error ?? 'Gagal mengubah status.')
  }

  const resetPassword = async () => {
    setError(null)
    const result = await driverService.resetPassword(driver.id)
    if (!result.ok || !result.value) setError(result.error ?? 'Reset password gagal.')
    else setNewPassword(result.value)
  }

  const assignmentColumns: Column<DriverAssignment>[] = [
    { key: 'shipment', get header() { return translate('ui.shipment') }, render: (a) => <span className="font-mono text-xs">{a.shipmentId}</span> },
    { key: 'container', get header() { return translate('ui.container') }, render: (a) => <span className="font-mono text-xs">{containers.find((c) => c.id === a.containerId)?.number ?? '—'}</span> },
    { key: 'vehicle', get header() { return translate('ui.vehicle2') }, render: (a) => vehicles.find((v) => v.id === a.vehicleId)?.plate ?? '—' },
    { key: 'status', get header() { return translate('ui.assignment') }, render: (a) => <span className="text-xs font-medium">{a.status}</span> },
    { key: 'assigned', get header() { return translate('ui.assigned') }, render: (a) => formatDateTime(a.assignedAt) },
    { key: 'completed', get header() { return translate('ui.completed') }, render: (a) => (a.completedAt ? formatDateTime(a.completedAt) : '—') },
  ]

  const checkpointColumns: Column<DriverCheckpoint>[] = [
    { key: 'time', get header() { return translate('ui.time') }, render: (c) => formatDateTime(c.timestamp) },
    { key: 'shipment', get header() { return translate('ui.shipment') }, render: (c) => <span className="font-mono text-xs">{c.shipmentId}</span> },
    { key: 'type', get header() { return translate('ui.checkpoint') }, render: (c) => checkpointLabel(c.type) },
    { key: 'location', get header() { return translate('ui.location') }, render: (c) => c.location.name },
    { key: 'notes', get header() { return translate('ui.notes') }, render: (c) => <span className="text-slate-500">{c.notes ?? '—'}</span> },
  ]

  const activityColumns: Column<AuditLogEntry>[] = [
    { key: 'time', get header() { return translate('ui.timestamp') }, render: (e) => formatDateTime(e.timestamp) },
    { key: 'action', get header() { return translate('ui.action') }, render: (e) => <span className="font-mono text-xs">{e.action}</span> },
    { key: 'entity', get header() { return translate('ui.entity') }, render: (e) => e.entity },
    { key: 'desc', get header() { return translate('ui.description') }, render: (e) => <span className="text-slate-600">{e.description}</span> },
  ]

  return (
    <div className="space-y-4 p-4 pb-10 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/admin/drivers')}>
          <ArrowLeft size={14} /> {translate('ui.driverManagement')}
        </Button>
        <div className="flex flex-wrap gap-2">
          {canManage && <Button variant="secondary" size="sm" onClick={() => setEditOpen(true)}><Pencil size={14} /> {translate('ui.edit')}</Button>}
          {canAssign && driver.status === 'AVAILABLE' && (
            <Button variant="secondary" size="sm" onClick={() => setAssignOpen(true)}><Link2 size={14} /> {translate('ui.assignShipment')}</Button>
          )}
          {canSuspend && driver.status !== 'ON_DELIVERY' && (
            <Button variant={driver.status === 'SUSPENDED' ? 'secondary' : 'danger'} size="sm" onClick={toggleSuspend}>
              {driver.status === 'SUSPENDED' ? <><UserCheck size={14} /> {translate('ui.activate')}</> : <><Ban size={14} /> {translate('ui.suspend')}</>}
            </Button>
          )}
          {canCredentials && <Button variant="secondary" size="sm" onClick={resetPassword}><KeyRound size={14} /> {translate('ui.resetPassword')}</Button>}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div>
          <p className="font-mono text-xs text-slate-500">{driver.driverId}</p>
          <h1 className="text-lg font-semibold text-navy-900">{driver.name}</h1>
        </div>
        <DriverStatusBadge status={driver.status} />
      </div>
      {error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label={translate('ui.completedShipments')} value={completed.length} />
        <Stat label={translate('ui.onTimeDelivery')} value={onTimeRate} />
        <Stat label={translate('ui.currentLocation')} value={snap.locationName} small />
        <Stat label={translate('ui.currentShipment')} value={snap.currentShipment?.id ?? '—'} small />
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === 'overview' && (
        <Card>
          <CardContent className="grid grid-cols-1 gap-4 py-4 text-sm md:grid-cols-2">
            <Field label={translate('ui.phone')} value={driver.phone} />
            <Field label={translate('ui.email')} value={driver.email ?? '—'} />
            <Field label={translate('ui.vehicle2')} value={vehicle ? `${vehicle.plate} · ${vehicle.vehicleType}` : '—'} />
            <Field label={translate('ui.username')} value={driver.username} mono />
            <Field label={translate('ui.lastCheckpoint')} value={snap.lastCheckpoint ? `${checkpointLabel(snap.lastCheckpoint.type)} · ${formatDateTime(snap.lastCheckpoint.timestamp)}` : '—'} />
            <Field label={translate('ui.updated')} value={formatDateTime(driver.updatedAt)} />
            <div className="md:col-span-2">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{translate('ui.recentActivity')}</p>
              {myActivity.slice(0, 5).map((e) => (
                <p key={e.id} className="text-xs text-slate-600">{formatDateTime(e.timestamp)} · <span className="font-mono">{e.action}</span> · {e.description}</p>
              ))}
              {myActivity.length === 0 && <p className="text-xs text-slate-400">{translate('ui.noActivityYet2')}</p>}
            </div>
          </CardContent>
        </Card>
      )}

      {tab === 'current' && (
        <Card>
          <CardContent className="py-4 text-sm">
            {snap.currentAssignment && snap.currentShipment ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field label={translate('ui.shipment')} value={snap.currentShipment.id} mono />
                  <Field label={translate('ui.container')} value={containers.find((c) => c.id === snap.currentAssignment!.containerId)?.number ?? '—'} mono />
                  <Field label={translate('ui.route')} value={`${snap.currentShipment.originCity} → ${snap.currentShipment.destinationCity}`} />
                  <Field label={translate('ui.assignedBy')} value={snap.currentAssignment.assignedBy} />
                  <div>
                    <p className="text-xs text-slate-500">{translate('ui.containerStatus2')}</p>
                    <ContainerStatusBadge status={containers.find((c) => c.id === snap.currentAssignment!.containerId)?.status ?? 'CREATED'} />
                  </div>
                </div>
              {(() => {
                const container = containers.find((c) => c.id === snap.currentAssignment!.containerId)
                if (!container || sealStatusFor(container).state !== 'TAMPER' || snap.currentShipment.exceptionApproved) return null
                return (
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-red-50 p-3 text-red-800">
                    <p className="text-sm">⚠ Tamper terdeteksi pada {container.number}. Checkpoint driver diblokir.</p>
                    {canApproveException && (
                      <Button variant="danger" size="sm" onClick={async () => {
                        const result = await checkpointService.approveException(snap.currentShipment!.id)
                        if (!result.ok) setError(result.error ?? 'Gagal menyetujui pengecualian.')
                      }}>{translate('ui.approveException')}</Button>
                    )}
                  </div>
                )
              })()}
              </div>
            ) : (
              <EmptyState title={translate('ui.noActiveShipment')} description={translate('ui.driverIsAvailableOrOffline')} />
            )}
          </CardContent>
        </Card>
      )}

      {tab === 'shipments' && (
        <Card>
          <CardContent className="py-2">
            <DataTable columns={assignmentColumns} rows={myAssignments} rowKey={(a) => a.id} emptyTitle={translate('ui.noShipmentHistoryYet')} />
          </CardContent>
        </Card>
      )}

      {tab === 'checkpoints' && (
        <Card>
          <CardContent className="py-2">
            <DataTable columns={checkpointColumns} rows={myCheckpoints} rowKey={(c) => c.id} emptyTitle={translate('ui.noCheckpointsYet')} />
          </CardContent>
        </Card>
      )}

      {tab === 'vehicle' && (
        <Card>
          <CardContent className="grid grid-cols-1 gap-4 py-4 text-sm md:grid-cols-2">
            <Field label={translate('ui.plate')} value={vehicle?.plate ?? '—'} mono />
            <Field label={translate('ui.unit')} value={vehicle?.unitNumber ?? '—'} />
            <Field label={translate('ui.type')} value={vehicle?.vehicleType ?? '—'} />
            <Field label={translate('ui.capacity')} value={vehicle ? `${vehicle.capacityTon} Ton` : '—'} />
          </CardContent>
        </Card>
      )}

      {tab === 'documents' && (
        <Card>
          <CardContent className="grid grid-cols-1 gap-4 py-4 text-sm md:grid-cols-2">
            <Field label={translate('ui.licenseNo')} value={driver.licenseNumber ?? '—'} mono />
            <Field label={translate('ui.licenseValidUntil')} value={driver.licenseExpiry ? formatDate(driver.licenseExpiry) : '—'} />
            <Field label={translate('ui.emergencyContact2')} value={driver.emergencyContact ?? '—'} />
            <p className="text-xs text-slate-400 md:col-span-2">{translate('ui.physicalDocumentsAreNotUploaded')}</p>
          </CardContent>
        </Card>
      )}

      {tab === 'activity' && (
        <Card>
          <CardContent className="py-2">
            <DataTable columns={activityColumns} rows={myActivity} rowKey={(e) => e.id} emptyTitle={translate('ui.noActivityYet')} />
          </CardContent>
        </Card>
      )}

      {editOpen && <DriverFormModal open onClose={() => setEditOpen(false)} driver={driver} />}
      {assignOpen && <AssignShipmentModal open onClose={() => setAssignOpen(false)} presetDriverId={driver.id} />}
      <Modal open={!!newPassword} onClose={() => setNewPassword(null)} title={translate('ui.newPassword')}>
        <div className="space-y-3 text-sm">
          <p className="rounded-md bg-slate-100 p-3 text-center font-mono text-lg tracking-wider">{newPassword}</p>
          <p className="text-xs text-slate-500">{translate('ui.shownOncePrototypeOnly')}</p>
          <div className="flex justify-end"><Button onClick={() => setNewPassword(null)}>{translate('ui.close2')}</Button></div>
        </div>
      </Modal>
    </div>
  )
}

function Stat({ label, value, small }: { label: string; value: string | number; small?: boolean }) {
  return (
    <Card>
      <CardContent className="py-3">
        <p className="text-xs text-slate-500">{label}</p>
        <p className={small ? 'truncate text-sm font-semibold text-navy-900' : 'text-xl font-semibold text-navy-900'}>{value}</p>
      </CardContent>
    </Card>
  )
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className={mono ? 'font-mono text-navy-900' : 'text-navy-900'}>{value}</p>
    </div>
  )
}
