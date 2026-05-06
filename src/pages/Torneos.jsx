import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { CATS } from '../lib/constants'
import { computeEquipoStats, sortedTeams, formaIcon } from '../lib/equipoStats'
import TabsScrollWrapper from '../components/TabsScrollWrapper'
import { PartidoCardResultado } from '../components/PartidoCard'

const COL = '36px 1fr 30px 30px 30px 30px 38px 42px 42px 44px 80px'

function formatFecha(str) {
  if (!str) return null
  const d = new Date(str)
  if (isNaN(d)) return null
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
}

export default function Torneos() {
  const [cat, setCat] = useState(1)
  const [loading, setLoading] = useState(true)
  const [teams, setTeams] = useState([])
  const [fechas, setFechas] = useState([])
  const [partidosPorFecha, setPartidosPorFecha] = useState({})
  const [fechaAbierta, setFechaAbierta] = useState(null)
  const [totalFechas, setTotalFechas] = useState(0)

  useEffect(() => { cargar(cat) }, [cat])

  async function cargar(c) {
    setLoading(true)
    setTeams([])
    setFechas([])
    setPartidosPorFecha({})
    setFechaAbierta(null)
    try {
      const { data: fechasCat } = await supabase
        .from('fechas')
        .select('id, numero, fecha_partido')
        .eq('categoria_id', c)
        .eq('resultados_cargados', true)
        .order('numero', { ascending: false })

      if (!fechasCat?.length) { setLoading(false); return }

      setTotalFechas(fechasCat.length)
      const ids = fechasCat.map(f => f.id)

      const { data: partidos } = await supabase
        .from('partidos')
        .select(`
          *,
          equipo_local:equipo_local_id(id,nombre,nombre_corto,escudo_url),
          equipo_visitante:equipo_visitante_id(id,nombre,nombre_corto,escudo_url)
        `)
        .in('fecha_id', ids)
        .not('resultado_local', 'is', null)
        .order('es_especial', { ascending: false })
        .order('id')

      // Agrupar partidos por fecha
      const grouped = {}
      fechasCat.forEach(f => { grouped[f.id] = [] })
      partidos?.forEach(p => { if (grouped[p.fecha_id]) grouped[p.fecha_id].push(p) })

      setFechas(fechasCat)
      setTeams(sortedTeams(computeEquipoStats(partidos || [])))
      setPartidosPorFecha(grouped)
      setFechaAbierta(fechasCat[0].id) // última fecha abierta por defecto
    } catch (e) {
      console.error('Torneos error:', e)
    }
    setLoading(false)
  }

  function toggleFecha(id) {
    setFechaAbierta(prev => prev === id ? null : id)
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">
          Torneos <span className="page-title-accent">URBA 2026</span>
        </h1>
      </div>

      <TabsScrollWrapper>
        {[1, 2, 3, 4, 5].map(c => (
          <button
            key={c}
            className={`tab-btn ${cat === c ? 'active' : ''}`}
            onClick={() => setCat(c)}
          >
            {CATS[c]}
          </button>
        ))}
      </TabsScrollWrapper>

      {loading && <div className="loading"><div className="spinner" /></div>}

      {!loading && fechas.length === 0 && (
        <div className="empty-state seccion-fade" style={{ padding: '40px 20px' }}>
          <div style={{ fontSize: 52, marginBottom: 10 }}>🏉</div>
          <div className="empty-title">Sin datos para {CATS[cat]}</div>
          <p style={{ fontSize: 13, color: 'var(--texto-suave)', maxWidth: 260, margin: '8px auto 0', lineHeight: 1.5 }}>
            Los resultados aparecerán una vez disputada la primera fecha.
          </p>
        </div>
      )}

      {!loading && fechas.length > 0 && (
        <div className="seccion-fade">

          {/* ══ POSICIONES ══════════════════════════════════════════════ */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--texto-suave)', letterSpacing: 1, textTransform: 'uppercase' }}>
              Posiciones
            </span>
            <span style={{ fontSize: 12, color: 'var(--texto-suave)' }}>
              {totalFechas} fecha{totalFechas !== 1 ? 's' : ''} · {teams.length} equipos
            </span>
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 24 }}>
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <div style={{ minWidth: 520 }}>
                {/* Header tabla */}
                <div style={{
                  display: 'grid', gridTemplateColumns: COL, gap: 2,
                  padding: '8px 10px',
                  background: 'linear-gradient(135deg,var(--azul),var(--azul-medio))',
                  fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.7)',
                  letterSpacing: 0.5, position: 'sticky', top: 0,
                }}>
                  <div style={{ textAlign: 'center' }}>#</div>
                  <div>Equipo</div>
                  <div style={{ textAlign: 'center' }}>PJ</div>
                  <div style={{ textAlign: 'center', color: '#86efac' }}>G</div>
                  <div style={{ textAlign: 'center', color: '#fde68a' }}>E</div>
                  <div style={{ textAlign: 'center', color: '#fca5a5' }}>P</div>
                  <div style={{ textAlign: 'center', color: '#fde68a' }}>PTS</div>
                  <div style={{ textAlign: 'center' }}>PF</div>
                  <div style={{ textAlign: 'center' }}>PC</div>
                  <div style={{ textAlign: 'center' }}>DIF</div>
                  <div style={{ textAlign: 'center' }}>FORMA</div>
                </div>
                {/* Filas */}
                {teams.map((t, idx) => (
                  <FilaEquipo key={t.equipo.id} t={t} idx={idx} />
                ))}
              </div>
            </div>
          </div>

          {/* Leyenda FORMA */}
          <div style={{
            marginBottom: 20, padding: '8px 12px',
            background: 'var(--gris)', borderRadius: 8,
            display: 'flex', gap: 10, flexWrap: 'wrap',
            fontSize: 11, color: 'var(--texto-suave)', alignItems: 'center',
          }}>
            {[
              { l: 'W', c: '#16a34a', b: '#dcfce7', t: 'Ganó' },
              { l: 'E', c: '#ca8a04', b: '#fef9c3', t: 'Empató' },
              { l: 'D', c: '#dc2626', b: '#fee2e2', t: 'Perdió' },
            ].map(f => (
              <div key={f.l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{
                  width: 16, height: 16, borderRadius: 4,
                  background: f.b, border: `1px solid ${f.c}60`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 8, fontWeight: 800, color: f.c,
                }}>{f.l}</div>
                <span>{f.t}</span>
              </div>
            ))}
            <span style={{ marginLeft: 'auto', opacity: 0.6, fontSize: 10 }}>← últimos 5 →</span>
          </div>

          {/* ══ RESULTADOS ══════════════════════════════════════════════ */}
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--texto-suave)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>
            Resultados por fecha
          </div>

          {fechas.map(f => {
            const abierta = fechaAbierta === f.id
            const pts = partidosPorFecha[f.id] || []
            const fecha = formatFecha(f.fecha_partido)

            return (
              <div
                key={f.id}
                className="card"
                style={{ padding: 0, marginBottom: 8, overflow: 'hidden' }}
              >
                {/* Cabecera acordeón */}
                <div
                  onClick={() => toggleFecha(f.id)}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '13px 16px', cursor: 'pointer', userSelect: 'none',
                    background: abierta
                      ? 'linear-gradient(135deg,var(--azul),var(--azul-medio))'
                      : 'transparent',
                    transition: 'background 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      fontFamily: 'Rajdhani,sans-serif', fontSize: 15, fontWeight: 700,
                      color: abierta ? 'white' : 'var(--texto)',
                    }}>
                      Fecha {f.numero}
                    </span>
                    {fecha && (
                      <span style={{ fontSize: 11, color: abierta ? 'rgba(255,255,255,0.55)' : 'var(--texto-suave)' }}>
                        {fecha}
                      </span>
                    )}
                    <span style={{ fontSize: 11, color: abierta ? 'rgba(255,255,255,0.45)' : 'var(--texto-suave)' }}>
                      · {pts.length} partido{pts.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <span style={{
                    fontSize: 11,
                    color: abierta ? 'var(--dorado)' : 'var(--texto-suave)',
                    display: 'inline-block',
                    transition: 'transform 0.25s',
                    transform: abierta ? 'rotate(180deg)' : 'rotate(0deg)',
                  }}>▼</span>
                </div>

                {/* Partidos */}
                {abierta && (
                  <div style={{ padding: '10px 12px 4px' }}>
                    {pts.length === 0 ? (
                      <p style={{ fontSize: 13, color: 'var(--texto-suave)', textAlign: 'center', padding: '12px 0' }}>
                        Sin partidos cargados
                      </p>
                    ) : (
                      pts.map(p => (
                        <PartidoCardResultado key={p.id} partido={p} soloScore />
                      ))
                    )}
                  </div>
                )}
              </div>
            )
          })}

        </div>
      )}
    </div>
  )
}

