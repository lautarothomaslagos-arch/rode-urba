import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

export default function BottomNav() {
  const { user } = useAuth()
  const location = useLocation()
  const [hayFechaAbierta, setHayFechaAbierta] = useState(false)

  useEffect(() => {
    if (!user) return
    supabase.from('fechas').select('id', { count: 'exact', head: true }).eq('activa', true)
      .then(({ count }) => setHayFechaAbierta((count || 0) > 0))
  }, [user])

  if (!user) return null

  const items = [
    { path: '/prode',   icon: '🏉', label: 'Predecir', dot: hayFechaAbierta },
    { path: '/ranking', icon: '🏆', label: 'Ranking' },
    { path: '/torneos', icon: '📊', label: 'Torneos' },
    { path: '/perfil',  icon: '👤', label: 'Perfil' },
  ]

  return (
    <nav className="bottom-nav">
      {items.map(item => {
        const isActive = location.pathname === item.path
        return (
          <Link key={item.path} to={item.path} className={`bottom-nav-item${isActive ? ' active' : ''}`}>
            <span className="bottom-nav-icon">
              {item.icon}
              {item.dot && !isActive && <span className="bottom-nav-dot" />}
            </span>
            <span className="bottom-nav-label">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
