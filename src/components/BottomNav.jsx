import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function IconHome() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11 12 3l9 8v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V11z"/>
    </svg>
  )
}

function IconPredecir() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
    </svg>
  )
}

function IconRanking() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="14" width="4" height="8" rx="1"/>
      <rect x="10" y="9" width="4" height="13" rx="1"/>
      <rect x="18" y="4" width="4" height="18" rx="1"/>
    </svg>
  )
}

function IconTorneos() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 21h8M12 17v4"/>
      <path d="M17 3H7v7a5 5 0 0 0 10 0V3Z"/>
      <path d="M17 5h3v3a3 3 0 0 1-3 3"/>
      <path d="M7 5H4v3a3 3 0 0 0 3 3"/>
    </svg>
  )
}

function IconPerfil() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4"/>
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
    </svg>
  )
}

export default function BottomNav() {
  const { user, hayFechaAbierta } = useAuth()
  const location = useLocation()

  const nomostrar = ['/', '/admin']
  if (!user || nomostrar.includes(location.pathname)) return null

  const items = [
    { path: '/home',    Icon: IconHome,     label: 'Inicio' },
    { path: '/prode',   Icon: IconPredecir, label: 'Predecir', dot: hayFechaAbierta },
    { path: '/ranking', Icon: IconRanking,  label: 'Ranking' },
    { path: '/torneos', Icon: IconTorneos,  label: 'Torneos' },
    { path: '/perfil',  Icon: IconPerfil,   label: 'Perfil' },
  ]

  return (
    <nav className="bottom-nav">
      {items.map(item => {
        const isActive = location.pathname === item.path
        return (
          <Link key={item.path} to={item.path} className={`bottom-nav-item${isActive ? ' active' : ''}`}>
            <span className="bottom-nav-icon">
              <item.Icon />
              {item.dot && !isActive && <span className="bottom-nav-dot" />}
            </span>
            <span className="bottom-nav-label">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
