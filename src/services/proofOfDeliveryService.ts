import { useDataStore } from '@/store/dataStore'
import { delay } from './delay'
import { fail, ok, type ServiceResult } from './common'
import type { ProofOfDelivery } from '@/types'
import { translate } from '@/i18n'

export type PodInput = Omit<ProofOfDelivery, 'id' | 'shipmentId' | 'containerId' | 'driverId' | 'submittedAt'>

/** POD completeness rules. The UI shows these, but the checkpoint service re-checks them. */
export function validatePod(input: PodInput): string | null {
  if (!input.receiverName.trim()) return translate('msg.msg000')
  if (!input.cargoReceived) return translate('msg.msg001')
  if (!input.containerVerified) return translate('msg.msg002')
  if (!input.sealVerified) return translate('msg.msg003')
  if (!input.signature) return translate('msg.msg004')
  return null
}

export const proofOfDeliveryService = {
  async getForShipment(shipmentId: string): Promise<ProofOfDelivery | undefined> {
    return delay(useDataStore.getState().proofOfDeliveries.find((p) => p.shipmentId === shipmentId))
  },
  async validate(input: PodInput): Promise<ServiceResult> {
    const error = validatePod(input)
    return delay(error ? fail(error) : ok())
  },
}
