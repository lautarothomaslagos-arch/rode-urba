import { BrowserRouter, Routes, Route, Navigate, useSearchParams } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import Navbar from './components/Navbar'
import LogroToast from './components/LogroToast'
import Login from './pages/Login'
import Prode from './pages/Prode'
import Ranking from './pages/Ranking'
import Admin from './pages/Admin'
import Perfil from './pages/Perfil'
import Torneos from './pages/Torneos'
import Dashboard from './pages/Dashboard'
import NuevaContrasena from './pages/NuevaContrasena'
import Privacidad from './pages/Privacidad'
import Terminos from './pages/Terminos'
import SwipeNavigator from './components/SwipeNavigator'
import BottomNav from './components/BottomNav'
import './index.css'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="loading"><div className="spinner"></div></div>
  return user ? children : <Navigate to="/login" />
}

function AdminRoute({ children }) {
  const { perfil, loading } = useAuth()
  if (loading) return <div className="loading"><div className="spinner"></div></div>
  return perfil?.es_admin ? children : <Navigate to="/" />
}

function HomeRoute() {
  const { user, loading } = useAuth()
  if (loading) return <div className="loading"><div className="spinner"></div></div>
  if (user) return <Navigate to="/home" replace />
  return <Navigate to="/login" replace />
}

function GruposRedirect() {
  const [searchParams] = useSearchParams()
  const codigo = searchParams.get('codigo')
  return <Navigate to={codigo ? `/perfil?codigo=${codigo}` : '/perfil'} replace />
}

function AppRoutes() {
  return (
    <>
      <Navbar />
      <LogroToast />
      <BottomNav />
      <SwipeNavigator>
      <Routes>
        <Route path="/" element={<HomeRoute />} />
        <Route path="/home" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Login modoInicial="registro" />} />
        <Route path="/nueva-contrasena" element={<NuevaContrasena />} />
        <Route path="/prode" element={<PrivateRoute><Prode /></PrivateRoute>} />
        <Route path="/ranking" element={<PrivateRoute><Ranking /></PrivateRoute>} />
        <Route path="/torneos" element={<PrivateRoute><Torneos /></PrivateRoute>} />
        <Route path="/resultados" element={<Navigate to="/torneos" />} />
        <Route path="/estadisticas" element={<Navigate to="/torneos" />} />
        <Route path="/perfil" element={<PrivateRoute><Perfil /></PrivateRoute>} />
        <Route path="/grupos" element={<GruposRedirect />} />
        <Route path="/privacidad" element={<Privacidad />} />
        <Route path="/terminos" element={<Terminos />} />
        <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      </SwipeNavigator>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
