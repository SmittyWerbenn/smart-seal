import { useDataStore } from '@/store/dataStore'
import { useAuthStore } from '@/store/authStore'
import { delay } from './delay'
import { actorName, fail, ok, requirePermission, type ServiceResult } from './common'
import { findDriver } from './driverService'
import { translate } from '@/i18n'

export type ShipmentRemark = 'ON_TIME' | 'DELAYED' | 'ISSUE'

export interface ShipmentUpdateInput {
  assignmentId: string
  remark: ShipmentRemark
  eta?: string // new ETA as ISO string
  note?: string
}

/** Driver-side shipment status: remark, ETA and note. Checkpoints stay in their own service. */
export const shipmentUpdateService = {
  async updateShipment(input: ShipmentUpdateInput): Promise<ServiceResult> {
    const denied = requirePermission('driver.checkpoint')
    if (denied) return delay(denied)
    const store = useDataStore.getState()
    const assignment = store.driverAssignments.find((a) => a.id === input.assignmentId)
    if (!assignment) return delay(fail(translate('misc.updAssignmentNotFound')))
    const user = useAuthStore.getState().currentUser
    if (user?.role === 'DRIVER' && user.driverId !== assignment.driverId) return delay(fail(translate('misc.updNotYours')))
    if (assignment.status !== 'ACTIVE') return delay(fail(translate('misc.updNotActive')))
    const driver = findDriver(assignment.driverId)
    if (!driver) return delay(fail(translate('misc.updDriverNotFound')))
    if (driver.status === 'SUSPENDED') return delay(fail(translate('misc.updSuspended')))
    if (driver.status === 'OFFLINE') return delay(fail(translate('misc.updOffline')))
    if (input.remark === 'ISSUE' && !input.note?.trim()) return delay(fail(translate('misc.updateNoteRequired')))
    if (input.eta && Number.isNaN(new Date(input.eta).getTime())) return delay(fail(translate('misc.updEtaInvalid')))

    const shipment = store.shipments.find((s) => s.id === assignment.shipmentId)
    const container = store.containers.find((c) => c.id === assignment.containerId)
    if (!shipment || !container) return delay(fail(translate('misc.updDataIncomplete')))

    const now = new Date().toISOString()
    const note = input.note?.trim() || undefined
    store.updateShipment(shipment.id, { driverRemark: input.remark, driverNote: note, driverUpdatedAt: now })
    if (input.eta) store.updateContainer(container.id, { eta: new Date(input.eta).toISOString() })

    const labels: Record<ShipmentRemark, string> = { ON_TIME: translate('misc.updLabelOnTime'), DELAYED: translate('misc.updLabelDelayed'), ISSUE: translate('misc.updLabelIssue') }
    store.addTimelineEvent({
      containerId: container.id,
      type: 'DRIVER_SHIPMENT_UPDATE',
      label: `${labels[input.remark]}`,
      description: [input.eta ? translate('misc.updEtaPrefix', { when: new Date(input.eta).toLocaleString('en-GB') }) : null, note].filter(Boolean).join(' · ') || undefined,
      actor: driver.name,
    })
    store.addAuditLogEntry({ user: actorName(driver.name), action: 'SHIPMENT_UPDATED', entity: shipment.id, description: `${shipment.id}: ${labels[input.remark]}${input.eta ? translate('misc.updEtaUpdated') : ''}` })
    if (input.remark !== 'ON_TIME') {
      store.addNotification({
        severity: input.remark === 'ISSUE' ? 'CRITICAL' : 'WARNING',
        title: translate(input.remark === 'ISSUE' ? 'misc.updIssueTitle' : 'misc.updDelayedTitle'),
        message: `${driver.name} · ${shipment.id} · ${container.number}${note ? `: ${note}` : ''}`,
        linkType: 'container',
        linkId: container.id,
      })
    }
    return delay(ok())
  },
}
