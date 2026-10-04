import { useState } from 'react'
import { ShieldCheck, WifiOff } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input, Label, Select } from '@/components/ui/input'
import { useDataStore } from '@/store/dataStore'
import { CLIENT_NAMES, clientIdFor } from '@/mock/clients'
import { PRODUCT_CATALOG, categoryIdFor, skuFromProduct } from '@/mock/products'
import type { CargoLine, Container } from '@/types'
import { translate } from '@/i18n'

interface CargoFormModalProps {
  open: boolean
  onClose: () => void
  container: Container
  existing?: CargoLine
}

export function CargoFormModal({ open, onClose, container, existing }: CargoFormModalProps) {
  const categories = useDataStore((s) => s.itemCategories)
  const addCargoLine = useDataStore((s) => s.addCargoLine)
  const updateCargoLine = useDataStore((s) => s.updateCargoLine)

  const [productName, setProductName] = useState(existing?.productName ?? '')
  const [category, setCategory] = useState<string>(existing?.categoryId ?? '')
  const [clientName, setClientName] = useState(existing?.clientName ?? '')
  const [doNumber, setDoNumber] = useState(existing?.doNumber ?? `DO-${Math.floor(Math.random() * 900 + 100)}`)
  const [quantity, setQuantity] = useState(existing?.quantity ?? 100)
  const [unit, setUnit] = useState(existing?.unit ?? 'units')
  const [address, setAddress] = useState(existing?.address ?? `Jl. Gudang Terpadu, ${container.destinationCity}`)

  const taggedSealId = container.securityMode === 'BASIC_SEAL' ? container.regularSealId : container.eSealId

  const reset = () => {
    setProductName('')
    setCategory('')
    setClientName('')
    setDoNumber(`DO-${Math.floor(Math.random() * 900 + 100)}`)
    setQuantity(100)
    setUnit('units')
    setAddress(`Jl. Gudang Terpadu, ${container.destinationCity}`)
  }

  const handleSubmit = () => {
    if (!productName.trim() || !clientName.trim()) return
    const payload = {
      containerId: container.id,
      sealId: taggedSealId,
      clientId: clientIdFor(clientName.trim()),
      clientName: clientName.trim(),
      doNumber,
      productName: productName.trim(),
      categoryId: category || null,
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
            {translate('ui.cancel2')}
          </Button>
          <Button onClick={handleSubmit} disabled={!productName.trim() || !clientName.trim()}>
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
          <Label htmlFor="cargo-product">{translate('ui.productName')}</Label>
          <Input
            id="cargo-product"
            list="product-suggestions"
            value={productName}
            onChange={(e) => {
              setProductName(e.target.value)
              const match = PRODUCT_CATALOG.find((p) => p.product === e.target.value)
              if (match) {
                // Suggest the master category matching the catalog entry; only if it exists and is active.
                const suggested = categories.find((c) => c.id === categoryIdFor(match.category) && c.active)
                if (suggested) setCategory(suggested.id)
                setUnit(match.unit)
              }
            }}
            placeholder={translate('ui.eGIphone15Pro')}
          />
          <datalist id="product-suggestions">
            {PRODUCT_CATALOG.map((p) => (
              <option key={p.product} value={p.product} />
            ))}
          </datalist>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="cargo-category">{translate('ui.category')}</Label>
            <Select id="cargo-category" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">{translate('ui.uncategorized2')}</option>
              {categories
                .filter((c) => c.active || c.id === category)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.active ? '' : ' (inactive)'}
                  </option>
                ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="cargo-client">{translate('ui.client')}</Label>
            <Input id="cargo-client" list="client-suggestions" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder={translate('ui.eGPtSinarNusantara')} />
            <datalist id="client-suggestions">
              {CLIENT_NAMES.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="cargo-do">{translate('ui.doNumber')}</Label>
            <Input id="cargo-do" value={doNumber} onChange={(e) => setDoNumber(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="cargo-qty">{translate('ui.quantity')}</Label>
              <Input id="cargo-qty" type="number" min={1} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
            </div>
            <div>
              <Label htmlFor="cargo-unit">{translate('ui.unit')}</Label>
              <Input id="cargo-unit" value={unit} onChange={(e) => setUnit(e.target.value)} />
            </div>
          </div>
        </div>

        <div>
          <Label htmlFor="cargo-address">{translate('ui.deliveryAddress')}</Label>
          <Input id="cargo-address" value={address} onChange={(e) => setAddress(e.target.value)} />
        </div>
      </div>
    </Modal>
  )
}
