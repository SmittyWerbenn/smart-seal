import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Container as ContainerIcon } from 'lucide-react'
import { useDataStore } from '@/store/dataStore'
import { Button } from '@/components/ui/button'
import { ContainerStatusBadge } from '@/components/shared/status-badge'
import { BatteryIndicator } from '@/components/shared/indicators'
import { EmptyState } from '@/components/shared/states'
import { securityModeLabel } from '@/lib/utils'

export default function FieldHomePage() {
  const containers = useDataStore((s) => s.containers)
  const devices = useDataStore((s) => s.devices)
  const navigate = useNavigate()

  const assigned = useMemo(
    () => containers.filter((c) => ['CREATED', 'STUFFING', 'SEALED', 'IN_TRANSIT_ORIGIN', 'IN_TRANSIT_DESTINATION'].includes(c.status)).slice(0, 6),
    [containers],
  )

  return (
    <div className="p-4">
      <h1 className="text-lg font-semibold text-navy-900">Assigned Containers</h1>
      <p className="mb-4 text-sm text-slate-500">{assigned.length} containers need your attention today</p>

      {assigned.length === 0 ? (
        <EmptyState icon={ContainerIcon} title="No assignments right now" />
      ) : (
        <div className="space-y-3">
          {assigned.map((c) => {
            const device = devices.find((d) => d.id === c.eSealId)
            return (
              <div key={c.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-base font-semibold text-navy-900">{c.number}</span>
                  <ContainerStatusBadge status={c.status} />
                </div>
                <p className="mt-1 text-sm text-slate-500">{c.originCity} → {c.destinationCity}</p>
                <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
                  <span>{securityModeLabel(c.securityMode)}</span>
                  {device && <BatteryIndicator value={device.battery} />}
                </div>
                {!c.isArmed ? (
                  <Button className="mt-3 w-full" onClick={() => navigate(`/field/stuffing/${c.id}`)}>
                    START STUFFING <ArrowRight size={14} />
                  </Button>
                ) : (
                  <Button className="mt-3 w-full" variant="secondary" onClick={() => navigate('/field/tracking')}>
                    View Tracking
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
