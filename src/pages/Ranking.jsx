import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const BASE = 'https://xmtsxdzwurxygqqccgdc.supabase.co/storage/v1/object/public/trofeos'

const TROFEOS = [
  { nombre: 'Puma',     minimo: 15, img: `${BASE}/trofeo_puma_v2.png` },
  { nombre: 'Capitán',  minimo: 10, img: `${BASE}/trofeo_capitan_v2.png` },
  { nombre: 'Titular',  minimo: 6,  img: `${BASE}/trofeo_titular_v2.png` },
  { nombre: 'Suplente', minimo: 3,  img: `${BASE}/trofeo_suplente_v2.png` },
]

function getTrofeo(rachaMaxima) {
  return TROFEOS.find(t => rachaMaxima >= t.minimo) || null
}

function RkAvatar({ perfiles, size = 36, style = {} }) {
  const av = perfiles?.avatar_url
  const ini = perfiles?.username?.[0]?.toUpperCase() || '?'
  return (
    <div className="rk-avatar" style={{ width: size, height: size, ...style }}>
      {av
        ? <img src={av} alt={ini} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
            onError={e => e.target.style.display = 'none'} />
        : ini}
    </div>
  )
}

function RkRow({ item, idx, esYo, subVista, movimiento, refProp }) {
  const racha  = item.perfiles?.racha_actual  || 0
  const trofeo = getTrofeo(item.perfiles?.racha_maxima || 0)
  const pts    = subVista === 'anual' ? item.puntos_acumulados : item.total_puntos
  const medals = ['🥇', '🥈', '🥉']
  const mov    = movimiento

  return (
    <div ref={refProp || undefined} className={`rk-row${esYo ? ' rk-row-you' : ''}`}>

      {/* Posición + delta */}
      <div className="rk-pos">
        <div className="rk-pos-num">{medals[idx] ?? (idx + 1)}</div>
        {mov && mov.dir !== 'same' && mov.delta > 0 && (
          <div className={`rk-delta ${mov.dir === 'up' ? 'rk-delta-up' : 'rk-delta-down'}`}>
            {mov.dir === 'up' ? '▲' : '▼'}{mov.delta}
          </div>
        )}
      </div>

      {/* Avatar */}
      <RkAvatar perfiles={item.perfiles} size={36} />

      {/* Info */}
      <div className="rk-info">
        <div className="rk-name">
          <span>{item.perfiles?.username || 'Usuario'}</span>
          {esYo && <span className="rk-you-pill">VOS</span>}
        </div>
        <div className="rk-meta">
          {item.perfiles?.club && <span>{item.perfiles.club}</span>}
          {racha >= 2 && <span className="rk-streak">🔥{racha}</span>}
          {trofeo && (
            <img src={trofeo.img} alt={trofeo.nombre} title={trofeo.nombre}
              style={{ width: 13, height: 13, objectFit: 'contain' }} />
          )}
          {subVista === 'fecha' && item.partidos_totales > 0 && (
            <span>{item.partidos_acertados}/{item.partidos_totales} aciertos</span>
          )}
        </div>
      </div>

      {/* Pts */}
      <div className="rk-pts-block">
        <div className="rk-pts">{pts}</div>
        <div className="rk-pts-lbl">pts</div>
      </div>
    </div>
  )
}

