import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const CATS = { 1:'Top 14', 2:'Primera A', 3:'Primera B', 4:'Primera C', 5:'Segunda Div.' }
const CAT_CLASS = { 1:'cat-top14', 2:'cat-primera-a', 3:'cat-primera-b', 4:'cat-primera-c', 5:'cat-segunda' }

function estaAbierto(cierre) {
  if (!cierre) return true
  return new Date() < new Date(cierre)
}

function Escudo({ equipo }) {
  if (!equipo) return null
  const ini = equipo.nombre_corto || equipo.nombre?.substring(0,3).toUpperCase()
  return (
    <div className="equipo-escudo" title={equipo.nombre}>
      {equipo.escudo_url ? <img src={equipo.escudo_url} alt={equipo.nombre} /> : ini}
    </div>
  )
}

export default function Prode() {
  const { user } = useAuth()
  const [cat, setCat] = useState(1)
  const [fechas, setFechas] = useState([])
  const [fechaId, setFechaId] = useState(null)
  const [partidos, setPartidos] = useState([])
  const [preds, setPreds] = useState({})
  const [guardando, setGuardando] = useState(false)
  const [guardado, setGuardado] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => { cargarFechas(cat) }, [cat])
  useEffect(() => { if (fechaId) cargarPartidos(fechaId) }, [fechaId])

  async function cargarFechas(c) {
    setLoading(true)
    // Solo fechas NO jugadas (resultados_cargados = false) — para predecir
    const { data } = await supabase.from('fechas')
      .select('*')
      .eq('categoria_id', c)
      .eq('activa', true)
      .eq('resultados_cargados', false)
      .order('numero')
    setFechas(data || [])
    if (data?.length) {
      setFechaId(data[0].id)
    } else {
      setFechaId(null)
      setPartidos([])
      setLoading(false)
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
    }
    setLoading(false)
  }

  function updPred(pid, lado, val) {
    const n = Math.max(0, parseInt(val) || 0)
    setPreds(prev => ({ ...prev, [pid]: { ...prev[pid], [lado]: n } }))
  }

  async function guardar() {
    setGuardando(true)
    const fi = fechas.find(f => f.id === fechaId)
    if (!estaAbierto(fi?.cierre_predicciones)) {
      alert('Las predicciones están cerradas')
      setGuardando(false)
      return
    }
    const upserts = Object.entries(preds)
      .filter(([, v]) => v.local !== undefined && v.visitante !== undefined)
      .map(([pid, v]) => ({
        usuario_id: user.id, partido_id: parseInt(pid),
        goles_local: v.local, goles_visitante: v.visitante,
        updated_at: new Date().toISOString()
      }))
    if (upserts.length) {
      await supabase.from('predicciones').upsert(upserts, { onConflict: 'usuario_id,partido_id' })
      setGuardado(true)
      setTimeout(() => setGuardado(false), 3000)
    }
    setGuardando(false)
  }

  const fi = fechas.find(f => f.id === fechaId)
  const abierto = estaAbierto(fi?.cierre_predicciones)

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">Mis <span className="page-title-accent">predicciones</span></h1>
      </div>

      <div className="tabs-box">
        {[1,2,3,4,5].map(c => (
          <button key={c} className={`tab-btn ${cat===c?'active':''}`} onClick={() => setCat(c)}>
            {CATS[c]}
          </button>
        ))}
      </div>

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
        <div className="empty-state">
          <div className="empty-icon">✅</div>
          <div className="empty-title">No hay fechas activas para predecir</div>
          <p style={{fontSize:13,color:'var(--texto-suave)'}}>Los resultados de las fechas jugadas están en la sección <strong>Resultados</strong></p>
        </div>
      )}

      {fi && !loading && (
        <div className="card" style={{padding:'12px 16px',marginBottom:16}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:8}}>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <span className={`cat-badge ${CAT_CLASS[cat]}`}>{CATS[cat]}</span>
              <span style={{fontWeight:600,fontSize:15}}>Fecha {fi.numero}</span>
              {fi.fecha_partido && (
                <span style={{fontSize:13,color:'var(--texto-suave)'}}>
                  {new Date(fi.fecha_partido+'T12:00:00').toLocaleDateString('es-AR',{weekday:'long',day:'numeric',month:'long'})}
                </span>
              )}
            </div>
            <span className={`cierre-badge ${abierto?'cierre-abierto':'cierre-cerrado'}`}>
              {abierto ? '● Abiertas' : '✕ Cerradas'}
            </span>
          </div>
          {fi.cierre_predicciones && (
            <div style={{fontSize:11,color:'var(--texto-suave)',marginTop:4}}>
              Cierre: {new Date(fi.cierre_predicciones).toLocaleString('es-AR')}
            </div>
          )}
        </div>
      )}

      {!loading && partidos.map(partido => {
        const pred = preds[partido.id] || {}
        return (
          <div key={partido.id} className="partido-card">
            <div className="partido-fila">
              <div className="equipo-lado local">
                <span className="equipo-nombre">{partido.equipo_local?.nombre}</span>
                <Escudo equipo={partido.equipo_local} />
              </div>
              <div className="marcador-central">
                <div className="vs-badge">VS</div>
              </div>
              <div className="equipo-lado visitante">
                <Escudo equipo={partido.equipo_visitante} />
                <span className="equipo-nombre">{partido.equipo_visitante?.nombre}</span>
              </div>
            </div>

            {abierto ? (
              <div className="prediccion-inputs">
                <input type="number" className="score-input" min="0" max="120"
                  value={pred.local ?? ''} placeholder="0"
                  onChange={e => updPred(partido.id, 'local', e.target.value)} />
                <span className="score-separator">—</span>
                <input type="number" className="score-input" min="0" max="120"
                  value={pred.visitante ?? ''} placeholder="0"
                  onChange={e => updPred(partido.id, 'visitante', e.target.value)} />
              </div>
            ) : (
              <div style={{textAlign:'center',fontSize:13,color:'var(--texto-suave)',marginTop:8}}>
                {pred.local !== undefined
                  ? <>Tu predicción: <strong style={{color:'var(--azul)'}}>{pred.local} — {pred.visitante}</strong></>
                  : 'Sin predicción cargada'
                }
              </div>
            )}
          </div>
        )
      })}

      {!loading && partidos.length > 0 && abierto && (
        <div className="sticky-save">
          <button className="btn btn-primary" onClick={guardar} disabled={guardando}>
            {guardando ? <><span className="spinner"></span> Guardando...</> : guardado ? '✓ Guardado' : 'Guardar predicciones'}
          </button>
        </div>
      )}
    </div>
  )
}
