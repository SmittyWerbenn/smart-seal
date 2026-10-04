import { useState } from 'react'
import { RotateCcw, ShieldCheck, Users, Lock, ScrollText, Building2 } from 'lucide-react'
import { useDataStore } from '@/store/dataStore'
import { useAuthStore } from '@/store/authStore'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { ALL_ROLES } from '@/mock/users'
import { translate } from '@/i18n'

export default function SettingsPage() {
  const resetAll = useDataStore((s) => s.resetAll)
  const currentUser = useAuthStore((s) => s.currentUser)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [done, setDone] = useState(false)

  return (
    <div className="pb-10">
      <PageHeader title={translate('ui.settings')} description={translate('ui.prototypeConfigurationAndSecurityConcept')} />

      <div className="grid grid-cols-1 gap-4 px-4 md:grid-cols-2 md:px-6">
        <Card>
          <CardHeader>
            <CardTitle>{translate('ui.prototypeData')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-slate-500">
              {translate('ui.allDataInSmartSeal')}
            </p>
            <Button variant="danger" onClick={() => setConfirmOpen(true)}>
              <RotateCcw size={14} /> {translate('ui.resetPrototypeData')}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{translate('ui.currentSession')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">{translate('ui.name')}</span><span className="font-medium">{currentUser?.name}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">{translate('ui.email')}</span><span className="font-medium">{currentUser?.email}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">{translate('ui.role')}</span><span className="font-medium">{ALL_ROLES.find((r) => r.role === currentUser?.role)?.label}</span></div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>{translate('ui.prototypeSecurityModelSimulated')}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <SecurityConcept icon={Building2} title={translate('ui.tenant')} description={translate('ui.eachClientIsModeledAs')} />
            <SecurityConcept icon={Users} title={translate('ui.role')} description={translate('ui.demoRolesDesc')} />
            <SecurityConcept icon={Lock} title={translate('ui.permission')} description={translate('ui.routeLevelAndComponentLevel')} />
            <SecurityConcept icon={ShieldCheck} title={translate('ui.maskedCargo')} description={translate('ui.clientsOnlySeeTheirOwn')} />
            <SecurityConcept icon={ScrollText} title={translate('ui.auditTrail')} description={translate('ui.everySimulatedActionIsRecorded')} />
          </CardContent>
          <CardContent className="pt-0">
            <p className="text-xs text-slate-400">
              {translate('ui.theseArePrototypeSimulationsFor')}
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
        title={translate('ui.resetPrototypeData')}
        footer={
          !done ? (
            <>
              <Button variant="secondary" onClick={() => setConfirmOpen(false)}>{translate('ui.cancel2')}</Button>
              <Button
                variant="danger"
                onClick={() => {
                  resetAll()
                  setDone(true)
                }}
              >
                {translate('ui.resetEverything')}
              </Button>
            </>
          ) : (
            <Button onClick={() => setConfirmOpen(false)}>{translate('ui.close')}</Button>
          )
        }
      >
        {done ? (
          <p className="text-sm text-green-700">{translate('ui.prototypeDataHasBeenReset')}</p>
        ) : (
          <p className="text-sm text-slate-600">{translate('ui.thisWillRegenerateAllMock')}</p>
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
