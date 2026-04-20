import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function Ranking() {
  const { perfil } = useAuth()
  const [vista, setVista] = useState('personal')
  const [subVista, setSubVista] = useState('anual')
  const [fechas, setFechas] = useState([])
  const [fechaNum, setFechaNum] = useState(null)
  const [lista, setLista] = useState([])
  const [listaClubs, setListaClubs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { cargarFechas() }, [])
  useEffect(() => { if (vista === 'personal') cargarPersonal(); else cargarClubs() }, [vista, subVista, fechaNum])

  async function cargarFechas() {
    // Fechas únicas por número (una fecha = todos los torneos del mismo sábado)
    const { data } = await supabase.from('fechas')
      .select('numero, fecha_partido')
      .eq('resultados_cargados', true)
      .order('numero', { ascending: false })
    // Deduplicar por número
    const unicas = [...new Map(data?.map(f => [f.numero, f])).values()]
    setFechas(unicas)
    if (unicas.length) setFechaNum(unicas[0].numero)
  }

  async function cargarPersonal() {
    setLoading(true)
    if (subVista === 'anual') {
      const { data } = await supabase.from('puntos_totales')
        .select('puntos_acumulados, fechas_jugadas, perfiles(username, nombre_completo, avatar_url, club)')
        .eq('temporada_id', 1)
        .order('puntos_acumulados', { ascending: false })
        .limit(200)
      // Agrupar por usuario sumando todos los torneos
      const agrupado = {}
      data?.forEach(item => {
        const u = item.perfiles?.username
        if (!u) return
        if (!agrupado[u]) agrupado[u] = { ...item, puntos_acumulados: 0 }
        agrupado[u].puntos_acumulados += item.puntos_acumulados
      })
      setLista(Object.values(agrupado).sort((a,b) => b.puntos_acumulados - a.puntos_acumulados))
    } else if (fechaNum) {
      const { data: fechasIds } = await supabase.from('fechas')
        .select('id').eq('numero', fechaNum).eq('resultados_cargados', true)
      const ids = fechasIds?.map(f => f.id) || []
      const { data } = await supabase.from('puntos_fecha')
        .select('total_puntos, partidos_acertados, partidos_totales, bonus_pleno, bonus_mitad, perfiles(username, nombre_completo, avatar_url, club)')
        .in('fecha_id', ids)
      // Agrupar por usuario sumando todos los torneos de esa fecha
      const agrupado = {}
      data?.forEach(item => {
        const u = item.perfiles?.username
        if (!u) return
        if (!agrupado[u]) agrupado[u] = { ...item, total_puntos: 0, partidos_acertados: 0, partidos_totales: 0, bonus_pleno: 0, bonus_mitad: 0 }
        agrupado[u].total_puntos += item.total_puntos
        agrupado[u].partidos_acertados += item.partidos_acertados
        agrupado[u].partidos_totales += item.partidos_totales
        agrupado[u].bonus_pleno += item.bonus_pleno || 0
        agrupado[u].bonus_mitad += item.bonus_mitad || 0
      })
      setLista(Object.values(agrupado).sort((a,b) => b.total_puntos - a.total_puntos))
    }
    setLoading(false)
  }

  async function cargarClubs() {
    setLoading(true)
    const { data } = await supabase.from('puntos_totales')
      .select('puntos_acumulados, perfiles(club)')
      .eq('temporada_id', 1)
    // Agrupar por club
    const agrupado = {}
    data?.forEach(item => {
      const club = item.perfiles?.club
      if (!club || club.startsWith('---')) return
      if (!agrupado[club]) agrupado[club] = { club, puntos: 0, miembros: 0 }
      agrupado[club].puntos += item.puntos_acumulados
      agrupado[club].miembros += 1
    })
    setListaClubs(Object.values(agrupado).sort((a,b) => b.puntos - a.puntos))
    setLoading(false)
  }

  const posMedalla = (i) => ['🥇','🥈','🥉'][i] || null
  const posClass = (i) => i===0?'pos-1':i===1?'pos-2':i===2?'pos-3':''

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">Ranking <span className="page-title-accent">2026</span></h1>
      </div>

      {/* Tabs principales */}
      <div className="tabs-box">
        <button className={`tab-btn ${vista==='personal'?'active':''}`} onClick={() => setVista('personal')}>Ranking personal</button>
        <button className={`tab-btn ${vista==='clubes'?'active':''}`} onClick={() => setVista('clubes')}>Ranking por clubes</button>
      </div>

      {/* Sub-tabs solo para personal */}
      {vista === 'personal' && (
        <div className="tabs-box">
          <button className={`tab-btn ${subVista==='anual'?'active':''}`} onClick={() => setSubVista('anual')}>Anual 2026</button>
          <button className={`tab-btn ${subVista==='fecha'?'active':''}`} onClick={() => setSubVista('fecha')}>Por fecha</button>
        </div>
      )}

      {/* Selector de fecha */}
      {vista === 'personal' && subVista === 'fecha' && fechas.length > 0 && (
        <div className="tabs-box" style={{marginBottom:16}}>
          {fechas.map(f => (
            <button key={f.numero} className={`tab-btn ${fechaNum===f.numero?'active':''}`}
              onClick={() => setFechaNum(f.numero)}>
              Fecha {f.numero}
            </button>
          ))}
        </div>
      )}

      {loading && <div className="loading"><div className="spinner"></div></div>}

      {/* RANKING PERSONAL */}
      {!loading && vista === 'personal' && (
        lista.length === 0
          ? <div className="empty-state"><div className="empty-icon">🏆</div><div className="empty-title">Sin datos todavía</div></div>
          : <div className="card" style={{padding:0,overflow:'hidden'}}>
              <div style={{padding:'12px 16px',background:'linear-gradient(135deg,var(--azul),var(--azul-medio))',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span style={{fontFamily:'Rajdhani,sans-serif',fontSize:15,fontWeight:700,color:'var(--dorado)',letterSpacing:1}}>
                  {subVista==='anual' ? 'Ranking anual 2026' : `Fecha ${fechaNum} — todos los torneos`}
                </span>
                <span style={{fontSize:12,color:'rgba(255,255,255,0.6)'}}>{lista.length} participantes</span>
              </div>
              {lista.map((item, idx) => {
                const esYo = item.perfiles?.username === perfil?.username
                const av = item.perfiles?.avatar_url
                const ini = item.perfiles?.username?.[0]?.toUpperCase() || '?'
                return (
                  <div key={idx} className={`ranking-row ${esYo?'yo':''}`}>
                    <div className={`ranking-pos ${posClass(idx)}`}>{posMedalla(idx) || (idx+1)}</div>
                    <div style={{display:'flex',alignItems:'center',gap:10}}>
                      <div className="avatar-circle" style={{width:34,height:34,fontSize:13}}>
                        {av ? <img src={av} alt={ini} style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:'50%'}} /> : ini}
                      </div>
                      <div className="ranking-info">
                        <div className="ranking-username">
                          {item.perfiles?.username}
                          {esYo && <span style={{marginLeft:6,fontSize:10,background:'var(--dorado)',color:'var(--azul)',padding:'1px 6px',borderRadius:20,fontWeight:700}}>VOS</span>}
                        </div>
                        {item.perfiles?.club && <div className="ranking-club">{item.perfiles.club}</div>}
                        {subVista==='fecha' && (
                          <div style={{fontSize:11,color:'var(--texto-suave)'}}>
                            {item.partidos_acertados}/{item.partidos_totales} acertados
                            {item.bonus_pleno>0 && <span style={{marginLeft:4,color:'var(--dorado)',fontWeight:600}}>+{item.bonus_pleno*5} pleno</span>}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="ranking-pts">
                      {subVista==='anual' ? item.puntos_acumulados : item.total_puntos}
                      <span> pts</span>
                    </div>
                    {subVista==='anual' && <div className="ranking-fechas">{item.fechas_jugadas} fechas</div>}
                  </div>
                )
              })}
            </div>
      )}

      {/* RANKING POR CLUBES */}
      {!loading && vista === 'clubes' && (
        listaClubs.length === 0
          ? <div className="empty-state"><div className="empty-icon">🏉</div><div className="empty-title">Sin datos de clubes todavía</div><p style={{fontSize:13}}>Los usuarios deben asignar su club en el perfil</p></div>
          : <div className="card" style={{padding:0,overflow:'hidden'}}>
              <div style={{padding:'12px 16px',background:'linear-gradient(135deg,var(--rojo),var(--rojo-vivo))',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span style={{fontFamily:'Rajdhani,sans-serif',fontSize:15,fontWeight:700,color:'white',letterSpacing:1}}>Ranking por clubes 2026</span>
                <span style={{fontSize:12,color:'rgba(255,255,255,0.7)'}}>{listaClubs.length} clubes</span>
              </div>
              {listaClubs.map((item, idx) => (
                <div key={idx} className="ranking-row">
                  <div className={`ranking-pos ${posClass(idx)}`}>{posMedalla(idx) || (idx+1)}</div>
                  <div className="ranking-info">
                    <div className="ranking-username">{item.club}</div>
                    <div className="ranking-club">{item.miembros} {item.miembros===1?'participante':'participantes'}</div>
                  </div>
                  <div className="ranking-pts">{item.puntos}<span> pts</span></div>
                </div>
              ))}
            </div>
      )}
    </div>
  )
}
