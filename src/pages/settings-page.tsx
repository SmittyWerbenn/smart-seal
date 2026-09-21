import { useState } from 'react'
import { RotateCcw, ShieldCheck, Users, Lock, ScrollText, Building2 } from 'lucide-react'
import { useDataStore } from '@/store/dataStore'
import { useAuthStore } from '@/store/authStore'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { ALL_ROLES } from '@/mock/users'

export default function SettingsPage() {
  const resetAll = useDataStore((s) => s.resetAll)
  const currentUser = useAuthStore((s) => s.currentUser)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [done, setDone] = useState(false)

  return (
    <div className="pb-10">
      <PageHeader title="Settings" description="Prototype configuration and security concept overview." />

      <div className="grid grid-cols-1 gap-4 px-4 md:grid-cols-2 md:px-6">
        <Card>
          <CardHeader>
            <CardTitle>Prototype Data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-slate-500">
              All data in Smart Container Seal &amp; Tracking is mocked and stored in your browser's local storage. Use this to restore the original demo dataset at any time.
            </p>
            <Button variant="danger" onClick={() => setConfirmOpen(true)}>
              <RotateCcw size={14} /> Reset Prototype Data
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current Session</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Name</span><span className="font-medium">{currentUser?.name}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Email</span><span className="font-medium">{currentUser?.email}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Role</span><span className="font-medium">{ALL_ROLES.find((r) => r.role === currentUser?.role)?.label}</span></div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Prototype Security Model (Simulated)</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <SecurityConcept icon={Building2} title="Tenant" description="Each client is modeled as an isolated tenant with its own cargo lines." />
            <SecurityConcept icon={Users} title="Role" description="7 demo roles gate navigation and available actions across the app." />
            <SecurityConcept icon={Lock} title="Permission" description="Route-level and component-level checks mirror a real RBAC system." />
            <SecurityConcept icon={ShieldCheck} title="Masked Cargo" description="Clients only see their own DO, SKU and quantity — others show as consolidated." />
            <SecurityConcept icon={ScrollText} title="Audit Trail" description="Every simulated action is recorded to the Audit Logs page." />
          </CardContent>
          <CardContent className="pt-0">
            <p className="text-xs text-slate-400">
              These are prototype simulations for stakeholder demonstration — no real authentication, authorization or encryption is implemented.
            </p>
          </CardContent>
        </Card>
      </div>

      <Modal
        open={confirmOpen}
        onClose={() => {
          setConfirmOpen(false)
          setDone(false)
        }}
        title="Reset Prototype Data"
        footer={
          !done ? (
            <>
              <Button variant="secondary" onClick={() => setConfirmOpen(false)}>Cancel</Button>
              <Button
                variant="danger"
                onClick={() => {
                  resetAll()
                  setDone(true)
                }}
              >
                Reset Everything
              </Button>
            </>
          ) : (
            <Button onClick={() => setConfirmOpen(false)}>Close</Button>
          )
        }
      >
        {done ? (
          <p className="text-sm text-green-700">Prototype data has been reset to its original demo state.</p>
        ) : (
          <p className="text-sm text-slate-600">This will regenerate all mock containers, devices, alerts and logs, discarding any simulated changes. This cannot be undone.</p>
        )}
      </Modal>
    </div>
  )
}

function SecurityConcept({ icon: Icon, title, description }: { icon: typeof ShieldCheck; title: string; description: string }) {
  return (
    <div className="rounded-md border border-slate-100 p-3">
      <Icon size={18} className="text-brand-600" />
      <p className="mt-2 text-sm font-medium text-navy-900">{title}</p>
      <p className="mt-0.5 text-xs text-slate-500">{description}</p>
    </div>
  )
}
