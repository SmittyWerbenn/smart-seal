import { useState } from 'react'
import { Download, FileBarChart } from 'lucide-react'
import { useDataStore } from '@/store/dataStore'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, Select } from '@/components/ui/input'
import { downloadCsv, titleCase } from '@/lib/utils'

// Trimmed to the reports that actually matter for a seal-first ops team —
// what devices are out there and their health, how seals are being used, and
// security incidents — rather than every possible export.
const REPORTS = [
  { key: 'device-summary', name: 'Device Summary', description: 'Every Smart Seal device: battery, signal, status, lifecycle and current container.' },
  { key: 'seal-usage', name: 'Seal Usage', description: 'Which containers are sealed, with which seal type, and which seal IDs are attached.' },
  { key: 'tamper-incident', name: 'Tamper Incident', description: 'Tamper alerts raised on smart seal devices, with status.' },
  { key: 'device-return', name: 'Device Return', description: 'Detached Smart Seal devices pending or completed return to warehouse.' },
]

export default function ReportsPage() {
  const { containers, devices, alerts } = useDataStore()
  const [dateFrom, setDateFrom] = useState('')
  const [status, setStatus] = useState('ALL')

  const buildRows = (key: string): Record<string, unknown>[] => {
    switch (key) {
      case 'device-summary':
        return devices.map((d) => ({
          device: d.id,
          status: d.status,
          battery: d.battery,
          signal: d.signal,
          lifecycle: d.lifecycle,
          firmware: d.firmware,
          container: containers.find((c) => c.eSealId === d.id)?.number ?? '',
        }))
      case 'seal-usage':
        return containers.map((c) => ({ container: c.number, securityMode: c.securityMode, eSeal: c.eSealId, boltSeal: c.boltSealId, regularSeal: c.regularSealId }))
      case 'tamper-incident':
        return alerts.filter((a) => a.category === 'TAMPER').map((a) => ({ container: containers.find((c) => c.id === a.containerId)?.number, message: a.message, status: a.status, createdAt: a.createdAt }))
      case 'device-return':
        return devices.filter((d) => d.returnStatus !== 'NOT_APPLICABLE').map((d) => ({ device: d.id, returnStatus: d.returnStatus, daysIdle: d.daysIdle }))
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
      <div className="grid grid-cols-1 gap-3 px-4 md:grid-cols-2 md:px-6">
        {REPORTS.map((r) => (
          <Card key={r.key}>
            <CardContent className="flex items-start justify-between gap-3 py-4">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand-600">
                  <FileBarChart size={16} />
                </span>
                <div>
                  <p className="text-sm font-medium text-navy-900">{r.name}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{r.description}</p>
                  <p className="mt-1 text-[11px] font-medium text-slate-400">{buildRows(r.key).length} records</p>
                </div>
              </div>
              <Button size="sm" variant="secondary" className="shrink-0" onClick={() => downloadCsv(`${r.key}.csv`, buildRows(r.key))}>
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
