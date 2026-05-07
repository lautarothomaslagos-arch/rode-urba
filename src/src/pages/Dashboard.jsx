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
        <span key={c.l} style={{ display: 'contents' }}>
          <div className="dash-countdown-cell">
            <span className="dash-countdown-num">{c.v}</span>
            <span className="dash-countdown-lbl">{c.l}</span>
          </div>
          {i < cells.length - 1 && <span className="dash-countdown-sep">:</span>}
        </span>
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
  const [escudoClub, setEscudoClub] = useState(null)

  // Fecha activa
  const [fechaActiva, setFechaActiva] = useState(null)
  const [totalPartidos, setTotalPartidos] = useState(0)
  const [picksLoaded, setPicksLoaded] = useState(0)
  const [featuredMatch, setFeaturedMatch] = useState(null)
  const [featuredPick, setFeaturedPick] = useState(null) // predicción del usuario para el partido destacado

  // Stats anuales
  const [puntosAcumulados, setPuntosAcumulados] = useState(0)
  const [posicion, setPosicion] = useState(null)
  const [distanciaArriba, setDistanciaArriba] = useState(null)
  const [posArriba, setPosArriba] = useState(null)

  // Cards inferiores
  const [ultimaFecha, setUltimaFecha] = useState(null)   // { numero, pts, pos }
  const [mejorFecha, setMejorFecha] = useState(null)     // { numero, pts }

  const racha = perfil?.racha_actual || 0
  const nombre = perfil?.nombre_completo?.split(' ')[0] || perfil?.username || 'jugador'

  useEffect(() => { if (user) cargar() }, [user])

  useEffect(() => {
    if (!perfil?.club) return
    supabase.from('equipos').select('escudo_url').eq('nombre', perfil.club).maybeSingle()
      .then(({ data }) => setEscudoClub(data?.escudo_url || null))
  }, [perfil?.club])

  async function cargar() {
    try {
      // ── 1. Puntos anuales + ranking ──────────────────────
      const { data: statsData } = await supabase
        .from('puntos_totales')
        .select('usuario_id, puntos_acumulados, fechas_jugadas')
        .eq('temporada_id', 1)

      let misPuntosAcum = 0
      if (statsData?.length) {
        const agrupado = {}
        statsData.forEach(item => {
          const uid = item.usuario_id
          if (!uid) return
          if (!agrupado[uid]) agrupado[uid] = { puntos_acumulados: 0 }
          agrupado[uid].puntos_acumulados += (item.puntos_acumulados || 0)
        })
        misPuntosAcum = agrupado[user.id]?.puntos_acumulados || 0
        setPuntosAcumulados(misPuntosAcum)

        const sorted = Object.entries(agrupado)
          .sort((a, b) => b[1].puntos_acumulados - a[1].puntos_acumulados)
        const pos = sorted.findIndex(([uid]) => uid === user.id)
        if (pos >= 0) {
          setPosicion(pos + 1)
          if (pos > 0) {
            const ptsArriba = sorted[pos - 1][1].puntos_acumulados
            setDistanciaArriba(ptsArriba - misPuntosAcum)
            setPosArriba(pos)
          }
        }
      }

      // ── 2. Última fecha con resultados (todas las categorías) ──
      const { data: ultimaFechaInfo } = await supabase
        .from('fechas').select('id, numero')
        .eq('resultados_cargados', true)
        .order('numero', { ascending: false })
        .limit(1).maybeSingle()

      if (ultimaFechaInfo) {
        // Todas las fechas con ese número (todas las categorías)
        const { data: fechasMismoNum } = await supabase
          .from('fechas').select('id')
          .eq('numero', ultimaFechaInfo.numero)
          .eq('resultados_cargados', true)
        const fids = (fechasMismoNum || []).map(f => f.id)

        const [{ data: misPts }, { data: todosPts }] = await Promise.all([
          supabase.from('puntos_fecha').select('total_puntos').eq('usuario_id', user.id).in('fecha_id', fids),
          supabase.from('puntos_fecha').select('usuario_id, total_puntos').in('fecha_id', fids)
        ])

        // Agrupar por usuario
        const byUser = {}
        ;(todosPts || []).forEach(p => {
          byUser[p.usuario_id] = (byUser[p.usuario_id] || 0) + (p.total_puntos || 0)
        })
        const miTotal = (misPts || []).reduce((acc, p) => acc + (p.total_puntos || 0), 0)
        const posEnFecha = Object.values(byUser).filter(v => v > miTotal).length + 1

        setUltimaFecha({ numero: ultimaFechaInfo.numero, pts: miTotal, pos: posEnFecha })
      }

      // ── 3. Mejor fecha personal ──────────────────────────
      const { data: todasMisFechas } = await supabase
        .from('puntos_fecha').select('total_puntos, fecha_id')
        .eq('usuario_id', user.id)
      if (todasMisFechas?.length) {
        const mejor = todasMisFechas.reduce((max, curr) =>
          (curr.total_puntos || 0) > (max.total_puntos || 0) ? curr : max,
          { total_puntos: 0, fecha_id: null }
        )
        if (mejor.fecha_id) {
          const { data: mejorInfo } = await supabase
            .from('fechas').select('numero').eq('id', mejor.fecha_id).maybeSingle()
          setMejorFecha({ pts: mejor.total_puntos, numero: mejorInfo?.numero })
        }
      }

      // ── 4. Fecha activa Top 14 ───────────────────────────
      const { data: fecha } = await supabase
        .from('fechas').select('id, numero, cierre_predicciones')
        .eq('activa', true).eq('categoria_id', 1).eq('resultados_cargados', false)
        .maybeSingle()

      if (fecha) {
        setFechaActiva(fecha)
        const { data: partidos } = await supabase
          .from('partidos').select('id').eq('fecha_id', fecha.id)
        const ids = (partidos || []).map(p => p.id)
        setTotalPartidos(ids.length)

        if (ids.length) {
          const { data: preds } = await supabase
            .from('predicciones').select('partido_id')
            .eq('usuario_id', user.id).in('partido_id', ids)
          setPicksLoaded((preds || []).length)

          // Partido destacado (primero del Top 14)
          const { data: match } = await supabase
            .from('partidos')
            .select('id, equipo_local:equipo_local_id(nombre, nombre_corto, escudo_url), equipo_visitante:equipo_visitante_id(nombre, nombre_corto, escudo_url)')
            .eq('fecha_id', fecha.id).limit(1).maybeSingle()

          if (match) {
            setFeaturedMatch(match)
            // ¿El usuario ya lo predijo?
            const { data: pick } = await supabase
              .from('predicciones').select('goles_local, goles_visitante')
              .eq('usuario_id', user.id).eq('partido_id', match.id).maybeSingle()
            setFeaturedPick(pick || null)
          }
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
        <div className="dash-header-right">
          <div className="dash-avatar-wrap">
            {perfil?.avatar_url
              ? <img src={perfil.avatar_url} alt={nombre} />
              : <span>{nombre[0]?.toUpperCase()}</span>
            }
            {racha >= 2 && <span className="dash-streak-badge">🔥{racha}</span>}
          </div>
          {escudoClub && (
            <div className="dash-club-shield">
              <img src={escudoClub} alt={perfil?.club}
                onError={e => e.target.parentElement.style.display = 'none'} />
            </div>
          )}
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
              {todosLoaded ? '✓ Todos los picks cargados' : `${picksLoaded} / ${totalPartidos} picks cargados`}
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
          <span className="dash-stat-num">{racha}<span className="dash-fire">🔥</span></span>
          <span className="dash-stat-lbl">racha</span>
        </div>
        <div className="dash-stat dash-stat-fire">
          <span className="dash-stat-num">{perfil?.racha_maxima || 0}</span>
          <span className="dash-stat-lbl">récord</span>
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
              {featuredPick ? (
                <div className="dash-pick-score">
                  <span className="dash-pick-label">Tu pick</span>
                  <span className="dash-pick-result">
                    <strong>{featuredPick.goles_local}</strong>
                    <span className="dash-pick-dash"> — </span>
                    <strong>{featuredPick.goles_visitante}</strong>
                  </span>
                </div>
              ) : (
                <div className="dash-vs">VS</div>
              )}
            </div>
            <div className="dash-featured-side">
              <Escudo equipo={featuredMatch.equipo_visitante} />
              <div className="dash-featured-team">{featuredMatch.equipo_visitante?.nombre_corto}</div>
            </div>
          </div>
          {!featuredPick && (
            <Link to="/prode" className="dash-cta-secondary">Predecir este partido</Link>
          )}
        </section>
      )}

      {/* ── Cards inferiores (Opción 2) ── */}
      <section className="dash-points">
        {/* Última fecha */}
        <div className="dash-point-card">
          <span className="dash-point-icon">📅</span>
          <span className="dash-point-num">
            {ultimaFecha ? ultimaFecha.pts : '—'}
          </span>
          <span className="dash-point-lbl">
            {ultimaFecha ? `pts · F${ultimaFecha.numero}` : 'sin datos'}
          </span>
          {ultimaFecha && (
            <span className="dash-point-sub">#{ultimaFecha.pos} en esa fecha</span>
          )}
        </div>

        {/* Distancia al de arriba */}
        <div className="dash-point-card dash-point-card-rival">
          <span className="dash-point-icon">⚔️</span>
          <span className="dash-point-num">
            {distanciaArriba != null ? `${distanciaArriba}` : '—'}
          </span>
          <span className="dash-point-lbl">
            {distanciaArriba != null
              ? `pts al #${posArriba}`
              : posicion === 1 ? 'sos líder 🥇' : 'sin datos'}
          </span>
          {posicion === 1 && <span className="dash-point-sub">nadie por delante</span>}
        </div>

        {/* Mejor fecha */}
        <div className="dash-point-card dash-point-card-active">
          <span className="dash-point-icon">🏅</span>
          <span className="dash-point-num">
            {mejorFecha ? mejorFecha.pts : '—'}
          </span>
          <span className="dash-point-lbl">
            {mejorFecha ? `récord · F${mejorFecha.numero}` : 'sin datos'}
          </span>
          {mejorFecha && <span className="dash-point-sub">tu mejor fecha</span>}
        </div>
      </section>

      <div style={{ height: 20 }} />
    </div>
  )
}
