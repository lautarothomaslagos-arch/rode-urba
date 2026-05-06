import { useEffect, useRef, useState } from 'react'

/**
 * Reemplaza <div className="tabs-wrap"><div className="tabs-box">
 * Detecta si hay contenido scrolleable y muestra fades laterales dinámicos.
 * Props: style (para el contenedor externo), className extra para .tabs-box
 */
export default function TabsScrollWrapper({ children, style, boxStyle }) {
  const scrollRef = useRef(null)
  const [showLeft, setShowLeft] = useState(false)
  const [showRight, setShowRight] = useState(false)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    function check() {
      setShowLeft(el.scrollLeft > 4)
      setShowRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
    }

    check()
    el.addEventListener('scroll', check, { passive: true })
    const ro = new ResizeObserver(check)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', check)
      ro.disconnect()
    }
  }, [children])

  return (
    <div style={{ position: 'relative', ...style }}>
      {/* Fade izquierda */}
      <div style={{
        position: 'absolute', top: 0, bottom: 0, left: 0, width: 36,
        background: 'linear-gradient(to right, var(--azul) 30%, transparent)',
        zIndex: 2, pointerEvents: 'none',
        borderRadius: 'var(--radio) 0 0 var(--radio)',
        opacity: showLeft ? 1 : 0,
        transition: 'opacity 0.2s',
      }} />

      {/* Scroll container */}
      <div
        ref={scrollRef}
        className="tabs-box"
        style={{ position: 'relative', ...boxStyle }}
      >
        {children}
      </div>

      {/* Fade derecha */}
      <div style={{
        position: 'absolute', top: 0, bottom: 0, right: 0, width: 36,
        background: 'linear-gradient(to left, var(--azul) 30%, transparent)',
        zIndex: 2, pointerEvents: 'none',
        borderRadius: '0 var(--radio) var(--radio) 0',
        opacity: showRight ? 1 : 0,
        transition: 'opacity 0.2s',
      }} />
    </div>
  )
}
