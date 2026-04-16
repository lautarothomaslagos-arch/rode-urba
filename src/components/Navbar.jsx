import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, perfil, signOut } = useAuth()
  const location = useLocation()
  const isActive = (path) => location.pathname === path ? 'active' : ''

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-logo">
        <div className="logo-icon">P</div>
        <span>Prode URBA</span>
      </Link>

      {user && (
        <div className="navbar-menu">
          <Link to="/prode" className={isActive('/prode')}>Predecir</Link>
          <Link to="/ranking" className={isActive('/ranking')}>Ranking</Link>
          <Link to="/resultados" className={isActive('/resultados')}>Resultados</Link>
          {perfil?.es_admin && <Link to="/admin" className={isActive('/admin')}>Admin</Link>}
          <div className="avatar-circle" title={perfil?.username}>
            {perfil?.username?.[0]?.toUpperCase() || 'U'}
          </div>
          <button onClick={signOut}>Salir</button>
        </div>
      )}

      {!user && (
        <div className="navbar-menu">
          <Link to="/login">Ingresar</Link>
          <Link to="/registro">Registrarse</Link>
        </div>
      )}
    </nav>
  )
}
