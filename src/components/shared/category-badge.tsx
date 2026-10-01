import { useDataStore } from '@/store/dataStore'
import { cn, readableTextColor } from '@/lib/utils'

// Single renderer for item categories. Name and color always come from the
// Master Kategori Barang (dataStore.itemCategories) — never stored on the item.
export function CategoryBadge({ categoryId, className }: { categoryId: string | null | undefined; className?: string }) {
  const category = useDataStore((s) => (categoryId ? s.itemCategories.find((c) => c.id === categoryId) : undefined))
  const base = 'inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium'
  if (!category) {
    return <span className={cn(base, 'border-slate-200 bg-slate-100 text-slate-500', className)}>Uncategorized</span>
  }
  return (
    <span
      className={cn(base, 'border-transparent', !category.active && 'opacity-60', className)}
      style={{ backgroundColor: category.color, color: readableTextColor(category.color) }}
      title={category.active ? category.name : `${category.name} (inactive)`}
    >
      <span className="truncate">{category.name}</span>
    </span>
  )
}
