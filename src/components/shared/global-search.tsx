import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Tags, ShieldCheck, Sailboat } from 'lucide-react'
import { useDataStore } from '@/store/dataStore'
import { sealIdFor } from '@/lib/utils'

interface SearchResult {
  id: string
  type: 'Seal' | 'Device' | 'Vessel'
  primary: string
  secondary: string
  path: string
}

const MAX_RESULTS = 8

export function GlobalSearch() {
  const containers = useDataStore((s) => s.containers)
  const devices = useDataStore((s) => s.devices)
  const vessels = useDataStore((s) => s.vessels)
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const results = useMemo<SearchResult[]>(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    const out: SearchResult[] = []

    for (const c of containers) {
      const seal = sealIdFor(c)
      if (`${seal ?? ''} ${c.number}`.toLowerCase().includes(q)) {
        out.push({ id: c.id, type: 'Seal', primary: seal ?? 'Not sealed', secondary: c.number, path: `/containers/${c.id}` })
      }
      if (out.length >= MAX_RESULTS) return out
    }
    for (const d of devices) {
      if (`${d.id} ${d.barcode}`.toLowerCase().includes(q)) {
        const container = containers.find((c) => c.id === d.containerId)
        out.push({ id: d.id, type: 'Device', primary: d.id, secondary: container ? `Attached to ${container.number}` : 'Not attached', path: `/eseals/${d.id}` })
      }
      if (out.length >= MAX_RESULTS) return out
    }
    for (const v of vessels) {
      if (`${v.name} ${v.imo} ${v.voyageNumber}`.toLowerCase().includes(q)) {
        out.push({ id: v.id, type: 'Vessel', primary: v.name, secondary: v.voyageNumber, path: `/vessels/${v.id}` })
      }
      if (out.length >= MAX_RESULTS) return out
    }
    return out
  }, [query, containers, devices, vessels])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const goTo = (result: SearchResult) => {
    navigate(result.path)
    setQuery('')
    setOpen(false)
  }

  const icon = (type: SearchResult['type']) =>
    type === 'Seal' ? <Tags size={14} className="text-brand-600" /> : type === 'Device' ? <ShieldCheck size={14} className="text-brand-600" /> : <Sailboat size={14} className="text-brand-600" />

  return (
    <div ref={rootRef} className="relative hidden items-center md:flex">
      <Search size={14} className="pointer-events-none absolute left-2.5 text-slate-400" />
      <input
        placeholder="Search seal, container, device, vessel…"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        className="h-9 w-64 rounded-md border border-slate-200 bg-slate-50 pl-8 pr-3 text-sm placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none"
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setOpen(false)
            return
          }
          if (e.key !== 'Enter') return
          const value = query.trim()
          if (!value) return
          if (results.length > 0) {
            goTo(results[0])
          } else {
            navigate(`/containers?q=${encodeURIComponent(value)}`)
            setQuery('')
            setOpen(false)
          }
        }}
      />

      {open && query.trim() && (
        <div className="absolute left-0 top-10 z-50 w-80 rounded-lg border border-slate-200 bg-white p-1.5 shadow-lg">
          {results.length === 0 ? (
            <p className="px-2 py-3 text-center text-xs text-slate-400">No matches — press Enter to search Seal Monitoring.</p>
          ) : (
            results.map((r) => (
              <button
                key={`${r.type}-${r.id}`}
                onClick={() => goTo(r)}
                className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left hover:bg-slate-50"
              >
                {icon(r.type)}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-navy-900">{r.primary}</span>
                  <span className="block truncate text-xs text-slate-500">{r.secondary}</span>
                </span>
                <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-500">{r.type}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
