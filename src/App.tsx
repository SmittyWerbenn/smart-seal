import { HashRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useSimulationEngine } from '@/hooks/useSimulationEngine'
import { useUiStore } from '@/store/uiStore'
import { can, type Permission } from '@/lib/permissions'
import { AppShell } from '@/components/shared/app-shell'
import { FieldShell } from '@/pages/field/field-shell'
import { DriverShell } from '@/pages/driver/driver-shell'

import LoginPage from '@/pages/login-page'
import DashboardPage from '@/pages/dashboard-page'
import ContainersListPage from '@/pages/containers-list-page'
import ContainerDetailPage from '@/pages/container-detail-page'
import ShipmentsPage from '@/pages/shipments-page'
import CargoPage from '@/pages/cargo-page'
import ESealsListPage from '@/pages/eseals-list-page'
import ESealDetailPage from '@/pages/eseal-detail-page'
import GenerateBasicSealsPage from '@/pages/generate-basic-seals-page'
import VesselsListPage from '@/pages/vessels-list-page'
import VesselDetailPage from '@/pages/vessel-detail-page'
import AlertsPage from '@/pages/alerts-page'
import GeofencesPage from '@/pages/geofences-page'
import ReverseLogisticsPage from '@/pages/reverse-logistics-page'
import ReportsPage from '@/pages/reports-page'
import AuditLogsPage from '@/pages/audit-logs-page'
import UsersRolesPage from '@/pages/users-roles-page'
import ItemCategoriesPage from '@/pages/item-categories-page'
import SettingsPage from '@/pages/settings-page'
import SimulationPage from '@/pages/simulation-page'
import StuffingWizardPage from '@/pages/stuffing-wizard-page'
import PublicScanPage from '@/pages/public-scan-page'
import NotFoundPage from '@/pages/not-found-page'

import FieldHomePage from '@/pages/field/field-home-page'
import FieldStuffingPage from '@/pages/field/field-stuffing-page'
import FieldTrackingPage from '@/pages/field/field-tracking-page'
import FieldAlertsPage from '@/pages/field/field-alerts-page'
import FieldScannerPage from '@/pages/field/field-scanner-page'

import DriverLoginPage from '@/pages/driver/driver-login-page'
import DriverHomePage from '@/pages/driver/driver-home-page'
import DriverShipmentsPage from '@/pages/driver/driver-shipments-page'
import DriverShipmentDetailPage from '@/pages/driver/driver-shipment-detail-page'
import DriverScanPage from '@/pages/driver/driver-scan-page'
import DriverAlertsPage from '@/pages/driver/driver-alerts-page'
import DriverProfilePage from '@/pages/driver/driver-profile-page'
import DriverManagementPage from '@/pages/admin/driver-management-page'
import DriverDetailPage from '@/pages/admin/driver-detail-page'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const currentUser = useAuthStore((s) => s.currentUser)
  if (!isAuthenticated || !currentUser) return <Navigate to="/login" replace />
  if (currentUser.role === 'DRIVER') return <Navigate to="/driver/dashboard" replace />
  return <>{children}</>
}

// Driver Portal entry and guard. /driver is the driver login; everything below it needs a driver session.
// Staff sessions never reach the Driver Portal, and drivers never reach the main app (AppShell).
function DriverPortalLayout() {
  const { pathname } = useLocation()
  const isDriver = useAuthStore((s) => s.isAuthenticated && s.currentUser?.role === 'DRIVER')
  const atEntry = pathname === '/driver' || pathname === '/driver/'
  if (atEntry) return isDriver ? <Navigate to="/driver/dashboard" replace /> : <Outlet />
  if (!isDriver) return <Navigate to="/driver" replace />
  return <DriverShell />
}

// Route-level permission check (not just a hidden menu item).
function RequirePermission({ permission, children }: { permission: Permission; children: React.ReactNode }) {
  const role = useAuthStore((s) => s.currentUser?.role)
  if (!can(role, permission)) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

function RequireFieldAuth({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  useSimulationEngine()
  // Subscribing at the root re-renders the whole tree on language change, without remounting pages (state is kept).
  useUiStore((s) => s.lang)

  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/scan" element={<PublicScanPage />} />
        <Route path="/scan-barcode" element={<PublicScanPage />} />

        <Route
          element={
            <RequireAuth>
              <AppShell />
            </RequireAuth>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          {/* Control Tower was merged into Seal Monitoring — keep a redirect for old links/bookmarks. */}
          <Route path="/control-tower" element={<Navigate to="/containers" replace />} />
          <Route path="/containers" element={<ContainersListPage />} />
          <Route path="/containers/:id" element={<ContainerDetailPage />} />
          <Route path="/containers/:id/stuffing" element={<StuffingWizardPage />} />
          <Route path="/stuffing" element={<StuffingWizardPage />} />
          <Route path="/shipments" element={<ShipmentsPage />} />
          <Route path="/cargo" element={<CargoPage />} />
          <Route path="/eseals" element={<ESealsListPage />} />
          <Route path="/eseals/generate" element={<GenerateBasicSealsPage />} />
          <Route path="/eseals/:id" element={<ESealDetailPage />} />
          <Route path="/vessels" element={<VesselsListPage />} />
          <Route path="/vessels/:id" element={<VesselDetailPage />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/geofences" element={<GeofencesPage />} />
          <Route path="/reverse-logistics" element={<ReverseLogisticsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/master/item-categories" element={<ItemCategoriesPage />} />
          <Route path="/audit-logs" element={<AuditLogsPage />} />
          <Route path="/users" element={<UsersRolesPage />} />
          <Route path="/simulation" element={<SimulationPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/admin/drivers" element={<RequirePermission permission="driver.view_all"><DriverManagementPage /></RequirePermission>} />
          <Route path="/admin/drivers/:id" element={<RequirePermission permission="driver.view_all"><DriverDetailPage /></RequirePermission>} />
        </Route>

        <Route path="/driver" element={<DriverPortalLayout />}>
          <Route index element={<DriverLoginPage />} />
          <Route path="dashboard" element={<DriverHomePage />} />
          <Route path="shipments" element={<DriverShipmentsPage />} />
          <Route path="shipments/:id" element={<DriverShipmentDetailPage />} />
          <Route path="scan" element={<DriverScanPage />} />
          <Route path="alerts" element={<DriverAlertsPage />} />
          <Route path="profile" element={<DriverProfilePage />} />
        </Route>

        <Route
          path="/field"
          element={
            <RequireFieldAuth>
              <FieldShell />
            </RequireFieldAuth>
          }
        >
          <Route index element={<FieldHomePage />} />
          <Route path="stuffing" element={<FieldStuffingPage />} />
          <Route path="stuffing/:id" element={<FieldStuffingPage />} />
          <Route path="scanner" element={<FieldScannerPage />} />
          <Route path="tracking" element={<FieldTrackingPage />} />
          <Route path="alerts" element={<FieldAlertsPage />} />
        </Route>

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </HashRouter>
  )
}
