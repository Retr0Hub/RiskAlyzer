import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { UserProfile } from '../types/user'
import { useAuth } from '../auth/AuthContext'
import { estimateLifeExpectancyYears, yearsRemaining } from '../lib/lifeExpectancy'
import { useGeolocation } from '../hooks/useGeolocation'
import { useEnvironmentData, weatherLabel } from '../hooks/useEnvironmentData'
import type { GeoState } from '../hooks/useGeolocation'
import { WeatherMotionBackdrop } from '../components/WeatherMotionBackdrop'
import { UserMenu } from '../components/UserMenu'

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
  const env = useEnvironmentData(geo)

  const expectancy = useMemo(
    () =>
      estimateLifeExpectancyYears(profile, {
        airQualityAqi: env.air?.usAqi ?? null,
      }),
    [profile, env.air?.usAqi]
  )

  const naiveRemain = Math.max(0, expectancy.baselineYears - profile.age)
  const remain = yearsRemaining(profile, expectancy.adjustedYears)
  const yearsDeltaPct =
    naiveRemain > 0 ? ((remain - naiveRemain) / naiveRemain) * 100 : 0
  const expectancyDeltaPct =
    (expectancy.adjustedYears - expectancy.baselineYears) /
    expectancy.baselineYears *
    100

  const chartData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const targetAqi = env.air?.usAqi ?? 48
    const targetTemp = env.weather?.temperatureC ?? 19
    return months.map((month, i) => {
      const t = i / 11
      const wave = Math.sin(t * Math.PI) * 12
      const aqi = Math.max(12, Math.min(170, targetAqi * (0.72 + t * 0.38) + wave * 0.6))
      const temp = targetTemp + (i - 5.5) * 0.65 + Math.sin(i * 0.9) * 2.2
      return { month, aqi, temp }
    })
  }, [env.air?.usAqi, env.weather?.temperatureC])

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
          <Sidebar profile={profile} onSignOut={signOut} />

          <div className="flex min-w-0 flex-1 flex-col gap-6 p-5 md:p-8">
            <DashboardHeader profile={profile} geo={geo} />

            <p className="text-xs leading-relaxed text-slate-600/90 md:text-[13px]">
              Illustrative only — not medical advice. Live weather &amp; AQI; breath sensor &amp; AI
              connect here when you wire them up.
            </p>

            <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              <GlassStatCard
                icon={<IconHeart />}
                label="Life expectancy vs baseline"
                value={formatLifePct(expectancyDeltaPct)}
                hint="Percent change vs same‑sex population baseline in the model — not a diagnosis."
                hideCornerDelta
              />
              <GlassStatCard
                icon={<IconClock />}
                label="Years-left vs baseline"
                value={formatLifePct(yearsDeltaPct)}
                hint={`Same model vs “no unknown negatives” at age ${profile.age} (still illustrative).`}
                hideCornerDelta
              />
              <GlassStatCard
                icon={<IconSun />}
                label="Temperature"
                value={
                  env.weather ? `${Math.round(env.weather.temperatureC)}°C` : geo.status === 'ok' && env.loading ? '…' : '—'
                }
                delta="Live"
                deltaPositive
                neutralDelta
                hint={env.weather ? weatherLabel(env.weather.code) : 'Location needed'}
              />
              <GlassStatCard
                icon={<IconWind />}
                label="US AQI"
                value={env.air?.usAqi != null ? String(env.air.usAqi) : '—'}
                delta={aqiBand(env.air?.usAqi ?? null).label}
                deltaPositive={(env.air?.usAqi ?? 100) <= 50}
                neutralDelta
                hint={env.air?.pm25 != null ? `PM2.5 ${env.air.pm25.toFixed(1)}` : 'Air quality'}
              />
            </section>

            <section className="grid flex-1 grid-cols-1 gap-5 lg:grid-cols-3 lg:gap-6">
              <div className="lg:col-span-2 flex flex-col rounded-2xl border border-white/55 bg-white/35 p-5 shadow-lg backdrop-blur-xl md:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-display text-lg font-semibold tracking-tight text-slate-800">
                      Environment over time
                    </h2>
                    <p className="mt-1 text-xs text-slate-600">
                      Illustrative 12‑month blend ending near your current AQI &amp; temperature.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 rounded-full border border-white/60 bg-white/40 px-3 py-1.5 text-xs font-medium text-slate-600 backdrop-blur-sm">
                    <span className="inline-flex size-2 rounded-full bg-sky-500" aria-hidden />
                    AQI
                    <span className="mx-1 text-slate-400">|</span>
                    <span className="inline-flex size-2 rounded-full bg-cyan-400" aria-hidden />
                    Temp °C
                  </div>
                </div>

                <div className="mt-6 flex flex-1 flex-col">
                  <div className="relative flex h-48 items-end justify-between gap-1 border-b border-white/40 pb-1 pl-0 pr-0 pt-2 md:h-56 md:gap-2">
                    {chartData.map((d) => (
                      <div
                        key={d.month}
                        className="group flex flex-1 flex-col items-center justify-end gap-1"
                      >
                        <div className="flex h-full w-full max-w-[28px] items-end justify-center gap-0.5 md:max-w-[36px] md:gap-1">
                          <div
                            className="w-[42%] rounded-t-md bg-gradient-to-t from-sky-600/90 to-sky-400/85 shadow-sm transition group-hover:brightness-110"
                            style={{ height: `${Math.min(100, (d.aqi / 180) * 100)}%` }}
                            title={`AQI ~${Math.round(d.aqi)}`}
                          />
                          <div
                            className="w-[42%] rounded-t-md bg-gradient-to-t from-cyan-600/85 to-cyan-300/80 shadow-sm transition group-hover:brightness-110"
                            style={{
                              height: `${Math.min(100, Math.max(8, ((d.temp + 5) / 42) * 100))}%`,
                            }}
                            title={`${d.temp.toFixed(1)}°C`}
                          />
                        </div>
                        <span className="mt-2 text-[10px] font-medium text-slate-500 md:text-xs">
                          {d.month}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-center text-[11px] text-slate-500">
                    Charts are illustrative blends toward current readings — not medical forecasts.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 md:gap-4">
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
                <QuickTile
                  icon={<IconActivity />}
                  title="Breath sensor"
                  value="Connect"
                  muted
                  subtitle="BLE / USB later"
                />
                <QuickTile
                  icon={<IconSparkle />}
                  title="AI insights"
                  value="Soon"
                  muted
                  subtitle="LLM / API"
                />
              </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
              <EnvironmentGlassPanel geo={geo} env={env} refresh={refresh} />
              <RiskGlassPanel profile={profile} expectancy={expectancy} />
            </section>
          </div>
        </div>
      </div>
      </div>
    </>
  )
}

function Sidebar({ profile, onSignOut }: { profile: UserProfile; onSignOut: () => void }) {
  return (
    <aside className="flex shrink-0 flex-col border-b border-white/40 bg-white/20 backdrop-blur-xl lg:w-56 lg:border-b-0 lg:border-r lg:border-white/40">
      <div className="flex items-center justify-between gap-2 px-5 py-5 lg:flex-col lg:items-stretch lg:gap-4">
        <div className="flex items-center gap-2">
          <span className="font-display text-xl font-bold tracking-tight text-slate-800">Riskalyzer</span>
          <button
            type="button"
            className="flex size-8 items-center justify-center rounded-full border border-white/60 bg-white/45 text-slate-700 shadow-sm backdrop-blur-sm transition hover:bg-white/70"
            title="Add metric (placeholder)"
          >
            <IconPlus className="size-4" />
          </button>
        </div>
      </div>
      <nav className="flex flex-wrap gap-1 px-3 pb-3 lg:flex-col lg:px-4 lg:pb-4">
        <NavPill active icon={<IconHome />} label="Home" />
        <NavPill icon={<IconUser />} label="Profile" to="/register" />
        <NavPill icon={<IconChart />} label="Trends" />
        <NavPill icon={<IconMapPin />} label="Environment" />
      </nav>
      <p className="hidden px-4 text-[10px] font-semibold uppercase tracking-widest text-slate-500 lg:block">
        Tools
      </p>
      <nav className="hidden flex-col gap-0.5 px-3 pb-4 lg:flex lg:px-4">
        <NavQuiet icon={<IconActivity />} label="Breath" />
        <NavQuiet icon={<IconSparkle />} label="AI insights" />
        <NavQuiet icon={<IconFile />} label="Reports" />
        <NavQuiet icon={<IconShield />} label="Privacy" />
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
}: {
  icon: ReactNode
  label: string
  active?: boolean
  to?: string
}) {
  const className = `flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition lg:w-full ${
    active
      ? 'bg-white/55 text-slate-900 shadow-sm'
      : 'text-slate-600 hover:bg-white/35 hover:text-slate-800'
  }`
  if (to) {
    return (
      <Link to={to} className={className}>
        {icon}
        <span>{label}</span>
      </Link>
    )
  }
  return (
    <button type="button" className={`${className} text-left`}>
      {icon}
      <span>{label}</span>
    </button>
  )
}

function NavQuiet({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <button
      type="button"
      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-600 transition hover:bg-white/30 hover:text-slate-800"
    >
      {icon}
      {label}
    </button>
  )
}

function DashboardHeader({ profile, geo }: { profile: UserProfile; geo: GeoState }) {
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    const t = window.setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => window.clearInterval(t)
  }, [])
  const h = Math.floor(elapsed / 3600)
  const m = Math.floor((elapsed % 3600) / 60)
  const s = elapsed % 60
  const timer = `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`

  const locHint =
    geo.status === 'ok'
      ? 'Location on'
      : geo.status === 'pending'
        ? 'Locating…'
        : geo.status === 'denied' || geo.status === 'error'
          ? 'Location off'
          : '—'

  return (
    <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
          Hello, {profile.displayName}
        </h1>
        <p className="mt-1 text-sm text-slate-600">How are your signals today?</p>
      </div>
      <div className="flex flex-1 flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-end">
        <div className="relative mx-auto w-full max-w-md sm:mx-0">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <IconSearch className="size-4" />
          </span>
          <input
            type="search"
            readOnly
            placeholder="Search metrics…"
            className="w-full rounded-full border border-white/60 bg-white/45 py-2.5 pl-10 pr-4 text-sm text-slate-800 shadow-inner backdrop-blur-md placeholder:text-slate-400 outline-none ring-sky-400/30 focus:ring-2"
            aria-label="Search metrics (coming soon)"
          />
        </div>
        <div className="flex items-center justify-end gap-2">
          <IconButton title="Tags (placeholder)">
            <IconTag />
          </IconButton>
          <IconButton title="Documents (placeholder)">
            <IconFile />
          </IconButton>
          <IconButton title={locHint}>
            <IconMapPin />
          </IconButton>
          <div
            className="hidden items-center gap-1.5 rounded-full border border-white/55 bg-white/40 px-3 py-1.5 font-mono text-xs font-medium text-slate-700 backdrop-blur-sm sm:flex"
            title="Session timer"
          >
            <span className="text-slate-400">⏱</span>
            {timer}
          </div>
          <UserMenu profile={profile} align="right" />
        </div>
      </div>
    </header>
  )
}

