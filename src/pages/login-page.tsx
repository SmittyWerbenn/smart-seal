import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Radar, Warehouse, Truck, Building2, ShieldCheck, Anchor, Radio, ScanLine } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { DEMO_USERS } from '@/mock/users'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/input'
import { AppLogo } from '@/components/shared/logo'
import type { Role } from '@/types'

const SHORTCUTS: { role: Role; label: string; icon: typeof Radar }[] = [
  { role: 'CONTROL_TOWER', label: 'Control Tower', icon: Radar },
  { role: 'WAREHOUSE', label: 'Warehouse Operator', icon: Warehouse },
  { role: 'DRIVER', label: 'Driver', icon: Truck },
  { role: 'CLIENT', label: 'Client', icon: Building2 },
]

export default function LoginPage() {
  const login = useAuthStore((s) => s.login)
  const navigate = useNavigate()
  const [email, setEmail] = useState('control.tower@smartseal.demo')
  const [password, setPassword] = useState('demo1234')

  const doLogin = (role: Role) => {
    login(role)
    navigate(role === 'DRIVER' ? '/field' : '/dashboard')
  }

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-navy-950 p-10 text-white lg:flex">
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '22px 22px' }} />
        <AppLogo className="relative z-10 [&_span]:text-white" />
        <div className="relative z-10 space-y-6">
          <h2 className="max-w-md text-3xl font-semibold leading-tight">
            Real-time container security &amp; supply-chain visibility for the whole corridor.
          </h2>
          <div className="grid max-w-md grid-cols-2 gap-4 text-sm text-slate-300">
            <div className="flex items-center gap-2"><Radio size={16} className="text-brand-300" /> Live IoT &amp; AIS tracking</div>
            <div className="flex items-center gap-2"><ShieldCheck size={16} className="text-brand-300" /> Dual smart-seal security</div>
            <div className="flex items-center gap-2"><Anchor size={16} className="text-brand-300" /> Automated port handoffs</div>
            <div className="flex items-center gap-2"><Warehouse size={16} className="text-brand-300" /> Reverse logistics control</div>
          </div>
        </div>
        <p className="relative z-10 text-xs text-slate-500">© 2026 Smart Container Seal &amp; Tracking — Prototype build for stakeholder demonstration.</p>
      </div>

      <div className="flex items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <AppLogo />
          </div>
          <h1 className="text-xl font-semibold text-navy-900">Sign in to Smart Container Seal &amp; Tracking</h1>
          <p className="mb-6 mt-1 text-sm text-slate-500">Container IoT &amp; Supply-Chain Tracking</p>

          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              doLogin('CONTROL_TOWER')
            }}
          >
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" className="w-full" size="lg">
              Sign in
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3 text-xs text-slate-400">
            <span className="h-px flex-1 bg-slate-200" />
            or continue as a demo role
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
            <ScanLine size={14} /> Just verifying a seal? Scan without signing in →
          </Link>

          <p className="mt-6 text-center text-[11px] text-slate-400">
            Prototype only — demo accounts: {DEMO_USERS.map((u) => u.email).join(', ')}
          </p>
        </div>
      </div>
    </div>
  )
}
