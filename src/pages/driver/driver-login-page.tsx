import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Truck } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { driverService } from '@/services/driverService'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input, Label } from '@/components/ui/input'
import { AppLogo } from '@/components/shared/logo'
import { LanguageToggle } from '@/components/shared/language-toggle'
import { translate } from '@/i18n'

/** Standalone entry point for drivers at /driver. Staff never see this form; drivers never see the staff login. */
export default function DriverLoginPage() {
  const loginDriver = useAuthStore((s) => s.loginDriver)
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const result = await driverService.authenticate(username, password)
    setBusy(false)
    if (!result.ok || !result.value) {
      setError(result.error ?? translate('driverLogin.invalid'))
      return
    }
    loginDriver(result.value)
    navigate('/driver/dashboard', { replace: true })
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="flex h-14 items-center justify-between px-4">
        <AppLogo />
        <LanguageToggle />
      </header>

      <main className="flex flex-1 items-start justify-center px-4 pb-10 pt-6 sm:items-center">
        <div className="w-full max-w-sm space-y-6">
          <div className="space-y-2 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm">
              <Truck size={24} />
            </span>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{translate('driverLogin.brand')}</p>
            <h1 className="text-xl font-semibold text-navy-900">{translate('driverLogin.portal')}</h1>
            <p className="text-sm text-slate-500">{translate('driverLogin.subtitle')}</p>
          </div>

          <Card>
            <CardContent className="py-5">
              <form onSubmit={submit} className="space-y-4" noValidate>
                <div>
                  <Label htmlFor="driver-username">{translate('driverLogin.username')}</Label>
                  <Input
                    id="driver-username"
                    autoComplete="username"
                    autoCapitalize="none"
                    spellCheck={false}
                    placeholder={translate('driverLogin.usernamePlaceholder')}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="h-11 text-base"
                  />
                </div>
                <div>
                  <Label htmlFor="driver-password">{translate('driverLogin.password')}</Label>
                  <div className="relative">
                    <Input
                      id="driver-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder={translate('driverLogin.passwordPlaceholder')}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-11 pr-11 text-base"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? translate('driverLogin.hidePassword') : translate('driverLogin.showPassword')}
                      className="absolute right-1 top-1 flex h-9 w-9 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">
                    {error}
                  </p>
                )}

                <Button type="submit" size="lg" className="min-h-11 w-full" disabled={busy || !username || !password}>
                  {busy ? translate('driverLogin.submitting') : translate('driverLogin.submit')}
                </Button>
              </form>
            </CardContent>
          </Card>

          <p className="text-center text-[12px] text-slate-500">{translate('ui.demoDriver01Driver05PasswordDriver123')}</p>
          <p className="text-center text-xs">
            <a className="font-medium text-brand-700 hover:underline" href="#/login">{translate('driverLogin.signInStaff')} →</a>
          </p>
        </div>
      </main>
    </div>
  )
}
