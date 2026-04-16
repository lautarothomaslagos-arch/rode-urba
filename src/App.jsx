import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Login from './pages/Login'
import Prode from './pages/Prode'
import Ranking from './pages/Ranking'
import Resultados from './pages/Resultados'
import Admin from './pages/Admin'
import './index.css'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="loading">Cargando...</div>
  return user ? children : <Navigate to="/login" />
}

function AdminRoute({ children }) {
  const { perfil, loading } = useAuth()
  if (loading) return <div className="loading">Cargando...</div>
  return perfil?.es_admin ? children : <Navigate to="/" />
}

function AppRoutes() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Login />} />
        <Route path="/prode" element={<PrivateRoute><Prode /></PrivateRoute>} />
        <Route path="/ranking" element={<PrivateRoute><Ranking /></PrivateRoute>} />
        <Route path="/resultados" element={<PrivateRoute><Resultados /></PrivateRoute>} />
        <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
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
