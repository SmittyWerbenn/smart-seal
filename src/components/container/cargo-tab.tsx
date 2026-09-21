import { useState, type ReactNode } from 'react'
import { Lock, Package, Pencil, Plus, ShieldCheck, Trash2, WifiOff } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/authStore'
import { useDataStore } from '@/store/dataStore'
import { EmptyState } from '@/components/shared/states'
import { CargoFormModal } from './cargo-form-modal'
import type { CargoLine, Container } from '@/types'

export function CargoTab({ cargo, container }: { cargo: CargoLine[]; container: Container }) {
  const currentUser = useAuthStore((s) => s.currentUser)
  const removeCargoLine = useDataStore((s) => s.removeCargoLine)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<CargoLine | undefined>(undefined)

  const isClient = currentUser?.role === 'CLIENT'
  const canManage = currentUser?.role !== 'CLIENT' && currentUser?.role !== 'AUDITOR'

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={() => {
              setEditing(undefined)
              setFormOpen(true)
            }}
          >
            <Plus size={14} /> Add Cargo Item
          </Button>
        </div>
      )}

      {cargo.length === 0 ? (
        <EmptyState icon={Package} title="No cargo recorded" description="Cargo lines will appear here once stuffing is completed, or add one manually above." />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {cargo.map((line) => {
            const owned = !isClient || line.clientId === currentUser?.clientId
            return (
              <Card key={line.id}>
                <CardHeader>
                  <div>
                    <CardTitle>{owned ? line.clientName : 'Consolidated Cargo'}</CardTitle>
                    {owned && <p className="mt-0.5 text-sm font-medium text-navy-800">{line.productName}</p>}
                  </div>
                  {!owned ? (
                    <Lock size={14} className="text-slate-400" />
                  ) : (
                    canManage && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            setEditing(line)
                            setFormOpen(true)
                          }}
                          className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-navy-700"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => removeCargoLine(line.id)}
                          className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-critical-500"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )
                  )}
                </CardHeader>
                <CardContent className="space-y-1.5 text-sm">
                  {owned ? (
                    <>
                      <Row label="Category" value={<Badge variant="brand">{line.category}</Badge>} />
                      <Row label="DO Number" value={line.doNumber} />
                      <Row label="SKU" value={line.sku} />
                      <Row label="Quantity" value={`${line.quantity.toLocaleString()} ${line.unit}`} />
                      <Row label="Delivery Address" value={line.address} />
                      <Row
                        label="Tagged Seal"
                        value={
                          line.sealId ? (
                            <span className="inline-flex items-center gap-1 text-brand-700">
                              <ShieldCheck size={12} /> {line.sealId}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-slate-400">
                              <WifiOff size={12} /> Not sealed
                            </span>
                          )
                        }
                      />
                    </>
                  ) : (
                    <p className="rounded-md bg-slate-50 p-3 text-xs text-slate-500">
                      This cargo belongs to another client. Product, DO number, SKU, quantity and address are hidden per tenant data-isolation policy.
                    </p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {canManage && (
        <CargoFormModal
          open={formOpen}
          onClose={() => setFormOpen(false)}
          container={container}
          existing={editing}
        />
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-medium text-navy-800">{value}</span>
    </div>
  )
}
