import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { EmptyState } from './states'

export interface Column<T> {
  header: string
  key: string
  render: (row: T) => ReactNode
  className?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string
  onRowClick?: (row: T) => void
  emptyTitle?: string
  emptyDescription?: string
}

export function DataTable<T>({ columns, rows, rowKey, onRowClick, emptyTitle, emptyDescription }: DataTableProps<T>) {
  if (rows.length === 0) return <EmptyState title={emptyTitle ?? 'No records'} description={emptyDescription} />
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            {columns.map((col) => (
              <th key={col.key} className={cn('whitespace-nowrap px-3 py-2.5', col.className)}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              onClick={() => onRowClick?.(row)}
              className={cn('border-b border-slate-100 last:border-0', onRowClick && 'cursor-pointer hover:bg-slate-50')}
            >
              {columns.map((col) => (
                <td key={col.key} className={cn('whitespace-nowrap px-3 py-2.5 text-navy-800', col.className)}>
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
