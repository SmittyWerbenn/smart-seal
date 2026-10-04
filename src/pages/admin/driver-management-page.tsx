import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, KeyRound, Pencil, Plus, Ban, Link2, UserCheck, Users } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { KpiCard } from '@/components/shared/kpi-card'
import { DataTable, type Column } from '@/components/shared/data-table'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input, Select } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { DriverStatusBadge } from '@/components/driver/driver-status-badge'
import { useDataStore } from '@/store/dataStore'
import { usePermission } from '@/lib/use-permission'
import { driverSnapshot } from '@/lib/driver-view'
import { driverService } from '@/services/driverService'
import { DriverFormModal } from './driver-form-modal'
import { AssignShipmentModal } from './assign-shipment-modal'
import type { Driver, DriverStatus } from '@/types'
import { formatDateTime } from '@/lib/utils'
import { translate } from '@/i18n'

export default function DriverManagementPage() {
  const navigate = useNavigate()
  const drivers = useDataStore((s) => s.drivers)
  const vehicles = useDataStore((s) => s.vehicles)
  const assignments = useDataStore((s) => s.driverAssignments)
  const checkpoints = useDataStore((s) => s.driverCheckpoints)
  const shipments = useDataStore((s) => s.shipments)
  const canManage = usePermission('driver.manage')
  const canAssign = usePermission('driver.assign')
  const canSuspend = usePermission('driver.suspend')
  const canCredentials = usePermission('driver.credentials')

  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<'ALL' | DriverStatus>('ALL')
  const [vehicleFilter, setVehicleFilter] = useState('ALL')
  const [assignmentFilter, setAssignmentFilter] = useState<'ALL' | 'ASSIGNED' | 'UNASSIGNED'>('ALL')
  const [locationFilter, setLocationFilter] = useState('ALL')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Driver | undefined>()
  const [assignOpen, setAssignOpen] = useState(false)
  const [assignDriver, setAssignDriver] = useState<string | undefined>()
  const [newPassword, setNewPassword] = useState<{ driverId: string; password: string } | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const rows = useMemo(
    () => drivers.map((d) => ({ driver: d, snap: driverSnapshot(d, assignments, checkpoints, shipments) })),
    [drivers, assignments, checkpoints, shipments],
  )

  const counts = useMemo(
    () => ({
      total: drivers.length,
      active: drivers.filter((d) => d.status !== 'SUSPENDED').length,
      available: drivers.filter((d) => d.status === 'AVAILABLE').length,
      onDelivery: drivers.filter((d) => d.status === 'ON_DELIVERY').length,
      inactive: drivers.filter((d) => d.status === 'SUSPENDED').length,
    }),
    [drivers],
  )

  const locations = useMemo(() => Array.from(new Set(rows.map((r) => r.snap.locationName).filter((l) => l !== '—'))).sort(), [rows])

  const filtered = rows.filter(({ driver, snap }) => {
    const q = query.trim().toLowerCase()
    if (q) {
      const vehicle = vehicles.find((v) => v.id === driver.vehicleId)
      const hay = `${driver.name} ${driver.driverId} ${driver.phone} ${vehicle?.plate ?? ''}`.toLowerCase()
      if (!hay.includes(q)) return false
    }
    if (status !== 'ALL' && driver.status !== status) return false
    if (vehicleFilter !== 'ALL' && driver.vehicleId !== vehicleFilter) return false
    if (assignmentFilter === 'ASSIGNED' && !snap.currentAssignment) return false
    if (assignmentFilter === 'UNASSIGNED' && snap.currentAssignment) return false
    if (locationFilter !== 'ALL' && snap.locationName !== locationFilter) return false
    return true
  })

  const toggleSuspend = async (driver: Driver) => {
    setActionError(null)
    const next: DriverStatus = driver.status === 'SUSPENDED' ? 'AVAILABLE' : 'SUSPENDED'
    const result = await driverService.setStatus(driver.id, next)
    if (!result.ok) setActionError(result.error ?? 'Gagal mengubah status.')
  }

  const resetPassword = async (driver: Driver) => {
    setActionError(null)
    const result = await driverService.resetPassword(driver.id)
    if (!result.ok || !result.value) {
      setActionError(result.error ?? 'Reset password gagal.')
      return
    }
    setNewPassword({ driverId: driver.driverId, password: result.value })
  }

  const columns: Column<(typeof rows)[number]>[] = [
    { key: 'id', get header() { return translate('ui.driverId2') }, render: ({ driver }) => <span className="font-mono text-xs">{driver.driverId}</span> },
    { key: 'name', get header() { return translate('ui.name') }, render: ({ driver }) => <span className="font-medium text-navy-900">{driver.name}</span> },
    { key: 'phone', get header() { return translate('ui.phone') }, render: ({ driver }) => <span className="text-navy-800">{driver.phone}</span> },
    {
      key: 'vehicle',
      get header() { return translate('ui.vehicle2') },
      render: ({ driver }) => <span className="text-navy-800">{vehicles.find((v) => v.id === driver.vehicleId)?.plate ?? '—'}</span>,
    },
    { key: 'status', get header() { return translate('ui.status') }, render: ({ driver }) => <DriverStatusBadge status={driver.status} /> },
    {
      key: 'current',
      get header() { return translate('ui.currentShipment') },
      render: ({ snap }) => <span className="font-mono text-xs">{snap.currentShipment?.id ?? '—'}</span>,
    },
    {
      key: 'last',
      get header() { return translate('ui.lastCheckpoint') },
      render: ({ snap }) =>
        snap.lastCheckpoint ? (
          <span className="text-xs text-navy-800">
            {snap.lastCheckpoint.type.replace(/_/g, ' ').toLowerCase()}
            <span className="block text-slate-400">{formatDateTime(snap.lastCheckpoint.timestamp)}</span>
          </span>
        ) : (
          <span className="text-slate-400">—</span>
        ),
    },
    {
      key: 'actions',
      get header() { return translate('ui.actions') },
      className: 'text-right',
      render: ({ driver }) => (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <IconAction label={translate('ui.view')} onClick={() => navigate(`/admin/drivers/${driver.id}`)} icon={Eye} />
          {canManage && <IconAction label={translate('ui.edit')} onClick={() => { setEditing(driver); setFormOpen(true) }} icon={Pencil} />}
          {canAssign && driver.status === 'AVAILABLE' && (
            <IconAction label={translate('ui.assignShipment')} onClick={() => { setAssignDriver(driver.id); setAssignOpen(true) }} icon={Link2} />
          )}
          {canSuspend && driver.status !== 'ON_DELIVERY' && (
            <IconAction
              label={driver.status === 'SUSPENDED' ? translate('misc.activate') : translate('misc.suspend')}
              onClick={() => toggleSuspend(driver)}
              icon={driver.status === 'SUSPENDED' ? UserCheck : Ban}
              danger={driver.status !== 'SUSPENDED'}
            />
          )}
          {canCredentials && <IconAction label={translate('ui.resetPassword')} onClick={() => resetPassword(driver)} icon={KeyRound} />}
        </div>
      ),
    },
  ]

  return (
    <div className="pb-10">
      <PageHeader
        title={translate('ui.driverManagement')}
        description={translate('ui.manageDriverAccountsVehiclesAnd')}
        actions={
          canManage && (
            <Button onClick={() => { setEditing(undefined); setFormOpen(true) }}>
              <Plus size={14} /> {translate('ui.addDriver')}
            </Button>
          )
        }
      />

      <div className="grid grid-cols-2 gap-3 px-4 md:grid-cols-5 md:px-6">
        <KpiCard label={translate('ui.totalDrivers')} value={counts.total} icon={Users} tone="brand" />
        <KpiCard label={translate('ui.active')} value={counts.active} icon={UserCheck} tone="success" />
        <KpiCard label={translate('ui.available')} value={counts.available} tone="success" />
        <KpiCard label={translate('ui.onDelivery')} value={counts.onDelivery} tone="brand" />
        <KpiCard label={translate('ui.inactive')} value={counts.inactive} tone="critical" />
      </div>

      <Card className="mx-4 mt-4 md:mx-6">
        <CardContent className="space-y-4 py-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
            <Input placeholder={translate('ui.searchNameIdPhonePlate')} value={query} onChange={(e) => setQuery(e.target.value)} className="md:col-span-2" />
            <Select value={status} onChange={(e) => setStatus(e.target.value as 'ALL' | DriverStatus)}>
              <option value="ALL">{translate('ui.allStatuses2')}</option>
              <option value="AVAILABLE">{translate('ui.available')}</option>
              <option value="ON_DELIVERY">{translate('ui.onDelivery')}</option>
              <option value="OFFLINE">{translate('ui.offline')}</option>
              <option value="SUSPENDED">{translate('ui.suspended')}</option>
            </Select>
            <Select value={vehicleFilter} onChange={(e) => setVehicleFilter(e.target.value)}>
              <option value="ALL">{translate('ui.allVehicles')}</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>{v.plate}</option>
              ))}
            </Select>
            <Select value={assignmentFilter} onChange={(e) => setAssignmentFilter(e.target.value as 'ALL' | 'ASSIGNED' | 'UNASSIGNED')}>
              <option value="ALL">{translate('ui.allAssignments')}</option>
              <option value="ASSIGNED">{translate('ui.onDuty')}</option>
              <option value="UNASSIGNED">{translate('ui.noShipment')}</option>
            </Select>
            <Select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} className="md:col-span-2">
              <option value="ALL">{translate('ui.allLastLocations')}</option>
              {locations.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </Select>
          </div>
          {actionError && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{actionError}</p>}
          <DataTable
            columns={columns}
            rows={filtered}
            rowKey={({ driver }) => driver.id}
            onRowClick={({ driver }) => navigate(`/admin/drivers/${driver.id}`)}
            emptyTitle={translate('ui.noDrivers')}
            emptyDescription={translate('ui.changeTheFiltersOrAdd')}
          />
        </CardContent>
      </Card>

      {formOpen && <DriverFormModal open onClose={() => setFormOpen(false)} driver={editing} />}
      {assignOpen && <AssignShipmentModal open onClose={() => setAssignOpen(false)} presetDriverId={assignDriver} />}

      <Modal open={!!newPassword} onClose={() => setNewPassword(null)} title={translate('ui.newPassword')}>
        <div className="space-y-3 text-sm">
          <p>{translate('ui.newPasswordFor')} <span className="font-mono font-semibold">{newPassword?.driverId}</span>:</p>
          <p className="rounded-md bg-slate-100 p-3 text-center font-mono text-lg tracking-wider">{newPassword?.password}</p>
          <p className="text-xs text-slate-500">{translate('ui.noteItDownNowIn')}</p>
          <div className="flex justify-end">
            <Button onClick={() => setNewPassword(null)}>{translate('ui.close2')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function IconAction({ label, icon: Icon, onClick, danger }: { label: string; icon: typeof Eye; onClick: () => void; danger?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={danger ? 'flex h-8 w-8 items-center justify-center rounded-md text-critical-500 hover:bg-red-50' : 'flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-brand-700'}
    >
      <Icon size={15} />
    </button>
  )
}
