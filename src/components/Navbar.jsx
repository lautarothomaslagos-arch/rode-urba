import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

export default function Navbar() {
  const { user, perfil, signOut } = useAuth()
  const location = useLocation()
  const [menuAbierto, setMenuAbierto] = useState(false)
  const [escudoClub, setEscudoClub] = useState(null)
  const [hayFechaAbierta, setHayFechaAbierta] = useState(false)
  const isActive = (path) => location.pathname === path ? 'active' : ''

  useEffect(() => { setMenuAbierto(false) }, [location.pathname])

  useEffect(() => {
    if (perfil?.club) {
      supabase.from('equipos').select('escudo_url').eq('nombre', perfil.club).single()
        .then(({ data }) => { if (data?.escudo_url) setEscudoClub(data.escudo_url) })
    }
  }, [perfil?.club])

  useEffect(() => {
    if (!user) return
    supabase.from('fechas').select('id', { count: 'exact', head: true }).eq('activa', true)
      .then(({ count }) => setHayFechaAbierta((count || 0) > 0))
  }, [user])

  return (
    <>
      <nav className="navbar">
        <Link to="/" className="navbar-logo">
          <img src="/logo.png" alt="Pick&Go" />
          <div className="navbar-logo-text">
            <span className="brand">Pick&amp;Go</span>
            <span className="sub">URBA Prode</span>
          </div>
        </Link>

        {user && (
          <>
            {/* Desktop menu */}
            <div className="navbar-menu desktop-menu">
              <Link to="/prode" className={isActive('/prode')} style={{position:'relative'}}>
                Predecir
                {hayFechaAbierta && location.pathname !== '/prode' && (
                  <span style={{position:'absolute',top:4,right:4,width:6,height:6,borderRadius:'50%',background:'var(--dorado)',boxShadow:'0 0 6px rgba(201,162,39,0.9)'}} />
                )}
              </Link>
              <Link to="/ranking" className={isActive('/ranking')}>Ranking</Link>
              <Link to="/torneos" className={isActive('/torneos')}>Torneos</Link>
              {perfil?.es_admin && <Link to="/admin" className={isActive('/admin')}>Admin</Link>}
              <Link to="/perfil" style={{display:'flex',alignItems:'center',gap:6,textDecoration:'none',padding:'4px 8px',borderRadius:8}}>
                <div className="avatar-circle" title={perfil?.username}>
                  {perfil?.avatar_url
                    ? <img src={perfil.avatar_url} alt={perfil.username} />
                    : (perfil?.username?.[0]?.toUpperCase() || 'U')
                  }
                </div>
                {escudoClub && (
                  <div style={{width:24,height:24,borderRadius:'50%',overflow:'hidden',border:'1.5px solid rgba(201,162,39,0.5)',background:'white',flexShrink:0}}>
                    <img src={escudoClub} alt={perfil.club} style={{width:'100%',height:'100%',objectFit:'contain',padding:2}} />
                  </div>
                )}
              </Link>
              <button onClick={signOut} style={{color:'rgba(255,255,255,0.6)',fontSize:12}}>Salir</button>
            </div>

            {/* Mobile: avatar + hamburguesa */}
            <div className="mobile-nav-right">
              <Link to="/perfil" style={{display:'flex',alignItems:'center',gap:6,textDecoration:'none'}}>
                <div className="avatar-circle" title={perfil?.username}>
                  {perfil?.avatar_url
                    ? <img src={perfil.avatar_url} alt={perfil.username} />
                    : (perfil?.username?.[0]?.toUpperCase() || 'U')
                  }
                </div>
                {escudoClub && (
                  <div style={{width:24,height:24,borderRadius:'50%',overflow:'hidden',border:'1.5px solid rgba(201,162,39,0.5)',background:'white',flexShrink:0}}>
                    <img src={escudoClub} alt={perfil.club} style={{width:'100%',height:'100%',objectFit:'contain',padding:2}} />
                  </div>
                )}
              </Link>
              <button className="hamburger hamburger-hidden-mobile" onClick={() => setMenuAbierto(!menuAbierto)}>
                <span className={menuAbierto ? 'bar bar-open-1' : 'bar'}></span>
                <span className={menuAbierto ? 'bar bar-open-2' : 'bar'}></span>
                <span className={menuAbierto ? 'bar bar-open-3' : 'bar'}></span>
              </button>
            </div>
          </>
        )}

        {!user && (
          <div className="navbar-menu">
            <Link to="/login">Ingresar</Link>
            <Link to="/registro" style={{background:'rgba(201,162,39,0.2)',color:'#C9A227',borderRadius:7,padding:'7px 13px'}}>Registrarse</Link>
          </div>
        )}
      </nav>

      {/* Menú desplegable móvil */}
      {user && menuAbierto && (
        <>
          <div className="mobile-overlay" onClick={() => setMenuAbierto(false)} />
          <div className="mobile-menu">
            <Link to="/prode" className={`mobile-menu-item ${isActive('/prode')}`}>
              <span>🏉</span> Predecir
              {hayFechaAbierta && location.pathname !== '/prode' && (
                <span style={{marginLeft:'auto',width:8,height:8,borderRadius:'50%',background:'var(--dorado)',boxShadow:'0 0 6px rgba(201,162,39,0.9)',flexShrink:0}} />
              )}
            </Link>
            <Link to="/ranking" className={`mobile-menu-item ${isActive('/ranking')}`}>
              <span>🏆</span> Ranking
            </Link>
            <Link to="/torneos" className={`mobile-menu-item ${isActive('/torneos')}`}>
              <span>🏆</span> Torneos
            </Link>
            <Link to="/perfil" className={`mobile-menu-item ${isActive('/perfil')}`}>
              <span>👤</span> Mi perfil
            </Link>
            {perfil?.es_admin && (
              <Link to="/admin" className={`mobile-menu-item ${isActive('/admin')}`}>
                <span>⚙️</span> Admin
              </Link>
            )}
            <div style={{height:1,background:'rgba(255,255,255,0.1)',margin:'8px 0'}} />
            <button onClick={() => { signOut(); setMenuAbierto(false) }} className="mobile-menu-item mobile-salir">
              <span>🚪</span> Salir
            </button>
          </div>
        </>
      )}
    </>
  )
}
