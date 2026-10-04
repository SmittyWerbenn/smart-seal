import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Radar, Warehouse, Truck, Building2, ShieldCheck, Anchor, Radio, ScanLine } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { DEMO_USERS } from '@/mock/users'
import { driverService } from '@/services/driverService'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/input'
import { AppLogo } from '@/components/shared/logo'
import { LanguageToggle } from '@/components/shared/language-toggle'
import type { Role } from '@/types'
import { translate } from '@/i18n'

const SHORTCUTS: { role: Role; label: string; icon: typeof Radar }[] = [
  { role: 'CONTROL_TOWER', get label() { return translate('ui.controlTower') }, icon: Radar },
  { role: 'WAREHOUSE', get label() { return translate('ui.warehouseOperator') }, icon: Warehouse },
  { role: 'DRIVER', get label() { return translate('ui.driver') }, icon: Truck },
  { role: 'CLIENT', get label() { return translate('ui.client') }, icon: Building2 },
]

export default function LoginPage() {
  const login = useAuthStore((s) => s.login)
  const navigate = useNavigate()
  const [email, setEmail] = useState('control.tower@smartseal.demo')
  const [password, setPassword] = useState('demo1234')

  const loginDriver = useAuthStore((s) => s.loginDriver)
  const [driverUser, setDriverUser] = useState('')
  const [driverPass, setDriverPass] = useState('')
  const [driverError, setDriverError] = useState<string | null>(null)
  const [driverBusy, setDriverBusy] = useState(false)

  const doLogin = (role: Role) => {
    login(role)
    navigate(role === 'DRIVER' ? '/driver' : '/dashboard')
  }

  const doDriverLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setDriverBusy(true)
    setDriverError(null)
    const result = await driverService.authenticate(driverUser, driverPass)
    setDriverBusy(false)
    if (!result.ok || !result.value) {
      setDriverError(result.error ?? 'Login gagal.')
      return
    }
    loginDriver(result.value)
    navigate('/driver')
  }

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-navy-950 p-10 text-white lg:flex">
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '22px 22px' }} />
        <AppLogo className="relative z-10 [&_span]:text-white" />
        <div className="relative z-10 space-y-6">
          <h2 className="max-w-md text-3xl font-semibold leading-tight">
            {translate('ui.realTimeContainerSecuritySupply')}
          </h2>
          <div className="grid max-w-md grid-cols-2 gap-4 text-sm text-slate-300">
            <div className="flex items-center gap-2"><Radio size={16} className="text-brand-300" /> {translate('ui.liveIotAisTracking')}</div>
            <div className="flex items-center gap-2"><ShieldCheck size={16} className="text-brand-300" /> {translate('ui.dualSmartSealSecurity')}</div>
            <div className="flex items-center gap-2"><Anchor size={16} className="text-brand-300" /> {translate('ui.automatedPortHandoffs')}</div>
            <div className="flex items-center gap-2"><Warehouse size={16} className="text-brand-300" /> {translate('ui.reverseLogisticsControl')}</div>
          </div>
        </div>
        <p className="relative z-10 text-xs text-slate-500">{translate('ui.n2026SmartSealContainerTracking')}</p>
      </div>

      <div className="flex items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center justify-between lg:hidden">
            <AppLogo />
            <LanguageToggle />
          </div>
          <div className="mb-4 hidden justify-end lg:flex">
            <LanguageToggle />
          </div>
          <h1 className="text-xl font-semibold text-navy-900">{translate('ui.signInToSmartSeal')}</h1>
          <p className="mb-6 mt-1 text-sm text-slate-500">{translate('ui.containerIotSupplyChainTracking')}</p>

          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              doLogin('CONTROL_TOWER')
            }}
          >
            <div>
              <Label htmlFor="email">{translate('ui.email')}</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="password">{translate('ui.password')}</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" className="w-full" size="lg">
              {translate('ui.signIn')}
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3 text-xs text-slate-400">
            <span className="h-px flex-1 bg-slate-200" />
            {translate('ui.orSignInAsA')}
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          <form onSubmit={doDriverLogin} className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/60 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-navy-900">
              <Truck size={16} className="text-brand-600" /> {translate('ui.driverLogin')}
            </p>
            <div>
              <Label htmlFor="driver-username">{translate('ui.username')}</Label>
              <Input id="driver-username" autoComplete="username" placeholder={translate('ui.driver01')} value={driverUser} onChange={(e) => setDriverUser(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="driver-password">{translate('ui.password')}</Label>
              <Input id="driver-password" type="password" autoComplete="current-password" placeholder={translate('ui.driver123')} value={driverPass} onChange={(e) => setDriverPass(e.target.value)} />
            </div>
            {driverError && <p className="text-sm text-red-700">{driverError}</p>}
            <Button type="submit" variant="secondary" className="w-full" disabled={driverBusy || !driverUser || !driverPass}>
              {driverBusy ? translate('misc.checking') : translate('misc.signInAsDriver')}
            </Button>
            <p className="text-[11px] text-slate-500">{translate('ui.demoDriver01Driver05PasswordDriver123')}</p>
          </form>

          <div className="my-6 flex items-center gap-3 text-xs text-slate-400">
            <span className="h-px flex-1 bg-slate-200" />
            {translate('ui.orContinueAsADemo')}
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {SHORTCUTS.map((s) => (
              <button
                key={s.role}
                onClick={() => doLogin(s.role)}
                className="flex flex-col items-start gap-2 rounded-lg border border-slate-200 p-3 text-left transition-colors hover:border-brand-400 hover:bg-brand-50"
              >
                <s.icon size={18} className="text-brand-600" />
                <span className="text-xs font-medium text-navy-800">{s.label}</span>
              </button>
            ))}
          </div>

          <Link
            to="/scan"
            className="mt-6 flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-300 py-2.5 text-xs font-medium text-slate-500 hover:border-brand-400 hover:text-brand-700"
          >
            <ScanLine size={14} /> {translate('ui.justVerifyingASealScan')}
          </Link>

          <p className="mt-6 text-center text-[11px] text-slate-400">
            Prototype only — demo accounts: {DEMO_USERS.map((u) => u.email).join(', ')}
          </p>
        </div>
      </div>
    </div>
  )
}
