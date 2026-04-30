import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const CAT_LABELS = { 1: 'Top 14', 2: 'Primera A', 3: 'Primera B', 4: 'Primera C', 5: 'Segunda División' }
const CAT_CLASS = { 1: 'cat-top14', 2: 'cat-primera-a', 3: 'cat-primera-b', 4: 'cat-primera-c', 5: 'cat-segunda' }

export default function Admin() {
  const [seccion, setSeccion] = useState('semana')

  return (
    <div className="container">
      <h1 className="page-title">Panel de <span className="page-title-accent">administración</span></h1>
      <div className="tabs-box" style={{ flexWrap: 'wrap', marginBottom: 20 }}>
        <button className={`tab-btn ${seccion === 'semana' ? 'active' : ''}`} onClick={() => setSeccion('semana')}>📋 Esta semana</button>
        <button className={`tab-btn ${seccion === 'fechas' ? 'active' : ''}`} onClick={() => setSeccion('fechas')}>📅 Fechas</button>
        <button className={`tab-btn ${seccion === 'equipos' ? 'active' : ''}`} onClick={() => setSeccion('equipos')}>🛡️ Equipos</button>
        <button className={`tab-btn ${seccion === 'usuarios' ? 'active' : ''}`} onClick={() => setSeccion('usuarios')}>👥 Usuarios</button>
        <button className={`tab-btn ${seccion === 'grupos' ? 'active' : ''}`} onClick={() => setSeccion('grupos')}>🏆 Grupos</button>
        <button className={`tab-btn ${seccion === 'stats' ? 'active' : ''}`} onClick={() => setSeccion('stats')}>📊 Stats</button>
      </div>
      {seccion === 'semana' && <AdminSemana />}
      {seccion === 'fechas' && <AdminFechas />}
      {seccion === 'equipos' && <AdminEquipos />}
      {seccion === 'usuarios' && <AdminUsuarios />}
      {seccion === 'grupos' && <AdminGrupos />}
      {seccion === 'stats' && <AdminStats />}
    </div>
  )
}

// ─────────────────────────────────────────────
// ESTA SEMANA
// ─────────────────────────────────────────────

