import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'

export function Landing() {
  const [scrollY, setScrollY] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div
      className="relative min-h-screen overflow-x-hidden font-sans text-slate-800 selection:bg-sky-500/30"
      data-testid="landing-page"
    >
      {/* Animated gradient background */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(165deg, #dbeafe 0%, #e0f2fe 18%, #f0f9ff 38%, #f8fafc 55%, #ede9fe 78%, #e0e7ff 100%)',
          }}
        />
        <div
          className="BreathSense-cloud absolute -left-24 top-[6%] h-64 w-80 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(186,230,253,0.6) 0%, transparent 70%)' }}
        />
        <div
          className="BreathSense-cloud BreathSense-cloud-delay absolute right-[-5%] top-[3%] h-56 w-72 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(199,210,254,0.5) 0%, transparent 70%)' }}
        />
        <div
          className="BreathSense-cloud absolute left-[30%] top-[55%] h-48 w-96 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(224,242,254,0.45) 0%, transparent 70%)' }}
        />
        <div
          className="BreathSense-cloud BreathSense-cloud-delay absolute right-[10%] bottom-[15%] h-40 w-64 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(221,214,254,0.4) 0%, transparent 70%)' }}
        />
      </div>

      <Navbar scrollY={scrollY} menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <StatsSection />
      <CTASection />
      <Footer />
    </div>
  )
}

