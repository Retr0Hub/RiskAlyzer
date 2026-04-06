import React, { useEffect, useMemo, useState, useRef, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { UserProfile } from '../types/user'
import { useAuth } from '../auth/AuthContext'
import { estimateLifeExpectancyYears } from '../lib/lifeExpectancy'
import { useGeolocation } from '../hooks/useGeolocation'
import { useEnvironmentData, weatherLabel } from '../hooks/useEnvironmentData'
import type { GeoState } from '../hooks/useGeolocation'
import { WeatherMotionBackdrop } from '../components/WeatherMotionBackdrop'
import { UserMenu } from '../components/UserMenu'
import { useRiskModel, type RiskAnalysisResult } from '../hooks/useRiskModel'
import { Chatbot, type ChatContext } from '../components/Chatbot'
import { CircularGauge, SparkTrendline } from '../components/Visualizations'

function aqiBand(aqi: number | null): { label: string; className: string } {
  if (aqi == null) return { label: 'No data', className: 'text-slate-400' }
  if (aqi <= 50) return { label: 'Good', className: 'text-emerald-600' }
  if (aqi <= 100) return { label: 'Moderate', className: 'text-amber-600' }
  if (aqi <= 150) return { label: 'Sensitive', className: 'text-orange-600' }
  return { label: 'High risk', className: 'text-red-600' }
}

/** Integer percent for life-expectancy cards (e.g. −12%). */
function formatLifePct(n: number): string {
  const r = Math.round(n)
  return `${r >= 0 ? '+' : ''}${r}%`
}

export function Dashboard({ profile }: { profile: UserProfile }) {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const { geo, refresh } = useGeolocation()
  const [customCoords, setCustomCoords] = useState<{ lat: number, lon: number } | null>(null)

  const activeGeo = customCoords
    ? { status: 'ok', latitude: customCoords.lat, longitude: customCoords.lon } as GeoState
    : geo

  const env = useEnvironmentData(activeGeo)

  const { analyze, result: aiResult, loading: aiLoading, error: aiError } = useRiskModel()
  const [deviceConnected, setDeviceConnected] = useState(false)
  const [espBreathRate, setEspBreathRate] = useState(16)
  const [espBreathTemp, setEspBreathTemp] = useState(34.2)

  // Rolling buffer of last 20 breath rate readings for live trendline
  const breathRateHistory = useRef<number[]>([])
  const analyzeDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Accumulate history when connected
  useEffect(() => {
    if (deviceConnected) {
      breathRateHistory.current = [...breathRateHistory.current.slice(-19), espBreathRate]
    }
  }, [espBreathRate, deviceConnected])

  // Re-run AI analysis (debounced) whenever sliders change while connected
  useEffect(() => {
    if (!deviceConnected) return
    if (analyzeDebounce.current) clearTimeout(analyzeDebounce.current)
    analyzeDebounce.current = setTimeout(() => {
      void analyze({
        age: profile.age,
        sex: profile.sex,
        smoker: profile.smokingStatus === 'active',
        familyHistory: profile.familyIllness,
        breathRate: espBreathRate,
        breathTemp: espBreathTemp,
        aqi: env.air?.usAqi ?? 50,
        pm25: env.air?.pm25 ?? 5.0,
        pm10: env.air?.pm10 ?? 10.0,
        no2: 4.0,
        o3: 20.0,
      })
    }, 1200) // 1.2s debounce so we don't fire on every pixel
    return () => {
      if (analyzeDebounce.current) clearTimeout(analyzeDebounce.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [espBreathRate, espBreathTemp, deviceConnected])




  const expectancy = useMemo(
    () =>
      estimateLifeExpectancyYears(profile, {
        airQualityAqi: env.air?.usAqi ?? null,
      }),
    [profile, env.air?.usAqi]
  )

  const expectancyDeltaPct =
    (expectancy.adjustedYears - expectancy.baselineYears) /
    expectancy.baselineYears *
    100


  const [activeTab, setActiveTab] = useState<'home' | 'trends'>('home')

  async function signOut() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <>
      <WeatherMotionBackdrop
        weatherCode={env.weather?.code ?? null}
        isDay={env.weather?.isDay ?? null}
      />
      <div className="relative z-10 min-h-svh overflow-x-hidden font-sans text-slate-800 selection:bg-sky-500/30">
        <div className="relative mx-auto max-w-[1380px] p-4 md:p-6 lg:p-10">
          <div
            className="flex flex-col overflow-hidden rounded-[1.75rem] border border-white/55 bg-white/30 shadow-[0_25px_80px_-12px_rgba(14,116,144,0.35),inset_0_1px_0_0_rgba(255,255,255,0.7)] backdrop-blur-2xl lg:flex-row lg:min-h-[760px]"
          >
            <Sidebar profile={profile} onSignOut={signOut} activeTab={activeTab} setActiveTab={setActiveTab} />

            <div className="flex min-w-0 flex-1 flex-col gap-6 p-5 md:p-8">
              <DashboardHeader profile={profile} geo={geo} placeLabel={env.placeLabel} onRefreshGps={refresh} />

              <p className="text-xs leading-relaxed text-slate-600/90 md:text-[13px]">
                All estimates are illustrative and for educational purposes only — not medical advice.
              </p>

              {activeTab === 'trends' ? (
                <TrendsPanel env={env} espBreathRate={espBreathRate} espBreathTemp={espBreathTemp} breathRateHistory={breathRateHistory.current} />
              ) : (
                <>
                  <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
                    <GlassStatCard
                      icon={<IconWind />}
                      label="US AQI"
                      value={env.air?.usAqi != null ? String(env.air.usAqi) : '—'}
                      delta={aqiBand(env.air?.usAqi ?? null).label}
                      deltaPositive={(env.air?.usAqi ?? 100) <= 50}
                      neutralDelta={(env.air?.usAqi ?? 100) > 50 && (env.air?.usAqi ?? 100) <= 100}
                      hint="US Air Quality Index"
                    />
                    <GlassStatCard
                      icon={<IconDroplet />}
                      label="PM2.5"
                      value={env.air?.pm25 != null ? `${env.air.pm25.toFixed(1)}` : '—'}
                      delta="µg/m³"
                      neutralDelta
                      hint="Fine particulate matter"
                    />
                    <GlassStatCard
                      icon={<IconDroplet />}
                      label="PM10"
                      value={env.air?.pm10 != null ? `${env.air.pm10.toFixed(1)}` : '—'}
                      delta="µg/m³"
                      neutralDelta
                      hint="Coarse particulate matter"
                    />
                    <GlassStatCard
                      icon={<IconSun />}
                      label="Temperature"
                      value={
                        env.weather ? `${Math.round(env.weather.temperatureC)}°C` : geo.status === 'ok' && env.loading ? '…' : '—'
                      }
                      delta={env.weather ? weatherLabel(env.weather.code) : 'Live'}
                      neutralDelta
                      hint="Current outdoor temperature"
                    />
                    <GlassStatCard
                      icon={<IconHumidity />}
                      label="Humidity"
                      value={env.weather?.humidityPct != null ? `${env.weather.humidityPct}%` : '—'}
                      delta="Relative"
                      neutralDelta
                      hint="Relative humidity"
                    />
                    <GlassStatCard
                      icon={<IconHeart />}
                      label="Risk Profile"
                      value={formatLifePct(expectancyDeltaPct)}
                      delta={aiResult ? `AI: ${aiResult.overallRisk}` : 'No scan'}
                      deltaPositive={expectancyDeltaPct >= 0}
                      hint="Baseline health deviation"
                    />
                  </section>

                  <section className="flex flex-col lg:flex-row gap-5 lg:gap-6 flex-1 items-start">
                    <div className="w-full lg:w-2/3 flex flex-col">
                      {aiLoading ? (
                        <div className="flex h-full min-h-[300px] flex-col items-center justify-center rounded-2xl border border-indigo-200/50 bg-indigo-50/30 p-5 shadow-lg backdrop-blur-xl">
                          <span className="animate-spin mb-3" style={{ animationDuration: '3s', display: 'flex' }}>
                            <IconSparkle className="size-8 text-indigo-400" />
                          </span>
                          <p className="font-display text-lg font-medium text-slate-800">Analyzing…</p>
                          <p className="text-indigo-600 text-sm font-bold mt-2 animate-pulse">Processing your health data</p>
                        </div>
                      ) : aiResult ? (
                        <AiResultsGlassPanel result={aiResult} />
                      ) : (
                        <div className="flex h-full min-h-[300px] flex-col items-center justify-center rounded-2xl border border-indigo-200/50 bg-indigo-50/30 p-5 shadow-lg backdrop-blur-xl">
                          <IconSparkle className="size-8 text-indigo-300 mb-3 animate-pulse" />
                          <p className="font-display text-lg font-medium text-slate-800">AI Standby</p>
                          <p className="text-sm text-slate-500 mt-1 max-w-sm text-center">Connect your ESP device to stream live data and instantly trigger a personalized health analysis.</p>
                          {aiError && <p className="text-red-600 text-sm font-bold mt-4 max-w-sm text-center">{aiError}</p>}
                        </div>
                      )}
                    </div>

                    <div className="w-full lg:w-1/3 grid grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3 md:gap-4 flex-shrink-0">
                      <div className={`col-span-2 flex flex-col rounded-2xl border p-4 shadow-md backdrop-blur-xl transition ${deviceConnected ? 'border-sky-300 bg-sky-50/50' : 'border-white/55 bg-white/40'}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex size-9 items-center justify-center rounded-lg border border-white/55 bg-white/50 text-slate-700">
                              <IconActivity />
                            </div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">ESP Core Sensor</p>
                          </div>
                          <button type="button" onClick={() => setDeviceConnected(!deviceConnected)} className={`px-3 py-1.5 text-[10px] tracking-wider font-bold rounded-full ${deviceConnected ? 'bg-sky-500 text-white shadow-md cursor-pointer ring-2 ring-sky-300 ring-offset-1' : 'bg-slate-200 text-slate-600 hover:bg-slate-300 cursor-pointer'}`}>
                            {deviceConnected ? 'ONLINE & STREAMING' : 'CONNECT BLUETOOTH'}
                          </button>
                        </div>
                        {deviceConnected ? (
                          <div className="mt-4 flex flex-col gap-3 border-t border-sky-100/50 pt-4">
                            <div className="flex items-center justify-around">
                              <div className="flex flex-col items-center">
                                <CircularGauge value={espBreathRate} max={40} size={72} strokeWidth={6} label={String(espBreathRate)} subLabel="BPM" colorClass={espBreathRate > 20 ? 'text-amber-500' : 'text-sky-500'} />
                              </div>
                              <div className="flex flex-col items-center">
                                <CircularGauge value={espBreathTemp} max={42} size={72} strokeWidth={6} label={espBreathTemp.toFixed(1)} subLabel="°C" colorClass={espBreathTemp > 36.5 ? 'text-rose-500' : 'text-emerald-500'} />
                              </div>
                            </div>
                            <div className="mt-4 flex flex-col gap-3 relative bg-white/40 p-3 rounded-xl border border-white/50">
                              <label className="text-[9px] font-bold uppercase text-sky-600 absolute -top-2 left-3 bg-white/80 px-1 rounded">Simulation Inputs</label>
                              <div className="flex items-center gap-3">
                                <span className="text-[10px] w-8 font-bold text-slate-500">BPM</span>
                                <input type="range" min="8" max="30" value={espBreathRate} onChange={e => setEspBreathRate(Number(e.target.value))} className="w-full accent-sky-500" title="Mock Breath Rate" />
                                <span className="text-[10px] font-mono w-5 text-slate-700">{espBreathRate}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-[10px] w-8 font-bold text-slate-500">°C</span>
                                <input type="range" min="30" max="40" step="0.1" value={espBreathTemp} onChange={e => setEspBreathTemp(Number(e.target.value))} className="w-full accent-rose-400" title="Mock Temp" />
                                <span className="text-[10px] font-mono w-8 text-slate-700">{espBreathTemp.toFixed(1)}</span>
                              </div>
                            </div>
                            {aiLoading && (
                              <p className="text-[10px] text-indigo-500 font-bold text-center animate-pulse">↺ Re-analyzing with new values…</p>
                            )}
                          </div>
                        ) : (
                          <p className="mt-4 font-display text-lg font-semibold text-slate-400 text-center">Device Offline</p>
                        )}
                      </div>
                      <QuickTile icon={<IconUser />} title="Age" value={String(profile.age)} />
                      <QuickTile
                        icon={<IconUsers />}
                        title="Sex"
                        value={profile.sex.charAt(0).toUpperCase() + profile.sex.slice(1)}
                      />
                      <QuickTile
                        icon={<IconFlame />}
                        title="Smoking"
                        value={profile.smokingStatus === 'active' ? 'Active' : profile.smokingStatus === 'previously' ? 'Previously' : 'Never'}
                        warn={profile.smokingStatus === 'active'}
                      />
                      <QuickTile
                        icon={<IconDna />}
                        title="Family history"
                        value={profile.familyIllness ? 'Flagged' : 'No'}
                        warn={profile.familyIllness}
                      />
                    </div>
                  </section>

                  <section className="grid gap-4 lg:grid-cols-2">
                    <EnvironmentGlassPanel geo={geo} env={env} refresh={refresh} setCustomCoords={setCustomCoords} />
                    <RiskGlassPanel profile={profile} expectancy={expectancy} />
                  </section>
                </>
              )}
            </div>
          </div>
        </div>
        <Chatbot context={{
          breathRate: deviceConnected ? espBreathRate : undefined,
          breathTemp: deviceConnected ? espBreathTemp : undefined,
          aqi: env.air?.usAqi ?? undefined,
          pm25: env.air?.pm25 ?? undefined,
          pm10: env.air?.pm10 ?? undefined,
          tempC: env.weather?.temperatureC ?? undefined,
          humidity: env.weather?.humidityPct ?? undefined,
          placeLabel: env.placeLabel,
          age: profile.age,
          sex: profile.sex,
          smoker: profile.smokingStatus === 'active',
          familyHistory: profile.familyIllness,
          aiRisk: aiResult?.overallRisk,
          aiScore: aiResult?.overallRiskScore,
        } satisfies ChatContext} />
      </div>
    </>
  )
}

function Sidebar({ profile, onSignOut, activeTab, setActiveTab }: {
  profile: UserProfile
  onSignOut: () => void
  activeTab: 'home' | 'trends'
  setActiveTab: (t: 'home' | 'trends') => void
}) {
  return (
    <aside className="flex shrink-0 flex-col border-b border-white/40 bg-white/20 backdrop-blur-xl lg:w-56 lg:border-b-0 lg:border-r lg:border-white/40">
      <div className="flex items-center justify-between gap-2 px-5 py-5 lg:flex-col lg:items-stretch lg:gap-4">
        <div className="flex items-center gap-2">
          <span className="font-display text-xl font-bold tracking-tight text-slate-800">BreathSense</span>
        </div>
      </div>
      <nav className="flex flex-wrap gap-1 px-3 pb-3 lg:flex-col lg:px-4 lg:pb-4">
        <NavPill active={activeTab === 'home'} icon={<IconHome />} label="Home" onClick={() => setActiveTab('home')} />
        <NavPill icon={<IconUser />} label="Profile" to="/settings" />
        <NavPill active={activeTab === 'trends'} icon={<IconChart />} label="Trends" onClick={() => setActiveTab('trends')} />
      </nav>
      <div className="mt-auto hidden border-t border-white/30 p-4 lg:block">
        <div className="flex items-center gap-3 rounded-xl bg-white/35 p-3 backdrop-blur-sm">
          <div className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-cyan-500 text-sm font-semibold text-white shadow-md">
            {profile.displayName.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-800">{profile.displayName}</p>
            <button
              type="button"
              onClick={onSignOut}
              className="text-xs font-medium text-sky-800/80 hover:text-sky-950"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}

function NavPill({
  icon,
  label,
  active,
  to,
  onClick,
}: {
  icon: ReactNode
  label: string
  active?: boolean
  to?: string
  onClick?: () => void
}) {
  const cls = `flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition lg:w-full ${active
    ? 'bg-white/55 text-slate-900 shadow-sm'
    : 'text-slate-600 hover:bg-white/35 hover:text-slate-800'
    }`
  if (to) {
    return (
      <Link to={to} className={cls}>
        {icon}
        <span>{label}</span>
      </Link>
    )
  }
  return (
    <button type="button" onClick={onClick} className={`${cls} text-left`}>
      {icon}
      <span>{label}</span>
    </button>
  )
}



function DashboardHeader({
  profile, geo, placeLabel, onRefreshGps
}: {
  profile: UserProfile
  geo: GeoState
  placeLabel: string | null
  onRefreshGps: () => void
}) {
  const locStatus = geo.status
  const locLabel =
    locStatus === 'ok' ? 'GPS on' :
    locStatus === 'pending' ? 'Locating…' :
    'Enable GPS'
  const locColor =
    locStatus === 'ok' ? 'text-emerald-600' :
    locStatus === 'pending' ? 'text-amber-500' :
    'text-slate-400'

  return (
    <header className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
          Hello, {profile.displayName}
        </h1>
        {placeLabel ? (
          <p className="mt-1 text-sm text-slate-600 flex items-center gap-1.5">
            <IconMapPin className="size-3.5 text-sky-500" />
            <span className="font-medium text-sky-700">{placeLabel}</span>
          </p>
        ) : (
          <p className="mt-1 text-sm text-slate-500">How are your signals today?</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {/* Location refresh button */}
        <button
          type="button"
          onClick={onRefreshGps}
          title={locLabel}
          className="flex items-center gap-1.5 rounded-full border border-white/55 bg-white/40 px-3 py-1.5 text-xs font-semibold shadow-sm backdrop-blur-sm transition hover:bg-white/65"
        >
          <IconMapPin className={`size-3.5 ${locColor}`} />
          <span className={locColor}>{locLabel}</span>
        </button>
        <UserMenu profile={profile} align="right" />
      </div>
    </header>
  )
}


function GlassStatCard({
  icon,
  label,
  value,
  delta,
  deltaPositive,
  neutralDelta,
  hint,
  hideCornerDelta,
}: {
  icon: ReactNode
  label: string
  value: string
  delta?: string
  deltaPositive?: boolean
  neutralDelta?: boolean
  hint: string
  hideCornerDelta?: boolean
}) {
  const deltaCls = neutralDelta
    ? 'bg-slate-100/70 text-slate-600'
    : (deltaPositive ?? false)
      ? 'bg-emerald-100/70 text-emerald-700'
      : 'bg-rose-100/70 text-rose-700'
  return (
    <div className="rounded-2xl border border-white/55 bg-white/40 p-4 shadow-md backdrop-blur-xl transition hover:bg-white/50 md:p-5">
      <div className="flex items-start justify-between gap-2">
        <span className="flex size-9 items-center justify-center rounded-xl border border-white/50 bg-white/50 text-sky-700 shadow-sm">
          {icon}
        </span>
        {!hideCornerDelta && delta != null && (
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${deltaCls}`}>{delta}</span>
        )}
      </div>
      <p className="mt-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="font-display mt-1 text-2xl font-bold tabular-nums tracking-tight text-slate-900">
        {value}
      </p>
      <p className="mt-1 text-[11px] leading-snug text-slate-500">{hint}</p>
    </div>
  )
}

function QuickTile({
  icon,
  title,
  value,
  subtitle,
  muted,
  warn,
}: {
  icon: ReactNode
  title: string
  value: string
  subtitle?: string
  muted?: boolean
  warn?: boolean
}) {
  return (
    <div
      className={`flex flex-col rounded-2xl border p-4 shadow-md backdrop-blur-xl transition hover:bg-white/55 ${warn
        ? 'border-amber-200/80 bg-amber-50/45'
        : muted
          ? 'border-white/45 bg-white/30'
          : 'border-white/55 bg-white/40'
        }`}
    >
      <div className="flex size-9 items-center justify-center rounded-lg border border-white/55 bg-white/50 text-slate-700">
        {icon}
      </div>
      <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <p className="mt-1 font-display text-lg font-semibold text-slate-900">{value}</p>
      {subtitle && <p className="mt-0.5 text-[11px] text-slate-500">{subtitle}</p>}
    </div>
  )
}

function EnvironmentGlassPanel({
  geo,
  env,
  refresh,
  setCustomCoords,
}: {
  geo: GeoState
  env: ReturnType<typeof useEnvironmentData>
  refresh: () => void
  setCustomCoords: (coords: { lat: number, lon: number } | null) => void
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (query.trim().length <= 2) {
      setResults([])
      return
    }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5`)
        const data = await res.json()
        setResults(data.results || [])
        setShowDropdown(true)
      } catch (err) { }
    }, 300)
    return () => clearTimeout(t)
  }, [query])

  function selectLocation(loc: any) {
    setCustomCoords({ lat: loc.latitude, lon: loc.longitude })
    setQuery('')
    setShowDropdown(false)
    setResults([])
  }

  const aqi = env.air?.usAqi ?? null
  const aqiInfo = aqiBand(aqi)

  return (
    <div className="flex flex-col h-full rounded-2xl border border-white/55 bg-white/35 p-5 shadow-lg backdrop-blur-xl md:p-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-base font-semibold text-slate-800">Location &amp; Air Quality</h2>
        {geo.status === 'denied' && <button onClick={refresh} className="text-[10px] uppercase font-bold text-sky-600">Retry GPS</button>}
      </div>

      {/* Location search — weather-app style */}
      <div className="relative mb-4" ref={dropdownRef}>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <IconSearch className="size-4" />
          </span>
          <input
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setShowDropdown(true); }}
            onFocus={() => { if (results.length > 0) setShowDropdown(true); }}
            placeholder="Search location…"
            className="w-full rounded-xl border border-white/60 bg-white/60 py-2.5 pl-9 pr-3 text-sm text-slate-800 shadow-inner outline-none focus:ring-2 focus:ring-sky-400/30 font-medium"
          />
        </div>
        {showDropdown && results.length > 0 && (
          <div className="absolute z-50 mt-1 w-full rounded-xl border border-white/60 bg-white/95 p-1 shadow-xl backdrop-blur-2xl max-h-52 overflow-y-auto">
            {results.map((loc, i) => (
              <button
                key={i}
                onClick={() => selectLocation(loc)}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-sky-50"
              >
                <IconMapPin className="size-3.5 text-sky-400 shrink-0" />
                <div>
                  <span className="block font-semibold text-sm text-slate-800">{loc.name}</span>
                  <span className="text-[10px] text-slate-500">{loc.admin1 ? `${loc.admin1}, ` : ''}{loc.country}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {geo.status === 'pending' && !env.placeLabel && (
        <p className="text-sm text-slate-500 animate-pulse">Locating you…</p>
      )}

      {/* Compact stats grid — shown when data is loaded */}
      {env.weather && env.air && (
        <div className="flex flex-col gap-3 flex-1">
          <div className="flex gap-3 items-center bg-white/40 border border-white/50 rounded-xl p-3 shadow-sm">
            <div className="shrink-0">
              <CircularGauge
                value={aqi ?? 0}
                max={200}
                size={72}
                strokeWidth={7}
                label={String(aqi || '—')}
                subLabel="AQI"
                colorClass={aqi != null && aqi > 100 ? 'text-amber-500' : 'text-emerald-500'}
              />
            </div>
            <div className="flex-1 flex flex-col gap-1">
              <span className={`self-start rounded-full px-2.5 py-0.5 text-[10px] font-bold ${aqiInfo.className} bg-white/60 border border-white/40`}>
                {aqiInfo.label}
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { label: 'PM2.5', value: `${env.air.pm25?.toFixed(1) ?? '—'} µg` },
                  { label: 'PM10', value: `${env.air.pm10?.toFixed(1) ?? '—'} µg` },
                  { label: 'Temp', value: `${env.weather.temperatureC.toFixed(1)}°C` },
                  { label: 'Humidity', value: `${env.weather.humidityPct ?? '—'}%` },
                ].map(s => (
                  <div key={s.label} className="flex flex-col bg-white/40 rounded-lg px-2 py-1 border border-white/40">
                    <span className="text-[9px] uppercase font-bold text-slate-400">{s.label}</span>
                    <span className="text-xs font-bold text-slate-800">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Air Quality Trend sparkline */}
          {env.air.hourlyAqi && env.air.hourlyAqi.length >= 2 && (
            <div className="bg-white/40 border border-white/50 rounded-xl p-3 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">AQI Trend (24 h)</p>
              <div className="h-10 w-full">
                <SparkTrendline
                  data={env.air.hourlyAqi}
                  width={400}
                  height={40}
                  color={(aqi ?? 0) > 100 ? '#f59e0b' : '#10b981'}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[9px] text-slate-400">Earlier</span>
                <span className="text-[9px] text-slate-400">Now</span>
              </div>
            </div>
          )}
        </div>
      )}

      {env.loading && !env.weather && (
        <p className="text-sm text-slate-500 animate-pulse mt-2">Fetching weather &amp; air quality…</p>
      )}
      {env.error && <p className="text-sm text-red-600 mt-2">{env.error}</p>}
    </div>
  )
}

function RiskGlassPanel({
  profile,
  expectancy,
}: {
  profile: UserProfile
  expectancy: ReturnType<typeof estimateLifeExpectancyYears>
}) {
  return (
    <div className="rounded-2xl border border-white/55 bg-white/35 p-5 shadow-lg backdrop-blur-xl md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-base font-semibold text-slate-800">Risk Factors & Adjustments</h2>
        <Link
          to="/settings"
          className="text-xs font-semibold text-sky-700 hover:text-sky-900 transition"
        >
          Edit →
        </Link>
      </div>

      <div className="space-y-3 mb-5">
        <RiskFactorRow
          label="Smoking status"
          value={profile.smokingStatus === 'active' ? 'Active smoker' : profile.smokingStatus === 'previously' ? 'Previously smoked' : 'Never smoked'}
          risk={profile.smokingStatus === 'active'}
          description={profile.smokingStatus === 'active' ?
            'Active smoking significantly reduces life expectancy' :
            profile.smokingStatus === 'previously' ?
              'Previously smoking has moderate impact on health expectations' :
              'Great! Keep it up.'}
        />
        <RiskFactorRow
          label="Family history"
          value={profile.familyIllness ? 'History of illness' : 'No known risk'}
          risk={profile.familyIllness}
          description={profile.familyIllness ?
            'Family history can increase risk for hereditary conditions' :
            'No significant genetic risk factors indicated.'}
        />
      </div>

      <div className="border-t border-white/30 pt-4">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Risk Factor Adjustments
        </p>
        <ul className="space-y-2 text-sm">
          {expectancy.adjustments.map((a) => {
            const pctChange = expectancy.baselineYears > 0
              ? ((a.years / expectancy.baselineYears) * 100)
              : 0
            const pctStr = pctChange === 0 ? '—' : `${pctChange > 0 ? '+' : ''}${pctChange.toFixed(1)}%`
            return (
              <li key={a.label} className="flex justify-between items-center gap-4 pb-2 last:pb-0">
                <span className="text-slate-600">{a.label}</span>
                <span className={`font-semibold tabular-nums px-3 py-1 rounded-full text-xs ${a.years < 0
                  ? 'bg-amber-100/60 text-amber-900'
                  : a.years > 0
                    ? 'bg-emerald-100/60 text-emerald-900'
                    : 'bg-slate-100/60 text-slate-700'
                  }`}>
                  {pctStr}
                </span>
              </li>
            )
          })}
        </ul>
      </div>

      <p className="mt-4 text-[10px] text-slate-500 italic">
        All estimates are illustrative and for educational purposes only — not medical advice.
      </p>
    </div>
  )
}

function RiskFactorRow({
  label,
  value,
  risk,
  description,
}: {
  label: string
  value: string
  risk: boolean
  description: string
}) {
  return (
    <div className={`rounded-xl border p-3 backdrop-blur-sm transition ${risk
      ? 'border-amber-200/80 bg-amber-50/45'
      : 'border-emerald-200/80 bg-emerald-50/45'
      }`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">{label}</p>
          <p className={`mt-1 font-semibold ${risk ? 'text-amber-900' : 'text-emerald-900'
            }`}>
            {value}
          </p>
        </div>
        <span className="text-lg">
          {risk ? '⚠️' : '✓'}
        </span>
      </div>
      <p className="mt-2 text-xs text-slate-600">{description}</p>
    </div>
  )
}


// ─── Trends Panel ────────────────────────────────────────────────────────────

const VB_PAD = { l: 32, r: 8, t: 10, b: 24 }

function GridAreaChart({
  data, color, unit = '', id,
}: {
  data: number[]; color: string; id: string; unit?: string
}) {
  if (data.length < 2) return (
    <div className="h-full w-full flex items-center justify-center text-xs text-slate-400">No data yet</div>
  )
  const W = 300, H = 100
  const iw = W - VB_PAD.l - VB_PAD.r
  const ih = H - VB_PAD.t - VB_PAD.b
  const min = Math.min(...data), max = Math.max(...data)
  const range = max - min || 1

  const px = (i: number) => VB_PAD.l + (i / (data.length - 1)) * iw
  const py = (v: number) => VB_PAD.t + ih - ((v - min) / range) * ih

  const pts = data.map((v, i) => [px(i), py(v)] as [number, number])
  const linePath = 'M ' + pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' L ')
  const areaPath = `M ${VB_PAD.l},${VB_PAD.t + ih} ` + pts.map(([x, y]) => `L ${x.toFixed(1)},${y.toFixed(1)}`).join(' ') + ` L ${VB_PAD.l + iw},${VB_PAD.t + ih} Z`

  const ticks = [0, 0.25, 0.5, 0.75, 1]
  const yTicks = ticks.map(t => ({ y: VB_PAD.t + ih * (1 - t), val: (min + range * t).toFixed(1) }))

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`grad-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="90%" stopColor={color} stopOpacity="0.01" />
        </linearGradient>
      </defs>
      {/* Gridlines */}
      {yTicks.map((t, i) => (
        <g key={i}>
          <line x1={VB_PAD.l} y1={t.y} x2={VB_PAD.l + iw} y2={t.y} stroke="#e2e8f0" strokeWidth="0.5" />
          <text x={VB_PAD.l - 2} y={t.y + 2} textAnchor="end" fontSize="7" fill="#94a3b8">{t.val}{unit}</text>
        </g>
      ))}
      {/* Area fill */}
      <path d={areaPath} fill={`url(#grad-${id})`} />
      {/* Line */}
      <path d={linePath} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Latest dot */}
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="3" fill={color} />
      {/* X-axis baseline */}
      <line x1={VB_PAD.l} y1={VB_PAD.t + ih} x2={VB_PAD.l + iw} y2={VB_PAD.t + ih} stroke="#cbd5e1" strokeWidth="0.7" />
    </svg>
  )
}

function GridBarChart({
  data, color, labels, id,
}: {
  data: number[]; color: string; labels: string[]; id: string
}) {
  if (!data.length) return null
  const W = 300, H = 110
  const iw = W - VB_PAD.l - VB_PAD.r
  const ih = H - VB_PAD.t - VB_PAD.b
  const max = Math.max(...data) || 1
  const bw = iw / data.length
  const yTicks = [0, 0.5, 1].map(t => ({
    y: VB_PAD.t + ih * (1 - t),
    val: Math.round(max * t),
  }))

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`bg-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.9" />
          <stop offset="100%" stopColor={color} stopOpacity="0.4" />
        </linearGradient>
      </defs>
      {/* Y gridlines */}
      {yTicks.map((t, i) => (
        <g key={i}>
          <line x1={VB_PAD.l} y1={t.y} x2={VB_PAD.l + iw} y2={t.y} stroke="#e2e8f0" strokeWidth="0.5" />
          <text x={VB_PAD.l - 2} y={t.y + 2} textAnchor="end" fontSize="7" fill="#94a3b8">{t.val}</text>
        </g>
      ))}
      {/* Bars */}
      {data.map((v, i) => {
        const bh = (v / max) * ih
        const x = VB_PAD.l + i * bw + bw * 0.12
        return (
          <g key={i}>
            <rect x={x} y={VB_PAD.t + ih - bh} width={bw * 0.76} height={bh} rx="2" fill={`url(#bg-${id})`} />
            <text x={x + bw * 0.38} y={VB_PAD.t + ih + 10} textAnchor="middle" fontSize="6.5" fill="#94a3b8">
              {labels[i] ?? ''}
            </text>
          </g>
        )
      })}
      {/* Baseline */}
      <line x1={VB_PAD.l} y1={VB_PAD.t + ih} x2={VB_PAD.l + iw} y2={VB_PAD.t + ih} stroke="#cbd5e1" strokeWidth="0.7" />
    </svg>
  )
}

