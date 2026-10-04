import { useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useDataStore } from '@/store/dataStore'
import { useAuthStore } from '@/store/authStore'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable, type Column } from '@/components/shared/data-table'
import { CategoryBadge } from '@/components/shared/category-badge'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { readableTextColor } from '@/lib/utils'
import { FALLBACK_CATEGORY_COLORS } from '@/mock/products'
import type { ItemCategory } from '@/types'
import { translate } from '@/i18n'

export default function ItemCategoriesPage() {
  const categories = useDataStore((s) => s.itemCategories)
  const cargo = useDataStore((s) => s.cargo)
  const addItemCategory = useDataStore((s) => s.addItemCategory)
  const updateItemCategory = useDataStore((s) => s.updateItemCategory)
  const removeItemCategory = useDataStore((s) => s.removeItemCategory)
  const role = useAuthStore((s) => s.currentUser?.role)
  // Add/edit: every role that can see the menu (nav-config.ts). Delete: admin-level only.
  const canManage = role === 'SUPER_ADMIN' || role === 'CONTROL_TOWER' || role === 'WAREHOUSE' || role === 'SUPERVISOR'
  const canDelete = role === 'SUPER_ADMIN' || role === 'SUPERVISOR'

  const [editing, setEditing] = useState<ItemCategory | 'new' | null>(null)
  const [name, setName] = useState('')
  const [color, setColor] = useState('#2563eb')
  const [active, setActive] = useState(true)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState<ItemCategory | null>(null)
  const [deleteError, setDeleteError] = useState('')

  const usage = (id: string) => cargo.filter((c) => c.categoryId === id).length

  const openForm = (target: ItemCategory | 'new') => {
    setEditing(target)
    setError('')
    if (target === 'new') {
      setName('')
      setColor(FALLBACK_CATEGORY_COLORS[categories.length % FALLBACK_CATEGORY_COLORS.length])
      setActive(true)
    } else {
      setName(target.name)
      setColor(target.color)
      setActive(target.active)
    }
  }

  const save = () => {
    const res = editing === 'new' ? addItemCategory({ name, color, active }) : editing ? updateItemCategory(editing.id, { name, color, active }) : { ok: false }
    if (!res.ok) {
      setError(res.error ?? 'Unable to save.')
      return
    }
    setEditing(null)
  }

  const columns: Column<ItemCategory>[] = [
    { key: 'name', get header() { return translate('ui.category') }, render: (c) => <CategoryBadge categoryId={c.id} /> },
    {
      key: 'color',
      get header() { return translate('ui.color') },
      render: (c) => (
        <span className="inline-flex items-center gap-2 text-xs text-slate-600">
          <span className="h-4 w-4 rounded border border-slate-200" style={{ backgroundColor: c.color }} />
          {c.color.toUpperCase()}
        </span>
      ),
    },
    { key: 'status', get header() { return translate('ui.status') }, render: (c) => <Badge variant={c.active ? 'success' : 'offline'}>{c.active ? 'Active' : 'Inactive'}</Badge> },
    { key: 'used', get header() { return translate('ui.items') }, render: (c) => usage(c.id).toLocaleString() },
    ...(canManage
      ? [
          {
            key: 'actions',
            header: '',
            className: 'w-24',
            render: (c: ItemCategory) => (
              <div className="flex gap-1">
                <button onClick={() => openForm(c)} aria-label={`Edit ${c.name}`} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-navy-700">
                  <Pencil size={14} />
                </button>
                {canDelete && (
                <button
                  onClick={() => {
                    setDeleteError('')
                    setDeleting(c)
                  }}
                  aria-label={`Delete ${c.name}`}
                  className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-critical-500"
                >
                  <Trash2 size={14} />
                </button>
                )}
              </div>
            ),
          } satisfies Column<ItemCategory>,
        ]
      : []),
  ]

  return (
    <div className="pb-10">
      <PageHeader
        title={translate('ui.itemCategories')}
        description={translate('ui.categoriesDesc', { n: categories.length })}
        actions={
          canManage && (
            <Button size="sm" onClick={() => openForm('new')}>
              <Plus size={14} /> {translate('ui.addCategory')}
            </Button>
          )
        }
      />
      <Card className="mx-4 mb-4 md:mx-6">
        <DataTable columns={columns} rows={categories} rowKey={(c) => c.id} emptyTitle={translate('ui.noCategories')} emptyDescription={translate('ui.addACategoryToClassify')} />
      </Card>

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? translate('misc.addCategoryTitle') : translate('misc.editCategory')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)}>
              {translate('ui.cancel2')}
            </Button>
            <Button onClick={save} disabled={!name.trim()}>
              {translate('ui.save')}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <Label htmlFor="cat-name">{translate('ui.categoryName')}</Label>
            <Input id="cat-name" value={name} onChange={(e) => setName(e.target.value)} placeholder={translate('ui.eGChemicals')} />
          </div>
          <div>
            <Label htmlFor="cat-color">{translate('ui.color')}</Label>
            <div className="flex items-center gap-2">
              <input
                id="cat-color"
                type="color"
                value={/^#[0-9a-f]{6}$/i.test(color) ? color : '#2563eb'}
                onChange={(e) => setColor(e.target.value)}
                className="h-9 w-12 cursor-pointer rounded-md border border-slate-300 bg-white p-1"
              />
              <Input value={color} onChange={(e) => setColor(e.target.value)} className="w-32 font-mono" maxLength={7} />
              <div className="ml-auto">
                <span
                  className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                  style={{ backgroundColor: color, color: readableTextColor(color) }}
                >
                  {translate('ui.preview')}
                </span>
              </div>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-navy-800">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="h-4 w-4 rounded border-slate-300" />
            {translate('ui.activeSelectableOnNewCargo')}
          </label>
          {error && <p className="text-xs text-critical-500">{error}</p>}
        </div>
      </Modal>

      <Modal
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title={translate('ui.deleteCategory')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleting(null)}>
              {translate('ui.cancel2')}
            </Button>
            <Button
              onClick={() => {
                if (!deleting) return
                const res = removeItemCategory(deleting.id)
                if (res.ok) setDeleting(null)
                else setDeleteError(res.error ?? 'Unable to delete.')
              }}
            >
              {translate('ui.delete')}
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          {translate('ui.deleteCategory2')} <span className="font-medium text-navy-900">{deleting?.name}</span>{translate('ui.questionCannotUndo')}
        </p>
        {deleteError && <p className="mt-2 text-xs text-critical-500">{deleteError}</p>}
      </Modal>
    </div>
  )
}
