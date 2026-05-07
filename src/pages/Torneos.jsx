import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { CATS } from '../lib/constants'
import { computeEquipoStats, sortedTeams, formaIcon } from '../lib/equipoStats'
import { PartidoCardResultado } from '../components/PartidoCard'

function formatFecha(str) {
  if (!str) return null
  const d = new Date(str)
  if (isNaN(d)) return null
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
}

export default function Torneos() {
  const { user } = useAuth()
  const [cat, setCat] = useState(1)
  const [loading, setLoading] = useState(true)
  const [teams, setTeams] = useState([])
  const [fechas, setFechas] = useState([])
  const [partidosPorFecha, setPartidosPorFecha] = useState({})
  const [predsByPartido, setPredsByPartido] = useState({})
  const [puntosPorFecha, setPuntosPorFecha] = useState({})
  const [fechaAbierta, setFechaAbierta] = useState(null)
  const [totalFechas, setTotalFechas] = useState(0)
  const [compartiendo, setCompartiendo] = useState(null)
  const [errorCarga, setErrorCarga] = useState(false)

  useEffect(() => { cargar(cat) }, [cat])

  async function cargar(c) {
    setLoading(true)
    setErrorCarga(false)
    setTeams([]); setFechas([]); setPartidosPorFecha({})
    setPredsByPartido({}); setPuntosPorFecha({}); setFechaAbierta(null)
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

      const [
        { data: partidos },
        { data: puntosData },
      ] = await Promise.all([
        supabase
          .from('partidos')
          .select('*, equipo_local:equipo_local_id(id,nombre,nombre_corto,escudo_url), equipo_visitante:equipo_visitante_id(id,nombre,nombre_corto,escudo_url)')
          .in('fecha_id', ids)
          .not('resultado_local', 'is', null)
          .order('es_especial', { ascending: false })
          .order('id'),
        user
          ? supabase.from('puntos_fecha')
              .select('fecha_id, total_puntos, puntos_exactos, puntos_signo, bonus_pleno, bonus_mitad, partidos_acertados, partidos_totales')
              .eq('usuario_id', user.id)
              .in('fecha_id', ids)
          : Promise.resolve({ data: [] }),
      ])

      const allPartidos = partidos || []

      let predsMap = {}
      if (user && allPartidos.length) {
        const { data: preds } = await supabase
          .from('predicciones')
          .select('partido_id, goles_local, goles_visitante')
          .eq('usuario_id', user.id)
          .in('partido_id', allPartidos.map(p => p.id))
        preds?.forEach(p => {
          predsMap[p.partido_id] = { local: p.goles_local, visitante: p.goles_visitante }
        })
      }

      const puntosMap = {}
      puntosData?.forEach(p => { puntosMap[p.fecha_id] = p })

      const grouped = {}
      fechasCat.forEach(f => { grouped[f.id] = [] })
      allPartidos.forEach(p => { if (grouped[p.fecha_id]) grouped[p.fecha_id].push(p) })

      setFechas(fechasCat)
      setTeams(sortedTeams(computeEquipoStats(allPartidos)))
      setPartidosPorFecha(grouped)
      setPredsByPartido(predsMap)
      setPuntosPorFecha(puntosMap)
      setFechaAbierta(fechasCat[0].id)
    } catch (e) {
      console.error('Torneos error:', e)
      setErrorCarga(true)
    }
    setLoading(false)
  }

  function toggleFecha(id) {
    setFechaAbierta(prev => prev === id ? null : id)
  }

  async function compartir(f) {
    if (compartiendo) return
    setCompartiendo(f.id)
    try {
      const { data: todasFechas } = await supabase
        .from('fechas').select('id').eq('numero', f.numero).eq('resultados_cargados', true)
      const fids = (todasFechas || []).map(x => x.id)

      const [{ data: allPuntos }, { data: rankingPuntos }] = await Promise.all([
        supabase.from('puntos_fecha')
          .select('total_puntos, puntos_exactos, puntos_signo, bonus_pleno, bonus_mitad')
          .eq('usuario_id', user.id).in('fecha_id', fids),
        supabase.from('puntos_fecha')
          .select('usuario_id, total_puntos').in('fecha_id', fids),
      ])

      const tot = (allPuntos || []).reduce((a, p) => ({
        pts:     a.pts     + (p.total_puntos  || 0),
        exactos: a.exactos + (p.puntos_exactos || 0),
        signo:   a.signo   + (p.puntos_signo   || 0),
        bonus:   a.bonus   + (p.bonus_pleno    || 0) + (p.bonus_mitad || 0),
      }), { pts: 0, exactos: 0, signo: 0, bonus: 0 })

      const byUser = {}
      rankingPuntos?.forEach(p => { byUser[p.usuario_id] = (byUser[p.usuario_id] || 0) + p.total_puntos })
      const sorted = Object.entries(byUser).sort(([, a], [, b]) => b - a)
      const pos = sorted.findIndex(([uid]) => uid === user.id) + 1
      const total = sorted.length
      const posTexto = pos === 1 ? '🥇 1ro' : pos === 2 ? '🥈 2do' : pos === 3 ? '🥉 3ro' : `#${pos}`

      const msg = encodeURIComponent(
        `🏉 Pick&Go · Fecha ${f.numero} · URBA 2026\n` +
        `${pos > 0 ? `Quedé ${posTexto} de ${total} con ` : ''}${tot.pts} pts${tot.bonus > 0 ? ' 💥' : ''}\n` +
        `(${tot.exactos} exactos · ${tot.signo} signo${tot.bonus > 0 ? ` · ${tot.bonus} bonus` : ''})\n\n` +
        `¿Jugás también? → pickandgo-prode.vercel.app`
      )
      window.open(`https://wa.me/?text=${msg}`, '_blank')

      supabase.from('perfiles').select('invitaciones').eq('id', user.id).single()
        .then(({ data }) => supabase.from('perfiles')
          .update({ invitaciones: (data?.invitaciones || 0) + 1 }).eq('id', user.id))
    } catch (e) {
      console.error('compartir error:', e)
    }
    setCompartiendo(null)
  }

  return (
    <div className="container">

      {/* ── Header ── */}
      <div className="torneos-header">
        <div className="torneos-eyebrow">URBA · TEMPORADA 2026</div>
        <h1 className="torneos-title">
          Torneos<span className="torneos-dot">•</span>
        </h1>
      </div>

      {/* ── Category pills ── */}
      <div className="torneos-cats">
        {[1, 2, 3, 4, 5].map(c => (
          <button
            key={c}
            className={`torneos-cat${cat === c ? ' active' : ''}`}
            onClick={() => setCat(c)}
          >
            {CATS[c]}
          </button>
        ))}
      </div>

      {loading && <div className="loading"><div className="spinner" /></div>}

      {errorCarga && !loading && (
        <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
          <span>Error al cargar los datos</span>
          <button className="btn btn-small btn-secondary" onClick={() => cargar(cat)}>Reintentar</button>
        </div>
      )}

      {!loading && fechas.length === 0 && (
        <div className="empty-state seccion-fade" style={{ padding: '40px 20px' }}>
          <div style={{ fontSize: 52, marginBottom: 10 }}>🏉</div>
          <div className="empty-title">Sin datos para {CATS[cat]}</div>
          <p style={{ fontSize: 13, color: 'var(--pg-text-soft)', maxWidth: 260, margin: '8px auto 0', lineHeight: 1.5 }}>
            Los resultados aparecerán una vez disputada la primera fecha.
          </p>
        </div>
      )}

      {!loading && fechas.length > 0 && (
        <div className="seccion-fade">

          {/* ── Posiciones ── */}
          <div className="torneos-section-label">
            <span>Posiciones · Fecha {totalFechas}</span>
            <span>{teams.length} equipos</span>
          </div>

          <div className="torneos-table-wrap">
            {/* Cabecera */}
            <div className="torneos-tgrid torneos-table-head">
              <div className="torneos-th">#</div>
              <div className="torneos-th-eq">Equipo</div>
              <div className="torneos-th">PJ</div>
              <div className="torneos-th" style={{ color: '#86efac' }}>G</div>
              <div className="torneos-th" style={{ color: '#fde68a' }}>E</div>
              <div className="torneos-th" style={{ color: '#fca5a5' }}>P</div>
              <div className="torneos-th">DIF</div>
              <div className="torneos-th">FORMA</div>
              <div className="torneos-th-pts" style={{ textAlign: 'right' }}>PTS</div>
            </div>
            {teams.map((t, idx) => <FilaEquipo key={t.equipo.id} t={t} idx={idx} />)}
          </div>

          {/* Leyenda FORMA */}
          <div className="torneos-forma-legend">
            {[
              { cls: 'forma-pill-w', l: 'W', t: 'Ganó' },
              { cls: 'forma-pill-e', l: 'E', t: 'Empató' },
              { cls: 'forma-pill-d', l: 'D', t: 'Perdió' },
            ].map(f => (
              <div key={f.l} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div className={`forma-pill ${f.cls}`}>{f.l}</div>
                <span>{f.t}</span>
              </div>
            ))}
            <span style={{ marginLeft: 'auto', opacity: 0.5, fontSize: 10 }}>← últimos 5</span>
          </div>

          {/* ── Resultados por fecha ── */}
          <div className="torneos-section-label torneos-fechas-label">
            <span>Resultados por fecha</span>
          </div>

          {fechas.map(f => {
            const abierta = fechaAbierta === f.id
            const partidos = partidosPorFecha[f.id] || []
            const puntosF  = puntosPorFecha[f.id]
            const fecha    = formatFecha(f.fecha_partido)

            return (
              <div key={f.id} className={`torneos-fecha-card${abierta ? ' open' : ''}`}>

                {/* Cabecera acordeón */}
                <div className="torneos-fecha-hd" onClick={() => toggleFecha(f.id)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="torneos-fecha-num">Fecha {f.numero}</span>
                    {fecha && <span className="torneos-fecha-date">{fecha}</span>}
                    <span className="torneos-fecha-cnt">· {partidos.length} partidos</span>
                    {puntosF && !abierta && (
                      <span className="torneos-fecha-pts-badge">· {puntosF.total_puntos} pts</span>
                    )}
                  </div>
                  <span className="torneos-fecha-arrow">▼</span>
                </div>

                {/* Contenido */}
                {abierta && (
                  <div className="torneos-fecha-body">

                    {/* Banner puntos user */}
                    {puntosF && (
                      <div className="torneos-pts-banner">
                        <div className="torneos-pts-cells">
                          <div className="torneos-pts-cell">
                            <div className="torneos-pts-main">{puntosF.total_puntos}</div>
                            <div className="torneos-pts-lbl">pts</div>
                          </div>
                          <div className="torneos-pts-div" />
                          {[
                            { v: puntosF.puntos_exactos, l: 'Exactos' },
                            { v: puntosF.puntos_signo,   l: 'Signo' },
                            { v: (puntosF.bonus_pleno || 0) + (puntosF.bonus_mitad || 0), l: 'Bonus' },
                          ].map((item, i) => (
                            <div key={i} className="torneos-pts-cell">
                              <div className={`torneos-pts-sub${i === 2 ? ' gold' : ''}`}>{item.v}</div>
                              <div className="torneos-pts-lbl">{item.l}</div>
                            </div>
                          ))}
                        </div>
                        <button
                          className="torneos-compartir"
                          onClick={e => { e.stopPropagation(); compartir(f) }}
                          disabled={compartiendo === f.id}
                        >
                          {compartiendo === f.id ? '⏳' : '📲 Compartir'}
                        </button>
                      </div>
                    )}

                    {/* Partidos */}
                    {partidos.length === 0 ? (
                      <p style={{ fontSize: 13, color: 'var(--pg-text-soft)', textAlign: 'center', padding: '12px 0' }}>
                        Sin partidos cargados
                      </p>
                    ) : (
                      partidos.map(p => (
                        <PartidoCardResultado
                          key={p.id}
                          partido={p}
                          pred={predsByPartido[p.id]}
                          soloScore={!predsByPartido[p.id]}
                        />
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

// ── Fila tabla posiciones ────────────────────────────────────────────────────
function FilaEquipo({ t, idx }) {
  const { equipo, pj, g, e, pe, dif, pts, forma } = t
  const difColor = dif > 0 ? '#16a34a' : dif < 0 ? '#dc2626' : 'var(--pg-text-soft)'
  const ini = equipo.nombre_corto || equipo.nombre?.slice(0, 3).toUpperCase() || '?'
  const posColor =
    idx === 0 ? 'var(--pg-gold)' :
    idx === 1 ? '#9ca3af' :
    idx === 2 ? '#cd7c3e' : 'var(--pg-text-soft)'

  return (
    <div className="torneos-tgrid torneos-row">
      {/* # */}
      <div className="torneos-pos" style={{ color: posColor }}>
        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
      </div>

      {/* EQUIPO */}
      <div className="torneos-eq-cell">
        <div className="torneos-badge">
          {equipo.escudo_url
            ? <img src={equipo.escudo_url} alt={ini} />
            : <span className="torneos-badge-ini">{ini}</span>}
        </div>
        <span className="torneos-eq-name">{equipo.nombre_corto || equipo.nombre}</span>
      </div>

      {/* Stats */}
      <div className="torneos-stat">{pj}</div>
      <div className="torneos-stat g">{g}</div>
      <div className="torneos-stat e">{e}</div>
      <div className="torneos-stat p">{pe}</div>

      {/* DIF */}
      <div className="torneos-dif" style={{ color: difColor }}>
        {dif > 0 ? '+' : ''}{dif}
      </div>

      {/* FORMA */}
      <div className="torneos-forma">
        {Array.from({ length: 5 }).map((_, i) => {
          const res = forma[i]
          if (!res) return <div key={i} className="forma-pill forma-pill-empty" />
          const f = formaIcon(res)
          return (
            <div key={i} className={`forma-pill forma-pill-${f.icon.toLowerCase()}`}>
              {f.icon}
            </div>
          )
        })}
      </div>

      {/* PTS */}
      <div className="torneos-pts-num">{pts}</div>
    </div>
  )
}