function TrendsCard({
  title, subtitle, value, unit, badge, children,
}: {
  title: string; subtitle?: string; value: string; unit: string; badge?: React.ReactNode; children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-white/55 bg-white/35 p-4 shadow-md backdrop-blur-xl flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 truncate">{title}</p>
          {subtitle && <p className="text-[10px] text-slate-400 mt-0.5 truncate">{subtitle}</p>}
        </div>
        <div className="flex flex-col items-end shrink-0">
          <span className="font-display text-xl font-bold text-slate-900 leading-none">{value}<span className="text-xs text-slate-500 ml-1 font-normal">{unit}</span></span>
          {badge}
        </div>
      </div>
      <div className="h-[90px] w-full">{children}</div>
    </div>
  )
}

function TrendsPanel({
  env, espBreathRate, espBreathTemp, breathRateHistory,
}: {
  env: ReturnType<typeof useEnvironmentData>
  espBreathRate: number
  espBreathTemp: number
  breathRateHistory: number[]
}) {
  const tempBase = env.weather?.temperatureC ?? 25
  const humBase = env.weather?.humidityPct ?? 60

  // Stable simulated 12h series — only recomputed when the base value changes
  const tempData = useMemo(() =>
    Array.from({ length: 13 }, (_, i) => +(tempBase + Math.sin((i - 6) * 0.45) * 2.2 + Math.sin(i * 1.7) * 0.6).toFixed(2)),
    [tempBase]
  )
  const humData = useMemo(() =>
    Array.from({ length: 13 }, (_, i) => +(humBase + Math.cos((i - 6) * 0.4) * 4.5 + Math.sin(i * 1.3) * 1.2).toFixed(2)),
    [humBase]
  )

  const aqiBase = env.air?.usAqi ?? 40
  const aqiRaw = env.air?.hourlyAqi ?? []
  const aqiData = aqiRaw.length >= 6 ? aqiRaw : useMemo(() =>
    Array.from({ length: 24 }, (_, i) => +(aqiBase + Math.sin(i * 0.5) * 6 + Math.sin(i * 1.2) * 3).toFixed(1)),
    [aqiBase]
  )
  const pm25Val = env.air?.pm25 ?? (aqiBase * 0.38)
  const pm25Data = useMemo(() =>
    Array.from({ length: 13 }, (_, i) => +(pm25Val + Math.sin(i * 0.6) * 1.8 + Math.cos(i * 1.4) * 0.8).toFixed(2)),
    [pm25Val]
  )

  const bpmData = breathRateHistory.length >= 3
    ? breathRateHistory
    : useMemo(() => Array.from({ length: 10 }, (_, i) => +(espBreathRate + Math.sin(i * 0.8) * 1.2).toFixed(1)), [espBreathRate])

  const tempData2 = useMemo(() =>
    Array.from({ length: 10 }, (_, i) => +(espBreathTemp + Math.sin(i * 0.7) * 0.25).toFixed(2)),
    [espBreathTemp]
  )

  const weekAqi = useMemo(() => {
    const base = aqiBase
    return Array.from({ length: 7 }, (_, i) => +(base + Math.sin(i * 0.9) * 7 + Math.sin(i * 2.3) * 3).toFixed(1))
  }, [aqiBase])

  const today = new Date()
  const dayLabels = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today); d.setDate(d.getDate() - 6 + i)
    return d.toLocaleDateString('en', { weekday: 'short' })
  })

  const aqiColor = aqiBase > 100 ? '#f59e0b' : '#10b981'
  const bpmColor = espBreathRate > 20 ? '#f59e0b' : '#0ea5e9'
  const tempBColor = espBreathTemp > 36.5 ? '#f43f5e' : '#34d399'

  return (
    <div className="flex flex-col gap-5 pb-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-semibold text-slate-900">Trends &amp; Analytics</h2>
        <span className="text-xs text-slate-500 bg-white/40 border border-white/50 px-2.5 py-1 rounded-full">
          {env.placeLabel ?? 'Live data'}
        </span>
      </div>

      {/* Environmental row */}
      <div className="grid sm:grid-cols-2 gap-4">
        <TrendsCard title="Temperature (12 h)" subtitle="Outdoor ambient · Open-Meteo"
          value={tempBase.toFixed(1)} unit="°C">
          <GridAreaChart data={tempData} color="#f59e0b" id="temp" unit="°" />
        </TrendsCard>
        <TrendsCard title="Humidity (12 h)" subtitle="Relative outdoor"
          value={humBase.toFixed(0)} unit="%">
          <GridAreaChart data={humData} color="#0ea5e9" id="hum" unit="%" />
        </TrendsCard>
      </div>

      {/* AQI row */}
      <div className="grid sm:grid-cols-2 gap-4">
        <TrendsCard
          title="AQI — Hourly (24 h)" subtitle={aqiRaw.length >= 6 ? 'Open-Meteo live' : 'Estimated trend'}
          value={env.air?.usAqi != null ? String(env.air.usAqi) : '—'} unit="AQI"
          badge={<span className={`text-[9px] font-bold mt-0.5 ${aqiColor === '#10b981' ? 'text-emerald-600' : 'text-amber-600'}`}>{aqiColor === '#10b981' ? 'Good' : 'Moderate'}</span>}
        >
          <GridAreaChart data={aqiData} color={aqiColor} id="aqi" />
        </TrendsCard>
        <TrendsCard title="PM2.5 (24 h)" subtitle="Fine particulate matter"
          value={env.air?.pm25 != null ? env.air.pm25.toFixed(1) : pm25Val.toFixed(1)} unit="µg/m³">
          <GridAreaChart data={pm25Data} color="#a78bfa" id="pm25" unit="" />
        </TrendsCard>
      </div>

      {/* Breath sensor row */}
      <div className="grid sm:grid-cols-2 gap-4">
        <TrendsCard title="Breath Rate — Session" subtitle="ESP sensor live history"
          value={String(espBreathRate)} unit="BPM"
          badge={<span className={`text-[9px] font-bold mt-0.5 ${espBreathRate > 20 ? 'text-amber-600' : 'text-emerald-600'}`}>{espBreathRate > 20 ? '⚠ Elevated' : '✓ Normal'}</span>}
        >
          <GridAreaChart data={bpmData} color={bpmColor} id="bpm" unit="" />
        </TrendsCard>
        <TrendsCard title="Breath Temp — Session" subtitle="Exhaled air temperature"
          value={espBreathTemp.toFixed(1)} unit="°C"
          badge={<span className={`text-[9px] font-bold mt-0.5 ${espBreathTemp > 36.5 ? 'text-rose-600' : 'text-emerald-600'}`}>{espBreathTemp > 36.5 ? '⚠ Elevated' : '✓ Normal'}</span>}
        >
          <GridAreaChart data={tempData2} color={tempBColor} id="btemp" unit="°" />
        </TrendsCard>
      </div>

      {/* Full-width weekly AQI bar */}
      <div className="rounded-2xl border border-white/55 bg-white/35 p-4 shadow-md backdrop-blur-xl">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Weekly AQI Breakdown</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Last 7 days · estimated from current baseline</p>
          </div>
          <span className="font-display text-xl font-bold text-slate-900">{env.air?.usAqi ?? '—'} <span className="text-xs text-slate-500 font-normal">AQI today</span></span>
        </div>
        <div className="h-[110px] w-full">
          <GridBarChart data={weekAqi} color={aqiColor} labels={dayLabels} id="week" />
        </div>
      </div>

      <p className="text-[9px] text-slate-400 text-center">
        Simulated trends fill gaps when API history is insufficient. Live data shows when ESP is connected.
      </p>
    </div>
  )
}



