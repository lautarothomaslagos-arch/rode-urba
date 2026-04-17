import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const CATS = { 1:'Top 14', 2:'Primera A', 3:'Primera B', 4:'Primera C' }
const CAT_CLASS = { 1:'cat-top14', 2:'cat-primera-a', 3:'cat-primera-b', 4:'cat-primera-c' }

function EscudoEquipo({ equipo }) {
  if (!equipo) return null
  const ini = equipo.nombre_corto || equipo.nombre?.substring(0,3).toUpperCase()
  return (
    <div className="equipo-escudo" title={equipo.nombre}>
      {equipo.escudo_url ? <img src={equipo.escudo_url} alt={equipo.nombre} /> : ini}
    </div>
  )
}

export default function Resultados() {
  const { user } = useAuth()
  const [cat, setCat] = useState(1)
  const [fechas, setFechas] = useState([])
  const [fechaId, setFechaId] = useState(null)
  const [partidos, setPartidos] = useState([])
  const [preds, setPreds] = useState({})
  const [puntosFecha, setPuntosFecha] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { cargarFechas(cat) }, [cat])
  useEffect(() => { if (fechaId) cargarPartidos(fechaId) }, [fechaId])

  async function cargarFechas(c) {
    setLoading(true)
    const { data } = await supabase.from('fechas').select('*').eq('categoria_id',c).eq('resultados_cargados',true).order('numero',{ascending:false})
    setFechas(data||[])
    if (data?.length) setFechaId(data[0].id)
    else { setFechaId(null); setPartidos([]); setLoading(false) }
  }

  async function cargarPartidos(fid) {
    setLoading(true)
    const { data: pts } = await supabase.from('partidos')
      .select('*, equipo_local:equipo_local_id(id,nombre,nombre_corto,escudo_url), equipo_visitante:equipo_visitante_id(id,nombre,nombre_corto,escudo_url)')
      .eq('fecha_id',fid).order('id')
    setPartidos(pts||[])
    if (pts?.length && user) {
      const { data: pr } = await supabase.from('predicciones').select('*').eq('usuario_id',user.id).in('partido_id',pts.map(p=>p.id))
      const m = {}; pr?.forEach(p => { m[p.partido_id] = { local:p.goles_local, visitante:p.goles_visitante } }); setPreds(m)
      const { data: pf } = await supabase.from('puntos_fecha').select('*').eq('usuario_id',user.id).eq('fecha_id',fid).single()
      setPuntosFecha(pf)
    }
    setLoading(false)
  }

  const fi = fechas.find(f => f.id === fechaId)

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">Mis <span className="page-title-accent">resultados</span></h1>
      </div>

      <div className="tabs">
        {[1,2,3,4].map(c => (
          <button key={c} className={`tab ${cat===c?'active':''}`} onClick={() => setCat(c)}>{CATS[c]}</button>
        ))}
      </div>

      {fechas.length > 0 && (
        <div className="tabs" style={{marginBottom:16}}>
          {fechas.map(f => (
            <button key={f.id} className={`tab ${fechaId===f.id?'active':''}`} onClick={() => setFechaId(f.id)}>Fecha {f.numero}</button>
          ))}
        </div>
      )}

      {loading && <div className="loading"><div className="spinner"></div></div>}

      {!loading && fechas.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🏉</div>
          <div className="empty-title">Sin resultados cargados aún</div>
        </div>
      )}

      {!loading && puntosFecha && (
        <div className="card" style={{background:'linear-gradient(135deg,var(--azul),var(--azul-medio))',border:'none'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
            <span style={{fontFamily:'Rajdhani,sans-serif',fontSize:16,fontWeight:700,color:'rgba(255,255,255,0.8)',letterSpacing:1}}>
              {fi && <span className={`cat-badge ${CAT_CLASS[cat]}`} style={{marginRight:8}}>{CATS[cat]}</span>}
              Fecha {fi?.numero}
            </span>
            <span style={{fontFamily:'Rajdhani,sans-serif',fontSize:32,fontWeight:700,color:'var(--dorado)'}}>
              {puntosFecha.total_puntos} <span style={{fontSize:16,fontWeight:400,color:'rgba(255,255,255,0.6)'}}>pts</span>
            </span>
          </div>
          <div className="puntos-resumen">
            <div className="punt-item" style={{background:'rgba(255,255,255,0.1)'}}>
              <div className="punt-valor" style={{color:'white'}}>{puntosFecha.puntos_exactos}</div>
              <div className="punt-label" style={{color:'rgba(255,255,255,0.6)'}}>Exactos</div>
            </div>
            <div className="punt-item" style={{background:'rgba(255,255,255,0.1)'}}>
              <div className="punt-valor" style={{color:'white'}}>{puntosFecha.puntos_signo}</div>
              <div className="punt-label" style={{color:'rgba(255,255,255,0.6)'}}>Signo</div>
            </div>
            <div className="punt-item" style={{background:'rgba(255,255,255,0.1)'}}>
              <div className="punt-valor" style={{color:'var(--dorado)'}}>{(puntosFecha.bonus_pleno||0)+(puntosFecha.bonus_mitad||0)}</div>
              <div className="punt-label" style={{color:'rgba(255,255,255,0.6)'}}>Bonus</div>
            </div>
          </div>
          {puntosFecha.bonus_pleno>0 && <div className="alert alert-gold" style={{marginBottom:0}}>¡Pleno! Acertaste todos los partidos (+5 pts)</div>}
        </div>
      )}

      {!loading && partidos.map(partido => {
        const pred = preds[partido.id]
        let claseCard = 'partido-card'
        let badge = null
        if (pred !== undefined) {
          const exacto = pred.local===partido.resultado_local && pred.visitante===partido.resultado_visitante
          const signo = !exacto && ((pred.local>pred.visitante && partido.resultado_local>partido.resultado_visitante)||(pred.local<pred.visitante && partido.resultado_local<partido.resultado_visitante)||(pred.local===pred.visitante && partido.resultado_local===partido.resultado_visitante))
          if (exacto) { claseCard+=' acertado-exacto'; badge=<span className="resultado-badge badge-exacto">+3 exacto</span> }
          else if (signo) { claseCard+=' acertado-signo'; badge=<span className="resultado-badge badge-signo">+1 signo</span> }
          else { claseCard+=' fallado'; badge=<span className="resultado-badge badge-nada">0 pts</span> }
        }
        return (
          <div key={partido.id} className={claseCard}>
            <div className="partido-equipos">
              <div className="equipo-bloque local">
                <span className="equipo-nombre local">{partido.equipo_local?.nombre}</span>
                <EscudoEquipo equipo={partido.equipo_local} />
              </div>
              <div className="marcador-central">
                <div className="marcador-resultado">{partido.resultado_local} — {partido.resultado_visitante}</div>
              </div>
              <div className="equipo-bloque visitante">
                <EscudoEquipo equipo={partido.equipo_visitante} />
                <span className="equipo-nombre visitante">{partido.equipo_visitante?.nombre}</span>
              </div>
            </div>
            <div style={{textAlign:'center',fontSize:13,color:'var(--texto-suave)'}}>
              {pred !== undefined
                ? <><span>Tu predicción: <strong style={{color:'var(--azul)'}}>{pred.local} — {pred.visitante}</strong></span> {badge}</>
                : <span>Sin predicción cargada</span>
              }
            </div>
          </div>
        )
      })}
    </div>
  )
}
