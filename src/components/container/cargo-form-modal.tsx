import { useState } from 'react'
import { ShieldCheck, WifiOff } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input, Label, Select } from '@/components/ui/input'
import { useDataStore } from '@/store/dataStore'
import { CLIENTS } from '@/mock/clients'
import { PRODUCT_CATALOG, PRODUCT_CATEGORIES, skuFromProduct } from '@/mock/products'
import type { CargoLine, Container } from '@/types'

interface CargoFormModalProps {
  open: boolean
  onClose: () => void
  container: Container
  existing?: CargoLine
}

export function CargoFormModal({ open, onClose, container, existing }: CargoFormModalProps) {
  const addCargoLine = useDataStore((s) => s.addCargoLine)
  const updateCargoLine = useDataStore((s) => s.updateCargoLine)

  const [productName, setProductName] = useState(existing?.productName ?? '')
  const [category, setCategory] = useState(existing?.category ?? PRODUCT_CATEGORIES[0])
  const [clientId, setClientId] = useState(existing?.clientId ?? CLIENTS[0].id)
  const [doNumber, setDoNumber] = useState(existing?.doNumber ?? `DO-${Math.floor(Math.random() * 900 + 100)}`)
  const [quantity, setQuantity] = useState(existing?.quantity ?? 100)
  const [unit, setUnit] = useState(existing?.unit ?? 'units')
  const [address, setAddress] = useState(existing?.address ?? `Jl. Gudang Terpadu, ${container.destinationCity}`)

  const taggedSealId = container.securityMode === 'BASIC_SEAL' ? container.regularSealId : container.eSealId

  const reset = () => {
    setProductName('')
    setCategory(PRODUCT_CATEGORIES[0])
    setClientId(CLIENTS[0].id)
    setDoNumber(`DO-${Math.floor(Math.random() * 900 + 100)}`)
    setQuantity(100)
    setUnit('units')
    setAddress(`Jl. Gudang Terpadu, ${container.destinationCity}`)
  }

  const handleSubmit = () => {
    if (!productName.trim()) return
    const client = CLIENTS.find((c) => c.id === clientId)!
    const payload = {
      containerId: container.id,
      sealId: taggedSealId,
      clientId,
      clientName: client.name,
      doNumber,
      productName: productName.trim(),
      category,
      sku: skuFromProduct(productName.trim(), Math.floor(Math.random() * 90 + 10)),
      quantity,
      unit,
      address,
    }
    if (existing) {
      updateCargoLine(existing.id, payload)
    } else {
      addCargoLine(payload)
    }
    onClose()
    if (!existing) reset()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={existing ? 'Edit Cargo Item' : 'Add Cargo Item'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!productName.trim()}>
            {existing ? 'Save Changes' : 'Add Cargo'}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="flex items-center gap-2 rounded-md bg-slate-50 p-2.5 text-xs text-slate-600">
          {taggedSealId ? <ShieldCheck size={14} className="text-brand-600" /> : <WifiOff size={14} className="text-slate-400" />}
          Tagged to seal: <span className="font-medium text-navy-800">{taggedSealId ?? 'Not sealed yet'}</span>
        </div>

        <div>
          <Label htmlFor="cargo-product">Product Name</Label>
          <Input
            id="cargo-product"
            list="product-suggestions"
            value={productName}
            onChange={(e) => {
              setProductName(e.target.value)
              const match = PRODUCT_CATALOG.find((p) => p.product === e.target.value)
              if (match) {
                setCategory(match.category)
                setUnit(match.unit)
              }
            }}
            placeholder="e.g. iPhone 15 Pro"
          />
          <datalist id="product-suggestions">
            {PRODUCT_CATALOG.map((p) => (
              <option key={p.product} value={p.product} />
            ))}
          </datalist>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="cargo-category">Category</Label>
            <Input id="cargo-category" list="category-suggestions" value={category} onChange={(e) => setCategory(e.target.value)} />
            <datalist id="category-suggestions">
              {PRODUCT_CATEGORIES.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
          <div>
            <Label htmlFor="cargo-client">Client</Label>
            <Select id="cargo-client" value={clientId} onChange={(e) => setClientId(e.target.value)}>
              {CLIENTS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="cargo-do">DO Number</Label>
            <Input id="cargo-do" value={doNumber} onChange={(e) => setDoNumber(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="cargo-qty">Quantity</Label>
              <Input id="cargo-qty" type="number" min={1} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
            </div>
            <div>
              <Label htmlFor="cargo-unit">Unit</Label>
              <Input id="cargo-unit" value={unit} onChange={(e) => setUnit(e.target.value)} />
            </div>
          </div>
        </div>

        <div>
          <Label htmlFor="cargo-address">Delivery Address</Label>
          <Input id="cargo-address" value={address} onChange={(e) => setAddress(e.target.value)} />
        </div>
      </div>
    </Modal>
  )
}
