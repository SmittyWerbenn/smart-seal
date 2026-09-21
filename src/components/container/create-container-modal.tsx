import { useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input, Label, Select } from '@/components/ui/input'
import { useDataStore } from '@/store/dataStore'
import { DOMESTIC_ROUTES } from '@/mock/geo'
import type { Container } from '@/types'

const ISO_TYPES = ['20GP', '40GP', '40HC', '20RF']

interface CreateContainerModalProps {
  open: boolean
  onClose: () => void
  onCreated: (container: Container) => void
}

export function CreateContainerModal({ open, onClose, onCreated }: CreateContainerModalProps) {
  const addContainer = useDataStore((s) => s.addContainer)
  const containers = useDataStore((s) => s.containers)

  const [number, setNumber] = useState('')
  const [isoType, setIsoType] = useState(ISO_TYPES[0])
  const [routeId, setRouteId] = useState(DOMESTIC_ROUTES[0].id)
  const [shipper, setShipper] = useState('')
  const [consignee, setConsignee] = useState('')

  const numberValid = /^[A-Z]{4}\d{6,7}$/.test(number.trim().toUpperCase())
  const numberTaken = containers.some((c) => c.number.toUpperCase() === number.trim().toUpperCase())
  const canSubmit = numberValid && !numberTaken && shipper.trim().length > 0 && consignee.trim().length > 0

  const reset = () => {
    setNumber('')
    setIsoType(ISO_TYPES[0])
    setRouteId(DOMESTIC_ROUTES[0].id)
    setShipper('')
    setConsignee('')
  }

  const handleSubmit = () => {
    if (!canSubmit) return
    const container = addContainer({
      number: number.trim().toUpperCase(),
      isoType,
      routeId,
      shipper: shipper.trim(),
      consignee: consignee.trim(),
    })
    onCreated(container)
    reset()
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        reset()
        onClose()
      }}
      title="Create New Container"
      footer={
        <>
          <Button
            variant="secondary"
            onClick={() => {
              reset()
              onClose()
            }}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            Create Container
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div>
          <Label htmlFor="new-cnt-number">Container Number</Label>
          <Input
            id="new-cnt-number"
            value={number}
            onChange={(e) => setNumber(e.target.value.toUpperCase())}
            placeholder="e.g. MSCU1234567"
            className="uppercase"
          />
          {number.trim().length > 0 && !numberValid && (
            <p className="mt-1 text-xs text-critical-500">Format: 4 letters + 6–7 digits (e.g. MSCU1234567)</p>
          )}
          {numberValid && numberTaken && <p className="mt-1 text-xs text-critical-500">This container number is already in use.</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="new-cnt-iso">ISO Type</Label>
            <Select id="new-cnt-iso" value={isoType} onChange={(e) => setIsoType(e.target.value)}>
              {ISO_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="new-cnt-route">Route</Label>
            <Select id="new-cnt-route" value={routeId} onChange={(e) => setRouteId(e.target.value)}>
              {DOMESTIC_ROUTES.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="new-cnt-shipper">Shipper</Label>
          <Input id="new-cnt-shipper" value={shipper} onChange={(e) => setShipper(e.target.value)} placeholder="e.g. PT Sumber Makmur Elektronik" />
        </div>
        <div>
          <Label htmlFor="new-cnt-consignee">Consignee</Label>
          <Input id="new-cnt-consignee" value={consignee} onChange={(e) => setConsignee(e.target.value)} placeholder="e.g. PT Mitra Distribusi Nusantara" />
        </div>
      </div>
    </Modal>
  )
}