function IconButton({
  children,
  title,
}: {
  children: ReactNode
  title?: string
}) {
  return (
    <button
      type="button"
      title={title}
      className="flex size-10 items-center justify-center rounded-full border border-white/55 bg-white/40 text-slate-600 shadow-sm backdrop-blur-sm transition hover:bg-white/65 hover:text-slate-900"
    >
      {children}
    </button>
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
    ? 'text-slate-500'
    : (deltaPositive ?? false)
      ? 'text-emerald-600'
      : 'text-rose-600'
  return (
    <div className="rounded-2xl border border-white/55 bg-white/40 p-4 shadow-md backdrop-blur-xl transition hover:bg-white/50 md:p-5">
      <div className="flex items-start justify-between gap-2">
        <span className="flex size-10 items-center justify-center rounded-xl border border-white/50 bg-white/50 text-sky-700 shadow-sm">
          {icon}
        </span>
        {!hideCornerDelta && delta != null && (
          <span className={`text-xs font-semibold ${deltaCls}`}>{delta}</span>
        )}
      </div>
      <p className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="font-display mt-1 text-2xl font-bold tabular-nums tracking-tight text-slate-900 md:text-[1.65rem]">
        {value}
      </p>
      <p className="mt-1.5 text-xs leading-snug text-slate-600">{hint}</p>
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
      className={`flex flex-col rounded-2xl border p-4 shadow-md backdrop-blur-xl transition hover:bg-white/55 ${
        warn
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
}: {
  geo: GeoState
  env: ReturnType<typeof useEnvironmentData>
  refresh: () => void
}) {
  return (
    <div className="rounded-2xl border border-white/55 bg-white/35 p-5 shadow-lg backdrop-blur-xl md:p-6">
      <h2 className="font-display text-base font-semibold text-slate-800">Your location</h2>
      {geo.status === 'pending' && <p className="mt-3 text-sm text-slate-600">Requesting location…</p>}
      {(geo.status === 'denied' || geo.status === 'error') && (
        <div className="mt-3 space-y-2">
          <p className="text-sm text-amber-800">{geo.message}</p>
          <button
            type="button"
            onClick={refresh}
            className="rounded-full bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-sky-500"
          >
            Try again
          </button>
        </div>
      )}
      {geo.status === 'ok' && (
        <div className="mt-3 space-y-3">
          <p className="text-sm text-slate-600">
            {env.placeLabel ?? `${geo.latitude.toFixed(2)}°, ${geo.longitude.toFixed(2)}°`}
          </p>
          {env.loading && <p className="text-sm text-slate-600">Loading weather &amp; air…</p>}
          {env.error && <p className="text-sm text-red-700">{env.error}</p>}
          {env.weather && (
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-slate-500">Conditions</dt>
                <dd className="font-medium text-slate-900">{weatherLabel(env.weather.code)}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Humidity</dt>
                <dd className="font-medium text-slate-900">
                  {env.weather.humidityPct != null ? `${env.weather.humidityPct}%` : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Wind</dt>
                <dd className="font-medium text-slate-900">
                  {env.weather.windKmh != null ? `${env.weather.windKmh} km/h` : '—'}
                </dd>
              </div>
            </dl>
          )}
        </div>
      )}
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
          Life Expectancy Adjustments
        </p>
        <ul className="space-y-2 text-sm">
          {expectancy.adjustments.map((a) => (
            <li key={a.label} className="flex justify-between items-center gap-4 pb-2 last:pb-0">
              <span className="text-slate-600">{a.label}</span>
              <span className={`font-semibold tabular-nums px-3 py-1 rounded-full text-xs ${
                a.years < 0 
                  ? 'bg-amber-100/60 text-amber-900' 
                  : a.years > 0 
                  ? 'bg-emerald-100/60 text-emerald-900'
                  : 'bg-slate-100/60 text-slate-700'
              }`}>
                {a.years > 0 ? `+${a.years}y` : a.years === 0 ? '—' : `${a.years}y`}
              </span>
            </li>
          ))}
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
    <div className={`rounded-xl border p-3 backdrop-blur-sm transition ${
      risk
        ? 'border-amber-200/80 bg-amber-50/45'
        : 'border-emerald-200/80 bg-emerald-50/45'
    }`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">{label}</p>
          <p className={`mt-1 font-semibold ${
            risk ? 'text-amber-900' : 'text-emerald-900'
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
function IconMapPin() {
  return (
    <svg className="size-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}
function IconPlus({ className = 'size-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
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
function IconSparkle() {
  return (
    <svg className="size-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  )
}
function IconFile() {
  return (
    <svg className="size-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )
}
function IconShield() {
  return (
    <svg className="size-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  )
}
function IconSearch({ className = 'size-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  )
}
function IconTag() {
  return (
    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
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
function IconClock() {
  return (
    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}
function IconSun() {
  return (
    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  )
}
function IconWind() {
  return (
    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9M3 9h6m12 0a4 4 0 00-4-4h-5M3 12h15" />
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
