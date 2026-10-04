import { AlertTriangle, BatteryWarning, CheckCircle2, ShieldAlert, WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BatteryIndicator, SignalIndicator } from '@/components/shared/indicators'
import { cn } from '@/lib/utils'
import type { SealStatus } from '@/services/checkpointService'
import { translate } from '@/i18n'

interface SealVerificationPanelProps {
  status: SealStatus
  verified: boolean
  onVerified?: (verified: boolean) => void
  readOnly?: boolean // status view only (e.g. shipment Seal tab): no verify action
}

/** Smart Seal shows live state; Basic Seal needs a manual physical check. */
export function SealVerificationPanel({ status, verified, onVerified, readOnly }: SealVerificationPanelProps) {
  if (status.kind === 'SMART' && status.device) {
    const d = status.device
    const tone = status.state === 'TAMPER' ? 'critical' : status.state === 'OFFLINE' || status.state === 'LOW_BATTERY' ? 'warning' : 'success'
    return (
      <div className={cn('space-y-3 rounded-lg border p-4', tone === 'critical' && 'border-red-300 bg-red-50', tone === 'warning' && 'border-amber-300 bg-amber-50', tone === 'success' && 'border-green-200 bg-green-50/50')}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">{translate('ui.smartSealVerification')}</p>
            <p className="font-mono text-sm font-semibold text-navy-900">{d.id}</p>
          </div>
          <span className="text-sm font-semibold">
            {status.state === 'SECURE' && <span className="text-success-600">{translate('ui.secure')}</span>}
            {status.state === 'LOW_BATTERY' && <span className="text-amber-700">{translate('ui.lowBattery')}</span>}
            {status.state === 'OFFLINE' && <span className="text-slate-600">{translate('ui.offline2')}</span>}
            {status.state === 'TAMPER' && <span className="text-critical-600">{translate('ui.tamper')}</span>}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-sm text-navy-800">
          <span className="flex items-center gap-1.5">{translate('ui.battery')} <BatteryIndicator value={d.battery} /></span>
          <span className="flex items-center gap-1.5">{translate('ui.signal')} <SignalIndicator value={d.signal} /></span>
          <span>Tamper: {d.status === 'TAMPER' ? 'Detected' : 'No tamper detected'}</span>
        </div>

        {status.state === 'TAMPER' && (
          <div className="flex gap-2 rounded-md bg-red-100 p-3 text-sm text-red-800">
            <ShieldAlert size={18} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">{translate('ui.tamperDetected')}</p>
              <p>{translate('ui.driverCannotCompleteThisCheckpoint')}</p>
            </div>
          </div>
        )}
        {status.state === 'OFFLINE' && (
          <div className="flex gap-2 rounded-md bg-slate-100 p-3 text-sm text-slate-700">
            <WifiOff size={18} className="mt-0.5 shrink-0" />
            <p>{translate('ui.deviceOfflineLastKnownLocation')}</p>
          </div>
        )}
        {status.state === 'LOW_BATTERY' && (
          <div className="flex gap-2 rounded-md bg-amber-100 p-3 text-sm text-amber-900">
            <BatteryWarning size={18} className="mt-0.5 shrink-0" />
            <p>Low Battery ({d.battery}%). Please report to Control Tower.</p>
          </div>
        )}

        {verified ? (
          <p className="flex items-center gap-1.5 text-sm font-medium text-success-600"><CheckCircle2 size={16} /> {translate('ui.sealVerified')}</p>
        ) : readOnly ? null : (
          <Button
            type="button"
            className="min-h-11 w-full"
            variant={status.state === 'TAMPER' || status.state === 'OFFLINE' ? 'secondary' : 'primary'}
            disabled={status.state === 'TAMPER' || status.state === 'OFFLINE'}
            onClick={() => onVerified?.(true)}
          >
            {translate('ui.verifySeal')}
          </Button>
        )}
      </div>
    )
  }

  if (status.kind === 'BASIC') {
    return (
      <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
        <p className="text-xs uppercase tracking-wide text-slate-500">{translate('ui.basicSealVerification')}</p>
        <p className="font-mono text-sm font-semibold text-navy-900">{status.sealId}</p>
        <p className="flex gap-2 text-sm text-amber-800"><AlertTriangle size={16} className="mt-0.5 shrink-0" /> {translate('ui.statusManualVerificationRequired')}</p>
        <label className="flex min-h-11 items-center gap-3 rounded-md bg-slate-50 px-3 text-sm text-navy-800">
          <input type="checkbox" className="h-5 w-5 accent-brand-600" checked={verified} disabled={readOnly} onChange={(e) => onVerified?.(e.target.checked)} />
          {translate('ui.iHaveMatchedThePhysical')}
        </label>
      </div>
    )
  }

  return <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-900">{status.message}</p>
}
