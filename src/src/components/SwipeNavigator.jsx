import { useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ROUTES_BASE  = ['/prode', '/ranking', '/torneos', '/perfil']
const MIN_DIST     = 75    // px mínimos para considerar swipe
const MAX_DURATION = 420   // ms máximos (descarta scrolls lentos)
const DIR_RATIO    = 2.2   // cuánto más horizontal que vertical debe ser

export default function SwipeNavigator({ children }) {
  const { perfil } = useAuth()
  const navigate   = useNavigate()
  const location   = useLocation()
  const touch      = useRef(null)

  const routes    = perfil?.es_admin ? [...ROUTES_BASE, '/admin'] : ROUTES_BASE
  const currentIdx = routes.indexOf(location.pathname)

  // Solo interceptamos páginas del menú principal
  if (currentIdx < 0) return <>{children}</>

  function onTouchStart(e) {
    touch.current = {
      x:    e.touches[0].clientX,
      y:    e.touches[0].clientY,
      time: Date.now(),
    }
  }

  function onTouchEnd(e) {
    if (!touch.current) return
    const { x: sx, y: sy, time } = touch.current
    const ex      = e.changedTouches[0].clientX
    const ey      = e.changedTouches[0].clientY
    const dx      = ex - sx
    const dy      = ey - sy
    const elapsed = Date.now() - time
    touch.current = null

    // Descartar si es demasiado lento, corto o más vertical que horizontal
    if (elapsed > MAX_DURATION)            return
    if (Math.abs(dx) < MIN_DIST)           return
    if (Math.abs(dx) < Math.abs(dy) * DIR_RATIO) return

    if (dx < 0 && currentIdx < routes.length - 1) {
      // Deslizar izquierda → siguiente página
      navigate(routes[currentIdx + 1], { state: { swipe: 'left' } })
    } else if (dx > 0 && currentIdx > 0) {
      // Deslizar derecha → página anterior
      navigate(routes[currentIdx - 1], { state: { swipe: 'right' } })
    }
  }

  // Detectamos la dirección desde location.state para animar la entrada
  const swipeDir = location.state?.swipe   // 'left' | 'right' | undefined

  return (
    <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div
        key={location.pathname}
        className={
          swipeDir === 'left'  ? 'swipe-enter-left'  :
          swipeDir === 'right' ? 'swipe-enter-right' : ''
        }
      >
        {children}
      </div>
    </div>
  )
}
