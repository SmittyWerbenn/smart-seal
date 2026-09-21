import { useState } from 'react'
import { Download, FileBarChart } from 'lucide-react'
import { useDataStore } from '@/store/dataStore'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, Select } from '@/components/ui/input'
import { downloadCsv, titleCase } from '@/lib/utils'

const REPORTS = [
  { key: 'container-movement', name: 'Container Movement' },
  { key: 'tamper-incident', name: 'Tamper Incident' },
  { key: 'device-utilization', name: 'Device Utilization' },
  { key: 'device-return', name: 'Device Return' },
  { key: 'shipment-status', name: 'Shipment Status' },
  { key: 'seal-usage', name: 'Seal Usage' },
  { key: 'geofence-events', name: 'Geofence Events' },
  { key: 'ais-tracking', name: 'AIS Tracking' },
]

export default function ReportsPage() {
  const { containers, devices, shipments, alerts, timeline, vessels } = useDataStore()
  const [dateFrom, setDateFrom] = useState('')
  const [status, setStatus] = useState('ALL')

  const buildRows = (key: string): Record<string, unknown>[] => {
    switch (key) {
      case 'container-movement':
        return timeline.map((e) => ({ container: containers.find((c) => c.id === e.containerId)?.number, event: e.type, actor: e.actor, timestamp: e.timestamp }))
      case 'tamper-incident':
        return alerts.filter((a) => a.category === 'TAMPER').map((a) => ({ container: containers.find((c) => c.id === a.containerId)?.number, message: a.message, status: a.status, createdAt: a.createdAt }))
      case 'device-utilization':
        return devices.map((d) => ({ device: d.id, lifecycle: d.lifecycle, battery: d.battery, signal: d.signal, container: containers.find((c) => c.eSealId === d.id)?.number ?? '' }))
      case 'device-return':
        return devices.filter((d) => d.returnStatus !== 'NOT_APPLICABLE').map((d) => ({ device: d.id, returnStatus: d.returnStatus, daysIdle: d.daysIdle }))
      case 'shipment-status':
        return shipments.map((s) => ({ booking: s.bookingNumber, shipper: s.shipper, consignee: s.consignee, status: s.status }))
      case 'seal-usage':
        return containers.map((c) => ({ container: c.number, securityMode: c.securityMode, eSeal: c.eSealId, boltSeal: c.boltSealId }))
      case 'geofence-events':
        return timeline.filter((e) => e.type.includes('GEOFENCE') || e.type.includes('GATE')).map((e) => ({ container: containers.find((c) => c.id === e.containerId)?.number, event: e.type, timestamp: e.timestamp }))
      case 'ais-tracking':
        return vessels.map((v) => ({ vessel: v.name, imo: v.imo, speed: v.speedKn, heading: v.heading, lastUpdate: v.lastAisUpdate }))
      default:
        return []
    }
  }

  return (
    <div className="pb-10">
      <PageHeader title="Reports" description="Generate and export operational reports for stakeholders." />
      <Card className="mx-4 mb-4 flex flex-wrap gap-2 p-3 md:mx-6">
        <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-44" />
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-44">
          <option value="ALL">All statuses</option>
          <option value="OPEN">Open</option>
          <option value="RESOLVED">Resolved</option>
        </Select>
      </Card>
      <div className="grid grid-cols-1 gap-3 px-4 md:grid-cols-2 md:px-6 lg:grid-cols-3">
        {REPORTS.map((r) => (
          <Card key={r.key}>
            <CardContent className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-50 text-brand-600">
                  <FileBarChart size={16} />
                </span>
                <div>
                  <p className="text-sm font-medium text-navy-900">{r.name}</p>
                  <p className="text-xs text-slate-500">{buildRows(r.key).length} records</p>
                </div>
              </div>
              <Button size="sm" variant="secondary" onClick={() => downloadCsv(`${r.key}.csv`, buildRows(r.key))}>
                <Download size={14} /> CSV
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="px-4 pt-4 text-xs text-slate-400 md:px-6">{titleCase(status)} filter and date-from {dateFrom || 'any'} apply visually in this prototype; export reflects full dataset.</p>
    </div>
  )
}
