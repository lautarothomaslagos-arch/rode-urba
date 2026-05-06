import { useState, useEffect, useRef } from 'react'

export default function LogroToast() {
  const [queue, setQueue] = useState([])
  const [current, setCurrent] = useState(null)
  const [visible, setVisible] = useState(false)
  const timerRef = useRef(null)

  // Escuchar eventos de logro desbloqueado
  useEffect(() => {
    const handler = (e) => {
      setQueue(q => [...q, e.detail])
    }
    window.addEventListener('logro-desbloqueado', handler)
    return () => window.removeEventListener('logro-desbloqueado', handler)
  }, [])

  // Procesar la cola
  useEffect(() => {
    if (current || queue.length === 0) return
    const [next, ...rest] = queue
    setQueue(rest)
    setCurrent(next)
    // Pequeño delay para que el render ocurra antes de la animación
    requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)))
    timerRef.current = setTimeout(() => cerrar(), 4500)
  }, [queue, current])

  function cerrar() {
    clearTimeout(timerRef.current)
    setVisible(false)
    setTimeout(() => setCurrent(null), 450)
  }

  if (!current) return null

  return (
    <div
      onClick={cerrar}
      style={{
        position: 'fixed',
        top: visible ? 16 : -180,
        left: '50%',
        transform: 'translateX(-50%)',
        transition: visible
          ? 'top 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)'
          : 'top 0.35s ease-in',
        zIndex: 9999,
        width: 'min(340px, 92vw)',
        cursor: 'pointer',
        userSelect: 'none',
      }}
    >
      {/* Tarjeta */}
      <div style={{
        background: 'linear-gradient(135deg, #1c1c2e 0%, #0f0f1f 100%)',
        border: '1.5px solid rgba(212,175,55,0.7)',
        borderRadius: 16,
        padding: '14px 16px 10px',
        boxShadow: '0 12px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(212,175,55,0.15), 0 0 30px rgba(212,175,55,0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        position: 'relative',
        overflow: 'hidden',
      }}>

        {/* Brillo decorativo */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.6), transparent)',
        }} />

        {/* Icono */}
        <div style={{
          fontSize: 38, lineHeight: 1, flexShrink: 0,
          filter: 'drop-shadow(0 2px 8px rgba(212,175,55,0.4))',
        }}>
          {current.icon}
        </div>

        {/* Texto */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 9, fontWeight: 800, letterSpacing: 1.8,
            color: 'var(--dorado, #d4af37)', textTransform: 'uppercase',
            marginBottom: 3,
          }}>
            🏅 ¡Logro desbloqueado!
          </div>
          <div style={{
            fontSize: 15, fontWeight: 700, color: '#ffffff',
            marginBottom: 2, lineHeight: 1.2,
          }}>
            {current.nombre}
          </div>
          <div style={{
            fontSize: 11, color: 'rgba(255,255,255,0.55)', lineHeight: 1.35,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {current.desc}
          </div>
        </div>

        {/* X cerrar */}
        <div style={{
          fontSize: 14, color: 'rgba(255,255,255,0.3)', flexShrink: 0,
          paddingLeft: 4, paddingBottom: 12, alignSelf: 'flex-start',
        }}>
          ✕
        </div>

        {/* Barra de progreso */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 3,
          background: 'rgba(255,255,255,0.06)', borderRadius: '0 0 16px 16px',
        }}>
          <div style={{
            height: '100%',
            background: 'linear-gradient(90deg, var(--dorado, #d4af37), #f5e07a)',
            borderRadius: '0 0 16px 16px',
            animation: visible ? 'logro-progress 4.5s linear forwards' : 'none',
          }} />
        </div>
      </div>

      {/* Estilos de animación inyectados */}
      <style>{`
        @keyframes logro-progress {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
    </div>
  )
}
