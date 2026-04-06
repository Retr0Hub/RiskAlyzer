import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth/AuthContext'
import { useFirestoreUserProfile } from './hooks/useFirestoreUserProfile'
import { LoadingScreen } from './components/LoadingScreen'
import { Landing } from './pages/Landing'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { Settings } from './pages/Settings'
import { Dashboard } from './pages/Dashboard'

function AppRoutes() {
  const { user, authReady, firebaseConfigured } = useAuth()
  const { profile, loading: profileLoading, error: profileError } = useFirestoreUserProfile(user?.uid)

  if (!authReady) {
    return <LoadingScreen label="Starting…" />
  }

  if (!firebaseConfigured) {
    return (
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    )
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    )
  }

  // If profile is still loading, show loading screen
  if (profileLoading) {
    return <LoadingScreen label="Loading your dashboard…" />
  }

  // If profile loading failed, log and direct to register
  if (profileError) {
    console.error('[BreathSense] Profile load error:', profileError)
  }

  // If profile exists, go directly to dashboard
  if (profile) {
    return (
      <Routes>
        <Route path="/dashboard" element={<Dashboard profile={profile} />} />
        <Route path="/settings" element={<Settings initialProfile={profile} />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    )
  }

  // If no profile, show register page
  return (
    <Routes>
      <Route path="/register" element={<Register initialProfile={profile} />} />
      <Route path="*" element={<Navigate to="/register" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
