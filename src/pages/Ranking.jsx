import { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const BASE = 'https://xmtsxdzwurxygqqccgdc.supabase.co/storage/v1/object/public/trofeos'

const TROFEOS = [
  { nombre: 'Puma',     minimo: 15, img: `${BASE}/trofeo_puma_v2.png`,     color: '#C9A227' },
  { nombre: 'Capitán',  minimo: 10, img: `${BASE}/trofeo_capitan_v2.png`,  color: '#C9A227' },
  { nombre: 'Titular',  minimo: 6,  img: `${BASE}/trofeo_titular_v2.png`,  color: '#9ca3af' },
  { nombre: 'Suplente', minimo: 3,  img: `${BASE}/trofeo_suplente_v2.png`, color: '#cd7c3e' },
]

function getTrofeo(rachaMaxima) {
  return TROFEOS.find(t => rachaMaxima >= t.minimo) || null
}

function FilaRanking({ item, idx, esYo, subVista, refProp }) {
  const av = item.perfiles?.avatar_url
  const ini = item.perfiles?.username?.[0]?.toUpperCase() || '?'
  const racha = item.perfiles?.racha_actual || 0
  const trofeo = getTrofeo(item.perfiles?.racha_maxima || 0)
  const puntos = subVista === 'anual' ? item.puntos_acumulados : item.total_puntos
  const medal = (i) => ['🥇','🥈','🥉'][i] || null
  const posClass = (i) => i===0?'pos-1':i===1?'pos-2':i===2?'pos-3':''

  return (
    <div
      ref={refProp}
      style={{
        display:'flex', alignItems:'center', padding:'10px 16px',
        borderBottom:'1px solid var(--gris-borde)', gap:0,
        background: esYo ? 'linear-gradient(135deg,#fff8e6,#fffdf5)' : 'white'
      }}
    >
      <div className={`ranking-pos ${posClass(idx)}`} style={{width:36,flexShrink:0,textAlign:'center'}}>
        {medal(idx) || (idx+1)}
      </div>
      <div className="avatar-circle" style={{width:34,height:34,fontSize:13,flexShrink:0,marginLeft:8}}>
        {av ? <img src={av} alt={ini} style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:'50%'}} /> : ini}
      </div>
      <div style={{flex:1,minWidth:0,marginLeft:10}}>
        <div style={{display:'flex',alignItems:'center',gap:5,flexWrap:'wrap'}}>
          <span style={{fontWeight:600,fontSize:14,color:'var(--texto)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
            {item.perfiles?.username || 'Usuario'}
          </span>
          {esYo && <span style={{fontSize:10,background:'var(--dorado)',color:'var(--azul)',padding:'1px 6px',borderRadius:20,fontWeight:700,flexShrink:0}}>VOS</span>}
          {racha >= 2 && <span style={{fontSize:11,fontWeight:700,color:'#ea580c',flexShrink:0}}>🔥{racha}</span>}
          {trofeo && <img src={trofeo.img} alt={trofeo.nombre} title={trofeo.nombre} style={{width:16,height:16,objectFit:'contain',flexShrink:0}} />}
        </div>
        {item.perfiles?.club && <div style={{fontSize:11,color:'var(--texto-suave)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.perfiles.club}</div>}
        {subVista==='fecha' && (
          <div style={{fontSize:11,color:'var(--texto-suave)'}}>
            {item.partidos_acertados}/{item.partidos_totales} acertados
            {item.bonus_pleno>0 && <span style={{marginLeft:4,color:'var(--dorado)',fontWeight:600}}>+{item.bonus_pleno*5} pleno</span>}
          </div>
        )}
      </div>
      <div style={{flexShrink:0,textAlign:'right',marginLeft:8}}>
        <span style={{fontFamily:'Rajdhani,sans-serif',fontSize:20,fontWeight:700,color:'var(--azul)'}}>{puntos}</span>
        <span style={{fontSize:11,color:'var(--texto-suave)',marginLeft:2}}>pts</span>
        {subVista==='anual' && <div style={{fontSize:10,color:'var(--texto-suave)'}}>{item.fechas_jugadas} f.</div>}
      </div>
    </div>
  )
}

export default function Ranking() {
  const { perfil } = useAuth()
  const [vista, setVista] = useState('personal')
  const [subVista, setSubVista] = useState('anual')
  const [fechas, setFechas] = useState([])
  const [fechaNum, setFechaNum] = useState(null)
  const [lista, setLista] = useState([])
  const [listaClubs, setListaClubs] = useState([])
  const [loading, setLoading] = useState(true)
  const [miFilaVisible, setMiFilaVisible] = useState(true)
  const miFilaRef = useRef(null)
  const scrollContainerRef = useRef(null)

  useEffect(() => { cargarFechas() }, [])
  useEffect(() => {
    if (vista === 'personal') cargarPersonal()
    else cargarClubs()
  }, [vista, subVista, fechaNum])

  useEffect(() => {
    if (!miFilaRef.current || !scrollContainerRef.current) return
    const observer = new IntersectionObserver(
      ([entry]) => setMiFilaVisible(entry.isIntersecting),
      { root: scrollContainerRef.current, threshold: 0.5 }
    )
    observer.observe(miFilaRef.current)
    return () => observer.disconnect()
  }, [lista, subVista])

  async function cargarFechas() {
    const { data } = await supabase.from('fechas')
      .select('numero, fecha_partido')
      .eq('resultados_cargados', true)
      .order('numero', { ascending: false })
    const unicas = [...new Map(data?.map(f => [f.numero, f])).values()]
    setFechas(unicas)
    if (unicas.length) setFechaNum(unicas[0].numero)
  }

  async function cargarPersonal() {
    setLoading(true)
    try {
      if (subVista === 'anual') {
        const { data, error } = await supabase.from('puntos_totales')
          .select('puntos_acumulados, fechas_jugadas, usuario_id, perfiles(username, nombre_completo, avatar_url, club, racha_actual, racha_maxima)')
          .eq('temporada_id', 1)
        if (error) throw error
        const agrupado = {}
        data?.forEach(item => {
          const uid = item.usuario_id
          if (!uid) return
          if (!agrupado[uid]) agrupado[uid] = {
            usuario_id: uid, puntos_acumulados: 0, fechas_jugadas: 0, perfiles: item.perfiles
          }
          agrupado[uid].puntos_acumulados += (item.puntos_acumulados || 0)
          agrupado[uid].fechas_jugadas = Math.max(agrupado[uid].fechas_jugadas, item.fechas_jugadas || 0)
        })
        setLista(Object.values(agrupado).sort((a,b) => b.puntos_acumulados - a.puntos_acumulados))
      } else if (fechaNum !== null) {
        const { data: fechasIds } = await supabase.from('fechas')
          .select('id').eq('numero', fechaNum).eq('resultados_cargados', true)
        const ids = fechasIds?.map(f => f.id) || []
        if (!ids.length) { setLista([]); setLoading(false); return }
        const { data, error } = await supabase.from('puntos_fecha')
          .select('total_puntos, partidos_acertados, partidos_totales, bonus_pleno, bonus_mitad, usuario_id, perfiles(username, nombre_completo, avatar_url, club, racha_actual, racha_maxima)')
          .in('fecha_id', ids)
        if (error) throw error
        const agrupado = {}
        data?.forEach(item => {
          const uid = item.usuario_id
          if (!uid) return
          if (!agrupado[uid]) agrupado[uid] = {
            usuario_id: uid, total_puntos: 0, partidos_acertados: 0,
            partidos_totales: 0, bonus_pleno: 0, bonus_mitad: 0, perfiles: item.perfiles
          }
          agrupado[uid].total_puntos += (item.total_puntos || 0)
          agrupado[uid].partidos_acertados += (item.partidos_acertados || 0)
          agrupado[uid].partidos_totales += (item.partidos_totales || 0)
          agrupado[uid].bonus_pleno += (item.bonus_pleno || 0)
          agrupado[uid].bonus_mitad += (item.bonus_mitad || 0)
        })
        setLista(Object.values(agrupado).sort((a,b) => b.total_puntos - a.total_puntos))
      }
    } catch(e) {
      console.error('Error ranking:', e)
      setLista([])
    }
    setLoading(false)
  }

  async function cargarClubs() {
    setLoading(true)
    try {
      const { data, error } = await supabase.from('puntos_totales')
        .select('puntos_acumulados, usuario_id, perfiles(club)')
        .eq('temporada_id', 1)
      if (error) throw error
      const agrupado = {}
      data?.forEach(item => {
        const club = item.perfiles?.club
        if (!club || club.startsWith('---') || club === 'Otro club') return
        if (!agrupado[club]) agrupado[club] = { club, puntos: 0, usuarios: new Set() }
        agrupado[club].puntos += (item.puntos_acumulados || 0)
        agrupado[club].usuarios.add(item.usuario_id)
      })
      setListaClubs(Object.values(agrupado)
        .map(c => ({ ...c, miembros: c.usuarios.size }))
        .sort((a,b) => b.puntos - a.puntos))
    } catch(e) {
      console.error('Error clubs:', e)
      setListaClubs([])
    }
    setLoading(false)
  }

  const medal = (i) => ['🥇','🥈','🥉'][i] || null
  const posClass = (i) => i===0?'pos-1':i===1?'pos-2':i===2?'pos-3':''

  const miIdx = lista.findIndex(item => item.perfiles?.username === perfil?.username)
  const miItem = miIdx >= 0 ? lista[miIdx] : null

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">Ranking <span className="page-title-accent">2026</span></h1>
      </div>

      <div className="tabs-box">
        <button className={`tab-btn ${vista==='personal'?'active':''}`} onClick={() => setVista('personal')}>Ranking personal</button>
        <button className={`tab-btn ${vista==='clubes'?'active':''}`} onClick={() => setVista('clubes')}>Por clubes</button>
      </div>

      {vista === 'personal' && (
        <div className="tabs-box">
          <button className={`tab-btn ${subVista==='anual'?'active':''}`} onClick={() => setSubVista('anual')}>Anual 2026</button>
          <button className={`tab-btn ${subVista==='fecha'?'active':''}`} onClick={() => setSubVista('fecha')}>Por fecha</button>
        </div>
      )}

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

              <div ref={scrollContainerRef} style={{maxHeight:'60vh',overflowY:'auto'}}>
                {lista.map((item, idx) => {
                  const esYo = item.perfiles?.username === perfil?.username
                  return (
                    <FilaRanking
                      key={item.usuario_id}
                      item={item}
                      idx={idx}
                      esYo={esYo}
                      subVista={subVista}
                      refProp={esYo ? miFilaRef : null}
                    />
                  )
                })}
              </div>

              {miItem && !miFilaVisible && (
                <div style={{borderTop:'2px solid var(--dorado)'}}>
                  <FilaRanking
                    item={miItem}
                    idx={miIdx}
                    esYo={true}
                    subVista={subVista}
                    refProp={null}
                  />
                </div>
              )}
            </div>
      )}

      {!loading && vista === 'clubes' && (
        listaClubs.length === 0
          ? <div className="empty-state"><div className="empty-icon">🏉</div><div className="empty-title">Sin datos de clubes todavía</div><p style={{fontSize:13}}>Los usuarios deben seleccionar su club en el perfil</p></div>
          : <div className="card" style={{padding:0,overflow:'hidden'}}>
              <div style={{padding:'12px 16px',background:'linear-gradient(135deg,var(--rojo),var(--rojo-vivo))',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span style={{fontFamily:'Rajdhani,sans-serif',fontSize:15,fontWeight:700,color:'white',letterSpacing:1}}>Ranking por clubes 2026</span>
                <span style={{fontSize:12,color:'rgba(255,255,255,0.7)'}}>{listaClubs.length} clubes</span>
              </div>
              <div style={{maxHeight:'60vh',overflowY:'auto'}}>
                {listaClubs.map((item, idx) => (
                  <div key={item.club} style={{display:'flex',alignItems:'center',padding:'10px 16px',borderBottom:'1px solid var(--gris-borde)',gap:0}}>
                    <div className={`ranking-pos ${posClass(idx)}`} style={{width:36,flexShrink:0,textAlign:'center'}}>
                      {medal(idx) || (idx+1)}
                    </div>
                    <div style={{flex:1,minWidth:0,marginLeft:12}}>
                      <div style={{fontWeight:600,fontSize:14,color:'var(--texto)'}}>{item.club}</div>
                      <div style={{fontSize:11,color:'var(--texto-suave)'}}>{item.miembros} {item.miembros===1?'participante':'participantes'}</div>
                    </div>
                    <div style={{flexShrink:0,textAlign:'right',marginLeft:8}}>
                      <span style={{fontFamily:'Rajdhani,sans-serif',fontSize:20,fontWeight:700,color:'var(--azul)'}}>{item.puntos}</span>
                      <span style={{fontSize:11,color:'var(--texto-suave)',marginLeft:2}}>pts</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
      )}
    </div>
  )
}