function IconHome() {
  return (
    <svg className="size-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l9-9 9 9M4 10v10a1 1 0 001 1h5m6-11v10a1 1 0 01-1 1h-5m-6 0h6" />
    </svg>
  )
}
function IconUser() {
  return (
    <svg className="size-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  )
}
function IconChart() {
  return (
    <svg className="size-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  )
}
function IconMapPin({ className = 'size-4 shrink-0' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}
function IconActivity() {
  return (
    <svg className="size-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  )
}
function IconSparkle({ className = 'size-4 shrink-0' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  )
}
function IconHeart() {
  return (
    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  )
}
function IconSun({ className = 'size-4 shrink-0' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  )
}
function IconWind({ className = 'size-4 shrink-0' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9M3 9h6m12 0a4 4 0 00-4-4h-5M3 12h15" />
    </svg>
  )
}
function IconSearch({ className = 'size-4 shrink-0' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  )
}
function IconUsers() {
  return (
    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  )
}
function IconFlame() {
  return (
    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.962 7.962 0 0120 13a7.962 7.962 0 01-2.343 5.657z" />
    </svg>
  )
}
function IconDna() {
  return (
    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 4v16M17 4v16M7 4h5c1.5 0 3 1 3 3s-1.5 3-3 3H7m10 8H12c-1.5 0-3-1-3-3s1.5-3 3-3h5" />
    </svg>
  )
}
function IconDroplet() {
  return (
    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C12 2 5 10.5 5 15a7 7 0 0014 0C19 10.5 12 2 12 2z" />
    </svg>
  )
}
function IconHumidity() {
  return (
    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
    </svg>
  )
}

function AiResultsGlassPanel({ result }: { result: RiskAnalysisResult }) {
  return (
    <div className="mt-2 rounded-2xl border border-indigo-200/50 bg-indigo-50/30 p-5 shadow-lg backdrop-blur-xl md:p-6 mb-8 col-span-full">
      <div className="flex items-center justify-between mb-4 border-b border-indigo-100/50 pb-3">
        <h2 className="font-display text-lg font-semibold text-indigo-900 flex items-center gap-2">
          <span className="text-indigo-600"><IconSparkle /></span> AI Health Assessment
        </h2>
        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${result.overallRisk === 'Low' ? 'bg-emerald-100/60 text-emerald-800 border-emerald-200' :
          result.overallRisk === 'Moderate' ? 'bg-amber-100/60 text-amber-800 border-amber-200' :
            'bg-rose-100/60 text-rose-800 border-rose-200'
          }`}>
          {result.overallRisk} Risk ({result.overallRiskScore}/100)
        </span>
      </div>

      <p className="text-sm text-slate-700 leading-relaxed font-medium mb-5">{result.summary}</p>

      <div className="grid md:grid-cols-2 gap-4 mb-5 text-sm">
        <div className="rounded-xl bg-white/50 p-4 border border-indigo-100/50 shadow-sm">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 mb-2 flex items-center gap-1.5"><IconActivity /> Breathing Feedback</h3>
          <p className="text-slate-800">{result.breathingStatus}</p>
        </div>
        <div className="rounded-xl bg-white/50 p-4 border border-indigo-100/50 shadow-sm">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 mb-2 flex items-center gap-1.5"><IconWind /> Environmental Impact</h3>
          <p className="text-slate-800">{result.aqiStatus}</p>
        </div>
      </div>

      <div className="mb-5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 ml-1">Key Insights</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          {result.insights?.map((ins, i) => (
            <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border shadow-sm ${ins.severity === 'good' ? 'bg-emerald-50/50 border-emerald-100' :
              ins.severity === 'warning' ? 'bg-amber-50/50 border-amber-200' :
                ins.severity === 'danger' ? 'bg-rose-50/50 border-rose-200' :
                  'bg-sky-50/50 border-sky-100'
              }`}>
              <div className="flex-1">
                <p className="text-xs font-bold text-slate-800">{ins.title}</p>
                <p className="text-xs mt-1 leading-snug text-slate-600">{ins.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 ml-1">Recommendations</h3>
        <ul className="space-y-2">
          {result.recommendations?.map((rec, i) => (
            <li key={i} className="text-sm flex gap-3 items-start text-slate-700 bg-white/30 p-2.5 rounded-lg border border-white/50">
              <span className="text-indigo-500 font-bold mt-0.5">•</span>
              {rec}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
