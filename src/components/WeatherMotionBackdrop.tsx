import { getWeatherVisual, type WeatherVisual } from '../lib/weatherVisual'

const gradients: Record<WeatherVisual, string> = {
  'clear-day':
    'linear-gradient(180deg, #38bdf8 0%, #7dd3fc 42%, #bae6fd 100%)',
  'clear-night':
    'linear-gradient(180deg, #0f172a 0%, #1e3a5f 45%, #312e81 100%)',
  cloudy:
    'linear-gradient(180deg, #64748b 0%, #94a3b8 40%, #cbd5e1 100%)',
  rain: 'linear-gradient(180deg, #475569 0%, #64748b 38%, #94a3b8 100%)',
  'heavy-rain':
    'linear-gradient(180deg, #334155 0%, #475569 35%, #64748b 100%)',
  snow: 'linear-gradient(180deg, #94a3b8 0%, #cbd5e1 45%, #e2e8f0 100%)',
  fog: 'linear-gradient(180deg, #cbd5e1 0%, #e2e8f0 50%, #f1f5f9 100%)',
  thunder:
    'linear-gradient(180deg, #1e293b 0%, #334155 40%, #475569 100%)',
}

export function WeatherMotionBackdrop({
  weatherCode,
  isDay,
}: {
  weatherCode: number | null
  isDay: boolean | null
}) {
  const v = getWeatherVisual(weatherCode, isDay)

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      style={{ background: gradients[v] }}
    >
      {(v === 'clear-day' || v === 'cloudy' || v === 'rain' || v === 'heavy-rain') && (
        <div
          className="absolute -left-[10%] top-[12%] h-40 w-[55%] rounded-full bg-white/45 blur-3xl BreathSense-cloud md:h-52"
          aria-hidden
        />
      )}
      {(v === 'cloudy' ||
        v === 'rain' ||
        v === 'heavy-rain' ||
        v === 'snow' ||
        v === 'thunder' ||
        v === 'fog') && (
          <>
            <div
              className="absolute left-[8%] top-[22%] h-48 w-[65%] rounded-full bg-white/35 blur-3xl BreathSense-cloud-delay"
              aria-hidden
            />
            <div
              className="absolute right-[-8%] top-[8%] h-44 w-[50%] rounded-full bg-white/30 blur-3xl BreathSense-cloud"
              aria-hidden
            />
          </>
        )}

      {v === 'clear-day' && (
        <div
          className="absolute right-[12%] top-[14%] h-28 w-28 rounded-full bg-yellow-100/90 blur-md shadow-[0_0_60px_rgba(253,224,71,0.65)] md:h-36 md:w-36"
          aria-hidden
        />
      )}

      {v === 'clear-night' && (
        <>
          <div
            className="absolute right-[18%] top-[16%] h-20 w-20 rounded-full bg-slate-200/35 blur-md md:h-24 md:w-24"
            aria-hidden
          />
          <div
            className="absolute right-[10%] top-[10%] h-1 w-1 rounded-full bg-white/80 shadow-[0_0_8px_white]"
            aria-hidden
          />
          <div
            className="absolute right-[40%] top-[8%] h-0.5 w-0.5 rounded-full bg-white/60"
            aria-hidden
          />
        </>
      )}

      {(v === 'rain' || v === 'heavy-rain' || v === 'thunder') && (
        <div
          className={`weather-rain-layer absolute inset-0 ${v === 'heavy-rain' || v === 'thunder' ? 'weather-rain-heavy' : ''}`}
          aria-hidden
        />
      )}

      {v === 'snow' &&
        Array.from({ length: 48 }).map((_, i) => (
          <span
            key={i}
            className="weather-snowflake absolute rounded-full bg-white/80 shadow-sm"
            style={{
              left: `${(i * 13) % 100}%`,
              top: `${-8 - (i % 7)}%`,
              width: 3 + (i % 3),
              height: 3 + (i % 3),
              opacity: 0.35 + (i % 5) * 0.1,
              animationDuration: `${7 + (i % 8)}s`,
              animationDelay: `${-(i % 10)}s`,
            }}
            aria-hidden
          />
        ))}

      {v === 'fog' && (
        <div
          className="absolute inset-0 bg-gradient-to-t from-white/55 via-white/20 to-transparent backdrop-blur-md"
          aria-hidden
        />
      )}

      {v === 'thunder' && (
        <div
          className="absolute inset-0 bg-white/0"
          style={{ animation: 'weather-flash 7s ease-in-out infinite' }}
          aria-hidden
        />
      )}
    </div>
  )
}
