import { useCallback, useEffect, useState } from 'react'

export interface GpsFix {
  lat: number
  lng: number
  accuracyM: number
}

export type GpsState =
  | { status: 'loading' }
  | { status: 'ok'; fix: GpsFix }
  | { status: 'error'; reason: 'unsupported' | 'denied' | 'unavailable' | 'timeout' }

/** Reads the device position once (and on retry). The caller decides what to do when it fails. */
export function useGpsPosition(enabled: boolean) {
  const [state, setState] = useState<GpsState>({ status: 'loading' })

  const request = useCallback(() => {
    if (!navigator.geolocation) {
      setState({ status: 'error', reason: 'unsupported' })
      return
    }
    setState({ status: 'loading' })
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setState({
          status: 'ok',
          fix: { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracyM: Math.round(pos.coords.accuracy) },
        }),
      (err) => {
        const reason = err.code === err.PERMISSION_DENIED ? 'denied' : err.code === err.TIMEOUT ? 'timeout' : 'unavailable'
        setState({ status: 'error', reason })
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    )
  }, [])

  useEffect(() => {
    if (enabled) request()
  }, [enabled, request])

  return { state, retry: request }
}
