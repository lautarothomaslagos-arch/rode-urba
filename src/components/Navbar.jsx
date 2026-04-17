import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, perfil, signOut } = useAuth()
  const location = useLocation()
  const isActive = (path) => location.pathname === path ? 'active' : ''

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-logo">
        <img src="/logo.png" alt="Pick&Go" />
        <div className="navbar-logo-text">
          <span className="brand">Pick&amp;Go</span>
          <span className="sub">URBA Prode</span>
        </div>
      </Link>

      {user && (
        <div className="navbar-menu">
          <Link to="/prode" className={isActive('/prode')}>Predecir</Link>
          <Link to="/ranking" className={isActive('/ranking')}>Ranking</Link>
          <Link to="/resultados" className={isActive('/resultados')}>Resultados</Link>
          {perfil?.es_admin && <Link to="/admin" className={isActive('/admin')}>Admin</Link>}
          <Link to="/perfil">
            <div className="avatar-circle" title={perfil?.username}>
              {perfil?.avatar_url
                ? <img src={perfil.avatar_url} alt={perfil.username} />
                : (perfil?.username?.[0]?.toUpperCase() || 'U')
              }
            </div>
          </Link>
          <button onClick={signOut} style={{color:'rgba(255,255,255,0.6)',fontSize:12}}>Salir</button>
        </div>
      )}

      {!user && (
        <div className="navbar-menu">
          <Link to="/login">Ingresar</Link>
          <Link to="/registro" style={{background:'rgba(201,162,39,0.2)',color:'#C9A227',borderRadius:7,padding:'7px 13px'}}>Registrarse</Link>
        </div>
      )}
    </nav>
  )
}
