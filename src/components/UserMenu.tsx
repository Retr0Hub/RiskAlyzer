import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { UserProfile } from '../types/user'
import { useAuth } from '../auth/AuthContext'

export function UserMenu({
  profile,
  align = 'right',
  up = false,
  className = '',
}: {
  profile: UserProfile
  align?: 'left' | 'right'
  up?: boolean
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const { logout, user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  async function handleSignOut() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className={`relative ${className}`} ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex size-10 items-center justify-center rounded-full border border-white/55 bg-gradient-to-br from-sky-400 to-indigo-400 text-sm font-bold text-white shadow-md transition hover:scale-105"
        title={profile.displayName}
      >
        {profile.displayName.slice(0, 1).toUpperCase()}
      </button>

      {open && (
        <div
          className={`absolute ${up ? 'bottom-full mb-2' : 'top-full mt-2'} w-64 rounded-[1.25rem] border border-white/60 bg-white/70 p-2 shadow-xl backdrop-blur-2xl ${
            align === 'right' ? 'right-0' : 'left-0'
          } z-50`}
        >
          <div className="px-3 py-2 pb-3">
            <p className="truncate text-sm font-semibold text-slate-800">{profile.displayName}</p>
            <p className="truncate text-xs text-slate-500">{user?.email}</p>
          </div>
          <div className="flex flex-col gap-1 border-t border-white/40 pt-1.5">
            <Link
              to="/settings"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-white/60"
            >
              Account settings
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-rose-600 transition hover:bg-rose-50/50"
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
