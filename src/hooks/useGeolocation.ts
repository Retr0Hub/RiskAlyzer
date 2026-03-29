import { useCallback, useEffect, useState } from 'react'

export type GeoState =
  | { status: 'idle' }
  | { status: 'pending' }
  | { status: 'ok'; latitude: number; longitude: number }
  | { status: 'denied' | 'error'; message: string }

export function useGeolocation() {
  const [state, setState] = useState<GeoState>({ status: 'idle' })

  const request = useCallback(() => {
    if (!navigator.geolocation) {
      setState({
        status: 'error',
        message: 'Geolocation is not supported in this browser.',
      })
      return
    }
    setState({ status: 'pending' })
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setState({
          status: 'ok',
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        })
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setState({
            status: 'denied',
            message:
              'Location permission denied. Weather and AQI need your approximate position.',
          })
        } else {
          setState({
            status: 'error',
            message: err.message || 'Could not read location.',
          })
        }
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 }
    )
  }, [])

  useEffect(() => {
    request()
  }, [request])

  return { geo: state, refresh: request }
}
