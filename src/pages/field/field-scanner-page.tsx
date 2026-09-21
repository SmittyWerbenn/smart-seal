import { useNavigate } from 'react-router-dom'
import { SealScanFlow } from '@/components/shared/seal-scan-flow'

export default function FieldScannerPage() {
  const navigate = useNavigate()

  return (
    <div className="p-4">
      <h1 className="mb-1 text-lg font-semibold text-navy-900">Scanner</h1>
      <p className="mb-4 text-sm text-slate-500">
        Scan a Smart Seal for live tracking, or a Basic Seal to verify its contents on-site.
      </p>
      <SealScanFlow onViewLiveTracking={(id) => navigate(`/field/tracking?container=${id}`)} />
    </div>
  )
}
