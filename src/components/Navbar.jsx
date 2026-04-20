import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Navbar() {
  const { user, perfil, signOut } = useAuth()
  const location = useLocation()
  const isActive = (path) => location.pathname === path ? 'active' : ''
  const [escudoClub, setEscudoClub] = useState(null)

  useEffect(() => {
    if (perfil?.club) {
      supabase.from('equipos').select('escudo_url').eq('nombre', perfil.club).single()
        .then(({ data }) => { if (data?.escudo_url) setEscudoClub(data.escudo_url) })
    }
  }, [perfil?.club])

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
