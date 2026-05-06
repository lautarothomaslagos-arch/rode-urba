import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { PartidoCardPrediccion, MonedaGlobal } from '../components/PartidoCard'
import { CATS, CAT_CLASS } from '../lib/constants'
import TabsScrollWrapper from '../components/TabsScrollWrapper'
import EquipoPopup from '../components/EquipoPopup'
import { computeEquipoStats } from '../lib/equipoStats'

function scoreRandom() {
  return Math.floor(Math.random() * 46) + 3
}

function estaAbierto(cierre) {
  if (!cierre) return true
  return new Date() < new Date(cierre)
}

function useCountdown(cierre) {
  const [texto, setTexto] = useState('')
  const [urgente, setUrgente] = useState(false)
  useEffect(() => {
    if (!cierre) return
    function actualizar() {
      const diff = new Date(cierre) - new Date()
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
  const [hayCAmbios, setHayCAmbios] = useState(false)
  const [loading, setLoading] = useState(true)
  const [girando, setGirando] = useState(false)
  const [catsActivas, setCatsActivas] = useState(new Set())
  const [savedPreds, setSavedPreds] = useState(new Set())
  const [statsEquipos, setStatsEquipos] = useState({})
  const [popupData, setPopupData] = useState(null) // { equipos: [stats, stats?], partido }

  useEffect(() => { if (user) calcularPendientes() }, [user])

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
    const { data } = await supabase.from('fechas')
      .select('*').eq('categoria_id', c).eq('activa', true)
      .eq('resultados_cargados', false).order('numero')
    setFechas(data || [])
    if (data?.length) setFechaId(data[0].id)
    else { setFechaId(null); setPartidos([]); setLoading(false) }
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
      await supabase.from('predicciones').upsert(upserts, { onConflict: 'usuario_id,partido_id' })
      setSavedPreds(prev => new Set([...prev, ...upserts.map(u => u.partido_id)]))
      setGuardado(true)
      setHayCAmbios(false)
      calcularPendientes()
      setTimeout(() => setGuardado(false), 3000)
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

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">Mis <span className="page-title-accent">predicciones</span></h1>
      </div>

      <TabsScrollWrapper>
        {[1,2,3,4,5].map(c => (
          <button key={c} className={`tab-btn ${cat===c?'active':''}`} onClick={() => setCat(c)}>
            {CATS[c]}{catsActivas.has(c) && <span style={{ display:'inline-block', width:5, height:5, borderRadius:'50%', background:'var(--dorado)', marginLeft:5, verticalAlign:'middle', boxShadow:'0 0 3px rgba(201,162,39,0.9)' }} />}
          </button>
        ))}
      </TabsScrollWrapper>

      {fechas.length > 1 && (
        <div className="tabs-box" style={{marginBottom:16}}>
          {fechas.map(f => (
            <button key={f.id} className={`tab-btn ${fechaId===f.id?'active':''}`} onClick={() => setFechaId(f.id)}>
              Fecha {f.numero}
            </button>
          ))}
        </div>
      )}

      {loading && <div className="loading"><div className="spinner"></div> Cargando...</div>}

      {!loading && fechas.length === 0 && (
        <div className="seccion-fade empty-state" style={{padding:'40px 20px'}}>
          <div style={{fontSize:52,marginBottom:10}}>✅</div>
          <div className="empty-title">Todo al día en {CATS[cat]}</div>
          <p style={{fontSize:13,color:'var(--texto-suave)',maxWidth:260,margin:'8px auto 20px',lineHeight:1.5}}>
            No hay partidos abiertos para predecir. Los picks se habilitan cada semana antes del viernes.
          </p>
          <button
            className="btn btn-secondary btn-small"
            onClick={() => navigate('/resultados')}
          >
            Ver mis resultados →
          </button>
        </div>
      )}

      {fi && !loading && (
        <div key={`${cat}-${fechaId}`} className="seccion-fade card" style={{padding:'12px 16px',marginBottom:8}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8,flexWrap:'wrap'}}>
            <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',flex:1}}>
              <span className={`cat-badge ${CAT_CLASS[cat]}`}>{CATS[cat]}</span>
              <span style={{fontWeight:600,fontSize:15}}>Fecha {fi.numero}</span>
              {fi.fecha_partido && (
                <span style={{fontSize:13,color:'var(--texto-suave)'}}>
                  {new Date(fi.fecha_partido+'T12:00:00').toLocaleDateString('es-AR',{weekday:'long',day:'numeric',month:'long'})}
                </span>
              )}
            </div>
            <span className={`cierre-badge ${abierto?'cierre-abierto':'cierre-cerrado'}`} style={{flexShrink:0}}>
              {abierto ? '● Abiertas' : '✕ Cerradas'}
            </span>
          </div>
          {fi.cierre_predicciones && abierto && (
            <div style={{fontSize:12,marginTop:6,display:'flex',alignItems:'center',gap:6}}>
              <span style={{color:'var(--texto-suave)'}}>Cierra en</span>
              <span style={{
                fontFamily:"'Rajdhani',sans-serif",fontWeight:700,fontSize:14,
                color: countdownUrgente ? '#dc2626' : 'var(--dorado-oscuro)',
                background: countdownUrgente ? '#fef2f2' : 'var(--dorado-claro)',
                padding:'2px 8px',borderRadius:6,letterSpacing:0.5
              }}>{countdownTexto}</span>
            </div>
          )}
          {fi.cierre_predicciones && !abierto && (
            <div style={{fontSize:11,color:'var(--texto-suave)',marginTop:5}}>
              Cerró: {new Date(fi.cierre_predicciones).toLocaleString('es-AR')}
            </div>
          )}
        </div>
      )}

      {fi && !loading && abierto && totalPartidos > 0 && (
        <div key={`prog-${cat}-${fechaId}`} className="seccion-fade card" style={{padding:'10px 16px',marginBottom:16,display:'flex',alignItems:'center',gap:12}}>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:5}}>
              <span style={{fontSize:11,fontWeight:600,color:todoCompleto?'var(--dorado-oscuro)':'var(--texto-suave)',paddingLeft:2}}>
                {todoCompleto ? '🏉 ¡Todos cargados!' : `${predsCompletas} / ${totalPartidos} cargados`}
              </span>
              <span style={{fontSize:11,fontWeight:700,color:todoCompleto?'var(--dorado-oscuro)':'var(--azul)'}}>
                {porcentaje}%
              </span>
            </div>
            <div style={{height:7,borderRadius:10,background:'var(--gris-borde)',overflow:'hidden',border:'1px solid rgba(0,0,0,0.06)'}}>
              <div style={{
                height:'100%',borderRadius:10,width:`${porcentaje}%`,
                background:todoCompleto
                  ?'linear-gradient(90deg,var(--dorado),var(--dorado-oscuro))'
                  :'linear-gradient(90deg,var(--rojo-vivo),var(--dorado))',
                transition:'width 0.4s ease'
              }} />
            </div>
          </div>
          <div style={{flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',width:64}}>
            <MonedaGlobal girando={girando} onClick={tirarMonedaTodos} />
          </div>
        </div>
      )}

      {!loading && partidos.map(partido => (
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

      {!loading && partidos.length > 0 && abierto && (
        <div className="sticky-save">
          {hayCAmbios && !guardando && (
            <div style={{textAlign:'center',fontSize:12,color:'var(--dorado)',fontWeight:600,marginBottom:6}}>
              ● Tenés cambios sin guardar
            </div>
          )}
          <button className="btn btn-primary" onClick={guardar} disabled={guardando}>
            {guardando ? <><span className="spinner"></span> Guardando...</> : guardado ? '✓ Guardado' : 'Guardar predicciones'}
          </button>
        </div>
      )}

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
