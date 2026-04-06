import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { getDb } from './firebase'
import { parseUserProfileRecord } from './profileCodec'
import type { UserProfile } from '../types/user'

export function userProfileRef(uid: string) {
  return doc(getDb(), 'users', uid)
}

export async function saveUserProfile(uid: string, profile: UserProfile): Promise<void> {
  await setDoc(userProfileRef(uid), profile, { merge: true })
}

export function subscribeUserProfile(
  uid: string,
  onNext: (profile: UserProfile | null) => void
): () => void {
  return onSnapshot(
    userProfileRef(uid),
    (snap) => {
      if (!snap.exists()) {
        onNext(null)
        return
      }
      onNext(parseUserProfileRecord(snap.data()))
    },
    (err) => {
      console.error('[BreathSense] Firestore profile listener:', err)
      onNext(null)
    }
  )
}