function AdminSemana() {
  const [catAbierta, setCatAbierta] = useState(null)
  const [fechasActivas, setFechasActivas] = useState([])
  const [fechasProximas, setFechasProximas] = useState([])
  const [equipos, setEquipos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setLoading(true)
    const [{ data: activas }, { data: proximas }, { data: eqs }] = await Promise.all([
      supabase.from('fechas').select('*, categorias(nombre)')
        .eq('activa', true).eq('resultados_cargados', false)
        .order('categoria_id').order('numero'),
      supabase.from('fechas').select('*, categorias(nombre)')
        .eq('activa', false).eq('resultados_cargados', false)
        .order('categoria_id').order('numero')
        .limit(50),
      supabase.from('equipos').select('*').order('nombre')
    ])
    setFechasActivas(activas || [])
    setFechasProximas(proximas || [])
    setEquipos(eqs || [])
    setLoading(false)
  }

  if (loading) return <div className="loading"><div className="spinner"></div> Cargando...</div>

  return (
    <div>
      {[1,2,3,4,5].map(cat => {
        const activas = fechasActivas.filter(f => f.categoria_id === cat)
        const proximas = fechasProximas.filter(f => f.categoria_id === cat)
        const estaAbierto = catAbierta === cat
        return (
          <div key={cat} className="card" style={{ marginBottom: 10, padding: 0, overflow: 'hidden' }}>
            <button
              onClick={() => setCatAbierta(estaAbierto ? null : cat)}
              style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', textAlign: 'left' }}
            >
              <span className={`cat-badge ${CAT_CLASS[cat]}`}>{CAT_LABELS[cat]}</span>
              {activas.length > 0 && (
                <span style={{ fontSize: 11, background: '#16a34a', color: 'white', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>
                  ● {activas.length} activa{activas.length > 1 ? 's' : ''}
                </span>
              )}
              {proximas.length > 0 && activas.length === 0 && (
                <span style={{ fontSize: 11, color: 'var(--texto-suave)' }}>{proximas.length} pendiente{proximas.length > 1 ? 's' : ''}</span>
              )}
              {activas.length === 0 && proximas.length === 0 && (
                <span style={{ fontSize: 11, color: 'var(--texto-suave)' }}>sin fechas</span>
              )}
              <span style={{ marginLeft: 'auto', color: 'var(--dorado)', fontSize: 20, transition: 'transform 0.2s', transform: estaAbierto ? 'rotate(90deg)' : 'none' }}>›</span>
            </button>
            {estaAbierto && (
              <div style={{ borderTop: '1px solid var(--gris-borde)', padding: '8px 12px 12px' }}>
                {activas.length === 0 && proximas.length === 0 && (
                  <p style={{ fontSize: 13, color: 'var(--texto-suave)', margin: '8px 0 0' }}>No hay fechas activas ni próximas para este torneo.</p>
                )}
                {activas.map(fecha => (
                  <FechaActiva key={fecha.id} fecha={fecha} equipos={equipos} onRefresh={cargar} />
                ))}
                {proximas.length > 0 && (
                  <div style={{ marginTop: activas.length > 0 ? 12 : 4 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--texto-suave)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                      Próximas (inactivas)
                    </div>
                    {proximas.map(f => (
                      <div key={f.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: 'var(--gris)', borderRadius: 8, marginBottom: 6, gap: 8, flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 600, fontSize: 14 }}>Fecha {f.numero}</span>
                          {f.fecha_partido && <span style={{ fontSize: 12, color: 'var(--texto-suave)' }}>{f.fecha_partido}</span>}
                        </div>
                        <button className="btn btn-primary btn-small" onClick={async () => {
                          await supabase.from('fechas').update({ activa: true }).eq('id', f.id)
                          cargar()
                        }}>Activar</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function FechaActiva({ fecha, equipos, onRefresh }) {
  const [partidos, setPartidos] = useState([])
  const [resultados, setResultados] = useState({})
  const [mostrarForm, setMostrarForm] = useState(false)
  const [mostrarResultados, setMostrarResultados] = useState(false)
  const [form, setForm] = useState({ local: '', visitante: '', hora: '', especial: false })
  const [guardando, setGuardando] = useState(false)
  const [msg, setMsg] = useState('')
  const [editandoPartido, setEditandoPartido] = useState(null)
  const [editForm, setEditForm] = useState({ local: '', visitante: '' })

  useEffect(() => { cargarPartidos() }, [fecha.id])

  async function cargarPartidos() {
    const { data } = await supabase.from('partidos')
      .select('*, equipo_local:equipo_local_id(id,nombre), equipo_visitante:equipo_visitante_id(id,nombre)')
      .eq('fecha_id', fecha.id).order('id')
    setPartidos(data || [])
    const res = {}
    data?.forEach(p => {
      if (p.resultado_local !== null) res[p.id] = { local: p.resultado_local, visitante: p.resultado_visitante }
    })
    setResultados(res)
  }

  const equiposCat = equipos.filter(e => e.categoria_id === fecha.categoria_id)

  function flash(texto) {
    setMsg(texto)
    setTimeout(() => setMsg(''), 3000)
  }

  async function agregarPartido() {
    if (!form.local || !form.visitante || form.local === form.visitante) { flash('Seleccioná dos equipos distintos'); return }
    const { error } = await supabase.from('partidos').insert({
      fecha_id: fecha.id,
      equipo_local_id: parseInt(form.local),
      equipo_visitante_id: parseInt(form.visitante),
      hora_estimada: form.hora || null,
      es_especial: form.especial
    })
    if (!error) {
      flash('✓ Partido agregado')
      setForm({ local: '', visitante: '', hora: '', especial: false })
      setMostrarForm(false)
      cargarPartidos()
    } else {
      flash('Error: ' + error.message)
    }
  }

  async function eliminarPartido(id) {
    if (!confirm('¿Eliminar este partido?')) return
    await supabase.from('partidos').delete().eq('id', id)
    cargarPartidos()
  }

  async function toggleEspecial(p) {
    await supabase.from('partidos').update({ es_especial: !p.es_especial }).eq('id', p.id)
    cargarPartidos()
  }

  async function guardarResultados() {
    setGuardando(true); setMsg('')
    await Promise.all(
      Object.entries(resultados)
        .filter(([, res]) => res.local !== undefined && res.visitante !== undefined)
        .map(([pid, res]) => supabase.from('partidos').update({
          resultado_local: parseInt(res.local),
          resultado_visitante: parseInt(res.visitante),
          jugado: true
        }).eq('id', pid))
    )
    await supabase.from('fechas').update({ resultados_cargados: true }).eq('id', fecha.id)
    const { error } = await supabase.rpc('calcular_puntos_fecha', { p_fecha_id: fecha.id })
    if (!error) flash('✓ Resultados guardados y puntos calculados')
    else flash('Resultados guardados. Error al calcular: ' + error.message)
    setGuardando(false)
    onRefresh()
  }

  async function notificar() {
    flash('Enviando notificaciones...')
    try {
      const { data, error } = await supabase.functions.invoke('send-notification', {
        body: { tipo: 'resultados', mensaje_extra: '¡Ya están los resultados! Entrá a ver tus puntos.' }
      })
      if (!error) flash(`✓ Notificaciones enviadas a ${data?.enviadas || 0} usuarios`)
      else flash('Error al enviar notificaciones')
    } catch (e) { flash('Error: ' + e.message) }
  }

  async function desactivar() {
    if (!confirm('¿Desactivar esta fecha?')) return
    await supabase.from('fechas').update({ activa: false }).eq('id', fecha.id)
    onRefresh()
  }

  return (
    <div className="card" style={{ marginBottom: 12 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span className={`cat-badge ${CAT_CLASS[fecha.categoria_id]}`}>{CAT_LABELS[fecha.categoria_id]}</span>
          <span style={{ fontWeight: 700, fontSize: 16 }}>Fecha {fecha.numero}</span>
          {fecha.fecha_partido && (
            <span style={{ fontSize: 13, color: 'var(--texto-suave)' }}>
              {new Date(fecha.fecha_partido + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })}
            </span>
          )}
          <span className="cierre-badge cierre-abierto">● Activa</span>
        </div>
        <button className="btn btn-small btn-secondary" onClick={desactivar}>Desactivar</button>
      </div>

      {msg && <div className={`alert ${msg.startsWith('Error') ? 'alert-error' : 'alert-success'}`} style={{ marginBottom: 8 }}>{msg}</div>}

      {/* Lista de partidos */}
      {partidos.length === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--texto-suave)', margin: '0 0 10px' }}>Sin partidos cargados aún.</p>
      ) : (
        <div style={{ marginBottom: 10 }}>
          {partidos.map(p => (
            <div key={p.id}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: editandoPartido === p.id ? 'none' : '1px solid var(--gris-borde)', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
                  {p.es_especial && <span title="Especial" style={{ flexShrink: 0 }}>⭐</span>}
                  <span style={{ fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.equipo_local?.nombre} <span style={{ color: 'var(--texto-suave)', fontSize: 12 }}>vs</span> {p.equipo_visitante?.nombre}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button className="btn btn-small btn-secondary" onClick={() => toggleEspecial(p)} title={p.es_especial ? 'Quitar especial' : 'Marcar especial'}>
                    {p.es_especial ? '★' : '☆'}
                  </button>
                  <button className="btn btn-small btn-secondary" title="Editar equipos" onClick={() => {
                    setEditandoPartido(editandoPartido === p.id ? null : p.id)
                    setEditForm({ local: String(p.equipo_local_id), visitante: String(p.equipo_visitante_id) })
                  }}>✏️</button>
                  <button className="btn btn-small btn-danger" onClick={() => eliminarPartido(p.id)}>×</button>
                </div>
              </div>
              {editandoPartido === p.id && (
                <div style={{ padding: '8px 0 10px', borderBottom: '1px solid var(--gris-borde)', background: 'rgba(201,162,39,0.04)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8, alignItems: 'end' }}>
                    <select className="form-select" style={{ fontSize: 13 }} value={editForm.local} onChange={e => setEditForm(f => ({ ...f, local: e.target.value }))}>
                      {equiposCat.map(e => <option key={e.id} value={String(e.id)}>{e.nombre}</option>)}
                    </select>
                    <select className="form-select" style={{ fontSize: 13 }} value={editForm.visitante} onChange={e => setEditForm(f => ({ ...f, visitante: e.target.value }))}>
                      {equiposCat.map(e => <option key={e.id} value={String(e.id)}>{e.nombre}</option>)}
                    </select>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-primary btn-small" onClick={async () => {
                        if (editForm.local === editForm.visitante) { flash('Equipos deben ser distintos'); return }
                        await supabase.from('partidos').update({
                          equipo_local_id: parseInt(editForm.local),
                          equipo_visitante_id: parseInt(editForm.visitante)
                        }).eq('id', p.id)
                        setEditandoPartido(null)
                        cargarPartidos()
                      }}>✓</button>
                      <button className="btn btn-secondary btn-small" onClick={() => setEditandoPartido(null)}>✕</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Agregar partido */}
      {!mostrarForm ? (
        <button className="btn btn-secondary btn-small" onClick={() => setMostrarForm(true)}>➕ Agregar partido</button>
      ) : (
        <div style={{ background: 'var(--gris)', borderRadius: 8, padding: 12, marginBottom: 4 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Local</label>
              <select className="form-select" value={form.local} onChange={e => setForm({ ...form, local: e.target.value })}>
                <option value="">— Local —</option>
                {equiposCat.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Visitante</label>
              <select className="form-select" value={form.visitante} onChange={e => setForm({ ...form, visitante: e.target.value })}>
                <option value="">— Visitante —</option>
                {equiposCat.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <input type="checkbox" id={`especial-${fecha.id}`} checked={form.especial} onChange={e => setForm({ ...form, especial: e.target.checked })} style={{ width: 16, height: 16 }} />
            <label htmlFor={`especial-${fecha.id}`} style={{ fontSize: 13, cursor: 'pointer', color: 'var(--dorado-oscuro)', fontWeight: 600 }}>⭐ Partido especial (puntaje doble)</label>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary btn-small" onClick={agregarPartido}>Guardar</button>
            <button className="btn btn-secondary btn-small" onClick={() => { setMostrarForm(false); setForm({ local: '', visitante: '', hora: '', especial: false }) }}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Resultados */}
      {partidos.length > 0 && (
        <div style={{ borderTop: '1px solid var(--gris-borde)', marginTop: 12, paddingTop: 12 }}>
          <button
            className={`btn btn-small ${mostrarResultados ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setMostrarResultados(!mostrarResultados)}
          >
            {mostrarResultados ? '▲ Ocultar resultados' : '✏️ Cargar resultados'}
          </button>

          {mostrarResultados && (
            <div style={{ marginTop: 12 }}>
              {partidos.map(p => (
                <div key={p.id} className="partido-card" style={{ marginBottom: 8 }}>
                  <div className="partido-fila">
                    <div className="equipo-lado local">
                      <span className="equipo-nombre">{p.equipo_local?.nombre}</span>
                    </div>
                    <div className="marcador-central">
                      <div className="vs-badge">VS</div>
                    </div>
                    <div className="equipo-lado visitante">
                      <span className="equipo-nombre">{p.equipo_visitante?.nombre}</span>
                    </div>
                  </div>
                  <div className="prediccion-inputs">
                    <input type="text" inputMode="numeric" pattern="[0-9]*" className="score-input"
                      value={resultados[p.id]?.local ?? ''} placeholder="0"
                      onChange={e => setResultados(prev => ({ ...prev, [p.id]: { ...prev[p.id], local: e.target.value.replace(/\D/g, '') } }))} />
                    <span className="score-separator">—</span>
                    <input type="text" inputMode="numeric" pattern="[0-9]*" className="score-input"
                      value={resultados[p.id]?.visitante ?? ''} placeholder="0"
                      onChange={e => setResultados(prev => ({ ...prev, [p.id]: { ...prev[p.id], visitante: e.target.value.replace(/\D/g, '') } }))} />
                  </div>
                </div>
              ))}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                <button className="btn btn-primary" style={{ width: '100%' }} onClick={guardarResultados} disabled={guardando}>
                  {guardando ? 'Calculando...' : 'Guardar resultados y calcular puntos'}
                </button>
                <button className="btn btn-gold" style={{ width: '100%' }} onClick={notificar}>
                  🔔 Notificar a todos los usuarios
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// FECHAS
// ─────────────────────────────────────────────

function calcularCierreDefault(fechaPartido) {
  if (!fechaPartido) return ''
  const partes = fechaPartido.split('-')
  const viernes = new Date(parseInt(partes[0]), parseInt(partes[1]) - 1, parseInt(partes[2]))
  viernes.setDate(viernes.getDate() - 1)
  const y = viernes.getFullYear()
  const m = String(viernes.getMonth() + 1).padStart(2, '0')
  const d = String(viernes.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}T23:59`
}

function AdminFechas() {
  const [fechas, setFechas] = useState([])
  const [form, setForm] = useState({ categoria_id: 1, numero: '', fecha_partido: '', cierre: '', activar: true })
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [mostrarBulk, setMostrarBulk] = useState(false)
  const [filasbulk, setFilasBulk] = useState([{ numero: '', fecha_partido: '' }])
  const [catBulk, setCatBulk] = useState(1)
  const [loadingBulk, setLoadingBulk] = useState(false)
  const [msgBulk, setMsgBulk] = useState('')
  const [catAbierta, setCatAbierta] = useState(null)

  useEffect(() => { cargar() }, [])

  async function cargar() {
    const { data } = await supabase.from('fechas').select('*, categorias(nombre)').order('categoria_id').order('numero')
    setFechas(data || [])
  }

  function onChangeFechaPartido(val) {
    setForm(f => ({ ...f, fecha_partido: val, cierre: calcularCierreDefault(val) }))
  }

  async function guardar() {
    if (!form.numero) { setMsg('Error: ingresá el número de fecha'); return }
    setLoading(true)
    const cierre = form.cierre ? new Date(form.cierre).toISOString() : null
    const { error } = await supabase.from('fechas').insert({
      categoria_id: parseInt(form.categoria_id), numero: parseInt(form.numero),
      temporada_id: 1, fecha_partido: form.fecha_partido || null,
      cierre_predicciones: cierre, activa: form.activar
    })
    if (!error) { setMsg('✓ Fecha creada'); cargar(); setForm({ ...form, numero: '', fecha_partido: '', cierre: '' }) }
    else setMsg('Error: ' + error.message)
    setLoading(false)
  }

  async function toggleActiva(fecha) {
    await supabase.from('fechas').update({ activa: !fecha.activa }).eq('id', fecha.id)
    cargar()
  }

  function agregarFila() { setFilasBulk(prev => [...prev, { numero: '', fecha_partido: '' }]) }
  function eliminarFila(i) { setFilasBulk(prev => prev.filter((_, idx) => idx !== i)) }
  function actualizarFila(i, campo, val) { setFilasBulk(prev => prev.map((f, idx) => idx === i ? { ...f, [campo]: val } : f)) }

  async function crearTodas() {
    const validas = filasbulk.filter(f => f.numero && f.fecha_partido)
    if (!validas.length) { setMsgBulk('Error: completá al menos una fila'); return }
    setLoadingBulk(true); setMsgBulk('')
    const inserts = validas.map(f => ({
      categoria_id: parseInt(catBulk), numero: parseInt(f.numero), temporada_id: 1,
      fecha_partido: f.fecha_partido,
      cierre_predicciones: calcularCierreDefault(f.fecha_partido) ? new Date(calcularCierreDefault(f.fecha_partido)).toISOString() : null,
      activa: false
    }))
    const { error } = await supabase.from('fechas').insert(inserts)
    if (!error) { setMsgBulk(`✓ ${inserts.length} fechas creadas como inactivas`); setFilasBulk([{ numero: '', fecha_partido: '' }]); cargar() }
    else setMsgBulk('Error: ' + error.message)
    setLoadingBulk(false)
  }

  return (
    <div>
      {/* Nueva fecha */}
      <div className="card">
        <div className="card-header"><span className="card-title">Nueva fecha</span></div>
        {msg && <div className={`alert ${msg.startsWith('Error') ? 'alert-error' : 'alert-success'}`}>{msg}</div>}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="form-group">
            <label className="form-label">Categoría</label>
            <select className="form-select" value={form.categoria_id} onChange={e => setForm({ ...form, categoria_id: e.target.value })}>
              {[1, 2, 3, 4, 5].map(c => <option key={c} value={c}>{CAT_LABELS[c]}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Número de fecha</label>
            <input className="form-input" type="number" value={form.numero} onChange={e => setForm({ ...form, numero: e.target.value })} placeholder="ej: 1" />
          </div>
          <div className="form-group">
            <label className="form-label">Fecha del partido</label>
            <input className="form-input" type="date" value={form.fecha_partido} onChange={e => onChangeFechaPartido(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Cierre de predicciones</label>
            <input className="form-input" type="datetime-local" value={form.cierre} onChange={e => setForm({ ...form, cierre: e.target.value })} />
            <span style={{ fontSize: 11, color: 'var(--texto-suave)' }}>Auto al elegir fecha. Editalo si querés.</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, marginTop: 4 }}>
          <input type="checkbox" id="activar" checked={form.activar} onChange={e => setForm({ ...form, activar: e.target.checked })} style={{ width: 16, height: 16, cursor: 'pointer' }} />
          <label htmlFor="activar" style={{ fontSize: 14, cursor: 'pointer' }}>Activar inmediatamente</label>
        </div>
        <button className="btn btn-primary" onClick={guardar} disabled={loading}>Crear fecha</button>
      </div>

      {/* Carga masiva (colapsada) */}
      <div className="card">
        <button
          onClick={() => setMostrarBulk(!mostrarBulk)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: 0, textAlign: 'left' }}
        >
          <span className="card-title">📦 Carga masiva de fechas</span>
          <span style={{ marginLeft: 'auto', fontSize: 18, color: 'var(--dorado)', transition: 'transform 0.2s', transform: mostrarBulk ? 'rotate(90deg)' : 'none' }}>›</span>
        </button>
        {!mostrarBulk && (
          <p style={{ fontSize: 12, color: 'var(--texto-suave)', marginTop: 6, marginBottom: 0 }}>
            Cargá todas las fechas del torneo de una vez como inactivas.
          </p>
        )}
        {mostrarBulk && (
          <div style={{ marginTop: 14 }}>
            {msgBulk && <div className={`alert ${msgBulk.startsWith('Error') ? 'alert-error' : 'alert-success'}`}>{msgBulk}</div>}
            <div className="form-group">
              <label className="form-label">Categoría</label>
              <select className="form-select" value={catBulk} onChange={e => setCatBulk(e.target.value)} style={{ maxWidth: 200 }}>
                {[1, 2, 3, 4, 5].map(c => <option key={c} value={c}>{CAT_LABELS[c]}</option>)}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 32px', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--texto-suave)', textTransform: 'uppercase' }}>Nº</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--texto-suave)', textTransform: 'uppercase' }}>Fecha del partido</span>
              <span></span>
            </div>
            {filasbulk.map((fila, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 32px', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                <input className="form-input" type="number" placeholder="5" value={fila.numero} onChange={e => actualizarFila(i, 'numero', e.target.value)} style={{ padding: '8px 10px' }} />
                <input className="form-input" type="date" value={fila.fecha_partido} onChange={e => actualizarFila(i, 'fecha_partido', e.target.value)} style={{ padding: '8px 10px' }} />
                <button onClick={() => eliminarFila(i)} disabled={filasbulk.length === 1}
                  style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--rojo)', opacity: filasbulk.length === 1 ? 0.3 : 1 }}>×</button>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button className="btn btn-secondary btn-small" onClick={agregarFila}>+ Fila</button>
              <button className="btn btn-primary" onClick={crearTodas} disabled={loadingBulk}>
                {loadingBulk ? 'Creando...' : `Crear ${filasbulk.filter(f => f.numero && f.fecha_partido).length || ''} fechas (inactivas)`}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Lista de fechas por torneo (acordeones) */}
      {[1,2,3,4,5].map(cat => {
        const lista = fechas.filter(f => f.categoria_id === cat)
        const estaAbierto = catAbierta === cat
        return (
          <div key={cat} className="card" style={{ marginBottom: 10, padding: 0, overflow: 'hidden' }}>
            <button
              onClick={() => setCatAbierta(estaAbierto ? null : cat)}
              style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', textAlign: 'left' }}
            >
              <span className={`cat-badge ${CAT_CLASS[cat]}`}>{CAT_LABELS[cat]}</span>
              <span style={{ fontSize: 13, color: 'var(--texto-suave)' }}>{lista.length} fecha{lista.length !== 1 ? 's' : ''}</span>
              <span style={{ marginLeft: 'auto', color: 'var(--dorado)', fontSize: 20, transition: 'transform 0.2s', transform: estaAbierto ? 'rotate(90deg)' : 'none' }}>›</span>
            </button>
            {estaAbierto && (
              lista.length === 0
                ? <div style={{ padding: '12px 16px', fontSize: 13, color: 'var(--texto-suave)', borderTop: '1px solid var(--gris-borde)' }}>No hay fechas para este torneo.</div>
                : <div style={{ borderTop: '1px solid var(--gris-borde)' }}>
                    {lista.map(f => <FilaFecha key={f.id} f={f} onToggle={() => toggleActiva(f)} onRefresh={cargar} />)}
                  </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function FilaFecha({ f, onToggle, onRefresh }) {
  const [editando, setEditando] = useState(false)
  const [editFecha, setEditFecha] = useState(f.fecha_partido || '')
  const [editCierre, setEditCierre] = useState(
    f.cierre_predicciones ? f.cierre_predicciones.slice(0, 16) : ''
  )
  const [guardando, setGuardando] = useState(false)

  async function guardarEdicion() {
    setGuardando(true)
    const cierre = editCierre ? new Date(editCierre).toISOString() : null
    await supabase.from('fechas').update({
      fecha_partido: editFecha || null,
      cierre_predicciones: cierre
    }).eq('id', f.id)
    setGuardando(false)
    setEditando(false)
    onRefresh()
  }

  return (
    <div style={{ borderBottom: '1px solid var(--gris-borde)', opacity: f.activa ? 1 : 0.6 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', flex: 1, minWidth: 0 }}>
          <span className={`cat-badge ${CAT_CLASS[f.categoria_id]}`}>{CAT_LABELS[f.categoria_id]}</span>
          <span style={{ fontWeight: 600, fontSize: 14 }}>Fecha {f.numero}</span>
          {f.fecha_partido && <span style={{ fontSize: 12, color: 'var(--texto-suave)' }}>{f.fecha_partido}</span>}
          {!f.activa && <span style={{ fontSize: 11, background: 'var(--gris-borde)', color: 'var(--texto-suave)', padding: '1px 6px', borderRadius: 20 }}>inactiva</span>}
          {f.resultados_cargados && <span className="cierre-badge cierre-abierto" style={{ fontSize: 11 }}>✓ Resultados</span>}
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <button className="btn btn-small btn-secondary" onClick={() => setEditando(!editando)}>✏️</button>
          <button className={`btn btn-small ${f.activa ? 'btn-secondary' : 'btn-primary'}`} onClick={onToggle}>
            {f.activa ? 'Desactivar' : 'Activar'}
          </button>
        </div>
      </div>
      {editando && (
        <div style={{ padding: '0 16px 12px', display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 10, alignItems: 'end', background: 'rgba(201,162,39,0.04)' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Fecha del partido</label>
            <input className="form-input" type="date" value={editFecha} onChange={e => setEditFecha(e.target.value)} />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Cierre predicciones</label>
            <input className="form-input" type="datetime-local" value={editCierre} onChange={e => setEditCierre(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-primary btn-small" onClick={guardarEdicion} disabled={guardando}>
              {guardando ? '...' : '✓'}
            </button>
            <button className="btn btn-secondary btn-small" onClick={() => setEditando(false)}>✕</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// EQUIPOS
// ─────────────────────────────────────────────

function AdminEquipos() {
  const [equipos, setEquipos] = useState([])
  const [form, setForm] = useState({ nombre: '', nombre_corto: '', categoria_id: 2 })
  const [msg, setMsg] = useState('')

  useEffect(() => { cargar() }, [])

  async function cargar() {
    const { data } = await supabase.from('equipos').select('*, categorias(nombre)').order('categoria_id').order('nombre')
    setEquipos(data || [])
  }

  async function guardar() {
    const { error } = await supabase.from('equipos').insert({ nombre: form.nombre, nombre_corto: form.nombre_corto.toUpperCase(), categoria_id: parseInt(form.categoria_id) })
    if (!error) { setMsg('✓ Equipo agregado'); cargar(); setForm({ ...form, nombre: '', nombre_corto: '' }) }
    else setMsg('Error: ' + error.message)
  }

  const porCategoria = [1, 2, 3, 4, 5].map(cat => ({ cat, equipos: equipos.filter(e => e.categoria_id === cat) }))

  return (
    <div>
      <div className="card">
        <div className="card-header"><span className="card-title">Agregar equipo</span></div>
        {msg && <div className={`alert ${msg.startsWith('Error') ? 'alert-error' : 'alert-success'}`}>{msg}</div>}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12 }}>
          <div className="form-group">
            <label className="form-label">Nombre</label>
            <input className="form-input" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="ej: Olivos RC" />
          </div>
          <div className="form-group">
            <label className="form-label">Abreviatura</label>
            <input className="form-input" value={form.nombre_corto} onChange={e => setForm({ ...form, nombre_corto: e.target.value })} placeholder="ej: OLI" maxLength={5} />
          </div>
          <div className="form-group">
            <label className="form-label">Categoría</label>
            <select className="form-select" value={form.categoria_id} onChange={e => setForm({ ...form, categoria_id: e.target.value })}>
              {[2, 3, 4, 5].map(c => <option key={c} value={c}>{CAT_LABELS[c]}</option>)}
            </select>
          </div>
        </div>
        <button className="btn btn-primary" onClick={guardar}>Agregar equipo</button>
      </div>
      {porCategoria.map(({ cat, equipos: lista }) => lista.length > 0 && (
        <div key={cat} className="card" style={{ padding: 0 }}>
          <div style={{ padding: '10px 16px', background: 'var(--gris)', borderRadius: 'var(--radio) var(--radio) 0 0' }}>
            <span className="card-title">{CAT_LABELS[cat]} ({lista.length} equipos)</span>
          </div>
          {lista.map(e => (
            <div key={e.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid var(--gris-borde)' }}>
              <span>{e.nombre}</span>
              <span style={{ fontSize: 12, color: 'var(--texto-suave)' }}>{e.nombre_corto}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────
// USUARIOS
// ─────────────────────────────────────────────

function AdminUsuarios() {
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [expandido, setExpandido] = useState(null)
  const [msg, setMsg] = useState('')

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setLoading(true)
    const { data } = await supabase.from('perfiles')
      .select('id, username, nombre_completo, club, es_admin, created_at, avatar_url')
      .order('created_at', { ascending: false })
    setUsuarios(data || [])
    setLoading(false)
  }

  async function toggleAdmin(usuario) {
    if (!confirm(`¿${usuario.es_admin ? 'Quitar' : 'Dar'} permisos de admin a ${usuario.username}?`)) return
    const { error } = await supabase.from('perfiles').update({ es_admin: !usuario.es_admin }).eq('id', usuario.id)
    if (!error) { setMsg('✓ Permisos actualizados'); setExpandido(null); cargar() }
    else setMsg('Error: ' + error.message)
    setTimeout(() => setMsg(''), 3000)
  }

  const filtrados = usuarios.filter(u =>
    u.username?.toLowerCase().includes(busqueda.toLowerCase()) ||
    u.nombre_completo?.toLowerCase().includes(busqueda.toLowerCase()) ||
    u.club?.toLowerCase().includes(busqueda.toLowerCase())
  )

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <span className="card-title">👥 Usuarios</span>
          <span style={{ fontSize: 13, color: 'var(--texto-suave)', fontWeight: 600 }}>{usuarios.length} total</span>
        </div>
        {msg && <div className="alert alert-success">{msg}</div>}
        <input className="form-input" placeholder="Buscar por usuario, nombre o club..." value={busqueda} onChange={e => { setBusqueda(e.target.value); setExpandido(null) }} />
      </div>

      {loading && <div className="loading"><div className="spinner"></div></div>}

      {!loading && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {filtrados.length === 0 && <div style={{ padding: 24, textAlign: 'center', color: 'var(--texto-suave)' }}>Sin resultados</div>}
          {filtrados.map(u => (
            <div key={u.id}>
              <div
                onClick={() => setExpandido(expandido === u.id ? null : u.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                  borderBottom: expandido === u.id ? 'none' : '1px solid var(--gris-borde)',
                  cursor: 'pointer', transition: 'background 0.15s',
                  background: expandido === u.id ? 'rgba(201,162,39,0.08)' : u.es_admin ? 'rgba(201,162,39,0.04)' : 'white'
                }}
              >
                <div className="avatar-circle" style={{ width: 36, height: 36, fontSize: 13, flexShrink: 0 }}>
                  {u.avatar_url
                    ? <img src={u.avatar_url} alt={u.username} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                    : u.username?.[0]?.toUpperCase() || '?'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    {u.username}
                    {u.es_admin && <span style={{ fontSize: 10, background: 'var(--dorado)', color: 'var(--azul)', padding: '1px 6px', borderRadius: 20, fontWeight: 700 }}>ADMIN</span>}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--texto-suave)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {[u.nombre_completo, u.club].filter(Boolean).join(' · ') || '—'}
                  </div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--texto-suave)', flexShrink: 0 }}>
                  {u.created_at ? new Date(u.created_at).toLocaleDateString('es-AR') : '—'}
                </div>
                <div style={{ color: 'var(--dorado)', fontSize: 18, flexShrink: 0, transition: 'transform 0.2s', transform: expandido === u.id ? 'rotate(90deg)' : 'none' }}>›</div>
              </div>
              {expandido === u.id && (
                <div style={{
                  background: 'rgba(201,162,39,0.06)',
                  borderTop: '1px solid rgba(201,162,39,0.3)',
                  borderBottom: '1px solid var(--gris-borde)',
                  padding: '14px 16px',
                  display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap'
                }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--azul)', marginBottom: 2 }}>@{u.username}</div>
                    {u.nombre_completo && <div style={{ fontSize: 13, color: 'var(--texto)' }}>{u.nombre_completo}</div>}
                    {u.club && <div style={{ fontSize: 12, color: 'var(--texto-suave)' }}>{u.club}</div>}
                    <div style={{ fontSize: 11, color: 'var(--texto-suave)', marginTop: 4 }}>
                      Registrado: {u.created_at ? new Date(u.created_at).toLocaleDateString('es-AR') : '—'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button className={`btn btn-small ${u.es_admin ? 'btn-secondary' : 'btn-primary'}`} onClick={e => { e.stopPropagation(); toggleAdmin(u) }}>
                      {u.es_admin ? '🔓 Quitar admin' : '🔐 Dar admin'}
                    </button>
                    <button className="btn btn-small btn-secondary" onClick={e => { e.stopPropagation(); setExpandido(null) }}>Cerrar</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// GRUPOS
// ─────────────────────────────────────────────

function AdminGrupos() {
  const [grupos, setGrupos] = useState([])
  const [loading, setLoading] = useState(true)
  const [grupoAbierto, setGrupoAbierto] = useState(null)
  const [miembros, setMiembros] = useState([])
  const [msg, setMsg] = useState('')

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setLoading(true)
    const { data } = await supabase.from('grupos')
      .select('id, nombre, codigo, imagen_url, creador_id, created_at, perfiles(username)')
      .order('created_at', { ascending: false })
    setGrupos(data || [])
    setLoading(false)
  }

  async function verMiembros(grupo) {
    setGrupoAbierto(grupo)
    const { data } = await supabase.from('grupo_miembros')
      .select('usuario_id, joined_at, perfiles(username, club, avatar_url)')
      .eq('grupo_id', grupo.id).order('joined_at')
    setMiembros(data || [])
  }

  async function eliminarGrupo(id) {
    if (!confirm('¿Eliminar este grupo permanentemente?')) return
    await supabase.from('grupos').delete().eq('id', id)
    setGrupoAbierto(null); setMsg('✓ Grupo eliminado'); cargar()
    setTimeout(() => setMsg(''), 3000)
  }

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <span className="card-title">🏉 Grupos privados</span>
          <span style={{ fontSize: 13, color: 'var(--texto-suave)', fontWeight: 600 }}>{grupos.length} grupos</span>
        </div>
        {msg && <div className="alert alert-success">{msg}</div>}
      </div>

      {loading && <div className="loading"><div className="spinner"></div></div>}

      {grupoAbierto && (
        <div className="card" style={{ border: '2px solid var(--dorado)', marginBottom: 12 }}>
          <div className="card-header">
            <span className="card-title">👥 {grupoAbierto.nombre}</span>
            <button className="btn btn-small btn-secondary" onClick={() => setGrupoAbierto(null)}>← Volver</button>
          </div>
          <div style={{ fontSize: 13, color: 'var(--texto-suave)', marginBottom: 12 }}>
            Código: <strong style={{ color: 'var(--dorado-oscuro)', letterSpacing: 1 }}>{grupoAbierto.codigo}</strong>
            {' · '}Creado por: <strong>{grupoAbierto.perfiles?.username}</strong>
            {' · '}{miembros.length} miembros
          </div>
          {miembros.map(m => (
            <div key={m.usuario_id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--gris-borde)' }}>
              <div className="avatar-circle" style={{ width: 30, height: 30, fontSize: 11, flexShrink: 0 }}>
                {m.perfiles?.avatar_url
                  ? <img src={m.perfiles.avatar_url} alt={m.perfiles.username} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                  : m.perfiles?.username?.[0]?.toUpperCase() || '?'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{m.perfiles?.username}</div>
                {m.perfiles?.club && <div style={{ fontSize: 11, color: 'var(--texto-suave)' }}>{m.perfiles.club}</div>}
              </div>
              <div style={{ fontSize: 11, color: 'var(--texto-suave)' }}>{m.joined_at ? new Date(m.joined_at).toLocaleDateString('es-AR') : ''}</div>
            </div>
          ))}
          <div style={{ marginTop: 16 }}>
            <button className="btn btn-danger btn-small" onClick={() => eliminarGrupo(grupoAbierto.id)}>🗑️ Eliminar grupo</button>
          </div>
        </div>
      )}

      {!loading && !grupoAbierto && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {grupos.length === 0 && <div style={{ padding: 24, textAlign: 'center', color: 'var(--texto-suave)' }}>No hay grupos todavía</div>}
          {grupos.map(g => (
            <div key={g.id} onClick={() => verMiembros(g)}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid var(--gris-borde)', cursor: 'pointer', transition: 'background 0.15s' }}
            >
              <div style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', background: 'linear-gradient(135deg,var(--azul),var(--azul-medio))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, border: '2px solid var(--dorado)', flexShrink: 0 }}>
                {g.imagen_url ? <img src={g.imagen_url} alt={g.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🏉'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{g.nombre}</div>
                <div style={{ fontSize: 11, color: 'var(--texto-suave)' }}>
                  Por {g.perfiles?.username || '—'} · <strong style={{ color: 'var(--dorado-oscuro)' }}>{g.codigo}</strong>
                </div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--texto-suave)', flexShrink: 0 }}>{g.created_at ? new Date(g.created_at).toLocaleDateString('es-AR') : ''}</div>
              <div style={{ color: 'var(--dorado)', fontSize: 18, flexShrink: 0 }}>›</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// STATS
// ─────────────────────────────────────────────

function AdminStats() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setLoading(true)
    const [
      { count: totalUsuarios },
      { count: totalGrupos },
      { data: fechasActivas },
      { count: totalPredsHoy },
      { data: topFecha }
    ] = await Promise.all([
      supabase.from('perfiles').select('*', { count: 'exact', head: true }),
      supabase.from('grupos').select('*', { count: 'exact', head: true }),
      supabase.from('fechas').select('id, categoria_id, numero, fecha_partido').eq('activa', true).eq('resultados_cargados', false),
      supabase.from('predicciones').select('*', { count: 'exact', head: true })
        .gte('updated_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      supabase.from('puntos_fecha')
        .select('fecha_id, total_puntos, perfiles(username), fechas(categoria_id, numero)')
        .order('total_puntos', { ascending: false }).limit(100)
    ])
    // Dedup: máximo por fecha (el primero por orden desc es el más alto)
    const vistas = new Set()
    const topPorFecha = (topFecha || []).filter(p => {
      if (vistas.has(p.fecha_id)) return false
      vistas.add(p.fecha_id)
      return true
    }).slice(0, 10)
    setStats({ totalUsuarios, totalGrupos, fechasActivas: fechasActivas || [], totalPredsHoy, topFecha: topPorFecha })
    setLoading(false)
  }

  if (loading) return <div className="loading"><div className="spinner"></div></div>
  if (!stats) return null

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 16 }}>
        {[
          { v: stats.totalUsuarios, l: 'Usuarios', icon: '👥', color: 'var(--azul)' },
          { v: stats.totalGrupos,   l: 'Grupos',   icon: '🏉', color: 'var(--dorado-oscuro)' },
          { v: stats.fechasActivas.length, l: 'Fechas activas', icon: '📅', color: '#16a34a' },
          { v: stats.totalPredsHoy, l: 'Preds esta semana', icon: '✏️', color: 'var(--rojo-vivo)' },
        ].map((s, i) => (
          <div key={i} className="card" style={{ textAlign: 'center', padding: '16px 12px' }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>{s.icon}</div>
            <div style={{ fontFamily: 'Rajdhani,sans-serif', fontSize: 32, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.v ?? '—'}</div>
            <div style={{ fontSize: 11, color: 'var(--texto-suave)', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.l}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">📅 Fechas activas ahora</span></div>
        {stats.fechasActivas.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--texto-suave)' }}>Ninguna fecha activa en este momento.</p>
        ) : (
          stats.fechasActivas.map(f => (
            <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--gris-borde)' }}>
              <span className={`cat-badge ${CAT_CLASS[f.categoria_id]}`}>{CAT_LABELS[f.categoria_id]}</span>
              <span style={{ fontWeight: 600 }}>Fecha {f.numero}</span>
              {f.fecha_partido && <span style={{ fontSize: 12, color: 'var(--texto-suave)' }}>{f.fecha_partido}</span>}
            </div>
          ))
        )}
      </div>

      {stats.topFecha.length > 0 && (
        <div className="card">
          <div className="card-header"><span className="card-title">🏆 Top puntajes por fecha</span></div>
          {stats.topFecha.map((p, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--gris-borde)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 16, minWidth: 20 }}>{'🥇🥈🥉'[i] || `${i + 1}.`}</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{p.perfiles?.username || '—'}</div>
                  <div style={{ fontSize: 11, color: 'var(--texto-suave)', display: 'flex', alignItems: 'center', gap: 5, marginTop: 1 }}>
                    <span className={`cat-badge ${CAT_CLASS[p.fechas?.categoria_id]}`} style={{ fontSize: 9, padding: '1px 5px' }}>{CAT_LABELS[p.fechas?.categoria_id]}</span>
                    Fecha {p.fechas?.numero}
                  </div>
                </div>
              </div>
              <span style={{ fontFamily: 'Rajdhani,sans-serif', fontSize: 20, fontWeight: 700, color: 'var(--azul)' }}>
                {p.total_puntos} <span style={{ fontSize: 12, color: 'var(--texto-suave)', fontWeight: 400 }}>pts</span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
