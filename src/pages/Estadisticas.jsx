import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { CATS, CAT_CLASS } from '../lib/constants'
import { computeEquipoStats, sortedTeams, formaIcon } from '../lib/equipoStats'
import TabsScrollWrapper from '../components/TabsScrollWrapper'

export default function Estadisticas() {
  const [cat, setCat] = useState(1)
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [totalFechas, setTotalFechas] = useState(0)

  useEffect(() => { cargar(cat) }, [cat])

  async function cargar(c) {
    setLoading(true)
    try {
      const { data: fechasCat } = await supabase.from('fechas')
        .select('id').eq('categoria_id', c).eq('resultados_cargados', true)
      const ids = (fechasCat || []).map(f => f.id)
      setTotalFechas(ids.length)
      if (!ids.length) { setTeams([]); setLoading(false); return }

      const { data: partidos } = await supabase.from('partidos')
        .select('equipo_local_id, equipo_visitante_id, resultado_local, resultado_visitante, fecha_id, equipo_local:equipo_local_id(id,nombre,nombre_corto,escudo_url), equipo_visitante:equipo_visitante_id(id,nombre,nombre_corto,escudo_url)')
        .in('fecha_id', ids)
        .not('resultado_local', 'is', null)

      const statsMap = computeEquipoStats(partidos || [])
      setTeams(sortedTeams(statsMap))
    } catch(e) {
      console.error('Error estadísticas:', e)
      setTeams([])
    }
    setLoading(false)
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">Estadísticas <span className="page-title-accent">de equipos</span></h1>
      </div>

      <TabsScrollWrapper>
        {[1,2,3,4,5].map(c => (
          <button
            key={c}
            className={`tab-btn ${cat === c ? 'active' : ''}`}
            onClick={() => setCat(c)}
          >
            {CATS[c]}
          </button>
        ))}
      </TabsScrollWrapper>

      {loading && <div className="loading"><div className="spinner"></div></div>}

      {!loading && teams.length === 0 && (
        <div className="seccion-fade empty-state" style={{padding:'40px 20px'}}>
          <div style={{fontSize:52,marginBottom:10}}>📊</div>
          <div className="empty-title">Sin datos para {CATS[cat]}</div>
          <p style={{fontSize:13,color:'var(--texto-suave)',maxWidth:260,margin:'8px auto 0',lineHeight:1.5}}>
            Las estadísticas aparecerán en cuanto se carguen los resultados de la primera fecha.
          </p>
        </div>
      )}

      {!loading && teams.length > 0 && (
        <div className="seccion-fade">
          {/* Info de contexto */}
          <div style={{
            display:'flex', justifyContent:'space-between', alignItems:'center',
            marginBottom:10,
          }}>
            <span className={`cat-badge ${CAT_CLASS[cat]}`}>{CATS[cat]}</span>
            <span style={{fontSize:12,color:'var(--texto-suave)'}}>
              {totalFechas} fecha{totalFechas !== 1 ? 's' : ''} con resultados · {teams.length} equipos
            </span>
          </div>

          <div className="card" style={{padding:0,overflow:'hidden'}}>
            {/* Header tabla */}
            <div style={{
              display:'grid',
              gridTemplateColumns:'36px 1fr 28px 28px 28px 28px 42px 42px 42px 90px',
              gap:2, padding:'8px 10px',
              background:'linear-gradient(135deg,var(--azul),var(--azul-medio))',
              fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.7)',
              letterSpacing:0.5,
            }}>
              <div style={{textAlign:'center'}}>#</div>
              <div>Equipo</div>
              <div style={{textAlign:'center'}}>PJ</div>
              <div style={{textAlign:'center',color:'#86efac'}}>G</div>
              <div style={{textAlign:'center',color:'#fde68a'}}>E</div>
              <div style={{textAlign:'center',color:'#fca5a5'}}>P</div>
              <div style={{textAlign:'center'}}>PF</div>
              <div style={{textAlign:'center'}}>PC</div>
              <div style={{textAlign:'center'}}>DIF</div>
              <div style={{textAlign:'center'}}>FORMA</div>
            </div>

            {/* Filas de equipos */}
            {teams.map((t, idx) => (
              <FilaEquipo key={t.equipo.id} t={t} idx={idx} />
            ))}
          </div>

          {/* Leyenda de forma */}
          <div style={{
            marginTop:10, padding:'8px 12px',
            background:'var(--gris)', borderRadius:8,
            display:'flex', gap:12, flexWrap:'wrap',
            fontSize:11, color:'var(--texto-suave)',
          }}>
            {[
              { l:'G', c:'#16a34a', b:'#dcfce7', t:'Ganó' },
              { l:'E', c:'#ca8a04', b:'#fef9c3', t:'Empató' },
              { l:'D', c:'#dc2626', b:'#fee2e2', t:'Perdió' },
            ].map(f => (
              <div key={f.l} style={{display:'flex',alignItems:'center',gap:4}}>
                <div style={{width:16,height:16,borderRadius:4,background:f.b,border:`1px solid ${f.c}60`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:8,fontWeight:800,color:f.c}}>{f.l}</div>
                <span>{f.t}</span>
              </div>
            ))}
            <span style={{marginLeft:'auto',opacity:0.7}}>Últimos 5 partidos →</span>
          </div>
        </div>
      )}
    </div>
  )
}

