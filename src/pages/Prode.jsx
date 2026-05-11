import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { PartidoCardPrediccion } from '../components/PartidoCard'
import { CATS } from '../lib/constants'
import EquipoPopup from '../components/EquipoPopup'
import { computeEquipoStats } from '../lib/equipoStats'
import { hayCAmbiosRef } from '../lib/prodeState'
import { usePushNotifications } from '../hooks/usePushNotifications'

function scoreRandom() {
  return Math.floor(Math.random() * 46) + 3
}

function toUTC(cierre) {
  if (!cierre) return null
  return cierre.endsWith('Z') ? cierre : cierre + 'Z'
}

function estaAbierto(cierre) {
  if (!cierre) return true
  return new Date() < new Date(toUTC(cierre))
}

function useCountdown(cierre) {
  const [texto, setTexto] = useState('')
  const [urgente, setUrgente] = useState(false)
  useEffect(() => {
    if (!cierre) return
    function actualizar() {
      const diff = new Date(toUTC(cierre)) - new Date()
      if (diff <= 0) { setTexto('Cerradas'); setUrgente(false); return }
      const d = Math.floor(diff / 86400000)
      const h = Math.floor((diff % 86400000) / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setUrgente(diff < 3600000)
      if (d > 0) setTexto(`${d}d ${h}h ${m}m`)
      else if (h > 0) setTexto(`${h}h ${m}m`)
      else setTexto(`${m}m ${s}s`)
    }
    actualizar()
    const iv = setInterval(actualizar, 1000)
    return () => clearInterval(iv)
  }, [cierre])
  return { texto, urgente }
}

export default function Prode() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [cat, setCat] = useState(1)
  const [fechas, setFechas] = useState([])
  const [fechaId, setFechaId] = useState(null)
  const [partidos, setPartidos] = useState([])
  const [preds, setPreds] = useState({})
  const [guardando, setGuardando] = useState(false)
  const [guardado, setGuardado] = useState(false)
  const [hayCAmbios, setHayCAmbiosState] = useState(false)
  function setHayCAmbios(v) { setHayCAmbiosState(v); hayCAmbiosRef.current = v }
  const [loading, setLoading] = useState(true)
  const [errorCarga, setErrorCarga] = useState(false)
  const [girando, setGirando] = useState(false)
  const [catsActivas, setCatsActivas] = useState(new Set())
  const [savedPreds, setSavedPreds] = useState(new Set())
  const [statsEquipos, setStatsEquipos] = useState({})
  const [popupData, setPopupData] = useState(null) // { equipos: [stats, stats?], partido }
  const [mostrarInfo, setMostrarInfo] = useState(false)
  const [mostrarNotifPrompt, setMostrarNotifPrompt] = useState(false)
  const [notifDismissed, setNotifDismissed] = useState(() => !!localStorage.getItem('pg-notif-dismissed'))
  const { permiso, suscrito, suscribirse } = usePushNotifications()
  function dismissNotif() { localStorage.setItem('pg-notif-dismissed', '1'); setNotifDismissed(true) }
  const mostrarBannerNotif = !notifDismissed && !suscrito && (permiso === 'default' || permiso === 'granted') && 'Notification' in window

  useEffect(() => { if (user) calcularPendientes() }, [user])

  useEffect(() => {
    const handler = (e) => {
      if (hayCAmbios) { e.preventDefault(); e.returnValue = '' }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [hayCAmbios])

  async function calcularPendientes() {
    const { data: fechasActivas } = await supabase.from('fechas')
      .select('id, categoria_id').eq('activa', true).eq('resultados_cargados', false)
    if (!fechasActivas?.length) { setCatsActivas(new Set()); return }
    const fids = fechasActivas.map(f => f.id)
    const { data: partidos } = await supabase.from('partidos').select('id, fecha_id').in('fecha_id', fids)
    const { data: preds } = await supabase.from('predicciones').select('partido_id')
      .eq('usuario_id', user.id).in('partido_id', (partidos || []).map(p => p.id))
    const predsSet = new Set((preds || []).map(p => p.partido_id))
    const pendientes = new Set()
    fechasActivas.forEach(f => {
      const pts = (partidos || []).filter(p => p.fecha_id === f.id)
      const completos = pts.filter(p => predsSet.has(p.id)).length
      if (pts.length > 0 && completos < pts.length) pendientes.add(f.categoria_id)
    })
    setCatsActivas(pendientes)
  }

  useEffect(() => { cargarFechas(cat) }, [cat])
  useEffect(() => { if (fechaId) cargarPartidos(fechaId) }, [fechaId])
  useEffect(() => { cargarStatsCategoria(cat) }, [cat])

  async function cargarFechas(c) {
    setLoading(true)
    setErrorCarga(false)
    try {
      const { data, error } = await supabase.from('fechas')
        .select('*').eq('categoria_id', c).eq('activa', true)
        .eq('resultados_cargados', false).order('numero')
      if (error) throw error
      setFechas(data || [])
      if (data?.length) {
        if (fechaId === data[0].id) {
          cargarPartidos(data[0].id)
        } else {
          setFechaId(data[0].id)
        }
      } else {
        setFechaId(null)
        setPartidos([])
        setLoading(false)
      }
    } catch(e) {
      console.error('Error cargando fechas:', e)
      setErrorCarga(true)
      setLoading(false)
    }
  }

  async function cargarStatsCategoria(c) {
    try {
      // Todas las fechas con resultados de esta categoría
      const { data: fechasCat } = await supabase.from('fechas')
        .select('id').eq('categoria_id', c).eq('resultados_cargados', true)
      const ids = (fechasCat || []).map(f => f.id)
      if (!ids.length) { setStatsEquipos({}); return }
      const { data: partidosCat } = await supabase.from('partidos')
        .select('equipo_local_id, equipo_visitante_id, resultado_local, resultado_visitante, bonus_of_local, bonus_of_visitante, fecha_id, equipo_local:equipo_local_id(id,nombre,nombre_corto,escudo_url), equipo_visitante:equipo_visitante_id(id,nombre,nombre_corto,escudo_url)')
        .in('fecha_id', ids)
        .not('resultado_local', 'is', null)
      setStatsEquipos(computeEquipoStats(partidosCat || []))
    } catch(e) {
      setStatsEquipos({})
    }
  }

  async function cargarPartidos(fid) {
    setLoading(true)
    const { data: pts } = await supabase.from('partidos')
      .select('*, equipo_local:equipo_local_id(id,nombre,nombre_corto,escudo_url), equipo_visitante:equipo_visitante_id(id,nombre,nombre_corto,escudo_url)')
      .eq('fecha_id', fid).order('id')
    setPartidos(pts || [])
    if (pts?.length) {
      const { data: pr } = await supabase.from('predicciones').select('*')
        .eq('usuario_id', user.id).in('partido_id', pts.map(p => p.id))
      const m = {}
      pr?.forEach(p => { m[p.partido_id] = { local: p.goles_local, visitante: p.goles_visitante } })
      setPreds(m)
      setSavedPreds(new Set((pr || []).map(p => p.partido_id)))
    }
    setHayCAmbios(false)
    setLoading(false)
  }

  function updPred(pid, lado, val) {
    const n = typeof val === 'number' ? val : Math.max(0, parseInt(val) || 0)
    setPreds(prev => ({ ...prev, [pid]: { ...prev[pid], [lado]: n } }))
    setHayCAmbios(true)
  }

  function tirarMonedaTodos() {
    if (girando) return
    setGirando(true)
    setTimeout(() => {
      const nuevasPreds = { ...preds }
      partidos.forEach(p => {
        nuevasPreds[p.id] = { local: scoreRandom(), visitante: scoreRandom() }
      })
      setPreds(nuevasPreds)
      setHayCAmbios(true)
      setGirando(false)
    }, 1500)
  }

  async function guardar() {
    if (!navigator.onLine) {
      alert('📵 Sin conexión — tus picks no fueron guardados. Conectate a internet e intentá de nuevo.')
      return
    }
    setGuardando(true)
    const fi = fechas.find(f => f.id === fechaId)
    if (!estaAbierto(fi?.cierre_predicciones)) { alert('Las predicciones están cerradas'); setGuardando(false); return }
    const upserts = Object.entries(preds)
      .filter(([, v]) => v.local !== undefined && v.visitante !== undefined)
      .map(([pid, v]) => ({
        usuario_id: user.id, partido_id: parseInt(pid),
        goles_local: v.local, goles_visitante: v.visitante,
        updated_at: new Date().toISOString()
      }))
    if (upserts.length) {
      const { error } = await supabase.from('predicciones').upsert(upserts, { onConflict: 'usuario_id,partido_id' })
      if (error) {
        alert('❌ Error al guardar. Verificá tu conexión e intentá de nuevo.')
        setGuardando(false)
        return
      }
      setSavedPreds(prev => new Set([...prev, ...upserts.map(u => u.partido_id)]))
      setGuardado(true)
      setHayCAmbios(false)
      calcularPendientes()
      setTimeout(() => setGuardado(false), 3000)
      // Mostrar prompt de notificaciones si nunca se pidió y nunca se cerró el banner
      if ((permiso === 'default' || permiso === 'granted') && !suscrito && !localStorage.getItem('pg-notif-dismissed')) {
        setTimeout(() => setMostrarNotifPrompt(true), 1500)
      }
    }
    setGuardando(false)
  }

  function emptyStats(equipo) {
    return { equipo, pj:0, g:0, e:0, pe:0, pf:0, pc:0, pts:0, bd:0, bo:0, dif:0, resultados:[], forma:[] }
  }

  function handleEquipoTap(equipo, partido) {
    const stats = statsEquipos[equipo?.id] ?? emptyStats(equipo)
    const side  = equipo?.id === partido?.equipo_local?.id ? 'left' : 'right'
    const item  = { stats, side }
    setPopupData(prev => {
      if (!prev) return { items: [item], partido }
      // mismo equipo → cerrar
      if (prev.partido?.id === partido?.id && prev.items.length === 1 && prev.items[0].stats.equipo.id === equipo.id) return null
      // mismo partido, 1 card, rival → abrir segunda
      if (prev.partido?.id === partido?.id && prev.items.length === 1) {
        return { ...prev, items: [prev.items[0], item] }
      }
      // distinto partido o ya hay 2 → reemplazar
      return { items: [item], partido }
    })
  }

  // Rival flotante (solo cuando hay 1 card abierta)
  const rivalEquipo = popupData?.items.length === 1 && popupData?.partido
    ? (popupData.items[0].side === 'left'
        ? popupData.partido.equipo_visitante
        : popupData.partido.equipo_local)
    : null
  const rivalStats = rivalEquipo ? (statsEquipos[rivalEquipo.id] ?? emptyStats(rivalEquipo)) : null
  const rivalSide  = popupData?.items.length === 1
    ? (popupData.items[0].side === 'left' ? 'right' : 'left')
    : null

  const fi = fechas.find(f => f.id === fechaId)
  const abierto = estaAbierto(fi?.cierre_predicciones)
  const { texto: countdownTexto, urgente: countdownUrgente } = useCountdown(fi?.cierre_predicciones)

  const totalPartidos = partidos.length
  const predsCompletas = partidos.filter(p => preds[p.id]?.local !== undefined && preds[p.id]?.visitante !== undefined).length
  const porcentaje = totalPartidos > 0 ? Math.round((predsCompletas / totalPartidos) * 100) : 0
  const todoCompleto = predsCompletas === totalPartidos && totalPartidos > 0
  const todosGuardados = !hayCAmbios && predsCompletas > 0 &&
    partidos.filter(p => preds[p.id]?.local !== undefined && preds[p.id]?.visitante !== undefined)
            .every(p => savedPreds.has(p.id))

  return (
    <div className="dashboard">
      <div className="dash-backdrop" aria-hidden="true" />

      {/* ── Prompt notificaciones ── */}
      {mostrarNotifPrompt && (
        <div onClick={() => { dismissNotif(); setMostrarNotifPrompt(false) }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'flex-end' }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', background: 'var(--pg-bg-card)', borderRadius: '20px 20px 0 0', padding: '28px 20px 44px' }}>
            <div style={{ width: 40, height: 4, background: 'var(--pg-border)', borderRadius: 2, margin: '0 auto 24px' }} />
            <div style={{ fontSize: 36, marginBottom: 12, textAlign: 'center' }}>🔔</div>
            <div style={{ fontFamily: 'Rajdhani,sans-serif', fontSize: 22, fontWeight: 700, color: 'var(--pg-text)', marginBottom: 10, textAlign: 'center' }}>¿Querés que te avisemos?</div>
            <p style={{ fontSize: 14, color: 'var(--pg-text-soft)', lineHeight: 1.6, textAlign: 'center', maxWidth: 280, margin: '0 auto 24px' }}>
              Te mandamos una notificación cuando se abre una nueva fecha para predecir y cuando se cargan los resultados.
            </p>
            <button
              className="btn btn-primary"
              style={{ width: '100%', marginBottom: 12 }}
              onClick={async () => { dismissNotif(); setMostrarNotifPrompt(false); await suscribirse() }}
            >Activar notificaciones</button>
            <button
              style={{ width: '100%', background: 'none', border: 'none', color: 'var(--pg-text-soft)', fontSize: 14, cursor: 'pointer', padding: '8px 0' }}
              onClick={() => { dismissNotif(); setMostrarNotifPrompt(false) }}
            >Ahora no</button>
          </div>
        </div>
      )}

      {/* ── Modal cómo funciona ── */}
      {mostrarInfo && (
        <div onClick={() => setMostrarInfo(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'flex-end' }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', background: 'var(--pg-bg-card)', borderRadius: '20px 20px 0 0', padding: '24px 20px 40px', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ width: 40, height: 4, background: 'var(--pg-border)', borderRadius: 2, margin: '0 auto 20px' }} />
            <div style={{ fontFamily: 'Rajdhani,sans-serif', fontSize: 22, fontWeight: 700, color: 'var(--pg-text)', marginBottom: 20 }}>¿Cómo funciona?</div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--pg-text-soft)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Puntaje por partido</div>
              {[
                { icon: '🎯', label: 'Resultado exacto', pts: '3 pts' },
                { icon: '🤝', label: 'Exacto en empate', pts: '4 pts' },
                { icon: '✅', label: 'Signo correcto (ganador)', pts: '1 pt' },
                { icon: '🤝', label: 'Signo empate (sin exacto)', pts: '2 pts' },
              ].map(r => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid var(--pg-border-soft)' }}>
                  <span style={{ fontSize: 13, color: 'var(--pg-text)' }}>{r.icon} {r.label}</span>
                  <span style={{ fontFamily: 'Rajdhani,sans-serif', fontSize: 16, fontWeight: 700, color: 'var(--pg-gold)' }}>{r.pts}</span>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--pg-text-soft)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Partido destacado ⭐</div>
              <div style={{ fontSize: 13, color: 'var(--pg-text-soft)', lineHeight: 1.6, padding: '8px 12px', background: 'var(--pg-bg-mid)', borderRadius: 10 }}>
                Los puntos del partido destacado valen el <strong style={{ color: 'var(--pg-gold)' }}>doble</strong>. Exacto normal → 6 pts. Exacto empate → 8 pts.
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--pg-text-soft)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Bonuses de fecha</div>
              {[
                { icon: '💥', label: 'Pleno — todos acertados', pts: '+5 pts' },
                { icon: '⚡', label: 'Mitad — la mitad o más', pts: '+2 pts' },
              ].map(r => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid var(--pg-border-soft)' }}>
                  <span style={{ fontSize: 13, color: 'var(--pg-text)' }}>{r.icon} {r.label}</span>
                  <span style={{ fontFamily: 'Rajdhani,sans-serif', fontSize: 16, fontWeight: 700, color: 'var(--pg-gold)' }}>{r.pts}</span>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--pg-text-soft)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Rachas 🔥</div>
              <div style={{ fontSize: 13, color: 'var(--pg-text-soft)', lineHeight: 1.6, padding: '8px 12px', background: 'var(--pg-bg-mid)', borderRadius: 10 }}>
                Participá en fechas consecutivas para aumentar tu racha. Desbloqueá trofeos con rachas de <strong style={{ color: 'var(--pg-text)' }}>3, 6, 10 y 15</strong> fechas seguidas.
              </div>
            </div>

            <button onClick={() => setMostrarInfo(false)} className="btn btn-primary" style={{ width: '100%', marginTop: 4 }}>Entendido</button>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <header style={{ padding: '20px 20px 6px', position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="prode-eyebrow">Mis predicciones</div>
          <h1 className="prode-h1">
            {fi
              ? <>{`Fecha ${fi.numero}`}<span style={{ color: 'var(--pg-text-mute)', margin: '0 6px' }}>·</span><em>{CATS[cat]}</em></>
              : CATS[cat]
            }
          </h1>
        </div>
        <button
          onClick={() => setMostrarInfo(true)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, padding: '4px', lineHeight: 1, marginTop: 18, color: 'var(--pg-text-soft)', fontWeight: 700, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
          title="¿Cómo funciona?"
        >i</button>
      </header>

      {/* ── Chips de categoría ── */}
      <div className="prode-chip-row" style={{position:'relative',zIndex:2}}>
        {[1,2,3,4,5].map(c => (
          <button
            key={c}
            className={`prode-chip${cat===c?' prode-chip-active':''}`}
            onClick={() => setCat(c)}
          >
            {CATS[c]}
            {catsActivas.has(c) && <span className="prode-chip-dot" />}
          </button>
        ))}
      </div>

      {/* ── Selector de fecha múltiple ── */}
      {fechas.length > 1 && (
        <div className="prode-chip-row" style={{position:'relative',zIndex:2,paddingTop:0}}>
          {fechas.map(f => (
            <button
              key={f.id}
              className={`prode-chip${fechaId===f.id?' prode-chip-active':''}`}
              onClick={() => setFechaId(f.id)}
            >
              Fecha {f.numero}
            </button>
          ))}
        </div>
      )}

      {loading && <div className="loading"><div className="spinner" /> Cargando...</div>}

      {errorCarga && !loading && (
        <div style={{margin:'0 16px 12px',position:'relative',zIndex:2}}>
          <div className="alert alert-error" style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12}}>
            <span>Error al cargar los partidos</span>
            <button className="btn btn-small btn-secondary" onClick={() => cargarFechas(cat)}>Reintentar</button>
          </div>
        </div>
      )}

      {!loading && fechas.length === 0 && (
        <div className="seccion-fade empty-state" style={{padding:'40px 20px',position:'relative',zIndex:2}}>
          <div style={{fontSize:52,marginBottom:10}}>✅</div>
          <div className="empty-title">Todo al día en {CATS[cat]}</div>
          <p style={{fontSize:13,color:'var(--pg-text-soft)',maxWidth:260,margin:'8px auto 20px',lineHeight:1.5}}>
            No hay partidos abiertos para predecir.
          </p>
          <button className="btn btn-secondary btn-small" onClick={() => navigate('/torneos')}>
            Ver mis resultados →
          </button>
        </div>
      )}

      {fi && !loading && (
        <>
          {/* ── Status banner ── */}
          <div className="prode-banner seccion-fade" style={{position:'relative',zIndex:2}}>
            <div className="prode-banner-l">
              <span className={`prode-pulse ${abierto ? 'prode-pulse-open' : 'prode-pulse-closed'}`} />
              <div>
                <div className="prode-banner-strong">{abierto ? 'Abiertas' : 'Cerradas'}</div>
                <div className="prode-banner-sub">
                  {fi.fecha_partido
                    ? new Date(fi.fecha_partido+'T12:00:00').toLocaleDateString('es-AR',{weekday:'long',day:'numeric',month:'short'})
                    : abierto ? 'Cargá tus picks' : 'Esperá la próxima fecha'
                  }
                </div>
              </div>
              {abierto && countdownTexto && (
                <span className={`prode-banner-cd${countdownUrgente?' prode-banner-cd-urgent':''}`}>
                  {countdownTexto}
                </span>
              )}
            </div>
            <div
              className="prode-ring"
              style={{'--p': porcentaje}}
              title={`${predsCompletas} de ${totalPartidos} picks`}
            >
              <span>{predsCompletas}/{totalPartidos}</span>
            </div>
          </div>

          {/* ── Banner notificaciones ── */}
          {mostrarBannerNotif && (
            <div style={{ margin: '0 16px 10px', background: 'var(--pg-bg-card)', border: '1px solid var(--pg-border)', borderRadius: 12, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10, position: 'relative', zIndex: 2 }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>🔔</span>
              <div style={{ flex: 1, fontSize: 12, color: 'var(--pg-text-soft)', lineHeight: 1.4 }}>Activá notificaciones para saber cuándo cierran las predicciones</div>
              <button onClick={async () => { dismissNotif(); await suscribirse() }} style={{ padding: '5px 10px', borderRadius: 7, border: 'none', background: 'var(--pg-gold)', color: '#07101F', fontSize: 11, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>Activar</button>
              <button onClick={dismissNotif} style={{ padding: '5px 7px', borderRadius: 7, border: 'none', background: 'var(--pg-bg-mid)', color: 'var(--pg-text-soft)', fontSize: 13, cursor: 'pointer', lineHeight: 1, flexShrink: 0 }}>×</button>
            </div>
          )}

          {/* ── Coin row ── */}
          {abierto && totalPartidos > 0 && (
            <button
              className={`prode-coin-row${girando?' prode-coin-spin':''}`}
              style={{position:'relative',zIndex:2}}
              onClick={tirarMonedaTodos}
              disabled={girando}
            >
              <span className="prode-coin-emoji">🎲</span>
              <span className="prode-coin-text">
                {girando ? 'Sorteando picks...' : 'Tirar el dado — autocompletar fecha'}
              </span>
              <span className="prode-coin-arrow">↻</span>
            </button>
          )}
        </>
      )}

      {/* ── Lista de partidos ── */}
      {!loading && partidos.length > 0 && (
        <div className="prode-match-list" style={{position:'relative',zIndex:2}}>
          {partidos.map(partido => (
            <PartidoCardPrediccion
              key={partido.id}
              partido={partido}
              pred={preds[partido.id]}
              abierto={abierto}
              saved={savedPreds.has(partido.id)}
              onUpdate={updPred}
              onEquipoTap={(equipo) => handleEquipoTap(equipo, partido)}
            />
          ))}
        </div>
      )}

      {/* ── Sticky save ── */}
      {!loading && partidos.length > 0 && abierto && (
        <div className="prode-sticky" style={{position:'relative',zIndex:2}}>
          {hayCAmbios && !guardando && (
            <div style={{textAlign:'center',fontSize:12,color:'var(--pg-gold)',fontWeight:600,marginBottom:6}}>
              ● Tenés cambios sin guardar
            </div>
          )}
          <button className="prode-save-btn" onClick={guardar} disabled={guardando || todosGuardados} style={todosGuardados ? {opacity:0.6} : undefined}>
            <span>
              {guardando
                ? '⏳ Guardando...'
                : guardado
                ? '✓ ¡Picks guardados!'
                : todosGuardados
                ? '✓ Al día — sin cambios'
                : `Guardar ${predsCompletas} picks`}
            </span>
          </button>
        </div>
      )}

      <div style={{height:20}} />

      <EquipoPopup
        items={popupData?.items}
        onClose={() => setPopupData(null)}
        onCloseOne={(idx) => setPopupData(prev => {
          const items = prev.items.filter((_,i) => i !== idx)
          return items.length ? { ...prev, items } : null
        })}
        rivalStats={rivalStats}
        rivalSide={rivalSide}
        onAddRival={() => rivalEquipo && handleEquipoTap(rivalEquipo, popupData.partido)}
      />
    </div>
  )
}