// ── Fila tabla de posiciones ──────────────────────────────────────────────────
function FilaEquipo({ t, idx }) {
  const { equipo, pj, g, e, pe, pf, pc, dif, pts, forma } = t
  const difColor = dif > 0 ? '#16a34a' : dif < 0 ? '#dc2626' : 'var(--texto-suave)'
  const ini = equipo.nombre_corto || equipo.nombre?.slice(0, 3).toUpperCase() || '?'

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: COL, gap: 2,
      padding: '9px 10px',
      borderBottom: '1px solid var(--gris-borde)',
      alignItems: 'center',
      background: idx % 2 === 0 ? 'white' : '#fafafa',
    }}>
      {/* Posición */}
      <div style={{
        textAlign: 'center',
        fontFamily: 'Rajdhani,sans-serif', fontSize: 15, fontWeight: 700,
        color: idx === 0 ? 'var(--dorado)' : idx === 1 ? '#9ca3af' : idx === 2 ? '#cd7c3e' : 'var(--texto-suave)',
      }}>
        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
      </div>

      {/* Equipo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
        <div style={{
          width: 26, height: 26, borderRadius: 5, overflow: 'hidden', flexShrink: 0,
          background: 'white', border: '1px solid var(--gris-borde)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {equipo.escudo_url
            ? <img src={equipo.escudo_url} alt={equipo.nombre} style={{ width: '85%', height: '85%', objectFit: 'contain' }} />
            : <span style={{ fontSize: 7, fontWeight: 700, color: 'var(--azul)' }}>{ini}</span>
          }
        </div>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--texto)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {equipo.nombre_corto || equipo.nombre}
        </span>
      </div>

      {/* PJ G E P */}
      {[pj, g, e, pe].map((v, i) => (
        <div key={i} style={{
          textAlign: 'center', fontFamily: 'Rajdhani,sans-serif', fontSize: 13, fontWeight: 700,
          color: i === 1 ? '#16a34a' : i === 2 ? '#ca8a04' : i === 3 ? '#dc2626' : 'var(--texto)',
        }}>{v}</div>
      ))}

      {/* PTS */}
      <div style={{ textAlign: 'center' }}>
        <span style={{
          fontFamily: 'Rajdhani,sans-serif', fontSize: 14, fontWeight: 800,
          color: 'var(--dorado-oscuro)',
          background: 'var(--dorado-claro)',
          padding: '1px 5px', borderRadius: 5,
          border: '1px solid rgba(201,162,39,0.3)',
        }}>{pts}</span>
      </div>

      {/* PF PC */}
      <div style={{ textAlign: 'center', fontFamily: 'Rajdhani,sans-serif', fontSize: 12, color: 'var(--texto)' }}>{pf}</div>
      <div style={{ textAlign: 'center', fontFamily: 'Rajdhani,sans-serif', fontSize: 12, color: 'var(--texto)' }}>{pc}</div>

      {/* DIF */}
      <div style={{ textAlign: 'center', fontFamily: 'Rajdhani,sans-serif', fontSize: 13, fontWeight: 700, color: difColor }}>
        {dif > 0 ? '+' : ''}{dif}
      </div>

      {/* Forma */}
      <div style={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
        {Array.from({ length: 5 }).map((_, i) => {
          const res = forma[i]
          if (!res) return (
            <div key={i} style={{ width: 13, height: 13, borderRadius: 3, background: '#f3f4f6', border: '1px solid #e5e7eb' }} />
          )
          const f = formaIcon(res)
          return (
            <div key={i} style={{
              width: 13, height: 13, borderRadius: 3,
              background: f.bg, border: `1px solid ${f.color}50`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 6, fontWeight: 800, color: f.color,
            }}>{f.icon}</div>
          )
        })}
      </div>
    </div>
  )
}