function Navbar({ scrollY, menuOpen, setMenuOpen }: { scrollY: number; menuOpen: boolean; setMenuOpen: (open: boolean) => void }) {
  const navSolid = scrollY > 40
  return (
    <nav
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${navSolid
          ? 'border-b border-white/40 bg-white/60 shadow-[0_4px_30px_-4px_rgba(14,116,144,0.10)] backdrop-blur-2xl'
          : 'bg-transparent'
        }`}
      data-testid="landing-navbar"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
        <Link to="/" className="flex items-center gap-2.5" data-testid="navbar-logo">
          <div className="flex size-9 items-center justify-center rounded-xl border border-white/60 bg-gradient-to-br from-sky-500 to-indigo-500 shadow-lg shadow-sky-500/20">
            <svg className="size-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="font-display text-xl font-bold tracking-tight text-slate-900">
            BreathSense
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-1 md:flex">
          <NavLink href="#features">Features</NavLink>
          <NavLink href="#how-it-works">How It Works</NavLink>
          <NavLink href="#stats">Insights</NavLink>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            to="/login"
            className="rounded-full bg-gradient-to-r from-sky-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-600/25 transition hover:from-sky-500 hover:to-indigo-500 hover:shadow-xl hover:shadow-sky-500/30"
            data-testid="navbar-register-btn"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile menu toggle */}
        <button
          type="button"
          className="flex size-10 items-center justify-center rounded-xl border border-white/50 bg-white/40 text-slate-700 backdrop-blur-sm md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
          data-testid="mobile-menu-toggle"
        >
          {menuOpen ? (
            <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-t border-white/30 bg-white/70 px-5 pb-5 pt-3 backdrop-blur-2xl md:hidden" data-testid="mobile-menu">
          <div className="flex flex-col gap-2">
            <a href="#features" className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-white/50" onClick={() => setMenuOpen(false)}>Features</a>
            <a href="#how-it-works" className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-white/50" onClick={() => setMenuOpen(false)}>How It Works</a>
            <a href="#stats" className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-white/50" onClick={() => setMenuOpen(false)}>Insights</a>
            <div className="mt-2 flex flex-col gap-2">
              <Link to="/login" className="rounded-xl border border-white/50 bg-white/40 px-4 py-2.5 text-center text-sm font-semibold text-slate-700" data-testid="mobile-login-btn">Sign in</Link>
              <Link to="/login" className="rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 px-4 py-2.5 text-center text-sm font-semibold text-white shadow-md" data-testid="mobile-register-btn">Get Started</Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-white/40 hover:text-slate-900"
    >
      {children}
    </a>
  )
}

/* ──────────────────────── HERO ──────────────────────── */
function HeroSection() {
  return (
    <section className="relative z-10 flex min-h-[92vh] flex-col items-center justify-center px-5 pt-24 pb-16 text-center lg:px-8" data-testid="hero-section">
      <FadeIn delay={0}>
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/40 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-sky-800 shadow-sm backdrop-blur-sm">
          <span className="inline-flex size-2 animate-pulse rounded-full bg-sky-500" />
          AI-Powered Health Risk Assessment
        </div>
      </FadeIn>

      <FadeIn delay={100}>
        <h1 className="font-display mx-auto max-w-4xl text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl md:text-6xl lg:text-7xl">
          Breathe. Measure.{' '}
          <span className="bg-gradient-to-r from-sky-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
            Understand
          </span>{' '}
          Your Risk.
        </h1>
      </FadeIn>

      <FadeIn delay={200}>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg md:text-xl">
          BreathSense combines real-time breath sensor data, air quality metrics, and AI analysis
          to give you a personalized view of your health risk landscape.
        </p>
      </FadeIn>

      <FadeIn delay={300}>
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
          <Link
            to="/login"
            className="group relative rounded-2xl bg-gradient-to-r from-sky-600 to-indigo-600 px-8 py-4 text-base font-semibold text-white shadow-xl shadow-sky-600/25 transition hover:from-sky-500 hover:to-indigo-500 hover:shadow-2xl hover:shadow-sky-500/30"
            data-testid="hero-cta-btn"
          >
            <span className="relative z-10">Start Your Assessment</span>
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-sky-400 to-indigo-400 opacity-0 blur-xl transition group-hover:opacity-40" />
          </Link>
          <a
            href="#features"
            className="flex items-center gap-2 rounded-2xl border border-white/50 bg-white/35 px-8 py-4 text-base font-semibold text-slate-700 shadow-sm backdrop-blur-sm transition hover:bg-white/55 hover:shadow-md"
            data-testid="hero-learn-more-btn"
          >
            Learn More
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </a>
        </div>
      </FadeIn>

      <FadeIn delay={450}>
        <div className="mx-auto mt-16 max-w-5xl">
          <DashboardPreviewCard />
        </div>
      </FadeIn>
    </section>
  )
}

/* ──────────────────────── DASHBOARD PREVIEW ──────────────────────── */
function DashboardPreviewCard() {
  return (
    <div className="rounded-[1.75rem] border border-white/50 bg-white/30 p-4 shadow-[0_30px_80px_-12px_rgba(14,116,144,0.22),inset_0_1px_0_0_rgba(255,255,255,0.65)] backdrop-blur-2xl sm:p-6" data-testid="dashboard-preview">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <PreviewStatCard icon="heart" label="Life Expectancy" value="-12%" color="sky" />
        <PreviewStatCard icon="clock" label="PM" value="-16%" color="indigo" />
        <PreviewStatCard icon="thermometer" label="Temperature" value="28°C" color="cyan" />
        <PreviewStatCard icon="wind" label="US AQI" value="119" color="violet" />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-6">
        {['Age: 21', 'Sex: Male', 'Smoking: Yes', 'Family: No', 'Breath: Live', 'AI: Active'].map(
          (item) => (
            <div
              key={item}
              className="rounded-xl border border-white/45 bg-white/35 px-3 py-2.5 text-center text-xs font-medium text-slate-600 backdrop-blur-sm"
            >
              {item}
            </div>
          )
        )}
      </div>
    </div>
  )
}

function PreviewStatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: string
  label: string
  value: string
  color: string
}) {
  const iconColors: Record<string, string> = {
    sky: 'from-sky-500 to-sky-600',
    indigo: 'from-indigo-500 to-indigo-600',
    cyan: 'from-cyan-500 to-cyan-600',
    violet: 'from-violet-500 to-violet-600',
  }

  const icons: Record<string, React.ReactNode> = {
    heart: (
      <svg className="size-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
    clock: (
      <svg className="size-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    thermometer: (
      <svg className="size-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    wind: (
      <svg className="size-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9M3 9h6m12 0a4 4 0 00-4-4h-5M3 12h15" />
      </svg>
    ),
  }

  return (
    <div className="rounded-2xl border border-white/50 bg-white/40 p-4 backdrop-blur-xl transition hover:bg-white/55 hover:shadow-md">
      <div className={`inline-flex size-9 items-center justify-center rounded-xl bg-gradient-to-br ${iconColors[color]} shadow-md`}>
        {icons[icon]}
      </div>
      <p className="mt-2.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="font-display mt-1 text-xl font-bold tracking-tight text-slate-900">{value}</p>
    </div>
  )
}

/* ──────────────────────── FEATURES ──────────────────────── */
function FeaturesSection() {
  const features = [
    {
      icon: (
        <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      title: 'Breath Rate Sensor',
      description:
        'Connect via BLE or USB to capture real-time breath rate data. Monitor respiratory patterns that reveal your body\'s stress signals.',
      gradient: 'from-sky-500 to-cyan-500',
      shadowColor: 'shadow-sky-500/20',
    },
    {
      icon: (
        <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9M3 9h6m12 0a4 4 0 00-4-4h-5M3 12h15" />
        </svg>
      ),
      title: 'Live AQI Tracking',
      description:
        'Automatic air quality monitoring based on your location. See how PM2.5, temperature, and humidity affect your health risk score.',
      gradient: 'from-indigo-500 to-violet-500',
      shadowColor: 'shadow-indigo-500/20',
    },
    {
      icon: (
        <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      ),
      title: 'AI Risk Analysis',
      description:
        'Machine learning models process your biometric data, environment signals, and health profile to estimate personalized risk factors.',
      gradient: 'from-violet-500 to-purple-600',
      shadowColor: 'shadow-violet-500/20',
    },
    {
      icon: (
        <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      title: 'Trend Dashboard',
      description:
        'Track your health metrics over time with beautiful glass-morphic visualizations. See life expectancy adjustments update in real-time.',
      gradient: 'from-cyan-500 to-sky-600',
      shadowColor: 'shadow-cyan-500/20',
    },
  ]

  return (
    <section id="features" className="relative z-10 px-5 py-24 lg:px-8" data-testid="features-section">
      <div className="mx-auto max-w-7xl">
        <FadeIn>
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
              Core Capabilities
            </p>
            <h2 className="font-display mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Everything you need to{' '}
              <span className="bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
                assess your risk
              </span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600">
              From breath sensors to air quality, our platform synthesizes multiple data streams into
              actionable health insights.
            </p>
          </div>
        </FadeIn>

        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <FadeIn key={f.title} delay={i * 100}>
              <div
                className="group rounded-2xl border border-white/50 bg-white/35 p-6 shadow-lg backdrop-blur-xl transition duration-300 hover:bg-white/50 hover:shadow-xl hover:-translate-y-1"
                data-testid={`feature-card-${i}`}
              >
                <div className={`inline-flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br ${f.gradient} ${f.shadowColor} shadow-lg text-white transition group-hover:scale-110`}>
                  {f.icon}
                </div>
                <h3 className="mt-5 text-lg font-bold text-slate-900">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{f.description}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ──────────────────────── HOW IT WORKS ──────────────────────── */
function HowItWorksSection() {
  const steps = [
    { number: '01', title: 'Connect Your Device', description: 'Pair your breath sensor via Bluetooth. Takes just 30 seconds.' },
    { number: '02', title: 'Authorize Location', description: 'Allow real-time air quality data based on your current location.' },
    { number: '03', title: 'Complete Your Profile', description: 'Share health details: age, sex, smoking status, and family history.' },
    { number: '04', title: 'View Your Dashboard', description: 'Get instant risk insights powered by AI and live environmental data.' },
  ]

  return (
    <section id="how-it-works" className="relative z-10 px-5 py-24 lg:px-8" data-testid="how-it-works-section">
      <div className="mx-auto max-w-7xl">
        <FadeIn>
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
              Simple Process
            </p>
            <h2 className="font-display mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              How BreathSense{' '}
              <span className="bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
                Works
              </span>
            </h2>
          </div>
        </FadeIn>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <FadeIn key={step.number} delay={i * 100}>
              <div
                className="rounded-2xl border border-white/50 bg-white/35 p-8 backdrop-blur-xl"
                data-testid={`step-${i}`}
              >
                <div className="text-4xl font-bold text-sky-600">{step.number}</div>
                <h3 className="mt-4 text-lg font-bold text-slate-900">{step.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{step.description}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ──────────────────────── STATS ──────────────────────── */
function StatsSection() {
  const stats = [
    { value: '50+', label: 'Health Risk Assessments' },
    { value: '-6.2%', label: 'Avg Life Expectancy Data' },
    { value: '150+ Cities', label: 'Real-time Air Quality' },
    { value: '90.9%', label: 'Data Accuracy' },
  ]

  return (
    <section id="stats" className="relative z-10 px-5 py-24 lg:px-8" data-testid="stats-section">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-3xl border border-white/50 bg-gradient-to-br from-white/40 to-white/20 p-12 backdrop-blur-2xl sm:p-16">
          <FadeIn>
            <h2 className="font-display text-center text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Soon to be trusted by researchers and health{' '}
              <span className="bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
                professionals
              </span>
            </h2>
          </FadeIn>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, i) => (
              <FadeIn key={stat.value} delay={i * 75}>
                <div className="text-center" data-testid={`stat-${i}`}>
                  <p className="font-display text-4xl font-bold text-sky-600 sm:text-5xl">{stat.value}</p>
                  <p className="mt-2 text-sm text-slate-600">{stat.label}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ──────────────────────── CTA ──────────────────────── */
function CTASection() {
  return (
    <section className="relative z-10 bg-gradient-to-br from-sky-600 via-indigo-600 to-violet-700 px-5 py-24 lg:px-8" data-testid="cta-section">
      <div className="mx-auto max-w-3xl text-center">
        <FadeIn>
          <h2 className="font-display text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            Ready to understand your risk?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-sky-100/90">
            Join BreathSense today and get personalized health risk insights powered by AI, real-time
            environmental data, and your own biometric signals.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              to="/login"
              className="rounded-2xl bg-white px-8 py-4 text-base font-semibold text-sky-700 shadow-xl transition hover:bg-sky-50 hover:shadow-2xl"
              data-testid="cta-create-account-btn"
            >
              Create Free Account
            </Link>
            <Link
              to="/login"
              className="rounded-2xl border border-white/30 bg-white/10 px-8 py-4 text-base font-semibold text-white shadow-lg backdrop-blur-sm transition hover:bg-white/20"
              data-testid="cta-signin-btn"
            >
              Sign In
            </Link>
          </div>
          <p className="mt-6 text-xs text-sky-200/70">
            Free to use. No credit card required. Not medical advice.
          </p>
        </FadeIn>
      </div>
    </section>
  )
}

/* ──────────────────────── FOOTER ──────────────────────── */
function Footer() {
  return (
    <footer className="relative z-10 border-t border-white/30 px-5 py-12 lg:px-8" data-testid="landing-footer">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-indigo-500 shadow-md">
                <svg className="size-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="font-display text-lg font-bold text-slate-900">BreathSense</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              AI-powered health risk assessment using breath sensors, AQI data, and personalized analysis.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Product</h4>
            <ul className="mt-3 space-y-2">
              {['Dashboard', 'Breath Sensor', 'AI Insights', 'Environment Tracking'].map((item) => (
                <li key={item}>
                  <span className="text-sm text-slate-600 transition hover:text-slate-900 cursor-default">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Resources</h4>
            <ul className="mt-3 space-y-2">
              {['Documentation', 'API Reference', 'Health Research', 'Blog'].map((item) => (
                <li key={item}>
                  <span className="text-sm text-slate-600 transition hover:text-slate-900 cursor-default">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Legal</h4>
            <ul className="mt-3 space-y-2">
              {['Privacy Policy', 'Terms of Service', 'Medical Disclaimer'].map((item) => (
                <li key={item}>
                  <span className="text-sm text-slate-600 transition hover:text-slate-900 cursor-default">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/30 pt-8 sm:flex-row">
          <p className="text-xs text-slate-500">
            &copy; {new Date().getFullYear()} BreathSense. All rights reserved. Not medical advice.
          </p>
          <div className="flex gap-4">
            <SocialIcon label="Twitter">
              <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" />
            </SocialIcon>
            <SocialIcon label="GitHub">
              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22" />
            </SocialIcon>
            <SocialIcon label="LinkedIn">
              <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z" />
              <circle cx="4" cy="4" r="2" />
            </SocialIcon>
          </div>
        </div>
      </div>
    </footer>
  )
}

function SocialIcon({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      className="flex size-9 items-center justify-center rounded-full border border-white/40 bg-white/30 text-slate-500 backdrop-blur-sm transition hover:bg-white/50 hover:text-slate-800"
    >
      <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        {children}
      </svg>
    </button>
  )
}

/* ──────────────────────── FADE IN ANIMATION ──────────────────────── */
function FadeIn({
  children,
  delay = 0,
}: {
  children: React.ReactNode
  delay?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.15 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className="transition-all duration-700 ease-out"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}
