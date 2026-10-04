import { useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/input'
import { useDataStore } from '@/store/dataStore'
import { CITIES, PORTS } from '@/mock/geo'
import type { Container } from '@/types'
import { translate } from '@/i18n'

const ISO_TYPES = ['20GP', '40GP', '40HC', '20RF']
// Suggestions only — origin/destination are free text, not locked to this list.
const CITY_SUGGESTIONS = Array.from(new Set([...CITIES, ...PORTS.map((p) => p.city)]))

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
  const [originCity, setOriginCity] = useState('')
  const [destinationCity, setDestinationCity] = useState('')
  const [shipper, setShipper] = useState('')
  const [consignee, setConsignee] = useState('')

  const numberValid = /^[A-Z]{4}\d{6,7}$/.test(number.trim().toUpperCase())
  const numberTaken = containers.some((c) => c.number.toUpperCase() === number.trim().toUpperCase())
  const canSubmit =
    numberValid && !numberTaken && isoType.trim().length > 0 && originCity.trim().length > 0 && destinationCity.trim().length > 0 && shipper.trim().length > 0 && consignee.trim().length > 0

  const reset = () => {
    setNumber('')
    setIsoType(ISO_TYPES[0])
    setOriginCity('')
    setDestinationCity('')
    setShipper('')
    setConsignee('')
  }

  const handleSubmit = () => {
    if (!canSubmit) return
    const container = addContainer({
      number: number.trim().toUpperCase(),
      isoType: isoType.trim(),
      originCity: originCity.trim(),
      destinationCity: destinationCity.trim(),
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
      title={translate('ui.createNewContainer')}
      footer={
        <>
          <Button
            variant="secondary"
            onClick={() => {
              reset()
              onClose()
            }}
          >
            {translate('ui.cancel2')}
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {translate('ui.createContainer')}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div>
          <Label htmlFor="new-cnt-number">{translate('ui.containerNumber')}</Label>
          <Input
            id="new-cnt-number"
            value={number}
            onChange={(e) => setNumber(e.target.value.toUpperCase())}
            placeholder={translate('ui.eGMscu1234567')}
            className="uppercase"
          />
          {number.trim().length > 0 && !numberValid && (
            <p className="mt-1 text-xs text-critical-500">{translate('ui.format4Letters67')}</p>
          )}
          {numberValid && numberTaken && <p className="mt-1 text-xs text-critical-500">{translate('ui.thisContainerNumberIsAlready')}</p>}
        </div>

        <div>
          <Label htmlFor="new-cnt-iso">{translate('ui.isoType')}</Label>
          <Input id="new-cnt-iso" list="iso-type-suggestions" value={isoType} onChange={(e) => setIsoType(e.target.value)} placeholder={translate('ui.eG20gp')} />
          <datalist id="iso-type-suggestions">
            {ISO_TYPES.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="new-cnt-origin">{translate('ui.originCity')}</Label>
            <Input id="new-cnt-origin" list="city-suggestions" value={originCity} onChange={(e) => setOriginCity(e.target.value)} placeholder={translate('ui.eGJakarta')} />
          </div>
          <div>
            <Label htmlFor="new-cnt-destination">{translate('ui.destinationCity')}</Label>
            <Input
              id="new-cnt-destination"
              list="city-suggestions"
              value={destinationCity}
              onChange={(e) => setDestinationCity(e.target.value)}
              placeholder={translate('ui.eGSurabaya')}
            />
          </div>
          <datalist id="city-suggestions">
            {CITY_SUGGESTIONS.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>

        <div>
          <Label htmlFor="new-cnt-shipper">{translate('ui.shipper')}</Label>
          <Input id="new-cnt-shipper" value={shipper} onChange={(e) => setShipper(e.target.value)} placeholder={translate('ui.eGPtSumberMakmur')} />
        </div>
        <div>
          <Label htmlFor="new-cnt-consignee">{translate('ui.consignee')}</Label>
          <Input id="new-cnt-consignee" value={consignee} onChange={(e) => setConsignee(e.target.value)} placeholder={translate('ui.eGPtMitraDistribusi')} />
        </div>
      </div>
    </Modal>
  )
}
