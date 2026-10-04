import { LocateFixed } from 'lucide-react'
import { translate } from '@/i18n'

/** Shown on the map while Follow is off: puts the tracked container back in the centre of the view. */
export function RecenterButton({ onClick }: { onClick: () => void }) {
  return (
    <div className="leaflet-top leaflet-right" style={{ pointerEvents: 'none' }}>
      <div className="leaflet-control" style={{ pointerEvents: 'auto', marginTop: 10, marginRight: 10 }}>
        <button
          type="button"
          onClick={onClick}
          className="flex h-9 items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-navy-800 shadow-md hover:bg-slate-50"
        >
          <LocateFixed size={14} /> {translate('track.recenter')}
        </button>
      </div>
    </div>
  )
}
