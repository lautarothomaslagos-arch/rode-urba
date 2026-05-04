import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { PartidoCardResultado } from '../components/PartidoCard'
import { CATS, CAT_CLASS } from '../lib/constants'

export default function Resultados() {
  const { user } = useAuth()
  const [cat, setCat] = useState(1)
  const [fechas, setFechas] = useState([])
  const [fechaId, setFechaId] = useState(null)
  const [partidos, setPartidos] = useState([])
  const [preds, setPreds] = useState({})
  const [puntosFecha, setPuntosFecha] = useState(null)
  const [loading, setLoading] = useState(true)
  const [compartiendo, setCompartiendo] = useState(false)

  useEffect(() => { cargarFechas(cat) }, [cat])
  useEffect(() => { if (fechaId) cargarPartidos(fechaId) }, [fechaId])

  async function cargarFechas(c) {
    setLoading(true)
    const { data } = await supabase.from('fechas').select('*')
      .eq('categoria_id', c).eq('resultados_cargados', true)
      .order('numero', { ascending: false })
    setFechas(data || [])
    setPuntosFecha(null)
    if (data?.length) setFechaId(data[0].id)
    else { setFechaId(null); setPartidos([]); setLoading(false) }
  }

  async function cargarPartidos(fid) {
    setLoading(true)
    const { data: pts } = await supabase.from('partidos')
      .select('*, equipo_local:equipo_local_id(id,nombre,nombre_corto,escudo_url), equipo_visitante:equipo_visitante_id(id,nombre,nombre_corto,escudo_url)')
      .eq('fecha_id', fid).order('id')
    setPartidos(pts || [])
    if (pts?.length && user) {
      const { data: pr } = await supabase.from('predicciones').select('*')
        .eq('usuario_id', user.id).in('partido_id', pts.map(p => p.id))
      const m = {}
      pr?.forEach(p => { m[p.partido_id] = { local: p.goles_local, visitante: p.goles_visitante } })
      setPreds(m)
      const { data: pf } = await supabase.from('puntos_fecha').select('*')
        .eq('usuario_id', user.id).eq('fecha_id', fid).single()
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

      <div className="tabs-wrap">
        <div className="tabs-box">
          {[1,2,3,4,5].map(c => (
            <button key={c} className={`tab-btn ${cat===c?'active':''}`} onClick={() => setCat(c)}>{CATS[c]}</button>
          ))}
        </div>
      </div>

      {fechas.length > 0 && (
        <div className="tabs-box" style={{marginBottom:16}}>
          {fechas.map(f => (
            <button key={f.id} className={`tab-btn ${fechaId===f.id?'active':''}`} onClick={() => setFechaId(f.id)}>
              Fecha {f.numero}
            </button>
          ))}
        </div>
      )}

      {loading && <div className="loading"><div className="spinner"></div></div>}

      {!loading && fechas.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🏉</div>
          <div className="empty-title">Sin resultados en {CATS[cat]}</div>
          <p style={{fontSize:13,color:'var(--texto-suave)',marginTop:6}}>Todavía no se cargaron resultados para este torneo</p>
        </div>
      )}

      {!loading && puntosFecha && (
        <div className="card" style={{background:'linear-gradient(135deg,var(--azul),var(--azul-medio))',border:'none',marginBottom:16,padding:'12px 14px'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
            <span style={{fontFamily:'Rajdhani,sans-serif',fontSize:14,fontWeight:700,color:'rgba(255,255,255,0.8)'}}>
              <span className={`cat-badge ${CAT_CLASS[cat]}`} style={{marginRight:8}}>{CATS[cat]}</span>
              Fecha {fi?.numero}
            </span>
            <span style={{fontFamily:'Rajdhani,sans-serif',fontSize:22,fontWeight:700,color:'var(--dorado)'}}>
              {puntosFecha.total_puntos} <span style={{fontSize:13,fontWeight:400,color:'rgba(255,255,255,0.6)'}}>pts</span>
            </span>
          </div>
          <div className="puntos-resumen" style={{marginBottom:10}}>
            {[
              {v: puntosFecha.puntos_exactos, l:'Exactos'},
              {v: puntosFecha.puntos_signo, l:'Signo'},
              {v: (puntosFecha.bonus_pleno||0)+(puntosFecha.bonus_mitad||0), l:'Bonus'},
            ].map((p,i) => (
              <div key={i} className="punt-item" style={{background:'rgba(255,255,255,0.1)',padding:'8px 6px'}}>
                <div className="punt-valor" style={{color:i===2?'var(--dorado)':'white',fontSize:18}}>{p.v}</div>
                <div className="punt-label" style={{color:'rgba(255,255,255,0.6)'}}>{p.l}</div>
              </div>
            ))}
          </div>
          {puntosFecha.bonus_pleno>0 && <div className="alert alert-gold" style={{marginBottom:8}}>¡Pleno! Acertaste todos los partidos (+5 pts)</div>}
          <button
            disabled={compartiendo}
            onClick={async () => {
              setCompartiendo(true)
              const numeroFecha = fi?.numero
              const { data: todasFechas } = await supabase.from('fechas').select('id').eq('numero', numeroFecha)
              const fids = (todasFechas || []).map(f => f.id)
              const [{ data: allPuntos }, { data: rankingPuntos }] = await Promise.all([
                supabase.from('puntos_fecha').select('total_puntos, puntos_exactos, puntos_signo, bonus_pleno, bonus_mitad')
                  .eq('usuario_id', user.id).in('fecha_id', fids),
                supabase.from('puntos_fecha').select('usuario_id, total_puntos').in('fecha_id', fids)
              ])
              const tot = (allPuntos || []).reduce((a, p) => ({
                pts: a.pts + (p.total_puntos || 0),
                exactos: a.exactos + (p.puntos_exactos || 0),
                signo: a.signo + (p.puntos_signo || 0),
                bonus: a.bonus + (p.bonus_pleno || 0) + (p.bonus_mitad || 0),
              }), { pts: 0, exactos: 0, signo: 0, bonus: 0 })
              const byUser = {}
              rankingPuntos?.forEach(p => { byUser[p.usuario_id] = (byUser[p.usuario_id] || 0) + p.total_puntos })
              const sorted = Object.entries(byUser).sort(([,a],[,b]) => b - a)
              const pos = sorted.findIndex(([uid]) => uid === user.id) + 1
              const total = sorted.length
              const posTexto = pos === 1 ? '🥇 1ro' : pos === 2 ? '🥈 2do' : pos === 3 ? '🥉 3ro' : `#${pos}`
              const msg = encodeURIComponent(
                `🏉 Pick&Go · Fecha ${numeroFecha} · URBA 2026\n` +
                `${pos > 0 ? `Quedé ${posTexto} de ${total} con ` : ''}${tot.pts} pts${tot.bonus > 0 ? ' 💥' : ''}\n` +
                `(${tot.exactos} exactos · ${tot.signo} signo${tot.bonus > 0 ? ` · ${tot.bonus} bonus` : ''})\n\n` +
                `¿Jugás también? → pickandgo-prode.vercel.app`
              )
              window.open(`https://wa.me/?text=${msg}`, '_blank')
              supabase.from('perfiles').select('invitaciones').eq('id', user.id).single()
                .then(({ data }) => supabase.from('perfiles').update({ invitaciones: (data?.invitaciones || 0) + 1 }).eq('id', user.id))
              setCompartiendo(false)
            }}
            style={{width:'100%',background:'rgba(255,255,255,0.12)',border:'1px solid rgba(255,255,255,0.2)',borderRadius:8,padding:'10px',color:'white',fontSize:13,fontWeight:600,cursor:'pointer',marginTop:4,opacity:compartiendo?0.7:1}}
          >
            {compartiendo ? '⏳ Preparando...' : '📲 Compartir resultado'}
          </button>
        </div>
      )}

      {!loading && partidos.length > 0 && user && Object.keys(preds).length === 0 && (
        <div className="alert" style={{background:'rgba(201,162,39,0.1)',border:'1px solid rgba(201,162,39,0.3)',color:'var(--dorado-oscuro)',marginBottom:12}}>
          No cargaste predicciones para esta fecha
        </div>
      )}

      {!loading && partidos.map(partido => (
        <PartidoCardResultado
          key={partido.id}
          partido={partido}
          pred={preds[partido.id]}
        />
      ))}
    </div>
  )
}
