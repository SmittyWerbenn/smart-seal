import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { AppLogo } from '@/components/shared/logo'
import { translate } from '@/i18n'

export default function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-4 text-center">
      <AppLogo />
      <h1 className="text-4xl font-bold text-navy-900">404</h1>
      <p className="text-sm text-slate-500">{translate('ui.thePageYouReLooking')}</p>
      <Button onClick={() => navigate('/dashboard')}>{translate('ui.backToDashboard')}</Button>
    </div>
  )
}