export default function Ranking() {
  const { perfil } = useAuth()
  const [modo, setModo]           = useState('anual')
  const [movimientos, setMovimientos] = useState({})
  const [busqueda, setBusqueda]   = useState('')
  const [fechas, setFechas]       = useState([])
  const [fechaNum, setFechaNum]   = useState(null)
  const [lista, setLista]         = useState([])
  const [listaClubs, setListaClubs] = useState([])
  const [loading, setLoading]     = useState(true)
  const miFilaRef                 = useRef(null)
  const podioRef                  = useRef(null)
  const [mostrarSticky, setMostrarSticky] = useState(false)

  useEffect(() => { cargarFechas() }, [])

  useEffect(() => {
    setMovimientos({})
    setBusqueda('')
    if (modo === 'clubes') cargarClubs()
    else cargarPersonal()
  }, [modo, fechaNum])

  const miIdx  = lista.findIndex(item => item.perfiles?.username === perfil?.username)
  const miItem = miIdx >= 0 ? lista[miIdx] : null

  // Visibility check para sticky "Tu posición"
  useEffect(() => {
    if (!miItem || modo === 'clubes') { setMostrarSticky(false); return }
    const check = () => {
      const ref = miIdx < 3 ? podioRef : miFilaRef
      if (!ref.current) { setMostrarSticky(false); return }
      const rect = ref.current.getBoundingClientRect()
      const visible = rect.top >= 0 && rect.bottom <= window.innerHeight - 130
      setMostrarSticky(!visible)
    }
    check()
    window.addEventListener('scroll', check, { passive: true })
    return () => window.removeEventListener('scroll', check)
  }, [miItem, lista, busqueda, modo, miIdx])

  async function cargarFechas() {
    const { data } = await supabase.from('fechas')
      .select('numero, fecha_partido')
      .eq('resultados_cargados', true)
      .order('numero', { ascending: false })
    const unicas = [...new Map(data?.map(f => [f.numero, f])).values()]
    setFechas(unicas)
    if (unicas.length) setFechaNum(unicas[0].numero)
  }

  async function cargarPersonal() {
    setLoading(true)
    try {
      if (modo === 'anual') {
        const { data, error } = await supabase.from('puntos_totales')
          .select('puntos_acumulados, fechas_jugadas, usuario_id, perfiles(username, nombre_completo, avatar_url, club, racha_actual, racha_maxima)')
          .eq('temporada_id', 1)
          .limit(500)
        if (error) throw error
        const agrupado = {}
        data?.forEach(item => {
          const uid = item.usuario_id
          if (!uid) return
          if (!agrupado[uid]) agrupado[uid] = {
            usuario_id: uid, puntos_acumulados: 0, fechas_jugadas: 0, perfiles: item.perfiles
          }
          agrupado[uid].puntos_acumulados += (item.puntos_acumulados || 0)
          agrupado[uid].fechas_jugadas = Math.max(agrupado[uid].fechas_jugadas, item.fechas_jugadas || 0)
        })
        const currentList = Object.values(agrupado).sort((a, b) => b.puntos_acumulados - a.puntos_acumulados)
        setLista(currentList)

        const { data: allFechas } = await supabase.from('fechas').select('id, numero')
          .eq('resultados_cargados', true).order('numero', { ascending: false })
        const latestNum = allFechas?.[0]?.numero
        if (latestNum != null) {
          const latestIds = (allFechas || []).filter(f => f.numero === latestNum).map(f => f.id)
          const { data: latestPts } = await supabase.from('puntos_fecha')
            .select('usuario_id, total_puntos').in('fecha_id', latestIds)
          const deduct = {}
          latestPts?.forEach(p => { deduct[p.usuario_id] = (deduct[p.usuario_id] || 0) + (p.total_puntos || 0) })
          const prevList = currentList
            .map(item => ({ ...item, puntos_acumulados: (item.puntos_acumulados || 0) - (deduct[item.usuario_id] || 0) }))
            .sort((a, b) => b.puntos_acumulados - a.puntos_acumulados)
          const prevPos = {}
          prevList.forEach((item, idx) => { prevPos[item.usuario_id] = idx + 1 })
          const movs = {}
          currentList.forEach((item, idx) => {
            const prev = prevPos[item.usuario_id]
            if (prev == null || deduct[item.usuario_id] == null) return
            const delta = prev - (idx + 1)
            movs[item.usuario_id] = { delta: Math.abs(delta), dir: delta > 0 ? 'up' : delta < 0 ? 'down' : 'same' }
          })
          setMovimientos(movs)
        }

      } else if (modo === 'fecha' && fechaNum !== null) {
        const { data: fechasIds } = await supabase.from('fechas')
          .select('id').eq('numero', fechaNum).eq('resultados_cargados', true)
        const ids = fechasIds?.map(f => f.id) || []
        if (!ids.length) { setLista([]); setLoading(false); return }
        const { data, error } = await supabase.from('puntos_fecha')
          .select('total_puntos, partidos_acertados, partidos_totales, bonus_pleno, bonus_mitad, usuario_id, perfiles(username, nombre_completo, avatar_url, club, racha_actual, racha_maxima)')
          .in('fecha_id', ids)
        if (error) throw error
        const agrupado = {}
        data?.forEach(item => {
          const uid = item.usuario_id
          if (!uid) return
          if (!agrupado[uid]) agrupado[uid] = {
            usuario_id: uid, total_puntos: 0, partidos_acertados: 0,
            partidos_totales: 0, bonus_pleno: 0, bonus_mitad: 0, perfiles: item.perfiles
          }
          agrupado[uid].total_puntos       += (item.total_puntos || 0)
          agrupado[uid].partidos_acertados += (item.partidos_acertados || 0)
          agrupado[uid].partidos_totales   += (item.partidos_totales || 0)
          agrupado[uid].bonus_pleno        += (item.bonus_pleno || 0)
          agrupado[uid].bonus_mitad        += (item.bonus_mitad || 0)
        })
        const currentListF = Object.values(agrupado).sort((a, b) => b.total_puntos - a.total_puntos)
        setLista(currentListF)

        const { data: allFechasF } = await supabase.from('fechas').select('id, numero')
          .eq('resultados_cargados', true).order('numero', { ascending: false })
        const prevNumF = (allFechasF || []).find(f => f.numero < fechaNum)?.numero
        if (prevNumF != null) {
          const prevIdsF = (allFechasF || []).filter(f => f.numero === prevNumF).map(f => f.id)
          const { data: prevDataF } = await supabase.from('puntos_fecha')
            .select('usuario_id, total_puntos').in('fecha_id', prevIdsF)
          const prevAgrF = {}
          prevDataF?.forEach(p => { prevAgrF[p.usuario_id] = (prevAgrF[p.usuario_id] || 0) + (p.total_puntos || 0) })
          const prevSortedF = Object.entries(prevAgrF).sort(([, a], [, b]) => b - a)
          const prevPosF = {}
          prevSortedF.forEach(([uid], idx) => { prevPosF[uid] = idx + 1 })
          const movsF = {}
          currentListF.forEach((item, idx) => {
            const prev = prevPosF[item.usuario_id]
            if (prev == null) return
            const delta = prev - (idx + 1)
            movsF[item.usuario_id] = { delta: Math.abs(delta), dir: delta > 0 ? 'up' : delta < 0 ? 'down' : 'same' }
          })
          setMovimientos(movsF)
        } else {
          setMovimientos({})
        }
      }
    } catch (e) {
      console.error('Error ranking:', e)
      setLista([])
    }
    setLoading(false)
  }

  async function cargarClubs() {
    setLoading(true)
    try {
      const [{ data, error }, { data: equiposData }] = await Promise.all([
        supabase.from('puntos_totales').select('puntos_acumulados, usuario_id, perfiles(club)').eq('temporada_id', 1).limit(500),
        supabase.from('equipos').select('nombre, nombre_corto, escudo_url')
      ])
      if (error) throw error
      const escudoMap = {}
      equiposData?.forEach(e => { escudoMap[e.nombre] = { abrev: e.nombre_corto, escudo: e.escudo_url } })
      const agrupado = {}
      data?.forEach(item => {
        const club = item.perfiles?.club
        if (!club || club.startsWith('---') || club === 'Otro club') return
        if (!agrupado[club]) agrupado[club] = { club, puntos: 0, usuarios: new Set(), ...(escudoMap[club] || {}) }
        agrupado[club].puntos += (item.puntos_acumulados || 0)
        agrupado[club].usuarios.add(item.usuario_id)
      })
      setListaClubs(Object.values(agrupado)
        .map(c => ({ ...c, miembros: c.usuarios.size }))
        .sort((a, b) => b.puntos - a.puntos))
    } catch (e) {
      console.error('Error clubs:', e)
      setListaClubs([])
    }
    setLoading(false)
  }

  const listaFiltrada = busqueda.trim()
    ? lista.filter(item =>
        item.perfiles?.username?.toLowerCase().includes(busqueda.toLowerCase()) ||
        item.perfiles?.club?.toLowerCase().includes(busqueda.toLowerCase())
      )
    : lista

  const mostrarPodio = !busqueda.trim() && lista.length >= 1 && modo !== 'clubes' && !loading
  const medals = ['🥇', '🥈', '🥉']

  return (
    <div className="dashboard">
      <div className="dash-backdrop" aria-hidden="true" />

      {/* ── Header ── */}
      <header style={{ padding: '20px 20px 6px', position: 'relative', zIndex: 2 }}>
        <div className="prode-eyebrow">Tabla 2026</div>
        <h1 className="prode-h1">
          Ranking
          <span style={{ color: 'var(--pg-text-mute)', margin: '0 6px' }}>·</span>
          <em>{modo === 'anual' ? 'Anual' : modo === 'fecha' ? 'Por fecha' : 'Por clubes'}</em>
        </h1>
      </header>

      {/* ── Segment control ── */}
      <div className="rk-seg">
        {[['anual', 'Anual'], ['fecha', 'Por fecha'], ['clubes', 'Por clubes']].map(([k, l]) => (
          <button key={k} className={`rk-seg-btn${modo === k ? ' rk-seg-btn-active' : ''}`}
            onClick={() => setModo(k)}>
            {l}
          </button>
        ))}
      </div>

      {/* ── Chips de fecha ── */}
      {modo === 'fecha' && fechas.length > 0 && (
        <div className="prode-chip-row" style={{ position: 'relative', zIndex: 2, paddingTop: 0 }}>
          {fechas.map(f => (
            <button key={f.numero}
              className={`prode-chip${fechaNum === f.numero ? ' prode-chip-active' : ''}`}
              onClick={() => setFechaNum(f.numero)}>
              Fecha {f.numero}
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div className="loading" style={{ position: 'relative', zIndex: 2 }}>
          <div className="spinner" />
        </div>
      )}

      {/* ── Búsqueda ── */}
      {!loading && modo !== 'clubes' && lista.length > 0 && (
        <div style={{ padding: '0 16px', position: 'relative', zIndex: 2 }}>
          <input
            className="rk-search"
            placeholder="🔍  Buscar por usuario o club..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
        </div>
      )}

      {/* ── Empty states ── */}
      {!loading && modo !== 'clubes' && lista.length === 0 && (
        <div className="seccion-fade empty-state" style={{ padding: '40px 20px', position: 'relative', zIndex: 2 }}>
          <div style={{ fontSize: 52, marginBottom: 10 }}>{modo === 'anual' ? '🏆' : '📋'}</div>
          <div className="empty-title">
            {modo === 'anual' ? 'El ranking arranca pronto' : `Sin resultados para Fecha ${fechaNum}`}
          </div>
          <p style={{ fontSize: 13, color: 'var(--pg-text-soft)', maxWidth: 260, margin: '8px auto 0', lineHeight: 1.5 }}>
            {modo === 'anual'
              ? 'Aparecerá en cuanto se carguen los primeros resultados de la temporada.'
              : 'Los puntos de esta fecha todavía no fueron registrados.'}
          </p>
        </div>
      )}

      {/* ── Podio top 3 ── */}
      {mostrarPodio && (
        <div className="rk-podium seccion-fade">
          {[lista[1], lista[0], lista[2]].map((item, i) => {
            const place   = [2, 1, 3][i]
            const idxReal = place - 1
            // slot vacío cuando no hay suficientes participantes
            if (!item) return <div key={i} className={`rk-podium-step rk-podium-${place}`} />
            const pts  = modo === 'anual' ? item.puntos_acumulados : item.total_puntos
            const av   = item.perfiles?.avatar_url
            const ini  = item.perfiles?.username?.[0]?.toUpperCase() || '?'
            const esYo = item.perfiles?.username === perfil?.username
            return (
              <div
                key={item.usuario_id}
                ref={esYo ? podioRef : undefined}
                className={`rk-podium-step rk-podium-${place}`}
              >
                <div className="rk-podium-medal">{medals[idxReal]}</div>
                <div className="rk-podium-avatar">
                  {av
                    ? <img src={av} alt={ini} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                        onError={e => e.target.style.display = 'none'} />
                    : ini}
                </div>
                <div className="rk-podium-name">
                  {(item.perfiles?.username || 'Usuario').split(' ')[0]}
                  {esYo && <span style={{ color: 'var(--pg-gold)', marginLeft: 3 }}>★</span>}
                </div>
                <div className="rk-podium-pts">{pts} pts</div>
                <div className="rk-podium-block"><span>{place}</span></div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Lista (desde 4° en adelante, o todos si hay búsqueda) ── */}
      {!loading && modo !== 'clubes' && listaFiltrada.length > 0 && (
        <div className="rk-list seccion-fade">
          {(mostrarPodio ? listaFiltrada.slice(3) : listaFiltrada).map(item => {
            const idxReal = lista.indexOf(item)
            const esYo    = item.perfiles?.username === perfil?.username
            return (
              <RkRow
                key={item.usuario_id}
                item={item}
                idx={idxReal}
                esYo={esYo}
                subVista={modo}
                movimiento={movimientos[item.usuario_id]}
                refProp={esYo && miIdx >= 3 ? miFilaRef : null}
              />
            )
          })}
          {busqueda && listaFiltrada.length === 0 && (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--pg-text-soft)', fontSize: 13 }}>
              Sin resultados para "{busqueda}"
            </div>
          )}
        </div>
      )}

      {/* ── Clubes ── */}
      {!loading && modo === 'clubes' && (
        listaClubs.length === 0
          ? (
            <div className="seccion-fade empty-state" style={{ padding: '40px 20px', position: 'relative', zIndex: 2 }}>
              <div style={{ fontSize: 52, marginBottom: 10 }}>🏉</div>
              <div className="empty-title">Sin datos de clubes todavía</div>
              <p style={{ fontSize: 13, color: 'var(--pg-text-soft)', maxWidth: 260, margin: '8px auto 0', lineHeight: 1.5 }}>
                Completá tu club en Perfil para aparecer acá.
              </p>
            </div>
          ) : (
            <div className="rk-list seccion-fade">
              {listaClubs.map((item, idx) => (
                <div key={item.club} className="rk-row">
                  <div className="rk-pos">
                    <div className="rk-pos-num">{medals[idx] ?? (idx + 1)}</div>
                  </div>
                  <div className="rk-avatar" style={{ borderRadius: 7 }}>
                    {item.escudo
                      ? <img src={item.escudo} alt={item.club}
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      : <span style={{ fontSize: 16 }}>🏉</span>}
                  </div>
                  <div className="rk-info">
                    <div className="rk-name"><span>{item.abrev || item.club}</span></div>
                    <div className="rk-meta">
                      {item.miembros} {item.miembros === 1 ? 'participante' : 'participantes'}
                    </div>
                  </div>
                  <div className="rk-pts-block">
                    <div className="rk-pts">{item.puntos}</div>
                    <div className="rk-pts-lbl">pts</div>
                  </div>
                </div>
              ))}
            </div>
          )
      )}

      {/* ── Sticky "Tu posición" ── */}
      {mostrarSticky && miItem && (
        <div className="rk-you-sticky">
          <div className="rk-you-label">Tu posición</div>
          <RkRow
            item={miItem}
            idx={miIdx}
            esYo={true}
            subVista={modo}
            movimiento={movimientos[miItem.usuario_id]}
          />
        </div>
      )}

      <div style={{ height: mostrarSticky ? 120 : 20 }} />
    </div>
  )
}
