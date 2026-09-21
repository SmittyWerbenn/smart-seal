import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useSimulationEngine } from '@/hooks/useSimulationEngine'
import { AppShell } from '@/components/shared/app-shell'
import { FieldShell } from '@/pages/field/field-shell'

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

function RequireAuth({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const currentUser = useAuthStore((s) => s.currentUser)
  if (!isAuthenticated || !currentUser) return <Navigate to="/login" replace />
  if (currentUser.role === 'DRIVER') return <Navigate to="/field" replace />
  return <>{children}</>
}

function RequireFieldAuth({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  useSimulationEngine()

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
          <Route path="/audit-logs" element={<AuditLogsPage />} />
          <Route path="/users" element={<UsersRolesPage />} />
          <Route path="/simulation" element={<SimulationPage />} />
          <Route path="/settings" element={<SettingsPage />} />
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
