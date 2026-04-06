import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { formatAuthError, formatFirestoreError } from '../lib/firebaseErrors'
import { WeatherMotionBackdrop } from '../components/WeatherMotionBackdrop'
import { saveUserProfile } from '../lib/firestoreProfile'
import type { Sex, SmokingStatus, UserProfile } from '../types/user'

type SettingsTab = 'profile' | 'security' | '2fa'

function defaultsFromProfile(
  p: UserProfile | null,
  nameHint: string
): {
  displayName: string
  age: string
  sex: Sex
  smokingStatus: SmokingStatus
  familyIllness: boolean
} {
  if (!p) {
    const hint = nameHint.trim() || ''
    return {
      displayName: hint,
      age: '30',
      sex: 'male',
      smokingStatus: 'never',
      familyIllness: false,
    }
  }
  return {
    displayName: p.displayName,
    age: String(p.age),
    sex: p.sex,
    smokingStatus: p.smokingStatus,
    familyIllness: p.familyIllness,
  }
}

export function Settings({ initialProfile }: { initialProfile: UserProfile | null }) {
  const navigate = useNavigate()
  const { user, updateUserEmail, updateUserPassword, resetPassword } = useAuth()
  
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile')
  const nameHint = user?.displayName?.trim() || user?.email?.split('@')[0]?.trim() || ''
  const init = defaultsFromProfile(initialProfile, nameHint)

  // Profile States
  const [displayName, setDisplayName] = useState(init.displayName)
  const [age, setAge] = useState(init.age)
  const [sex, setSex] = useState<Sex>(init.sex)
  const [smokingStatus, setSmokingStatus] = useState<SmokingStatus>(init.smokingStatus)
  const [familyIllness, setFamilyIllness] = useState(init.familyIllness)
  
  // Security States
  const [email, setEmail] = useState(user?.email || '')
  const [newPassword, setNewPassword] = useState('')
  const [phoneNumber, setPhoneNumber] = useState(initialProfile?.phoneNumber || '')
  
  // 2FA States
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(initialProfile?.twoFactorEnabled || false)
  const [verificationCode, setVerificationCode] = useState('')
  const [showingQRCode, setShowingQRCode] = useState(false)

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
        smokingStatus,
        familyIllness,
        phoneNumber,
        twoFactorEnabled,
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

  function handleEnable2FA() {
    setShowingQRCode(true)
    setMsg(null)
    setError(null)
  }

  function handleVerify2FA() {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit code.')
      return
    }
    // TODO: Send verification code to backend
    setTwoFactorEnabled(true)
    setShowingQRCode(false)
    setVerificationCode('')
    setMsg('Two-factor authentication has been enabled.')
  }

  function handleDisable2FA() {
    setTwoFactorEnabled(false)
    setMsg('Two-factor authentication has been disabled.')
  }

  return (
    <>
      <WeatherMotionBackdrop weatherCode={null} isDay={true} />
      <div className="relative z-10 min-h-svh overflow-x-hidden font-sans text-slate-800 selection:bg-sky-500/30">
        <div className="relative z-10 mx-auto flex min-h-svh max-w-4xl flex-col px-4 py-12">
          
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="font-display text-3xl font-semibold tracking-tight text-slate-900">
                {initialProfile ? 'Account Settings' : 'Create your profile'}
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                {initialProfile 
                  ? 'Manage your health profile, security, and account settings.' 
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

          <div className="rounded-[1.5rem] border border-white/55 bg-white/35 shadow-[0_25px_80px_-12px_rgba(14,116,144,0.28)] backdrop-blur-2xl overflow-hidden">
            {/* Tab Headers */}
            <div className="flex border-b border-white/40 bg-white/20">
              <TabButton
                label="Profile"
                active={activeTab === 'profile'}
                onClick={() => setActiveTab('profile')}
                icon="👤"
              />
              <TabButton
                label="Security"
                active={activeTab === 'security'}
                onClick={() => setActiveTab('security')}
                icon="🔐"
              />
              <TabButton
                label="Two-Factor Auth"
                active={activeTab === '2fa'}
                onClick={() => setActiveTab('2fa')}
                icon="🔑"
              />
            </div>

            {/* Tab Content */}
            <form onSubmit={onSubmit} className="p-6 md:p-8">
              {error && (
                <div className="mb-6 rounded-xl bg-red-500/15 px-4 py-3 text-sm text-red-900 ring-1 ring-red-400/40">
                  {error}
                </div>
              )}
              {msg && (
                <div className="mb-6 rounded-xl bg-emerald-500/15 px-4 py-3 text-sm text-emerald-900 ring-1 ring-emerald-400/40">
                  {msg}
                </div>
              )}

              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="font-display text-lg font-semibold text-slate-900">Health Profile</h2>
                    <p className="mt-1 text-sm text-slate-600">Update your basic health information.</p>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
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

                    <label className="block">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Sex</span>
                      <select 
                        value={sex}
                        onChange={(e) => setSex(e.target.value as Sex)}
                        className="mt-2 w-full rounded-xl border border-white/60 bg-white/50 px-4 py-3 text-slate-900 shadow-inner backdrop-blur-sm outline-none transition focus:border-sky-400/70 focus:ring-2 focus:ring-sky-400/35 appearance-none"
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </label>

                    <label className="block">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Phone (Optional)</span>
                      <input
                        type="tel"
                        className="mt-2 w-full rounded-xl border border-white/60 bg-white/50 px-4 py-3 text-slate-900 shadow-inner backdrop-blur-sm outline-none transition focus:border-sky-400/70 focus:ring-2 focus:ring-sky-400/35"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="+1 (555) 000-0000"
                      />
                    </label>
                  </div>

                  <div className="space-y-4 border-t border-white/40 pt-6">
                    <h3 className="text-sm font-semibold text-slate-800">Risk Factors</h3>
                    
                    <fieldset>
                      <legend className="text-xs font-semibold uppercase tracking-wider text-slate-500">Smoking Status</legend>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {(
                          [
                            ['never', 'Never smoked'],
                            ['previously', 'Previously smoked'],
                            ['active', 'Currently smoking'],
                          ] as const
                        ).map(([value, label]) => (
                          <label
                            key={value}
                            className={`cursor-pointer rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
                              smokingStatus === value
                                ? 'border-sky-500/60 bg-white/70 text-sky-950 shadow-sm'
                                : 'border-white/50 bg-white/35 text-slate-600 hover:border-white/70 hover:bg-white/50'
                            }`}
                          >
                            <input
                              type="radio"
                              name="smokingStatus"
                              className="sr-only"
                              checked={smokingStatus === value}
                              onChange={() => setSmokingStatus(value)}
                            />
                            {label}
                          </label>
                        ))}
                      </div>
                    </fieldset>
                    
                    <ToggleRow
                      label="Family history of illness?"
                      description="Flag for hereditary or genetic risk factors."
                      checked={familyIllness}
                      onChange={setFamilyIllness}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={busy}
                    className="w-full rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 py-3.5 text-sm font-bold text-white shadow-lg transition enabled:hover:from-sky-500 enabled:hover:to-cyan-500 disabled:opacity-60"
                  >
                    {busy ? 'Saving…' : initialProfile ? 'Save Profile' : 'Create Profile & Continue'}
                  </button>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="font-display text-lg font-semibold text-slate-900">Security Settings</h2>
                    <p className="mt-1 text-sm text-slate-600">Manage your account authentication and password.</p>
                  </div>

                  <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Email Address</span>
                    <input
                      type="email"
                      className="mt-2 w-full rounded-xl border border-white/60 bg-white/50 px-4 py-3 text-slate-900 shadow-inner backdrop-blur-sm outline-none transition focus:border-sky-400/70 focus:ring-2 focus:ring-sky-400/35 disabled:opacity-50 disabled:cursor-not-allowed"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isGoogleAuthOnly}
                      title={isGoogleAuthOnly ? "Email is managed by Google." : ""}
                    />
                  </label>

                  {isGoogleAuthOnly ? (
                    <div className="rounded-xl border border-sky-300/40 bg-sky-100/30 p-4">
                      <p className="text-sm text-sky-900">
                        <strong className="block">🔒 Managed by Google</strong>
                        <span className="block mt-1">Your password and email are securely managed through your Google account. Sign out and sign in again to make changes.</span>
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-6 border-t border-white/40 pt-6">
                        <div>
                          <h3 className="text-sm font-semibold text-slate-800 mb-4">Password</h3>
                          <label className="block">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">New Password</span>
                            <input
                              type="password"
                              className="mt-2 w-full rounded-xl border border-white/60 bg-white/50 px-4 py-3 text-slate-900 shadow-inner backdrop-blur-sm outline-none transition focus:border-sky-400/70 focus:ring-2 focus:ring-sky-400/35"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              placeholder="Leave blank to keep current password"
                            />
                            <p className="mt-2 text-xs text-slate-600">Minimum 6 characters</p>
                          </label>
                        </div>

                        <button
                          type="button"
                          disabled={busy}
                          onClick={handleResetPassword}
                          className="w-full rounded-xl border border-white/60 bg-white/40 py-3 text-sm font-bold text-slate-700 shadow-sm transition enabled:hover:bg-white/60 disabled:opacity-50"
                        >
                          📧 Send Password Reset Link
                        </button>
                      </div>
                    </>
                  )}

                  <div className="mt-6 border-t border-white/40 pt-6">
                    <button
                      type="submit"
                      disabled={busy}
                      className="w-full rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 py-3.5 text-sm font-bold text-white shadow-lg transition enabled:hover:from-sky-500 enabled:hover:to-cyan-500 disabled:opacity-60"
                    >
                      {busy ? 'Saving…' : 'Save Security Settings'}
                    </button>
                  </div>
                </div>
              )}

              {/* 2FA Tab */}
              {activeTab === '2fa' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="font-display text-lg font-semibold text-slate-900">Two-Factor Authentication</h2>
                    <p className="mt-1 text-sm text-slate-600">Add an extra layer of security to your account.</p>
                  </div>

                  <div className="rounded-xl border border-white/50 bg-white/30 p-5 backdrop-blur-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {twoFactorEnabled ? '✅ Two-Factor Authentication Enabled' : '❌ Two-Factor Authentication Disabled'}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          {twoFactorEnabled 
                            ? 'Your account is protected with two-factor authentication.' 
                            : 'Enable 2FA to add extra security to your account.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {!twoFactorEnabled && !showingQRCode && (
                    <button
                      type="button"
                      onClick={handleEnable2FA}
                      className="w-full rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 py-3.5 text-sm font-bold text-white shadow-lg transition hover:from-amber-500 hover:to-orange-500"
                    >
                      🔐 Enable Two-Factor Authentication
                    </button>
                  )}

                  {!twoFactorEnabled && showingQRCode && (
                    <div className="space-y-4 rounded-xl border border-white/50 bg-white/30 p-6 backdrop-blur-sm">
                      <div className="text-center">
                        <p className="text-sm font-semibold text-slate-900 mb-4">Scan this QR code with an authenticator app</p>
                        <div className="mx-auto size-40 rounded-lg bg-white/60 flex items-center justify-center">
                          <span className="text-xs text-slate-500">[QR Code would display here]</span>
                        </div>
                        <p className="mt-4 text-xs text-slate-600">Don't have an authenticator app? Try Google Authenticator or Authy.</p>
                      </div>

                      <label className="block">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Enter 6-digit code</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          className="mt-2 text-center tracking-widest w-full rounded-xl border border-white/60 bg-white/50 px-4 py-3 text-slate-900 shadow-inner backdrop-blur-sm outline-none transition focus:border-sky-400/70 focus:ring-2 focus:ring-sky-400/35"
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                          placeholder="000000"
                        />
                      </label>

                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setShowingQRCode(false)
                            setVerificationCode('')
                          }}
                          className="flex-1 rounded-xl border border-white/60 bg-white/40 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-white/60"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleVerify2FA}
                          className="flex-1 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 py-3 text-sm font-bold text-white shadow-lg transition hover:from-emerald-500 hover:to-green-500"
                        >
                          Verify & Enable
                        </button>
                      </div>
                    </div>
                  )}

                  {twoFactorEnabled && (
                    <button
                      type="button"
                      onClick={handleDisable2FA}
                      className="w-full rounded-xl border border-red-300/40 bg-red-100/20 py-3 text-sm font-bold text-red-700 shadow-sm transition hover:bg-red-100/35"
                    >
                      🗑️ Disable Two-Factor Authentication
                    </button>
                  )}

                  <div className="rounded-xl border border-sky-300/40 bg-sky-100/30 p-4">
                    <p className="text-xs text-sky-900">
                      <strong className="block">💡 Tip:</strong>
                      <span className="block mt-1">Save your backup codes in a safe place. You'll need them if you lose access to your authenticator app.</span>
                    </p>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </>
  )
}

function TabButton({
  label,
  active,
  onClick,
  icon,
}: {
  label: string
  active: boolean
  onClick: () => void
  icon: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 px-4 py-4 text-sm font-semibold transition border-b-2 ${
        active
          ? 'border-sky-500 bg-white/20 text-slate-900'
          : 'border-transparent text-slate-600 hover:text-slate-800'
      }`}
    >
      <span className="mr-2">{icon}</span>
      {label}
    </button>
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
