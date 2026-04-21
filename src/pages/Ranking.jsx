import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const CATS = { 1:'Top 14', 2:'Primera A', 3:'Primera B', 4:'Primera C' }

export default function Ranking() {
  const { perfil } = useAuth()
  const [vista, setVista] = useState('anual')
  const [cat, setCat] = useState(1)
  const [fechas, setFechas] = useState([])
  const [fechaId, setFechaId] = useState(null)
  const [lista, setLista] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { cargarFechas(cat) }, [cat])
  useEffect(() => { cargarDatos() }, [cat, fechaId, vista])

  async function cargarFechas(c) {
    const { data } = await supabase.from('fechas').select('id,numero').eq('categoria_id',c).eq('resultados_cargados',true).order('numero',{ascending:false})
    setFechas(data || [])
    if (data?.length) setFechaId(data[0].id)
  }

  async function cargarDatos() {
    setLoading(true)
    if (vista === 'anual') {
      const { data } = await supabase.from('puntos_totales')
        .select('puntos_acumulados,fechas_jugadas,perfiles(username,nombre_completo,avatar_url,club)')
        .eq('temporada_id',1).order('puntos_acumulados',{ascending:false}).limit(100)
      setLista(data || [])
    } else if (fechaId) {
      const { data } = await supabase.from('puntos_fecha')
        .select('total_puntos,puntos_exactos,puntos_signo,bonus_pleno,bonus_mitad,partidos_acertados,partidos_totales,perfiles(username,nombre_completo,avatar_url,club)')
        .eq('fecha_id',fechaId).order('total_puntos',{ascending:false}).limit(100)
      setLista(data || [])
    }
    setLoading(false)
  }

  const posMedalla = (i) => ['🥇','🥈','🥉'][i] || null

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">Ranking <span className="page-title-accent">2026</span></h1>
      </div>

      <div className="tabs">
        {[1,2,3,4].map(c => (
          <button key={c} className={`tab ${cat===c?'active':''}`} onClick={() => setCat(c)}>{CATS[c]}</button>
        ))}
      </div>

      <div className="tabs">
        <button className={`tab ${vista==='anual'?'active tab-gold':''}`} onClick={() => setVista('anual')}>Ranking anual</button>
        <button className={`tab ${vista==='fecha'?'active':''}`} onClick={() => setVista('fecha')}>Por fecha</button>
      </div>

      {vista === 'fecha' && fechas.length > 0 && (
        <div className="tabs" style={{marginBottom:16}}>
          {fechas.map(f => (
            <button key={f.id} className={`tab ${fechaId===f.id?'active':''}`} onClick={() => setFechaId(f.id)}>Fecha {f.numero}</button>
          ))}
        </div>
      )}

      {loading && <div className="loading"><div className="spinner"></div></div>}

      {!loading && lista.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🏆</div>
          <div className="empty-title">Sin resultados todavía</div>
          <p style={{fontSize:13}}>El ranking aparecerá cuando se carguen los resultados</p>
        </div>
      )}

      {!loading && lista.length > 0 && (
        <div className="card" style={{padding:0,overflow:'hidden'}}>
          <div style={{padding:'12px 16px',background:'linear-gradient(135deg,var(--azul),var(--azul-medio))',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span style={{fontFamily:'Rajdhani,sans-serif',fontSize:15,fontWeight:700,color:'var(--dorado)',letterSpacing:1}}>
              {vista==='anual' ? 'Ranking anual' : `Fecha ${fechas.find(f=>f.id===fechaId)?.numero||''}`}
            </span>
            <span style={{fontSize:12,color:'rgba(255,255,255,0.6)'}}>{lista.length} participantes</span>
          </div>
          {lista.map((item, idx) => {
            const esYo = item.perfiles?.username === perfil?.username
            const av = item.perfiles?.avatar_url
            const ini = item.perfiles?.username?.[0]?.toUpperCase() || '?'
            return (
              <div key={idx} className={`ranking-row ${esYo?'yo':''}`}>
                <div className={`ranking-pos ${idx===0?'pos-1':idx===1?'pos-2':idx===2?'pos-3':''}`}>
                  {posMedalla(idx) || (idx+1)}
                </div>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <div className="avatar-circle" style={{width:32,height:32,fontSize:12}}>
                    {av ? <img src={av} alt={ini} style={{width:'100%',height:'100%',objectFit:'cover'}} /> : ini}
                  </div>
                  <div className="ranking-info">
                    <div className="ranking-username">
                      {item.perfiles?.username}
                      {esYo && <span style={{marginLeft:6,fontSize:10,background:'var(--dorado)',color:'var(--azul)',padding:'1px 6px',borderRadius:20,fontWeight:700}}>VOS</span>}
                    </div>
                    {item.perfiles?.club && <div className="ranking-club">{item.perfiles.club}</div>}
                    {vista==='fecha' && (
                      <div style={{fontSize:11,color:'var(--texto-suave)'}}>
                        {item.partidos_acertados}/{item.partidos_totales} acertados
                        {item.bonus_pleno>0 && <span style={{marginLeft:4,color:'var(--dorado)',fontWeight:600}}>+5 pleno</span>}
                        {item.bonus_mitad>0 && <span style={{marginLeft:4,color:'var(--azul)',fontWeight:600}}>+2 mitad</span>}
                      </div>
                    )}
                  </div>
                </div>
                <div className="ranking-pts">
                  {vista==='anual' ? item.puntos_acumulados : item.total_puntos}
                  <span> pts</span>
                </div>
                {vista==='anual' && <div className="ranking-fechas">{item.fechas_jugadas} fechas</div>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
