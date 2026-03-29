import { useEffect, useState } from 'react'
import { isFirebaseConfigured } from '../lib/firebase'
import { subscribeUserProfile } from '../lib/firestoreProfile'
import type { UserProfile } from '../types/user'

export function useFirestoreUserProfile(uid: string | undefined) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(!!uid && isFirebaseConfigured())

  useEffect(() => {
    if (!uid || !isFirebaseConfigured()) {
      setProfile(null)
      setLoading(false)
      return
    }
    setLoading(true)
    const unsub = subscribeUserProfile(uid, (p) => {
      setProfile(p)
      setLoading(false)
    })
    return unsub
  }, [uid])

  return { profile, loading }
}
