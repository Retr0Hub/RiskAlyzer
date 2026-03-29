import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { formatAuthError, formatFirestoreError } from '../lib/firebaseErrors'
import { WeatherMotionBackdrop } from '../components/WeatherMotionBackdrop'
import { saveUserProfile } from '../lib/firestoreProfile'
import type { Sex, UserProfile } from '../types/user'

function defaultsFromProfile(
  p: UserProfile | null,
  nameHint: string
): {
  displayName: string
  age: string
  sex: Sex
  smoker: boolean
  familyIllness: boolean
} {
  if (!p) {
    const hint = nameHint.trim() || ''
    return {
      displayName: hint,
      age: '30',
      sex: 'male',
      smoker: false,
      familyIllness: false,
    }
  }
  return {
    displayName: p.displayName,
    age: String(p.age),
    sex: p.sex,
    smoker: p.smoker,
    familyIllness: p.familyIllness,
  }
}

export function Settings({ initialProfile }: { initialProfile: UserProfile | null }) {
  const navigate = useNavigate()
  const { user, updateUserEmail, updateUserPassword, resetPassword } = useAuth()
  
  const nameHint = user?.displayName?.trim() || user?.email?.split('@')[0]?.trim() || ''
  const init = defaultsFromProfile(initialProfile, nameHint)

  // Profile States
  const [displayName, setDisplayName] = useState(init.displayName)
  const [age, setAge] = useState(init.age)
  const [sex, setSex] = useState<Sex>(init.sex)
  const [smoker, setSmoker] = useState(init.smoker)
  const [familyIllness, setFamilyIllness] = useState(init.familyIllness)
  
  // Security States
  const [email, setEmail] = useState(user?.email || '')
  const [newPassword, setNewPassword] = useState('')

  const [error, setError] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // Determine if the user signed in exclusively with Google
  const isGoogleAuthOnly = user?.providerData.every(p => p.providerId === 'google.com') ?? false

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!user) {
      setError('You must be signed in.')
      return
    }

    const n = displayName.trim()
    const a = parseInt(age, 10)
    if (!n) {
      setError('Please enter your name or a display name.')
      return
    }
    if (Number.isNaN(a) || a < 18 || a > 120) {
      setError('Age must be between 18 and 120.')
      return
    }

    setError(null)
    setMsg(null)
    setBusy(true)

    try {
      // 1. Update Profile (Firestore)
      const profileToSave: UserProfile = {
        displayName: n,
        age: a,
        sex,
        smoker,
        familyIllness,
        registeredAt: initialProfile?.registeredAt ?? new Date().toISOString(),
      }
      await saveUserProfile(user.uid, profileToSave)

      // 2. Update Auth Settings (if changed)
      let credentialsUpdated = false
      if (email !== user?.email) {
        if (!email.trim()) throw new Error('Email cannot be empty')
        await updateUserEmail(email)
        credentialsUpdated = true
      }
      if (newPassword && !isGoogleAuthOnly) {
        if (newPassword.length < 6) throw new Error('Password must be at least 6 characters.')
        await updateUserPassword(newPassword)
        credentialsUpdated = true
      }

      if (credentialsUpdated) {
        setMsg('Profile and credentials updated successfully.')
        setNewPassword('')
      } else {
        setMsg('Profile saved successfully.')
      }

      // If it was their first time onboarding, send them to dashboard
      if (!initialProfile) {
        navigate('/dashboard', { replace: true })
      }

    } catch (err: unknown) {
      const formattedError = formatAuthError(err)
      if (formattedError.includes('recent-login')) {
        setError('For security, please sign out and sign in again before updating your credentials.')
      } else {
        // Fallback to firestore error formatting if it's not an auth error
        setError(formatFirestoreError(err))
      }
    } finally {
      setBusy(false)
    }
  }

  async function handleResetPassword() {
    if (!user?.email) return
    setBusy(true)
    setError(null)
    setMsg(null)
    try {
      await resetPassword(user.email)
      setMsg('A password reset link has been sent to your email.')
    } catch (err: unknown) {
      setError(formatAuthError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <WeatherMotionBackdrop weatherCode={null} isDay={true} />
      <div className="relative z-10 min-h-svh overflow-x-hidden font-sans text-slate-800 selection:bg-sky-500/30">
        <div className="relative z-10 mx-auto flex min-h-svh max-w-2xl flex-col justify-center px-4 py-12">
          
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="font-display text-3xl font-semibold tracking-tight text-slate-900">
                {initialProfile ? 'Account Settings' : 'Create your profile'}
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                {initialProfile 
                  ? 'Manage your health profile and credentials.' 
                  : 'Let\'s get started by setting up your health baseline.'}
              </p>
            </div>
            {initialProfile && (
              <Link
                to="/dashboard"
                className="flex items-center justify-center rounded-xl bg-white/40 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm backdrop-blur-md transition hover:bg-white/60"
              >
                Back
              </Link>
            )}
          </div>

          <form
            onSubmit={onSubmit}
            className="space-y-6 rounded-[1.5rem] border border-white/55 bg-white/35 p-6 shadow-[0_25px_80px_-12px_rgba(14,116,144,0.28)] backdrop-blur-2xl md:p-8"
          >
            {error && (
              <p className="rounded-xl bg-red-500/15 px-3 py-2 text-sm text-red-900 ring-1 ring-red-400/40">
                {error}
              </p>
            )}
            {msg && (
              <p className="rounded-xl bg-emerald-500/15 px-3 py-2 text-sm text-emerald-900 ring-1 ring-emerald-400/40">
                {msg}
              </p>
            )}

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 border-b border-white/40 pb-2">Profile</h3>
                
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Display name</span>
                  <input
                    className="mt-2 w-full rounded-xl border border-white/60 bg-white/50 px-4 py-3 text-slate-900 shadow-inner backdrop-blur-sm outline-none transition placeholder:text-slate-400 focus:border-sky-400/70 focus:ring-2 focus:ring-sky-400/35"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    autoComplete="name"
                    placeholder="Alex"
                  />
                </label>

                <div className="grid grid-cols-2 gap-4">
                  <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Age</span>
                    <input
                      type="number"
                      min={18}
                      max={120}
                      className="mt-2 w-full rounded-xl border border-white/60 bg-white/50 px-4 py-3 text-slate-900 shadow-inner backdrop-blur-sm outline-none transition focus:border-sky-400/70 focus:ring-2 focus:ring-sky-400/35"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                    />
                  </label>
                  
                  <fieldset>
                    <legend className="text-xs font-semibold uppercase tracking-wider text-slate-500">Sex</legend>
                    <div className="mt-2 flex flex-col gap-2">
                      <select 
                        value={sex}
                        onChange={(e) => setSex(e.target.value as Sex)}
                        className="w-full rounded-xl border border-white/60 bg-white/50 px-4 py-3 text-slate-900 shadow-inner backdrop-blur-sm outline-none transition focus:border-sky-400/70 focus:ring-2 focus:ring-sky-400/35 appearance-none"
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </fieldset>
                </div>

                <div className="space-y-3 pt-2">
                  <ToggleRow
                    label="Do you smoke?"
                    description="Tobacco use is a major risk factor."
                    checked={smoker}
                    onChange={setSmoker}
                  />
                  <ToggleRow
                    label="Family illness flag?"
                    description="Placeholder flag for hereditary risk."
                    checked={familyIllness}
                    onChange={setFamilyIllness}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 border-b border-white/40 pb-2">Security</h3>
                
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Email Address</span>
                  <input
                    type="email"
                    className="mt-2 w-full rounded-xl border border-white/60 bg-white/50 px-4 py-3 text-slate-900 shadow-inner backdrop-blur-sm outline-none focus:ring-2 focus:ring-sky-400/40 disabled:opacity-50 disabled:cursor-not-allowed"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isGoogleAuthOnly}
                    title={isGoogleAuthOnly ? "Email is managed by Google." : ""}
                  />
                </label>

                {isGoogleAuthOnly ? (
                  <div className="mt-4 rounded-xl border border-sky-300/40 bg-sky-100/30 p-4">
                    <p className="text-sm text-sky-900">
                      <strong>Managed by Google</strong><br/>
                      You signed in using your Google account. Your password and email are managed securely by Google.
                    </p>
                  </div>
                ) : (
                  <>
                    <label className="block">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">New Password</span>
                      <input
                        type="password"
                        className="mt-2 w-full rounded-xl border border-white/60 bg-white/50 px-4 py-3 text-slate-900 shadow-inner backdrop-blur-sm outline-none focus:ring-2 focus:ring-sky-400/40"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Leave blank to keep current"
                      />
                    </label>

                    <div className="pt-2">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={handleResetPassword}
                        className="w-full rounded-xl border border-white/60 bg-white/40 py-3 text-sm font-bold text-slate-700 shadow-sm transition enabled:hover:bg-white/60 disabled:opacity-50"
                      >
                        Send Password Reset Link
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-white/40 mt-6">
              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 py-3.5 text-sm font-bold text-white shadow-lg transition enabled:hover:from-sky-500 enabled:hover:to-cyan-500 disabled:opacity-60"
              >
                {busy ? 'Saving…' : initialProfile ? 'Save Changes' : 'Create Profile & Continue'}
              </button>
            </div>
          </form>

        </div>
      </div>
    </>
  )
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-white/50 bg-white/30 px-4 py-3 backdrop-blur-sm">
      <div>
        <p className="text-sm font-medium text-slate-800">{label}</p>
        <p className="mt-0.5 text-xs text-slate-600">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full border border-white/40 shadow-inner transition ${
          checked ? 'bg-sky-600' : 'bg-slate-300/80'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 size-6 rounded-full bg-white shadow transition ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  )
}
