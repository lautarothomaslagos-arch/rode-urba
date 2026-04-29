import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { PartidoCardPrediccion, MonedaGlobal } from '../components/PartidoCard'
import { CATS, CAT_CLASS } from '../lib/constants'

function scoreRandom() {
  return Math.floor(Math.random() * 46) + 3
}

function estaAbierto(cierre) {
  if (!cierre) return true
  return new Date() < new Date(cierre)
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
  const [hayCAmbios, setHayCAmbios] = useState(false)
  const [loading, setLoading] = useState(true)
  const [girando, setGirando] = useState(false)

  useEffect(() => { cargarFechas(cat) }, [cat])
  useEffect(() => { if (fechaId) cargarPartidos(fechaId) }, [fechaId])

  async function cargarFechas(c) {
    setLoading(true)
    const { data } = await supabase.from('fechas')
      .select('*').eq('categoria_id', c).eq('activa', true)
      .eq('resultados_cargados', false).order('numero')
    setFechas(data || [])
    if (data?.length) setFechaId(data[0].id)
    else { setFechaId(null); setPartidos([]); setLoading(false) }
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
      setGuardado(true)
      setHayCAmbios(false)
      setTimeout(() => setGuardado(false), 3000)
    }
    setGuardando(false)
  }

  const fi = fechas.find(f => f.id === fechaId)
  const abierto = estaAbierto(fi?.cierre_predicciones)

  const totalPartidos = partidos.length
  const predsCompletas = partidos.filter(p => preds[p.id]?.local !== undefined && preds[p.id]?.visitante !== undefined).length
  const porcentaje = totalPartidos > 0 ? Math.round((predsCompletas / totalPartidos) * 100) : 0
  const todoCompleto = predsCompletas === totalPartidos && totalPartidos > 0

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">Mis <span className="page-title-accent">predicciones</span></h1>
      </div>

      <div className="tabs-box">
        {[1,2,3,4,5].map(c => (
          <button key={c} className={`tab-btn ${cat===c?'active':''}`} onClick={() => setCat(c)}>{CATS[c]}</button>
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
          <p style={{fontSize:13,color:'var(--texto-suave)'}}>Los resultados están en la sección <strong>Resultados</strong></p>
        </div>
      )}

      {fi && !loading && (
        <div className="card" style={{padding:'12px 16px',marginBottom:8}}>
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
          {fi.cierre_predicciones && (
            <div style={{fontSize:11,color:'var(--texto-suave)',marginTop:5}}>
              Cierre: {new Date(fi.cierre_predicciones).toLocaleString('es-AR')}
            </div>
          )}
        </div>
      )}

      {fi && !loading && abierto && totalPartidos > 0 && (
        <div className="card" style={{padding:'10px 16px',marginBottom:16,display:'flex',alignItems:'center',gap:12}}>
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
          onUpdate={updPred}
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
    </div>
  )
}
