import { useState, type FormEvent } from 'react'
import { useAuth } from '../auth/AuthContext'
import { formatAuthError } from '../lib/firebaseErrors'

export function Login() {
  const { loginWithEmail, registerWithEmail, loginWithGoogle, firebaseConfigured } = useAuth()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!firebaseConfigured) {
      setError('Copy .env.example to .env and add your Firebase web app keys.')
      return
    }
    const em = email.trim()
    if (!em || !password) {
      setError('Enter email and password.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    setBusy(true)
    try {
      if (mode === 'signin') {
        await loginWithEmail(em, password)
      } else {
        await registerWithEmail(em, password)
      }
    } catch (err: unknown) {
      setError(formatAuthError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="relative min-h-svh overflow-x-hidden bg-gradient-to-b from-sky-400 via-sky-300 to-sky-100 font-sans text-slate-800">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="BreathSense-cloud absolute -left-10 top-[8%] h-40 w-56 rounded-full bg-white/35 blur-3xl md:h-52 md:w-72" />
        <div className="BreathSense-cloud BreathSense-cloud-delay absolute left-[35%] top-[4%] h-48 w-64 rounded-full bg-white/30 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-svh max-w-md flex-col justify-center px-6 py-12">
        <p className="font-display text-sm font-semibold tracking-wide text-sky-950/80">BreathSense</p>
        <h1 className="font-display mt-2 text-3xl font-semibold tracking-tight text-slate-900">
          {mode === 'signin' ? 'Welcome back' : 'Create account'}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Sign in with Google or email — your profile syncs with Firestore.
        </p>

        {!firebaseConfigured && (
          <p className="mt-4 rounded-xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-sm text-amber-950 backdrop-blur-sm">
            Add Firebase keys to <code className="rounded bg-white/60 px-1">.env</code> (see{' '}
            <code className="rounded bg-white/60 px-1">.env.example</code>), then restart{' '}
            <code className="rounded bg-white/60 px-1">npm run dev</code>. In Firebase Console enable{' '}
            <strong>Authentication → Sign-in method → Email/Password</strong> and{' '}
            <strong>Google</strong>, and publish <strong>Firestore rules</strong> (see{' '}
            <code className="rounded bg-white/60 px-1">firestore.rules</code>).
          </p>
        )}

        <div className="mt-8 space-y-4 rounded-[1.5rem] border border-white/55 bg-white/35 p-6 shadow-[0_25px_80px_-12px_rgba(14,116,144,0.28)] backdrop-blur-2xl">
          {error && (
            <p className="rounded-xl bg-red-500/15 px-3 py-2 text-sm text-red-900 ring-1 ring-red-400/40">
              {error}
            </p>
          )}

          <button
            type="button"
            disabled={busy || !firebaseConfigured}
            onClick={async () => {
              setError(null)
              setBusy(true)
              try {
                await loginWithGoogle()
              } catch (err: unknown) {
                setError(formatAuthError(err))
              } finally {
                setBusy(false)
              }
            }}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/70 bg-white/60 py-3 text-sm font-semibold text-slate-800 shadow-sm transition enabled:hover:bg-white/80 disabled:opacity-50"
          >
            <GoogleMark className="size-5" />
            Continue with Google
          </button>

          <p className="text-center text-xs font-medium uppercase tracking-wider text-slate-500">
            or email
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="mt-3 space-y-4 rounded-[1.5rem] border border-white/55 bg-white/35 p-6 shadow-[0_25px_80px_-12px_rgba(14,116,144,0.28)] backdrop-blur-2xl"
        >
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Email</span>
            <input
              type="email"
              autoComplete="email"
              className="mt-2 w-full rounded-xl border border-white/60 bg-white/50 px-4 py-3 text-slate-900 shadow-inner backdrop-blur-sm outline-none focus:ring-2 focus:ring-sky-400/40"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </label>

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Password</span>
            <input
              type="password"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              className="mt-2 w-full rounded-xl border border-white/60 bg-white/50 px-4 py-3 text-slate-900 shadow-inner backdrop-blur-sm outline-none focus:ring-2 focus:ring-sky-400/40"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </label>

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 py-3.5 text-sm font-semibold text-white shadow-lg transition enabled:hover:from-sky-500 enabled:hover:to-cyan-500 disabled:opacity-60"
          >
            {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>

          <p className="text-center text-sm text-slate-600">
            {mode === 'signin' ? (
              <>
                New here?{' '}
                <button
                  type="button"
                  className="font-medium text-sky-900 underline decoration-sky-600/40 underline-offset-2"
                  onClick={() => {
                    setMode('signup')
                    setError(null)
                  }}
                >
                  Create an account
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  className="font-medium text-sky-900 underline decoration-sky-600/40 underline-offset-2"
                  onClick={() => {
                    setMode('signin')
                    setError(null)
                  }}
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500">
          By continuing you agree this app is experimental and not medical advice.
        </p>
      </div>
    </div>
  )
}

function GoogleMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}
