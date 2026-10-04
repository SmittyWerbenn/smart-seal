import { useNavigate } from 'react-router-dom'
import { SealScanFlow } from '@/components/shared/seal-scan-flow'
import { translate } from '@/i18n'

export default function FieldScannerPage() {
  const navigate = useNavigate()

  return (
    <div className="p-4">
      <h1 className="mb-1 text-lg font-semibold text-navy-900">{translate('ui.scanner')}</h1>
      <p className="mb-4 text-sm text-slate-500">
        {translate('ui.scanASmartSealFor')}
      </p>
      <SealScanFlow onViewLiveTracking={(id) => navigate(`/field/tracking?container=${id}`)} />
    </div>
  )
}
