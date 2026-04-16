import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const CAT_LABELS = { 1: 'Top 14', 2: 'Primera A', 3: 'Primera B', 4: 'Primera C' }

export default function Ranking() {
  const { user } = useAuth()
  const [vista, setVista] = useState('anual')
  const [categoriaActiva, setCategoriaActiva] = useState(1)
  const [fechas, setFechas] = useState([])
  const [fechaActiva, setFechaActiva] = useState(null)
  const [rankingAnual, setRankingAnual] = useState([])
  const [rankingSemanal, setRankingSemanal] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { cargarDatos() }, [categoriaActiva, fechaActiva, vista])

  useEffect(() => {
    cargarFechas(categoriaActiva)
  }, [categoriaActiva])

  async function cargarFechas(catId) {
    const { data } = await supabase
      .from('fechas')
      .select('id, numero, resultados_cargados')
      .eq('categoria_id', catId)
      .eq('resultados_cargados', true)
      .order('numero', { ascending: false })
    setFechas(data || [])
    if (data?.length) setFechaActiva(data[0].id)
  }

  async function cargarDatos() {
    setLoading(true)
    if (vista === 'anual') {
      const { data } = await supabase
        .from('puntos_totales')
        .select(`puntos_acumulados, fechas_jugadas, perfiles(username, nombre_completo)`)
        .eq('temporada_id', 1)
        .order('puntos_acumulados', { ascending: false })
        .limit(100)
      setRankingAnual(data || [])
    } else if (vista === 'semanal' && fechaActiva) {
      const { data } = await supabase
        .from('puntos_fecha')
        .select(`total_puntos, puntos_exactos, puntos_signo, bonus_pleno, bonus_mitad, partidos_acertados, partidos_totales, perfiles(username, nombre_completo)`)
        .eq('fecha_id', fechaActiva)
        .order('total_puntos', { ascending: false })
        .limit(100)
      setRankingSemanal(data || [])
    }
    setLoading(false)
  }

  const medalla = (pos) => {
    if (pos === 0) return '🥇'
    if (pos === 1) return '🥈'
    if (pos === 2) return '🥉'
    return null
  }

  const posClass = (pos) => {
    if (pos === 0) return 'top1'
    if (pos === 1) return 'top2'
    if (pos === 2) return 'top3'
    return ''
  }

  const lista = vista === 'anual' ? rankingAnual : rankingSemanal

  return (
    <div className="container">
      <h1 className="page-title">Ranking</h1>

      <div className="tabs">
        {[1,2,3,4].map(cat => (
          <button key={cat} className={`tab ${categoriaActiva === cat ? 'active' : ''}`}
            onClick={() => setCategoriaActiva(cat)}>
            {CAT_LABELS[cat]}
          </button>
        ))}
      </div>

      <div className="tabs">
        <button className={`tab ${vista === 'anual' ? 'active' : ''}`} onClick={() => setVista('anual')}>
          Anual 2026
        </button>
        <button className={`tab ${vista === 'semanal' ? 'active' : ''}`} onClick={() => setVista('semanal')}>
          Por fecha
        </button>
      </div>

      {vista === 'semanal' && fechas.length > 0 && (
        <div className="tabs" style={{marginBottom:16}}>
          {fechas.map(f => (
            <button key={f.id} className={`tab ${fechaActiva === f.id ? 'active' : ''}`}
              onClick={() => setFechaActiva(f.id)}>
              Fecha {f.numero}
            </button>
          ))}
        </div>
      )}

      {loading && <div className="loading">Cargando ranking...</div>}

      {!loading && lista.length === 0 && (
        <div className="card">
          <p style={{color:'var(--texto-suave)',textAlign:'center',padding:'20px 0'}}>
            Todavía no hay resultados cargados para esta categoría.
          </p>
        </div>
      )}

      {!loading && lista.length > 0 && (
        <div className="card" style={{padding:0,overflow:'hidden'}}>
          <div style={{padding:'14px 16px',borderBottom:'1px solid var(--gris-borde)',background:'var(--gris)'}}>
            <span style={{fontWeight:700,fontSize:14,color:'var(--verde-oscuro)'}}>
              {vista === 'anual' ? 'Ranking anual 2026' : `Ranking fecha ${fechas.find(f => f.id === fechaActiva)?.numero || ''}`}
            </span>
            <span style={{marginLeft:8,fontSize:13,color:'var(--texto-suave)'}}>
              {lista.length} participantes
            </span>
          </div>
          {lista.map((item, idx) => {
            const esYo = item.perfiles?.username === user?.email?.split('@')[0]
            return (
              <div key={idx} className="ranking-row"
                style={esYo ? {background:'var(--verde-claro)'} : {}}>
                <div className={`ranking-pos ${posClass(idx)}`}>
                  {medalla(idx) || (idx + 1)}
                </div>
                <div>
                  <div className="ranking-usuario">
                    {item.perfiles?.username}
                    {esYo && <span style={{marginLeft:6,fontSize:11,background:'var(--verde)',color:'white',padding:'1px 6px',borderRadius:20}}>Vos</span>}
                  </div>
                  {vista === 'semanal' && (
                    <div style={{fontSize:12,color:'var(--texto-suave)',marginTop:2}}>
                      {item.partidos_acertados}/{item.partidos_totales} partidos acertados
                      {item.bonus_pleno > 0 && <span style={{marginLeft:6,color:'var(--verde)',fontWeight:600}}>+5 pleno</span>}
                      {item.bonus_mitad > 0 && <span style={{marginLeft:6,color:'var(--dorado)',fontWeight:600}}>+2 mitad</span>}
                    </div>
                  )}
                </div>
                <div className="ranking-pts">
                  {vista === 'anual' ? item.puntos_acumulados : item.total_puntos}
                  <span style={{fontSize:12,fontWeight:400,marginLeft:2}}>pts</span>
                </div>
                {vista === 'anual' && (
                  <div className="ranking-fechas">{item.fechas_jugadas} fechas</div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
