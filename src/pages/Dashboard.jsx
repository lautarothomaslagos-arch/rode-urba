import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

// ── Countdown ────────────────────────────────────────────────
function Countdown({ cierre }) {
  const [diff, setDiff] = useState(Math.max(0, new Date(cierre) - Date.now()))
  useEffect(() => {
    if (!cierre) return
    const iv = setInterval(() => setDiff(Math.max(0, new Date(cierre) - Date.now())), 1000)
    return () => clearInterval(iv)
  }, [cierre])
  const pad = n => String(n).padStart(2, '0')
  const d = Math.floor(diff / 86400000)
  const h = Math.floor((diff % 86400000) / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  const s = Math.floor((diff % 60000) / 1000)
  const cells = d > 0
    ? [{ v: pad(d), l: 'días' }, { v: pad(h), l: 'hs' }, { v: pad(m), l: 'min' }]
    : [{ v: pad(h), l: 'hs' }, { v: pad(m), l: 'min' }, { v: pad(s), l: 'seg' }]
  if (diff === 0) return <div className="dash-closed">Predicciones cerradas</div>
  return (
    <div className="dash-countdown">
      {cells.map((c, i) => (
        <>
          <div key={c.l} className="dash-countdown-cell">
            <span className="dash-countdown-num">{c.v}</span>
            <span className="dash-countdown-lbl">{c.l}</span>
          </div>
          {i < cells.length - 1 && <span className="dash-countdown-sep">:</span>}
        </>
      ))}
    </div>
  )
}

// ── Escudo ───────────────────────────────────────────────────
function Escudo({ equipo, size = 52 }) {
  if (!equipo) return null
  return (
    <div className="dash-escudo" style={{ width: size, height: size }}>
      {equipo.escudo_url
        ? <img src={equipo.escudo_url} alt={equipo.nombre_corto} onError={e => e.target.style.display = 'none'} />
        : <span>{equipo.nombre_corto?.slice(0, 3)}</span>
      }
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────────
export default function Dashboard() {
  const { user, perfil } = useAuth()
  const [loading, setLoading] = useState(true)
  const [fechaActiva, setFechaActiva] = useState(null)
  const [totalPartidos, setTotalPartidos] = useState(0)
  const [picksLoaded, setPicksLoaded] = useState(0)
  const [featuredMatch, setFeaturedMatch] = useState(null)
  const [puntosAcumulados, setPuntosAcumulados] = useState(0)
  const [posicion, setPosicion] = useState(null)
  const [fechasJugadas, setFechasJugadas] = useState(0)

  const racha = perfil?.racha_actual || 0
  const nombre = perfil?.nombre_completo?.split(' ')[0] || perfil?.username || 'jugador'

  useEffect(() => { if (user) cargar() }, [user])

  async function cargar() {
    try {
      // 1. Puntos anuales + ranking
      const { data: statsData } = await supabase
        .from('puntos_totales')
        .select('usuario_id, puntos_acumulados, fechas_jugadas')
        .eq('temporada_id', 1)

      if (statsData?.length) {
        const agrupado = {}
        statsData.forEach(item => {
          const uid = item.usuario_id
          if (!uid) return
          if (!agrupado[uid]) agrupado[uid] = { puntos_acumulados: 0, fechas_jugadas: 0 }
          agrupado[uid].puntos_acumulados += (item.puntos_acumulados || 0)
          agrupado[uid].fechas_jugadas = Math.max(agrupado[uid].fechas_jugadas, item.fechas_jugadas || 0)
        })
        const misStats = agrupado[user.id]
        if (misStats) {
          setPuntosAcumulados(misStats.puntos_acumulados)
          setFechasJugadas(misStats.fechas_jugadas)
        }
        const sorted = Object.values(agrupado).sort((a, b) => b.puntos_acumulados - a.puntos_acumulados)
        const pos = sorted.findIndex((_, i) => {
          const uid = Object.keys(agrupado).sort((a, b) => agrupado[b].puntos_acumulados - agrupado[a].puntos_acumulados)[i]
          return uid === user.id
        })
        setPosicion(pos >= 0 ? pos + 1 : null)
      }

      // 2. Fecha activa Top 14
      const { data: fecha } = await supabase
        .from('fechas')
        .select('id, numero, cierre_predicciones, fecha_partido')
        .eq('activa', true)
        .eq('categoria_id', 1)
        .eq('resultados_cargados', false)
        .maybeSingle()

      if (fecha) {
        setFechaActiva(fecha)

        // 3. Partidos + picks del usuario
        const { data: partidos } = await supabase
          .from('partidos').select('id').eq('fecha_id', fecha.id)
        const ids = (partidos || []).map(p => p.id)
        setTotalPartidos(ids.length)

        if (ids.length) {
          const { data: preds } = await supabase
            .from('predicciones').select('partido_id')
            .eq('usuario_id', user.id).in('partido_id', ids)
          setPicksLoaded((preds || []).length)

          // 4. Partido destacado (primero del Top 14)
          const { data: match } = await supabase
            .from('partidos')
            .select('id, equipo_local:equipo_local_id(nombre, nombre_corto, escudo_url), equipo_visitante:equipo_visitante_id(nombre, nombre_corto, escudo_url)')
            .eq('fecha_id', fecha.id)
            .limit(1)
            .maybeSingle()
          setFeaturedMatch(match)
        }
      }
    } catch (e) {
      console.error('Dashboard error:', e)
    }
    setLoading(false)
  }

  if (loading) return <div className="loading"><div className="spinner" /></div>

  const pct = totalPartidos > 0 ? Math.round((picksLoaded / totalPartidos) * 100) : 0
  const todosLoaded = picksLoaded === totalPartidos && totalPartidos > 0

  return (
    <div className="dashboard">
      <div className="dash-backdrop" aria-hidden="true" />

      {/* ── Header ── */}
      <header className="dash-header">
        <div>
          <div className="dash-greet">Buen día,</div>
          <div className="dash-name">
            {nombre}
            {posicion && <span className="dash-pos"> · <span className="dash-pos-num">#{posicion}</span></span>}
          </div>
        </div>
        <div className="dash-avatar-wrap">
          {perfil?.avatar_url
            ? <img src={perfil.avatar_url} alt={nombre} />
            : <span>{nombre[0]?.toUpperCase()}</span>
          }
          {racha >= 2 && <span className="dash-streak-badge">🔥{racha}</span>}
        </div>
      </header>

      {/* ── Hero card ── */}
      {fechaActiva ? (
        <section className="dash-hero">
          <div className="dash-hero-tag">
            <span className="dash-live-dot" />
            Fecha {fechaActiva.numero} · Top 14
          </div>
          <div className="dash-hero-title">
            {todosLoaded ? '¡Picks listos!' : 'Cierran en'}
          </div>
          {!todosLoaded && fechaActiva.cierre_predicciones && (
            <Countdown cierre={fechaActiva.cierre_predicciones} />
          )}
          <div className="dash-progress">
            <div className="dash-progress-track">
              <div className="dash-progress-fill" style={{ width: `${pct}%` }} />
            </div>
            <div className="dash-progress-label">
              {todosLoaded
                ? '✓ Todos los picks cargados'
                : `${picksLoaded} / ${totalPartidos} picks cargados`}
            </div>
          </div>
          <Link to="/prode" className="dash-cta-primary">
            {todosLoaded ? 'Ver mis predicciones' : 'Cargar mis picks'}
          </Link>
        </section>
      ) : (
        <section className="dash-hero dash-hero-empty">
          <div className="dash-hero-tag">Top 14 · 2026</div>
          <div className="dash-hero-title">Sin fecha abierta</div>
          <p className="dash-hero-sub">Las predicciones aparecerán cuando se abra la próxima fecha.</p>
          <Link to="/torneos" className="dash-cta-secondary">Ver posiciones</Link>
        </section>
      )}

      {/* ── Stats strip ── */}
      <section className="dash-stats">
        <div className="dash-stat">
          <span className="dash-stat-num">{puntosAcumulados}</span>
          <span className="dash-stat-lbl">puntos</span>
        </div>
        <div className="dash-stat dash-stat-accent">
          <span className="dash-stat-num">{posicion ? `#${posicion}` : '—'}</span>
          <span className="dash-stat-lbl">ranking</span>
        </div>
        <div className="dash-stat">
          <span className="dash-stat-num">{fechasJugadas}</span>
          <span className="dash-stat-lbl">fechas</span>
        </div>
        <div className="dash-stat dash-stat-fire">
          <span className="dash-stat-num">{racha}<span className="dash-fire">🔥</span></span>
          <span className="dash-stat-lbl">racha</span>
        </div>
      </section>

      {/* ── Partido destacado ── */}
      {featuredMatch && (
        <section className="dash-featured">
          <div className="dash-featured-tag">★ Partido destacado · Top 14</div>
          <div className="dash-featured-card">
            <div className="dash-featured-side">
              <Escudo equipo={featuredMatch.equipo_local} />
              <div className="dash-featured-team">{featuredMatch.equipo_local?.nombre_corto}</div>
            </div>
            <div className="dash-featured-mid">
              <div className="dash-vs">VS</div>
            </div>
            <div className="dash-featured-side">
              <Escudo equipo={featuredMatch.equipo_visitante} />
              <div className="dash-featured-team">{featuredMatch.equipo_visitante?.nombre_corto}</div>
            </div>
          </div>
          <Link to="/prode" className="dash-cta-secondary">Predecir este partido</Link>
        </section>
      )}

      {/* ── Sistema de puntos ── */}
      <section className="dash-points">
        <div className="dash-point-card">
          <span className="dash-point-icon">🎯</span>
          <span className="dash-point-num">+3</span>
          <span className="dash-point-lbl">resultado<br />exacto</span>
        </div>
        <div className="dash-point-card">
          <span className="dash-point-icon">⚡</span>
          <span className="dash-point-num">+5</span>
          <span className="dash-point-lbl">pleno de<br />fecha</span>
        </div>
        <div className="dash-point-card dash-point-card-active">
          <span className="dash-point-icon">🔥</span>
          <span className="dash-point-num">×{Math.max(racha, 1)}</span>
          <span className="dash-point-lbl">racha<br />activa</span>
        </div>
      </section>

      <div style={{ height: 20 }} />
    </div>
  )
}
