import type { PodFormValue } from './pod-form'

export const EMPTY_POD: PodFormValue = {
  receiverName: '',
  receiverPhone: '',
  notes: '',
  cargoReceived: false,
  containerVerified: false,
  sealVerified: false,
}
