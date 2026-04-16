import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const CAT_LABELS = { 1: 'Top 14', 2: 'Primera A', 3: 'Primera B', 4: 'Primera C' }
const CAT_CLASS = { 1: 'cat-top14', 2: 'cat-primera-a', 3: 'cat-primera-b', 4: 'cat-primera-c' }

export default function Resultados() {
  const { user } = useAuth()
  const [categoriaActiva, setCategoriaActiva] = useState(1)
  const [fechas, setFechas] = useState([])
  const [fechaActiva, setFechaActiva] = useState(null)
  const [partidos, setPartidos] = useState([])
  const [predicciones, setPredicciones] = useState({})
  const [puntosFecha, setPuntosFecha] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { cargarFechas(categoriaActiva) }, [categoriaActiva])
  useEffect(() => { if (fechaActiva) cargarPartidos(fechaActiva) }, [fechaActiva])

  async function cargarFechas(catId) {
    setLoading(true)
    const { data } = await supabase
      .from('fechas')
      .select('*')
      .eq('categoria_id', catId)
      .eq('resultados_cargados', true)
      .order('numero', { ascending: false })
    setFechas(data || [])
    if (data?.length) setFechaActiva(data[0].id)
    else { setFechaActiva(null); setPartidos([]); setLoading(false) }
  }

  async function cargarPartidos(fechaId) {
    setLoading(true)
    const { data: pts } = await supabase
      .from('partidos')
      .select(`*, equipo_local:equipo_local_id(nombre), equipo_visitante:equipo_visitante_id(nombre)`)
      .eq('fecha_id', fechaId)
      .order('id')
    setPartidos(pts || [])

    if (pts?.length && user) {
      const { data: preds } = await supabase
        .from('predicciones')
        .select('*')
        .eq('usuario_id', user.id)
        .in('partido_id', pts.map(p => p.id))
      const predMap = {}
      preds?.forEach(p => { predMap[p.partido_id] = { local: p.goles_local, visitante: p.goles_visitante } })
      setPredicciones(predMap)

      const { data: pf } = await supabase
        .from('puntos_fecha')
        .select('*')
        .eq('usuario_id', user.id)
        .eq('fecha_id', fechaId)
        .single()
      setPuntosFecha(pf)
    }
    setLoading(false)
  }

  const fechaInfo = fechas.find(f => f.id === fechaActiva)

  return (
    <div className="container">
      <h1 className="page-title">Resultados</h1>

      <div className="tabs">
        {[1,2,3,4].map(cat => (
          <button key={cat} className={`tab ${categoriaActiva === cat ? 'active' : ''}`}
            onClick={() => setCategoriaActiva(cat)}>
            {CAT_LABELS[cat]}
          </button>
        ))}
      </div>

      {fechas.length > 0 && (
        <div className="tabs" style={{marginBottom:16}}>
          {fechas.map(f => (
            <button key={f.id} className={`tab ${fechaActiva === f.id ? 'active' : ''}`}
              onClick={() => setFechaActiva(f.id)}>
              Fecha {f.numero}
            </button>
          ))}
        </div>
      )}

      {loading && <div className="loading">Cargando resultados...</div>}

      {!loading && fechas.length === 0 && (
        <div className="card">
          <p style={{color:'var(--texto-suave)',textAlign:'center',padding:'20px 0'}}>
            No hay resultados cargados aún.
          </p>
        </div>
      )}

      {!loading && puntosFecha && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Mis puntos — Fecha {fechaInfo?.numero}</span>
            <span style={{fontSize:22,fontWeight:800,color:'var(--verde-oscuro)'}}>
              {puntosFecha.total_puntos} pts
            </span>
          </div>
          <div className="puntos-resumen">
            <div className="punt-item">
              <div className="punt-valor">{puntosFecha.puntos_exactos}</div>
              <div className="punt-label">Pts exactos</div>
            </div>
            <div className="punt-item">
              <div className="punt-valor">{puntosFecha.puntos_signo}</div>
              <div className="punt-label">Pts signo</div>
            </div>
            <div className="punt-item">
              <div className="punt-valor">{(puntosFecha.bonus_pleno || 0) + (puntosFecha.bonus_mitad || 0)}</div>
              <div className="punt-label">Bonus</div>
            </div>
          </div>
          {puntosFecha.bonus_pleno > 0 && (
            <div className="alert alert-success">¡Pleno! Acertaste todos los partidos (+5 pts)</div>
          )}
          {puntosFecha.bonus_mitad > 0 && (
            <div className="alert alert-info">Acertaste la mitad o más (+2 pts)</div>
          )}
          <div style={{fontSize:13,color:'var(--texto-suave)'}}>
            {puntosFecha.partidos_acertados} de {puntosFecha.partidos_totales} partidos acertados ({puntosFecha.partidos_exactos} exactos)
          </div>
        </div>
      )}

      {!loading && partidos.map(partido => {
        const pred = predicciones[partido.id]
        let claseCard = 'partido-card'
        let badge = null

        if (pred !== undefined) {
          const exacto = pred.local === partido.resultado_local && pred.visitante === partido.resultado_visitante
          const signo = !exacto && (
            (pred.local > pred.visitante && partido.resultado_local > partido.resultado_visitante) ||
            (pred.local < pred.visitante && partido.resultado_local < partido.resultado_visitante) ||
            (pred.local === pred.visitante && partido.resultado_local === partido.resultado_visitante)
          )
          if (exacto) { claseCard += ' acertado-exacto'; badge = <span className="resultado-badge badge-exacto">+3 exacto</span> }
          else if (signo) { claseCard += ' acertado-signo'; badge = <span className="resultado-badge badge-signo">+1 signo</span> }
          else badge = <span className="resultado-badge badge-nada">0 pts</span>
        }

        return (
          <div key={partido.id} className={claseCard}>
            <div className="partido-equipos">
              <div className="equipo-nombre local">{partido.equipo_local?.nombre}</div>
              <div className="vs-badge" style={{fontSize:16,fontWeight:800}}>
                {partido.resultado_local} — {partido.resultado_visitante}
              </div>
              <div className="equipo-nombre visitante">{partido.equipo_visitante?.nombre}</div>
            </div>
            <div style={{textAlign:'center',fontSize:13,color:'var(--texto-suave)'}}>
              {pred !== undefined
                ? <span>Tu predicción: <strong>{pred.local} - {pred.visitante}</strong> {badge}</span>
                : <span>No cargaste predicción</span>
              }
            </div>
          </div>
        )
      })}
    </div>
  )
}
