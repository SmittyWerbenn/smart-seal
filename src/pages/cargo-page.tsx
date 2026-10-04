import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, Plus } from 'lucide-react'
import { useDataStore } from '@/store/dataStore'
import { useAuthStore } from '@/store/authStore'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable, type Column } from '@/components/shared/data-table'
import { Card } from '@/components/ui/card'
import { Input, Label, Select } from '@/components/ui/input'
import { CategoryBadge } from '@/components/shared/category-badge'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { CargoFormModal } from '@/components/container/cargo-form-modal'
import type { CargoLine } from '@/types'
import { translate } from '@/i18n'

export default function CargoPage() {
  const cargo = useDataStore((s) => s.cargo)
  const containers = useDataStore((s) => s.containers)
  const currentUser = useAuthStore((s) => s.currentUser)
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('ALL')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickedContainerId, setPickedContainerId] = useState('')
  const [formContainerId, setFormContainerId] = useState<string | null>(null)

  const isClient = currentUser?.role === 'CLIENT'
  const canManage = currentUser?.role !== 'CLIENT' && currentUser?.role !== 'AUDITOR'
  const formContainer = containers.find((c) => c.id === formContainerId)
  const categories = useDataStore((s) => s.itemCategories)

  const masked = useMemo(
    () =>
      cargo.map((c) => ({
        ...c,
        owned: !isClient || c.clientId === currentUser?.clientId,
      })),
    [cargo, isClient, currentUser],
  )

  const filtered = masked.filter((c) => {
    if (category === 'NONE' ? c.categoryId !== null : category !== 'ALL' && c.categoryId !== category) return false
    const container = containers.find((x) => x.id === c.containerId)
    return `${container?.number ?? ''} ${c.owned ? c.clientName : ''} ${c.owned ? c.doNumber : ''} ${c.owned ? c.productName : ''}`
      .toLowerCase()
      .includes(query.toLowerCase())
  })

  const columns: Column<CargoLine & { owned: boolean }>[] = [
    { key: 'container', get header() { return translate('ui.container') }, render: (c) => containers.find((x) => x.id === c.containerId)?.number ?? c.containerId },
    { key: 'product', get header() { return translate('ui.product') }, render: (c) => (c.owned ? <span className="font-medium text-navy-900">{c.productName}</span> : '—') },
    { key: 'category', get header() { return translate('ui.category') }, render: (c) => <CategoryBadge categoryId={c.categoryId} /> },
    {
      key: 'client',
      get header() { return translate('ui.client') },
      render: (c) => (c.owned ? c.clientName : <span className="flex items-center gap-1.5 text-slate-400"><Lock size={12} /> {translate('ui.consolidatedCargo')}</span>),
    },
    { key: 'do', get header() { return translate('ui.doNumber') }, render: (c) => (c.owned ? c.doNumber : '—') },
    { key: 'sku', get header() { return translate('ui.sku') }, render: (c) => (c.owned ? c.sku : '—') },
    { key: 'qty', get header() { return translate('ui.quantity') }, render: (c) => (c.owned ? `${c.quantity.toLocaleString()} ${c.unit}` : '—') },
    { key: 'seal', get header() { return translate('ui.taggedSeal') }, render: (c) => c.sealId ?? <span className="text-slate-400">{translate('ui.notSealed2')}</span> },
  ]

  return (
    <div className="pb-10">
      <PageHeader
        title={translate('ui.cargoDeliveryOrders')}
        description={translate('ui.cargoLinesCount', { n: filtered.length })}
        actions={
          canManage && (
            <Button
              size="sm"
              onClick={() => {
                setPickedContainerId(containers[0]?.id ?? '')
                setPickerOpen(true)
              }}
            >
              <Plus size={14} /> {translate('ui.addCargo')}
            </Button>
          )
        }
      />
      <Card className="mx-4 mb-4 md:mx-6">
        <div className="flex flex-wrap gap-2 border-b border-slate-100 p-3">
          <Input placeholder={translate('ui.searchContainerProductClientDo')} value={query} onChange={(e) => setQuery(e.target.value)} className="w-72" />
          <Select value={category} onChange={(e) => setCategory(e.target.value)} className="w-52">
            <option value="ALL">{translate('ui.allCategories')}</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
            <option value="NONE">{translate('ui.uncategorized')}</option>
          </Select>
        </div>
        <DataTable columns={columns} rows={filtered} rowKey={(c) => c.id} onRowClick={(c) => navigate(`/containers/${c.containerId}`)} emptyTitle={translate('ui.noCargoRecords')} />
      </Card>

      <Modal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title={translate('ui.addCargoSelectContainer')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setPickerOpen(false)}>
              {translate('ui.cancel2')}
            </Button>
            <Button
              disabled={!pickedContainerId}
              onClick={() => {
                setPickerOpen(false)
                setFormContainerId(pickedContainerId)
              }}
            >
              {translate('ui.next2')}
            </Button>
          </>
        }
      >
        {containers.length === 0 ? (
          <p className="text-sm text-slate-500">{translate('ui.noContainersExistYetCreate')}</p>
        ) : (
          <div>
            <Label htmlFor="cargo-picker-container">{translate('ui.container')}</Label>
            <Select id="cargo-picker-container" value={pickedContainerId} onChange={(e) => setPickedContainerId(e.target.value)}>
              {containers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.number} — {c.originCity} → {c.destinationCity}
                </option>
              ))}
            </Select>
          </div>
        )}
      </Modal>

      {formContainer && (
        <CargoFormModal open={!!formContainerId} onClose={() => setFormContainerId(null)} container={formContainer} />
      )}
    </div>
  )
}
