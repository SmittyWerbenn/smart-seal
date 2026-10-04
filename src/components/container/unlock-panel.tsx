import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Lock, ShieldCheck, Unlock, Wifi, WifiOff } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Input, Label } from '@/components/ui/input'
import { offlineUnlock, requestAndConfirmUnlock } from '@/lib/actions'
import { saveUnlockPhotos, unlockPhotoText } from '@/lib/documentation'
import { PhotoSlot } from '@/components/shared/photo-ui'
import { IssueReportModal } from '@/components/shared/issue-report-modal'
import { useAuthStore } from '@/store/authStore'
import type { Container } from '@/types'
import { translate } from '@/i18n'

const OFFLINE_PIN = '123456'

// Shared between the container's Seals tab and Overview tab, and the Smart
// Seal device detail page — a seal can be unlocked from any of them, no
// need to dig into the container's Seals tab specifically.
export function UnlockPanel({ container }: { container: Container }) {
  const navigate = useNavigate()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [requestOpen, setRequestOpen] = useState(false)
  const [offlineOpen, setOfflineOpen] = useState(false)
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState('')
  const [offlineSuccess, setOfflineSuccess] = useState(false)
  const [photoBefore, setPhotoBefore] = useState<string | null>(null)
  const [photoAfter, setPhotoAfter] = useState<string | null>(null)
  const [photoError, setPhotoError] = useState('')
  const [issueOpen, setIssueOpen] = useState(false)
  const actor = useAuthStore((s) => s.currentUser?.name ?? 'User')
  const photosReady = !!photoBefore && !!photoAfter

  const resetPhotos = () => {
    setPhotoBefore(null)
    setPhotoAfter(null)
    setPhotoError('')
  }

  // Photos are saved first; the unlock only runs if both are stored.
  const unlockWithPhotos = (run: (id: string) => boolean): boolean => {
    const saved = saveUnlockPhotos(container.id, photoBefore, photoAfter, actor)
    if (!saved.ok) {
      setPhotoError(saved.error ?? 'Foto gagal disimpan.')
      return false
    }
    const done = run(container.id)
    if (done) resetPhotos()
    return done
  }

  const photoBlock = (
    <div className="space-y-2.5">
      <div className="rounded-md bg-brand-50 p-2.5 text-xs text-brand-700">
        <span className="font-semibold">{translate('ui.unlockNeeds2Photos')}</span> {unlockPhotoText()}
      </div>
      <PhotoSlot step={1} label={translate('ui.containerPhotoBeforeSealOpened')} value={photoBefore} onChange={setPhotoBefore} />
      <PhotoSlot step={2} label={translate('ui.cargoInsideContainerAfterSeal')} value={photoAfter} onChange={setPhotoAfter} />
      {photoError && <p className="text-xs text-critical-500">{photoError}</p>}
      <button type="button" onClick={() => setIssueOpen(true)} className="flex items-center gap-1.5 text-xs font-medium text-amber-700 hover:underline">
        <AlertTriangle size={13} /> {translate('ui.issueReported')}
      </button>
    </div>
  )

  const isUnlocked = container.isUnlocked
  const canUnlock = container.insideDestinationGeofence && !container.isUnlocked

  if (container.securityMode === 'BASIC_SEAL') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{translate('ui.manualUnlock')}</CardTitle>
        </CardHeader>
        <CardContent>
          {isUnlocked ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 rounded-md bg-success-100 p-3 text-sm text-green-800">
                <Unlock size={16} /> {translate('ui.containerUnlockedManualSupervisorOverrid')}
              </div>
              <div className="flex items-start gap-2 rounded-md bg-slate-100 p-3 text-xs text-slate-600">
                <Lock size={14} className="mt-0.5 shrink-0" />
                Basic Seal {container.regularSealId} flagged as <span className="font-medium text-navy-700">{translate('ui.unsealed')}</span> — it's a single-use
                tag with no electronics, so it cannot be reused on another container.
              </div>
            </div>
          ) : (
            <>
              <p className="mb-3 text-xs text-slate-500">
                Since this seal cannot be tracked, destination-geofence detection is unavailable. Unlock requires a supervisor to
                manually confirm the container has reached its destination.
              </p>
              <Button onClick={() => setConfirmOpen(true)}>
                <ShieldCheck size={14} /> {translate('ui.manualUnlockSupervisorOverride')}
              </Button>
            </>
          )}
        </CardContent>

        <Modal
          open={confirmOpen}
          onClose={() => {
            setConfirmOpen(false)
            resetPhotos()
          }}
          className="max-h-[90vh] overflow-y-auto"
          title={translate('ui.confirmManualUnlock')}
          footer={
            <>
              <Button
                variant="secondary"
                onClick={() => {
                  setConfirmOpen(false)
                  resetPhotos()
                }}
              >
                {translate('ui.cancel2')}
              </Button>
              <Button
                disabled={!photosReady}
                onClick={() => {
                  if (unlockWithPhotos((id) => requestAndConfirmUnlock(id))) setConfirmOpen(false)
                }}
              >
                {translate('ui.confirmUnlock')}
              </Button>
            </>
          }
        >
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">{translate('ui.container')}</dt>
              <dd className="font-medium">{container.number}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">{translate('ui.seal')}</dt>
              <dd className="font-medium">{container.regularSealId ?? '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">{translate('ui.verification')}</dt>
              <dd className="font-medium">{translate('ui.manualNoGpsAvailable')}</dd>
            </div>
          </dl>
          <div className="mt-4 border-t border-slate-100 pt-3">{photoBlock}</div>
        </Modal>
        <IssueReportModal open={issueOpen} onClose={() => setIssueOpen(false)} container={container} context="UNLOCK" />
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{translate('ui.destinationUnlock')}</CardTitle>
      </CardHeader>
      <CardContent>
        {isUnlocked ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 rounded-md bg-success-100 p-3 text-sm text-green-800">
              <Unlock size={16} /> Container unlocked{container.offlineMode ? ' via offline PIN' : ''}.
            </div>
            <div className="flex items-start gap-2 rounded-md bg-slate-100 p-3 text-xs text-slate-600">
              <ShieldCheck size={14} className="mt-0.5 shrink-0" />
              Smart Seal {container.eSealId} has been <span className="font-medium text-navy-700">{translate('ui.detachedAndReturnedToThe')}</span>{' '}
              for reuse — track its pickup in{' '}
              <button onClick={() => navigate('/reverse-logistics')} className="font-medium text-brand-600 hover:underline">
                {translate('ui.reverseLogistics')}
              </button>
              .
            </div>
          </div>
        ) : (
          <>
            <div
              className={`mb-3 flex items-center gap-2 rounded-md p-3 text-sm ${container.insideDestinationGeofence ? 'bg-success-100 text-green-800' : 'bg-slate-100 text-slate-600'}`}
            >
              {container.insideDestinationGeofence ? <Wifi size={16} /> : <WifiOff size={16} />}
              {container.insideDestinationGeofence ? 'Inside destination geofence' : 'Outside destination geofence'}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button disabled={!canUnlock} onClick={() => setRequestOpen(true)}>
                <Unlock size={14} /> {translate('ui.requestUnlock')}
              </Button>
              <Button variant="outline" onClick={() => setOfflineOpen(true)}>
                <WifiOff size={14} /> {translate('ui.offlineUnlock')}
              </Button>
            </div>
          </>
        )}
      </CardContent>

      <Modal
        open={requestOpen}
        onClose={() => {
          setRequestOpen(false)
          resetPhotos()
        }}
        className="max-h-[90vh] overflow-y-auto"
        title={translate('ui.confirmUnlock')}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setRequestOpen(false)
                resetPhotos()
              }}
            >
              {translate('ui.cancel2')}
            </Button>
            <Button
              disabled={!photosReady}
              onClick={() => {
                if (unlockWithPhotos((id) => requestAndConfirmUnlock(id))) setRequestOpen(false)
              }}
            >
              {translate('ui.confirmUnlock')}
            </Button>
          </>
        }
      >
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-500">{translate('ui.container')}</dt>
            <dd className="font-medium">{container.number}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">{translate('ui.currentLocation2')}</dt>
            <dd className="font-medium">
              {container.currentLocation.lat.toFixed(3)}, {container.currentLocation.lng.toFixed(3)}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">{translate('ui.geofenceStatus')}</dt>
            <dd className="font-medium text-green-700">{translate('ui.insideDestinationGeofence')}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">{translate('ui.sealStatus')}</dt>
            <dd className="font-medium">{container.eSealId ?? '—'} armed</dd>
          </div>
        </dl>
        <div className="mt-4 border-t border-slate-100 pt-3">{photoBlock}</div>
      </Modal>

      <Modal
        open={offlineOpen}
        onClose={() => {
          setOfflineOpen(false)
          setOfflineSuccess(false)
          setPin('')
          setPinError('')
          resetPhotos()
        }}
        className="max-h-[90vh] overflow-y-auto"
        title={translate('ui.offlineUnlock')}
      >
        {offlineSuccess ? (
          <div className="rounded-md bg-success-100 p-3 text-sm text-green-800">{translate('ui.offlineUnlockSuccessful')}</div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-md bg-slate-100 p-3 text-sm text-slate-600">
              <WifiOff size={16} /> {translate('ui.noInternetConnection')}
            </div>
            <div>
              <Label htmlFor="pin">{translate('ui.enterStaticPin')}</Label>
              <Input
                id="pin"
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value)
                  setPinError('')
                }}
                placeholder={translate('ui.pinPlaceholder')}
                maxLength={6}
              />
              {pinError && <p className="mt-1 text-xs text-critical-500">{pinError}</p>}
              <p className="mt-1 text-[11px] text-slate-400">Demo PIN: {OFFLINE_PIN}</p>
            </div>
            {photoBlock}
            <Button
              className="w-full"
              disabled={!photosReady}
              onClick={() => {
                if (pin === OFFLINE_PIN) {
                  if (unlockWithPhotos((id) => offlineUnlock(id))) setOfflineSuccess(true)
                } else {
                  setPinError('Incorrect PIN. Please try again.')
                }
              }}
            >
              {translate('ui.unlock')}
            </Button>
          </div>
        )}
      </Modal>
      <IssueReportModal open={issueOpen} onClose={() => setIssueOpen(false)} container={container} context="UNLOCK" />
    </Card>
  )
}
