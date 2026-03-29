import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateEmail,
  updatePassword,
  sendPasswordResetEmail,
  type User,
} from 'firebase/auth'
import { getAuthInstance, isFirebaseConfigured } from '../lib/firebase'

type AuthContextValue = {
  user: User | null
  authReady: boolean
  firebaseConfigured: boolean
  loginWithEmail: (email: string, password: string) => Promise<void>
  registerWithEmail: (email: string, password: string) => Promise<void>
  loginWithGoogle: () => Promise<void>
  logout: () => Promise<void>
  updateUserEmail: (newEmail: string) => Promise<void>
  updateUserPassword: (newPassword: string) => Promise<void>
  resetPassword: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [authReady, setAuthReady] = useState(false)

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setAuthReady(true)
      return
    }
    const auth = getAuthInstance()
    return onAuthStateChanged(auth, (u) => {
      setUser(u)
      setAuthReady(true)
    })
  }, [])

  const loginWithEmail = useCallback(async (email: string, password: string) => {
    if (!isFirebaseConfigured()) throw new Error('Firebase not configured')
    await signInWithEmailAndPassword(getAuthInstance(), email, password)
  }, [])

  const registerWithEmail = useCallback(async (email: string, password: string) => {
    if (!isFirebaseConfigured()) throw new Error('Firebase not configured')
    await createUserWithEmailAndPassword(getAuthInstance(), email, password)
  }, [])

  const loginWithGoogle = useCallback(async () => {
    if (!isFirebaseConfigured()) throw new Error('Firebase not configured')
    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({ prompt: 'select_account' })
    provider.addScope('profile')
    await signInWithPopup(getAuthInstance(), provider)
  }, [])

  const logout = useCallback(async () => {
    if (!isFirebaseConfigured()) return
    await signOut(getAuthInstance())
  }, [])

  const updateUserEmail = useCallback(async (newEmail: string) => {
    if (!isFirebaseConfigured()) throw new Error('Firebase not configured')
    const auth = getAuthInstance()
    if (!auth.currentUser) throw new Error('No user signed in')
    await updateEmail(auth.currentUser, newEmail)
  }, [])

  const updateUserPassword = useCallback(async (newPassword: string) => {
    if (!isFirebaseConfigured()) throw new Error('Firebase not configured')
    const auth = getAuthInstance()
    if (!auth.currentUser) throw new Error('No user signed in')
    await updatePassword(auth.currentUser, newPassword)
  }, [])

  const resetPassword = useCallback(async (email: string) => {
    if (!isFirebaseConfigured()) throw new Error('Firebase not configured')
    await sendPasswordResetEmail(getAuthInstance(), email)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      authReady,
      firebaseConfigured: isFirebaseConfigured(),
      loginWithEmail,
      registerWithEmail,
      loginWithGoogle,
      logout,
      updateUserEmail,
      updateUserPassword,
      resetPassword,
    }),
    [user, authReady, loginWithEmail, registerWithEmail, loginWithGoogle, logout, updateUserEmail, updateUserPassword, resetPassword]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