function FilaEquipo({ t, idx }) {
  const { equipo, pj, g, e, pe, pf, pc, dif, forma } = t
  const difColor = dif > 0 ? '#16a34a' : dif < 0 ? '#dc2626' : 'var(--texto-suave)'
  const ini = equipo.nombre_corto || equipo.nombre?.slice(0,3).toUpperCase() || '?'

  return (
    <div style={{
      display:'grid',
      gridTemplateColumns:'36px 1fr 28px 28px 28px 28px 42px 42px 42px 90px',
      gap:2, padding:'9px 10px',
      borderBottom:'1px solid var(--gris-borde)',
      alignItems:'center',
      background: idx % 2 === 0 ? 'white' : 'var(--gris)',
      transition:'background 0.1s',
    }}>
      {/* Posición */}
      <div style={{
        textAlign:'center',
        fontFamily:'Rajdhani,sans-serif', fontSize:15, fontWeight:700,
        color: idx === 0 ? 'var(--dorado)' : idx === 1 ? '#9ca3af' : idx === 2 ? '#cd7c3e' : 'var(--texto-suave)',
      }}>
        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
      </div>

      {/* Equipo */}
      <div style={{display:'flex',alignItems:'center',gap:7,minWidth:0}}>
        <div style={{
          width:28,height:28,borderRadius:6,overflow:'hidden',flexShrink:0,
          background:'white', border:'1px solid var(--gris-borde)',
          display:'flex',alignItems:'center',justifyContent:'center',
        }}>
          {equipo.escudo_url
            ? <img src={equipo.escudo_url} alt={equipo.nombre} style={{width:'85%',height:'85%',objectFit:'contain'}} />
            : <span style={{fontSize:7,fontWeight:700,color:'var(--azul)'}}>{ini}</span>
          }
        </div>
        <span style={{fontSize:12,fontWeight:600,color:'var(--texto)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
          {equipo.nombre_corto || equipo.nombre}
        </span>
      </div>

      {/* Stats numéricas */}
      {[pj, g, e, pe].map((v, i) => (
        <div key={i} style={{
          textAlign:'center',
          fontFamily:'Rajdhani,sans-serif', fontSize:14, fontWeight:700,
          color: i === 1 ? '#16a34a' : i === 2 ? '#ca8a04' : i === 3 ? '#dc2626' : 'var(--texto)',
        }}>
          {v}
        </div>
      ))}

      <div style={{textAlign:'center',fontFamily:'Rajdhani,sans-serif',fontSize:13,color:'var(--texto)'}}>{pf}</div>
      <div style={{textAlign:'center',fontFamily:'Rajdhani,sans-serif',fontSize:13,color:'var(--texto)'}}>{pc}</div>
      <div style={{textAlign:'center',fontFamily:'Rajdhani,sans-serif',fontSize:13,fontWeight:700,color:difColor}}>
        {dif > 0 ? '+' : ''}{dif}
      </div>

      {/* Forma */}
      <div style={{display:'flex',gap:3,justifyContent:'center'}}>
        {Array.from({length:5}).map((_, i) => {
          const res = forma[i]
          if (!res) return (
            <div key={i} style={{width:14,height:14,borderRadius:3,background:'#f3f4f6',border:'1px solid #e5e7eb'}} />
          )
          const f = formaIcon(res)
          return (
            <div key={i} style={{
              width:14,height:14,borderRadius:3,
              background:f.bg,border:`1px solid ${f.color}50`,
              display:'flex',alignItems:'center',justifyContent:'center',
              fontSize:7,fontWeight:800,color:f.color,
            }}>
              {f.icon}
            </div>
          )
        })}
      </div>
    </div>
  )
}
