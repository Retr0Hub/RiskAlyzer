import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth/AuthContext'
import { useFirestoreUserProfile } from './hooks/useFirestoreUserProfile'
import { LoadingScreen } from './components/LoadingScreen'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { Dashboard } from './pages/Dashboard'

function AppRoutes() {
  const { user, authReady, firebaseConfigured } = useAuth()
  const { profile, loading: profileLoading } = useFirestoreUserProfile(user?.uid)

  if (!authReady) {
    return <LoadingScreen label="Starting…" />
  }

  if (!firebaseConfigured) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Login />} />
      </Routes>
    )
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  if (profileLoading) {
    return <LoadingScreen label="Syncing your profile…" />
  }

  return (
    <Routes>
      <Route path="/register" element={<Register initialProfile={profile} />} />
      <Route
        path="/dashboard"
        element={profile ? <Dashboard profile={profile} /> : <Navigate to="/register" replace />}
      />
      <Route
        path="/"
        element={<Navigate to={profile ? '/dashboard' : '/register'} replace />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
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
