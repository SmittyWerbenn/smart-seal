import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { ALL_ROLES } from '@/mock/users'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function UsersRolesPage() {
  const { currentUser, switchRole } = useAuthStore()
  const navigate = useNavigate()

  return (
    <div className="pb-10">
      <PageHeader title="Users &amp; Roles" description="Frontend-only demo role management. Switching a role immediately changes the accessible UI." />
      <div className="grid grid-cols-1 gap-3 px-4 md:grid-cols-2 md:px-6 lg:grid-cols-3">
        {ALL_ROLES.map((r) => (
          <Card key={r.role} className={cn(currentUser?.role === r.role && 'ring-2 ring-brand-500')}>
            <CardContent className="flex flex-col gap-3 py-4">
              <div>
                <p className="text-sm font-semibold text-navy-900">{r.label}</p>
                <p className="mt-1 text-xs text-slate-500">{r.description}</p>
              </div>
              <Button
                size="sm"
                variant={currentUser?.role === r.role ? 'secondary' : 'primary'}
                onClick={() => {
                  switchRole(r.role)
                  navigate(r.role === 'DRIVER' ? '/field' : '/dashboard')
                }}
              >
                {currentUser?.role === r.role ? 'Current Role' : 'Switch to this role'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
