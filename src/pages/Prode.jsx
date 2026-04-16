import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const CAT_LABELS = { 1: 'Top 14', 2: 'Primera A', 3: 'Primera B', 4: 'Primera C' }
const CAT_CLASS = { 1: 'cat-top14', 2: 'cat-primera-a', 3: 'cat-primera-b', 4: 'cat-primera-c' }

function estaAbierto(cierre) {
  if (!cierre) return true
  return new Date() < new Date(cierre)
}

export default function Prode() {
  const { user } = useAuth()
  const [categoriaActiva, setCategoriaActiva] = useState(1)
  const [fechas, setFechas] = useState([])
  const [fechaActiva, setFechaActiva] = useState(null)
  const [partidos, setPartidos] = useState([])
  const [predicciones, setPredicciones] = useState({})
  const [guardando, setGuardando] = useState(false)
  const [guardado, setGuardado] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => { cargarFechas(categoriaActiva) }, [categoriaActiva])
  useEffect(() => { if (fechaActiva) cargarPartidos(fechaActiva) }, [fechaActiva])

  async function cargarFechas(catId) {
    setLoading(true)
    const { data } = await supabase
      .from('fechas')
      .select('*')
      .eq('categoria_id', catId)
      .eq('activa', true)
      .order('numero')
    setFechas(data || [])
    if (data?.length) {
      const proxima = data.find(f => !f.resultados_cargados) || data[data.length - 1]
      setFechaActiva(proxima.id)
    } else {
      setFechaActiva(null)
      setPartidos([])
      setLoading(false)
    }
  }

  async function cargarPartidos(fechaId) {
    setLoading(true)
    const { data: pts } = await supabase
      .from('partidos')
      .select(`*, equipo_local:equipo_local_id(nombre, nombre_corto), equipo_visitante:equipo_visitante_id(nombre, nombre_corto)`)
      .eq('fecha_id', fechaId)
      .order('id')

    setPartidos(pts || [])

    if (pts?.length) {
      const { data: preds } = await supabase
        .from('predicciones')
        .select('*')
        .eq('usuario_id', user.id)
        .in('partido_id', pts.map(p => p.id))

      const predMap = {}
      preds?.forEach(p => {
        predMap[p.partido_id] = { local: p.goles_local, visitante: p.goles_visitante }
      })
      setPredicciones(predMap)
    }
    setLoading(false)
  }

  function actualizarPred(partidoId, lado, valor) {
    const num = Math.max(0, parseInt(valor) || 0)
    setPredicciones(prev => ({
      ...prev,
      [partidoId]: { ...prev[partidoId], [lado]: num }
    }))
  }

  async function guardarPredicciones() {
    setGuardando(true)
    const fechaInfo = fechas.find(f => f.id === fechaActiva)
    if (!estaAbierto(fechaInfo?.cierre_predicciones)) {
      alert('Las predicciones de esta fecha están cerradas')
      setGuardando(false)
      return
    }

    const upserts = Object.entries(predicciones)
      .filter(([, v]) => v.local !== undefined && v.visitante !== undefined)
      .map(([partido_id, v]) => ({
        usuario_id: user.id,
        partido_id: parseInt(partido_id),
        goles_local: v.local,
        goles_visitante: v.visitante,
        updated_at: new Date().toISOString()
      }))

    if (upserts.length === 0) {
      setGuardando(false)
      return
    }

    const { error } = await supabase
      .from('predicciones')
      .upsert(upserts, { onConflict: 'usuario_id,partido_id' })

    if (!error) {
      setGuardado(true)
      setTimeout(() => setGuardado(false), 2500)
    }
    setGuardando(false)
  }

  const fechaInfo = fechas.find(f => f.id === fechaActiva)
  const abierto = estaAbierto(fechaInfo?.cierre_predicciones)

  return (
    <div className="container">
      <h1 className="page-title">Mis predicciones</h1>

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

      {fechaInfo && (
        <div className="card" style={{padding:'12px 16px',marginBottom:16}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:8}}>
            <div>
              <span className={`cat-badge ${CAT_CLASS[categoriaActiva]}`}>{CAT_LABELS[categoriaActiva]}</span>
              <span style={{marginLeft:8,fontWeight:600}}>Fecha {fechaInfo.numero}</span>
              {fechaInfo.fecha_partido && (
                <span style={{marginLeft:8,fontSize:13,color:'var(--texto-suave)'}}>
                  {new Date(fechaInfo.fecha_partido + 'T12:00:00').toLocaleDateString('es-AR',{weekday:'long',day:'numeric',month:'long'})}
                </span>
              )}
            </div>
            <span className={`cierre-badge ${abierto ? 'cierre-abierto' : 'cierre-cerrado'}`}>
              {abierto ? '● Predicciones abiertas' : '✕ Predicciones cerradas'}
            </span>
          </div>
          {fechaInfo.cierre_predicciones && (
            <div style={{fontSize:12,color:'var(--texto-suave)',marginTop:6}}>
              Cierre: {new Date(fechaInfo.cierre_predicciones).toLocaleString('es-AR')}
            </div>
          )}
        </div>
      )}

      {loading && <div className="loading">Cargando partidos...</div>}

      {!loading && partidos.length === 0 && (
        <div className="card">
          <p style={{color:'var(--texto-suave)',textAlign:'center',padding:'20px 0'}}>
            No hay fechas cargadas aún para esta categoría. El administrador las cargará pronto.
          </p>
        </div>
      )}

      {!loading && partidos.map(partido => {
        const pred = predicciones[partido.id] || {}
        const jugado = partido.jugado
        const tieneRes = jugado && partido.resultado_local !== null

        let claseCard = 'partido-card'
        let badge = null

        if (tieneRes && pred.local !== undefined) {
          const exacto = pred.local === partido.resultado_local && pred.visitante === partido.resultado_visitante
          const signo = !exacto && (
            (pred.local > pred.visitante && partido.resultado_local > partido.resultado_visitante) ||
            (pred.local < pred.visitante && partido.resultado_local < partido.resultado_visitante) ||
            (pred.local === pred.visitante && partido.resultado_local === partido.resultado_visitante)
          )
          if (exacto) { claseCard += ' acertado-exacto'; badge = <span className="resultado-badge badge-exacto">+3 pts exacto</span> }
          else if (signo) { claseCard += ' acertado-signo'; badge = <span className="resultado-badge badge-signo">+1 pt signo</span> }
          else badge = <span className="resultado-badge badge-nada">0 pts</span>
        }

        return (
          <div key={partido.id} className={claseCard}>
            <div className="partido-equipos">
              <div className="equipo-nombre local">{partido.equipo_local?.nombre}</div>
              <div className="vs-badge">{tieneRes ? `${partido.resultado_local} - ${partido.resultado_visitante}` : 'vs'}</div>
              <div className="equipo-nombre visitante">{partido.equipo_visitante?.nombre}</div>
            </div>

            {!jugado && abierto && (
              <div className="prediccion-inputs">
                <input type="number" className="score-input" min="0" max="99"
                  value={pred.local ?? ''}
                  placeholder="0"
                  onChange={e => actualizarPred(partido.id, 'local', e.target.value)}
                />
                <span className="score-separator">-</span>
                <input type="number" className="score-input" min="0" max="99"
                  value={pred.visitante ?? ''}
                  placeholder="0"
                  onChange={e => actualizarPred(partido.id, 'visitante', e.target.value)}
                />
              </div>
            )}

            {(!abierto || jugado) && pred.local !== undefined && (
              <div style={{textAlign:'center',fontSize:14,color:'var(--texto-suave)'}}>
                Tu predicción: <strong>{pred.local} - {pred.visitante}</strong>
                {badge && <span style={{marginLeft:8}}>{badge}</span>}
              </div>
            )}

            {(!abierto || jugado) && pred.local === undefined && (
              <div style={{textAlign:'center',fontSize:13,color:'var(--texto-suave)'}}>
                No cargaste predicción para este partido
              </div>
            )}
          </div>
        )
      })}

      {!loading && partidos.length > 0 && abierto && (
        <div style={{position:'sticky',bottom:16,marginTop:16}}>
          <button className="btn btn-primary" style={{width:'100%',fontSize:16,padding:'14px'}}
            onClick={guardarPredicciones} disabled={guardando}>
            {guardando ? 'Guardando...' : guardado ? '✓ Predicciones guardadas' : 'Guardar mis predicciones'}
          </button>
        </div>
      )}
    </div>
  )
}
