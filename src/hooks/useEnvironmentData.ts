import { useEffect, useState } from 'react'
import type { GeoState } from './useGeolocation'

export interface WeatherCurrent {
  temperatureC: number
  humidityPct: number | null
  windKmh: number | null
  code: number
  isDay: boolean
  time: string
}

export interface AirCurrent {
  usAqi: number | null
  pm25: number | null
  time: string
}

export interface EnvironmentState {
  weather: WeatherCurrent | null
  air: AirCurrent | null
  placeLabel: string | null
  loading: boolean
  error: string | null
}

const WMO: Record<number, string> = {
  0: 'Clear',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Fog',
  51: 'Light drizzle',
  53: 'Drizzle',
  55: 'Drizzle',
  61: 'Light rain',
  63: 'Rain',
  65: 'Heavy rain',
  71: 'Snow',
  73: 'Snow',
  75: 'Snow',
  95: 'Thunderstorm',
}

function weatherLabel(code: number): string {
  return WMO[code] ?? 'Weather'
}

export { weatherLabel }

async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'RiskalyzerDashboard/1.0 (local dev; contact: local)',
    },
  })
  if (!res.ok) return null
  const data = (await res.json()) as {
    address?: { city?: string; town?: string; village?: string; state?: string; country?: string }
  }
  const a = data.address
  if (!a) return null
  const city = a.city ?? a.town ?? a.village
  if (city && a.country) return `${city}, ${a.country}`
  if (a.state && a.country) return `${a.state}, ${a.country}`
  return a.country ?? null
}

export function useEnvironmentData(geo: GeoState) {
  const [state, setState] = useState<EnvironmentState>({
    weather: null,
    air: null,
    placeLabel: null,
    loading: false,
    error: null,
  })

  const lat = geo.status === 'ok' ? geo.latitude : null
  const lon = geo.status === 'ok' ? geo.longitude : null

  useEffect(() => {
    if (lat == null || lon == null) {
      setState((s) => ({
        ...s,
        weather: null,
        air: null,
        placeLabel: null,
        loading: false,
        error: null,
      }))
      return
    }

    const latitude = lat
    const longitude = lon
    let cancelled = false

    async function run() {
      setState((s) => ({ ...s, loading: true, error: null }))
      try {
        const weatherUrl =
          `https://api.open-meteo.com/v1/forecast` +
          `?latitude=${latitude}&longitude=${longitude}` +
          `&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,is_day` +
          `&wind_speed_unit=kmh&timezone=auto`
        const airUrl =
          `https://air-quality-api.open-meteo.com/v1/air-quality` +
          `?latitude=${latitude}&longitude=${longitude}` +
          `&current=us_aqi,pm2_5&timezone=auto`

        const [wRes, aRes, place] = await Promise.all([
          fetch(weatherUrl),
          fetch(airUrl),
          reverseGeocode(latitude, longitude).catch(() => null),
        ])

        if (cancelled) return
        if (!wRes.ok) throw new Error('Weather data unavailable.')
        const wJson = (await wRes.json()) as {
          current: {
            time: string
            temperature_2m: number
            relative_humidity_2m?: number
            weather_code: number
            wind_speed_10m?: number
            is_day?: number
          }
        }

        let air: AirCurrent | null = null
        if (aRes.ok) {
          const aJson = (await aRes.json()) as {
            current: { time: string; us_aqi?: number; pm2_5?: number }
          }
          const c = aJson.current
          air = {
            usAqi: c.us_aqi ?? null,
            pm25: c.pm2_5 ?? null,
            time: c.time,
          }
        }

        const c = wJson.current
        setState({
          weather: {
            temperatureC: c.temperature_2m,
            humidityPct: c.relative_humidity_2m ?? null,
            windKmh: c.wind_speed_10m ?? null,
            code: c.weather_code,
            isDay: c.is_day === 1,
            time: c.time,
          },
          air,
          placeLabel: place,
          loading: false,
          error: null,
        })
      } catch (e) {
        if (cancelled) return
        setState({
          weather: null,
          air: null,
          placeLabel: null,
          loading: false,
          error: e instanceof Error ? e.message : 'Failed to load environment data.',
        })
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [lat, lon])

  return state
}
