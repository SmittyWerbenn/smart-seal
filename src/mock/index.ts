import { attachContainersToVessels, generateAlerts, generateAuditLog, generateContainersAndRelated, generateDevices, generateGeofences, generateVessels } from './generators'
import { ROUTES, PORTS, WAREHOUSES } from './geo'

export function buildInitialDataset() {
  const rawVessels = generateVessels()
  const { containers, shipments, cargo, timeline } = generateContainersAndRelated(rawVessels, 32)
  const vessels = attachContainersToVessels(rawVessels, containers)
  const devices = generateDevices(containers, 42)
  const alerts = generateAlerts(containers, devices, 24)
  const geofences = generateGeofences()
  const auditLog = generateAuditLog(containers, 40)

  return { containers, shipments, cargo, timeline, devices, vessels, alerts, geofences, auditLog, routes: ROUTES, ports: PORTS, warehouses: WAREHOUSES }
}

export type InitialDataset = ReturnType<typeof buildInitialDataset>
