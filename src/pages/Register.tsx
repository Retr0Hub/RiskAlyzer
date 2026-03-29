import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Sex, UserProfile } from '../types/user'
import { useAuth } from '../auth/AuthContext'
import { saveUserProfile } from '../lib/firestoreProfile'
import { formatFirestoreError } from '../lib/firebaseErrors'

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

export function Register({ initialProfile }: { initialProfile: UserProfile | null }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const nameHint =
    user?.displayName?.trim() ||
    user?.email?.split('@')[0]?.trim() ||
    ''
  const init = defaultsFromProfile(initialProfile, nameHint)
  const [displayName, setDisplayName] = useState(init.displayName)
  const [age, setAge] = useState(init.age)
  const [sex, setSex] = useState<Sex>(init.sex)
  const [smoker, setSmoker] = useState(init.smoker)
  const [familyIllness, setFamilyIllness] = useState(init.familyIllness)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

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
    const profile: UserProfile = {
      displayName: n,
      age: a,
      sex,
      smoker,
      familyIllness,
      registeredAt: initialProfile?.registeredAt ?? new Date().toISOString(),
    }
    setError(null)
    setBusy(true)
    try {
      await saveUserProfile(user.uid, profile)
      navigate('/dashboard', { replace: true })
    } catch (err: unknown) {
      setError(formatFirestoreError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="relative min-h-svh overflow-x-hidden bg-gradient-to-b from-sky-400 via-sky-300 to-sky-100 font-sans text-slate-800 selection:bg-sky-500/30">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="riskalyzer-cloud absolute -left-10 top-[8%] h-40 w-56 rounded-full bg-white/35 blur-3xl md:h-52 md:w-72" />
        <div className="riskalyzer-cloud riskalyzer-cloud-delay absolute left-[35%] top-[4%] h-48 w-64 rounded-full bg-white/30 blur-3xl" />
        <div className="absolute bottom-[12%] left-[15%] h-36 w-96 rounded-full bg-sky-200/35 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-svh max-w-lg flex-col justify-center px-6 py-12">
        <p className="font-display text-sm font-semibold tracking-wide text-sky-950/80">Riskalyzer</p>
        <h1 className="font-display mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
          {initialProfile ? 'Update your health profile' : 'Create your health profile'}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          Saved to your account in Firebase. Illustrative estimates only — not medical advice.
        </p>

        <form
          onSubmit={onSubmit}
          className="mt-10 space-y-6 rounded-[1.5rem] border border-white/55 bg-white/35 p-6 shadow-[0_25px_80px_-12px_rgba(14,116,144,0.28),inset_0_1px_0_0_rgba(255,255,255,0.75)] backdrop-blur-2xl"
        >
          {error && (
            <p className="rounded-xl bg-red-500/15 px-3 py-2 text-sm text-red-900 ring-1 ring-red-400/40">
              {error}
            </p>
          )}

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Display name
            </span>
            <input
              className="mt-2 w-full rounded-xl border border-white/60 bg-white/50 px-4 py-3 text-slate-900 shadow-inner backdrop-blur-sm outline-none transition placeholder:text-slate-400 focus:border-sky-400/70 focus:ring-2 focus:ring-sky-400/35"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              autoComplete="name"
              placeholder="Alex"
            />
          </label>

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
            <div className="mt-2 flex flex-wrap gap-2">
              {(
                [
                  ['male', 'Male'],
                  ['female', 'Female'],
                  ['other', 'Other'],
                ] as const
              ).map(([value, label]) => (
                <label
                  key={value}
                  className={`cursor-pointer rounded-xl border px-4 py-2 text-sm font-medium transition ${
                    sex === value
                      ? 'border-sky-500/60 bg-white/70 text-sky-950 shadow-sm'
                      : 'border-white/50 bg-white/35 text-slate-600 hover:border-white/70 hover:bg-white/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="sex"
                    className="sr-only"
                    checked={sex === value}
                    onChange={() => setSex(value)}
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="space-y-4">
            <ToggleRow
              label="Do you smoke?"
              description="Tobacco use is a major risk factor in population models."
              checked={smoker}
              onChange={setSmoker}
            />
            <ToggleRow
              label="Family history of serious illness?"
              description="Placeholder flag for hereditary risk — refine with your clinician."
              checked={familyIllness}
              onChange={setFamilyIllness}
            />
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-sky-900/20 transition enabled:hover:from-sky-500 enabled:hover:to-cyan-500 disabled:opacity-60 active:enabled:scale-[0.99]"
          >
            {busy ? 'Saving…' : initialProfile ? 'Save changes' : 'Continue to dashboard'}
          </button>
        </form>
      </div>
    </div>
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
