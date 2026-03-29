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

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      authReady,
      firebaseConfigured: isFirebaseConfigured(),
      loginWithEmail,
      registerWithEmail,
      loginWithGoogle,
      logout,
    }),
    [user, authReady, loginWithEmail, registerWithEmail, loginWithGoogle, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
