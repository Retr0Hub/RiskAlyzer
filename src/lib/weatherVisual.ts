export type WeatherVisual =
  | 'clear-day'
  | 'clear-night'
  | 'cloudy'
  | 'rain'
  | 'heavy-rain'
  | 'snow'
  | 'fog'
  | 'thunder'

/** Open-Meteo WMO weathercode + day/night → backdrop style. */
export function getWeatherVisual(
  code: number | null,
  isDay: boolean | null
): WeatherVisual {
  const day = isDay !== false
  if (code == null) return day ? 'clear-day' : 'clear-night'

  if (code === 95 || code === 96 || code === 99) return 'thunder'
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'snow'
  if (code === 45 || code === 48) return 'fog'

  if (
    [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)
  ) {
    if ([65, 67, 82, 66].includes(code)) return 'heavy-rain'
    return 'rain'
  }

  if (code === 0) return day ? 'clear-day' : 'clear-night'
  if (code === 1) return day ? 'clear-day' : 'clear-night'
  if (code === 2) return 'cloudy'
  if (code === 3) return 'cloudy'

  return day ? 'cloudy' : 'clear-night'
}
