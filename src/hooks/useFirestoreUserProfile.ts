import { useEffect, useState } from 'react'
import { isFirebaseConfigured } from '../lib/firebase'
import { subscribeUserProfile } from '../lib/firestoreProfile'
import type { UserProfile } from '../types/user'

export function useFirestoreUserProfile(uid: string | undefined) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(!!uid && isFirebaseConfigured())
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!uid || !isFirebaseConfigured()) {
      setProfile(null)
      setLoading(false)
      setError(null)
      return
    }

    let isMounted = true
    setLoading(true)
    setError(null)

    try {
      const unsub = subscribeUserProfile(uid, (p) => {
        if (isMounted) {
          setProfile(p)
          setLoading(false)
        }
      })

      return () => {
        isMounted = false
        unsub()
      }
    } catch (err) {
      if (isMounted) {
        setError(err instanceof Error ? err.message : 'Failed to load profile')
        setLoading(false)
      }
      return undefined
    }
  }, [uid])

  return { profile, loading, error }
}
