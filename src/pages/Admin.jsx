import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const CAT_LABELS = { 1: 'Top 14', 2: 'Primera A', 3: 'Primera B', 4: 'Primera C', 5: 'Segunda División' }

export default function Admin() {
  const [seccion, setSeccion] = useState('fechas')

  return (
    <div className="container">
      <h1 className="page-title">Panel de administración</h1>
      <div className="tabs">
        <button className={`tab ${seccion === 'fechas' ? 'active' : ''}`} onClick={() => setSeccion('fechas')}>Fechas</button>
        <button className={`tab ${seccion === 'partidos' ? 'active' : ''}`} onClick={() => setSeccion('partidos')}>Partidos</button>
        <button className={`tab ${seccion === 'resultados' ? 'active' : ''}`} onClick={() => setSeccion('resultados')}>Cargar resultados</button>
        <button className={`tab ${seccion === 'equipos' ? 'active' : ''}`} onClick={() => setSeccion('equipos')}>Equipos</button>
      </div>
      {seccion === 'fechas' && <AdminFechas />}
      {seccion === 'partidos' && <AdminPartidos />}
      {seccion === 'resultados' && <AdminResultados />}
      {seccion === 'equipos' && <AdminEquipos />}
    </div>
  )
}

// ---- FECHAS ----
function AdminFechas() {
  const [fechas, setFechas] = useState([])
  const [form, setForm] = useState({ categoria_id: 1, numero: '', fecha_partido: '', cierre_predicciones: '' })
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => { cargar() }, [])

  async function cargar() {
    const { data } = await supabase.from('fechas').select('*, categorias(nombre)').order('categoria_id').order('numero')
    setFechas(data || [])
  }

  async function guardar() {
    setLoading(true)
    const cierre = form.fecha_partido
      ? new Date(form.fecha_partido + 'T23:59:00').toISOString().replace('T23:59:00.000Z', 'T02:59:00.000Z') // viernes 23:59 AR = sábado 02:59 UTC
      : null
    const { error } = await supabase.from('fechas').insert({
      categoria_id: parseInt(form.categoria_id),
      numero: parseInt(form.numero),
      temporada_id: 1,
      fecha_partido: form.fecha_partido || null,
      cierre_predicciones: cierre,
      activa: true
    })
    if (!error) { setMsg('Fecha creada'); cargar(); setForm({ ...form, numero: '' }) }
    else setMsg('Error: ' + error.message)
    setLoading(false)
  }

  async function toggleActiva(fecha) {
    await supabase.from('fechas').update({ activa: !fecha.activa }).eq('id', fecha.id)
    cargar()
  }

  return (
    <div>
      <div className="card">
        <div className="card-header"><span className="card-title">Nueva fecha</span></div>
        {msg && <div className={`alert ${msg.startsWith('Error') ? 'alert-error' : 'alert-success'}`}>{msg}</div>}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <div className="form-group">
            <label className="form-label">Categoría</label>
            <select className="form-select" value={form.categoria_id} onChange={e => setForm({...form, categoria_id: e.target.value})}>
              {[1,2,3,4,5].map(c => <option key={c} value={c}>{CAT_LABELS[c]}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Número de fecha</label>
            <input className="form-input" type="number" value={form.numero} onChange={e => setForm({...form, numero: e.target.value})} placeholder="ej: 1" />
          </div>
          <div className="form-group">
            <label className="form-label">Fecha del partido (sábado)</label>
            <input className="form-input" type="date" value={form.fecha_partido} onChange={e => setForm({...form, fecha_partido: e.target.value})} />
          </div>
        </div>
        <div style={{fontSize:12,color:'var(--texto-suave)',marginBottom:12}}>
          El cierre de predicciones se calcula automáticamente: viernes anterior a las 23:59
        </div>
        <button className="btn btn-primary" onClick={guardar} disabled={loading}>Crear fecha</button>
      </div>

      <div className="card" style={{padding:0}}>
        {fechas.map(f => (
          <div key={f.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 16px',borderBottom:'1px solid var(--gris-borde)'}}>
            <div>
              <span className="card-title">{f.categorias?.nombre} — Fecha {f.numero}</span>
              {f.fecha_partido && <span style={{marginLeft:8,fontSize:13,color:'var(--texto-suave)'}}>{f.fecha_partido}</span>}
            </div>
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              {f.resultados_cargados && <span className="cierre-badge cierre-abierto">Resultados OK</span>}
              <button className={`btn btn-small ${f.activa ? 'btn-secondary' : 'btn-primary'}`} onClick={() => toggleActiva(f)}>
                {f.activa ? 'Desactivar' : 'Activar'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---- PARTIDOS ----
function AdminPartidos() {
  const [fechas, setFechas] = useState([])
  const [equipos, setEquipos] = useState([])
  const [fechaId, setFechaId] = useState('')
  const [partidos, setPartidos] = useState([])
  const [form, setForm] = useState({ local: '', visitante: '', hora: '' })
  const [msg, setMsg] = useState('')

  useEffect(() => {
    supabase.from('fechas').select('*, categorias(nombre)').order('categoria_id').order('numero').then(({ data }) => setFechas(data || []))
    supabase.from('equipos').select('*').order('nombre').then(({ data }) => setEquipos(data || []))
  }, [])

  useEffect(() => { if (fechaId) cargarPartidos() }, [fechaId])

  async function cargarPartidos() {
    const { data } = await supabase.from('partidos')
      .select('*, equipo_local:equipo_local_id(nombre), equipo_visitante:equipo_visitante_id(nombre)')
      .eq('fecha_id', fechaId).order('id')
    setPartidos(data || [])
  }

  async function agregarPartido() {
    if (!form.local || !form.visitante || form.local === form.visitante) {
      setMsg('Seleccioná dos equipos distintos')
      return
    }
    const { error } = await supabase.from('partidos').insert({
      fecha_id: parseInt(fechaId),
      equipo_local_id: parseInt(form.local),
      equipo_visitante_id: parseInt(form.visitante),
      hora_estimada: form.hora || null
    })
    if (!error) { setMsg('Partido agregado'); cargarPartidos() }
    else setMsg('Error: ' + error.message)
  }

  async function eliminarPartido(id) {
    if (!confirm('¿Eliminar este partido?')) return
    await supabase.from('partidos').delete().eq('id', id)
    cargarPartidos()
  }

  const fechaSeleccionada = fechas.find(f => f.id === parseInt(fechaId))
  const equiposFiltrados = fechaSeleccionada
    ? equipos.filter(e => e.categoria_id === fechaSeleccionada.categoria_id)
    : equipos

  return (
    <div>
      <div className="card">
        <div className="card-header"><span className="card-title">Agregar partido</span></div>
        {msg && <div className={`alert ${msg.startsWith('Error') ? 'alert-error' : 'alert-success'}`}>{msg}</div>}
        <div className="form-group">
          <label className="form-label">Fecha</label>
          <select className="form-select" value={fechaId} onChange={e => setFechaId(e.target.value)}>
            <option value="">Seleccioná una fecha</option>
            {fechas.map(f => <option key={f.id} value={f.id}>{f.categorias?.nombre} — Fecha {f.numero} ({f.fecha_partido || 'sin fecha'})</option>)}
          </select>
        </div>
        {fechaId && (
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}}>
            <div className="form-group">
              <label className="form-label">Local</label>
              <select className="form-select" value={form.local} onChange={e => setForm({...form, local: e.target.value})}>
                <option value="">Equipo local</option>
                {equiposFiltrados.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Visitante</label>
              <select className="form-select" value={form.visitante} onChange={e => setForm({...form, visitante: e.target.value})}>
                <option value="">Equipo visitante</option>
                {equiposFiltrados.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Hora (opcional)</label>
              <input className="form-input" type="time" value={form.hora} onChange={e => setForm({...form, hora: e.target.value})} />
            </div>
          </div>
        )}
        {fechaId && <button className="btn btn-primary" onClick={agregarPartido}>Agregar partido</button>}
      </div>

      {partidos.length > 0 && (
        <div className="card" style={{padding:0}}>
          {partidos.map(p => (
            <div key={p.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 16px',borderBottom:'1px solid var(--gris-borde)'}}>
              <span style={{fontSize:14}}>{p.equipo_local?.nombre} vs {p.equipo_visitante?.nombre}</span>
              <button className="btn btn-small btn-danger" onClick={() => eliminarPartido(p.id)}>Eliminar</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ---- RESULTADOS ----
function AdminResultados() {
  const [fechas, setFechas] = useState([])
  const [fechaId, setFechaId] = useState('')
  const [partidos, setPartidos] = useState([])
  const [resultados, setResultados] = useState({})
  const [guardando, setGuardando] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    supabase.from('fechas').select('*, categorias(nombre)').order('categoria_id').order('numero').then(({ data }) => setFechas(data || []))
  }, [])

  useEffect(() => { if (fechaId) cargarPartidos() }, [fechaId])

  async function cargarPartidos() {
    const { data } = await supabase.from('partidos')
      .select('*, equipo_local:equipo_local_id(nombre), equipo_visitante:equipo_visitante_id(nombre)')
      .eq('fecha_id', fechaId).order('id')
    setPartidos(data || [])
    const res = {}
    data?.forEach(p => {
      if (p.resultado_local !== null) res[p.id] = { local: p.resultado_local, visitante: p.resultado_visitante }
    })
    setResultados(res)
  }

  async function guardarResultados() {
    setGuardando(true)
    setMsg('')
    for (const [pid, res] of Object.entries(resultados)) {
      if (res.local !== undefined && res.visitante !== undefined) {
        await supabase.from('partidos').update({
          resultado_local: parseInt(res.local),
          resultado_visitante: parseInt(res.visitante),
          jugado: true
        }).eq('id', pid)
      }
    }
    await supabase.from('fechas').update({ resultados_cargados: true }).eq('id', fechaId)
    const { error } = await supabase.rpc('calcular_puntos_fecha', { p_fecha_id: parseInt(fechaId) })
    if (!error) setMsg('Resultados guardados y puntos calculados correctamente')
    else setMsg('Resultados guardados. Error al calcular puntos: ' + error.message)
    setGuardando(false)
  }

  return (
    <div>
      <div className="card">
        <div className="card-header"><span className="card-title">Cargar resultados</span></div>
        {msg && <div className={`alert ${msg.includes('Error') ? 'alert-error' : 'alert-success'}`}>{msg}</div>}
        <div className="form-group">
          <label className="form-label">Fecha</label>
          <select className="form-select" value={fechaId} onChange={e => setFechaId(e.target.value)}>
            <option value="">Seleccioná una fecha</option>
            {fechas.map(f => <option key={f.id} value={f.id}>{f.categorias?.nombre} — Fecha {f.numero}</option>)}
          </select>
        </div>
      </div>

      {partidos.map(p => (
        <div key={p.id} className="partido-card">
          <div className="partido-equipos">
            <div className="equipo-nombre local">{p.equipo_local?.nombre}</div>
            <div className="vs-badge">vs</div>
            <div className="equipo-nombre visitante">{p.equipo_visitante?.nombre}</div>
          </div>
          <div className="prediccion-inputs">
            <input type="number" className="score-input" min="0" max="99"
              value={resultados[p.id]?.local ?? ''}
              placeholder="0"
              onChange={e => setResultados(prev => ({ ...prev, [p.id]: { ...prev[p.id], local: e.target.value }}))}
            />
            <span className="score-separator">-</span>
            <input type="number" className="score-input" min="0" max="99"
              value={resultados[p.id]?.visitante ?? ''}
              placeholder="0"
              onChange={e => setResultados(prev => ({ ...prev, [p.id]: { ...prev[p.id], visitante: e.target.value }}))}
            />
          </div>
        </div>
      ))}

      {partidos.length > 0 && (
        <button className="btn btn-primary" style={{width:'100%',padding:14}} onClick={guardarResultados} disabled={guardando}>
          {guardando ? 'Calculando puntos...' : 'Guardar resultados y calcular puntos'}
        </button>
      )}
    </div>
  )
}

// ---- EQUIPOS ----
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
    const { error } = await supabase.from('equipos').insert({
      nombre: form.nombre,
      nombre_corto: form.nombre_corto.toUpperCase(),
      categoria_id: parseInt(form.categoria_id)
    })
    if (!error) { setMsg('Equipo agregado'); cargar(); setForm({ ...form, nombre: '', nombre_corto: '' }) }
    else setMsg('Error: ' + error.message)
  }

  const porCategoria = [1,2,3,4,5].map(cat => ({
    cat,
    equipos: equipos.filter(e => e.categoria_id === cat)
  }))

  return (
    <div>
      <div className="card">
        <div className="card-header"><span className="card-title">Agregar equipo (Primera A, B, C)</span></div>
        {msg && <div className={`alert ${msg.startsWith('Error') ? 'alert-error' : 'alert-success'}`}>{msg}</div>}
        <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr',gap:12}}>
          <div className="form-group">
            <label className="form-label">Nombre</label>
            <input className="form-input" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} placeholder="ej: Olivos RC" />
          </div>
          <div className="form-group">
            <label className="form-label">Abreviatura</label>
            <input className="form-input" value={form.nombre_corto} onChange={e => setForm({...form, nombre_corto: e.target.value})} placeholder="ej: OLI" maxLength={5} />
          </div>
          <div className="form-group">
            <label className="form-label">Categoría</label>
            <select className="form-select" value={form.categoria_id} onChange={e => setForm({...form, categoria_id: e.target.value})}>
              {[2,3,4,5].map(c => <option key={c} value={c}>{CAT_LABELS[c]}</option>)}
            </select>
          </div>
        </div>
        <button className="btn btn-primary" onClick={guardar}>Agregar equipo</button>
      </div>

      {porCategoria.map(({ cat, equipos: lista }) => lista.length > 0 && (
        <div key={cat} className="card" style={{padding:0}}>
          <div style={{padding:'10px 16px',background:'var(--gris)',borderRadius:'var(--radio) var(--radio) 0 0'}}>
            <span className="card-title">{CAT_LABELS[cat]} ({lista.length} equipos)</span>
          </div>
          {lista.map(e => (
            <div key={e.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 16px',borderBottom:'1px solid var(--gris-borde)'}}>
              <span>{e.nombre}</span>
              <span style={{fontSize:12,color:'var(--texto-suave)'}}>{e.nombre_corto}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
