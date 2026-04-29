import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const CAT_LABELS = { 1: 'Top 14', 2: 'Primera A', 3: 'Primera B', 4: 'Primera C', 5: 'Segunda División' }

export default function Admin() {
  const [seccion, setSeccion] = useState('fechas')

  return (
    <div className="container">
      <h1 className="page-title">Panel de <span className="page-title-accent">administración</span></h1>
      <div className="tabs" style={{flexWrap:'wrap'}}>
        <button className={`tab ${seccion === 'fechas' ? 'active' : ''}`} onClick={() => setSeccion('fechas')}>Fechas</button>
        <button className={`tab ${seccion === 'partidos' ? 'active' : ''}`} onClick={() => setSeccion('partidos')}>Partidos</button>
        <button className={`tab ${seccion === 'resultados' ? 'active' : ''}`} onClick={() => setSeccion('resultados')}>Cargar resultados</button>
        <button className={`tab ${seccion === 'equipos' ? 'active' : ''}`} onClick={() => setSeccion('equipos')}>Equipos</button>
        <button className={`tab ${seccion === 'usuarios' ? 'active' : ''}`} onClick={() => setSeccion('usuarios')}>Usuarios</button>
        <button className={`tab ${seccion === 'grupos' ? 'active' : ''}`} onClick={() => setSeccion('grupos')}>Grupos</button>
      </div>
      {seccion === 'fechas' && <AdminFechas />}
      {seccion === 'partidos' && <AdminPartidos />}
      {seccion === 'resultados' && <AdminResultados />}
      {seccion === 'equipos' && <AdminEquipos />}
      {seccion === 'usuarios' && <AdminUsuarios />}
      {seccion === 'grupos' && <AdminGrupos />}
    </div>
  )
}

function AdminFechas() {
  const [fechas, setFechas] = useState([])
  const [form, setForm] = useState({ categoria_id: 1, numero: '', fecha_partido: '' })
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
      ? (() => {
          const partes = form.fecha_partido.split('-')
          const sabado = new Date(parseInt(partes[0]), parseInt(partes[1])-1, parseInt(partes[2]))
          const viernes = new Date(sabado)
          viernes.setDate(viernes.getDate() - 1)
          return new Date(viernes.getFullYear(), viernes.getMonth(), viernes.getDate(), 23, 59, 0)
            .toISOString().replace(/T\d{2}:\d{2}:\d{2}/, 'T02:59:00').replace(/\.\d{3}Z/, '.000Z')
        })()
      : null
    const { error } = await supabase.from('fechas').insert({
      categoria_id: parseInt(form.categoria_id), numero: parseInt(form.numero),
      temporada_id: 1, fecha_partido: form.fecha_partido || null,
      cierre_predicciones: cierre, activa: true
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
        <div style={{fontSize:12,color:'var(--texto-suave)',marginBottom:12}}>El cierre se calcula automáticamente: viernes anterior a las 23:59</div>
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

function AdminPartidos() {
  const [fechas, setFechas] = useState([])
  const [equipos, setEquipos] = useState([])
  const [fechaId, setFechaId] = useState('')
  const [partidos, setPartidos] = useState([])
  const [form, setForm] = useState({ local: '', visitante: '', hora: '', especial: false })
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
    if (!form.local || !form.visitante || form.local === form.visitante) { setMsg('Seleccioná dos equipos distintos'); return }
    const { error } = await supabase.from('partidos').insert({
      fecha_id: parseInt(fechaId), equipo_local_id: parseInt(form.local),
      equipo_visitante_id: parseInt(form.visitante), hora_estimada: form.hora || null, es_especial: form.especial
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
  const equiposFiltrados = fechaSeleccionada ? equipos.filter(e => e.categoria_id === fechaSeleccionada.categoria_id) : equipos

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
                <option value="">Local</option>
                {equiposFiltrados.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Visitante</label>
              <select className="form-select" value={form.visitante} onChange={e => setForm({...form, visitante: e.target.value})}>
                <option value="">Visitante</option>
                {equiposFiltrados.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Hora (opcional)</label>
              <input className="form-input" type="time" value={form.hora} onChange={e => setForm({...form, hora: e.target.value})} />
            </div>
          </div>
        )}
        {fechaId && (
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12,padding:'10px 14px',background:'rgba(201,162,39,0.1)',borderRadius:8,border:'1px solid rgba(201,162,39,0.3)'}}>
            <input type="checkbox" id="especial" checked={form.especial} onChange={e => setForm({...form, especial: e.target.checked})} style={{width:18,height:18,cursor:'pointer'}} />
            <label htmlFor="especial" style={{fontSize:14,fontWeight:600,cursor:'pointer',color:'var(--dorado-oscuro)'}}>⭐ Partido especial (puntaje doble)</label>
          </div>
        )}
        {fechaId && <button className="btn btn-primary" onClick={agregarPartido}>Agregar partido</button>}
      </div>
      {partidos.length > 0 && (
        <div className="card" style={{padding:0}}>
          {partidos.map(p => (
            <div key={p.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 16px',borderBottom:'1px solid var(--gris-borde)',background:p.es_especial?'rgba(201,162,39,0.05)':''}}>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                {p.es_especial && <span>⭐</span>}
                <span style={{fontSize:14}}>{p.equipo_local?.nombre} vs {p.equipo_visitante?.nombre}</span>
              </div>
              <div style={{display:'flex',gap:8}}>
                <button className="btn btn-small btn-secondary" onClick={async () => { await supabase.from('partidos').update({ es_especial: !p.es_especial }).eq('id', p.id); cargarPartidos() }}>
                  {p.es_especial ? '★ Quitar' : '☆ Especial'}
                </button>
                <button className="btn btn-small btn-danger" onClick={() => eliminarPartido(p.id)}>Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

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
    data?.forEach(p => { if (p.resultado_local !== null) res[p.id] = { local: p.resultado_local, visitante: p.resultado_visitante } })
    setResultados(res)
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
    await supabase.from('fechas').update({ resultados_cargados: true }).eq('id', fechaId)
    const { error } = await supabase.rpc('calcular_puntos_fecha', { p_fecha_id: parseInt(fechaId) })
    if (!error) setMsg('Resultados guardados y puntos calculados correctamente')
    else setMsg('Resultados guardados. Error al calcular puntos: ' + error.message)
    setGuardando(false)
  }

  async function notificarResultadosAdmin() {
    setMsg('Enviando notificaciones...')
    try {
      const { data, error } = await supabase.functions.invoke('send-notification', { body: { tipo: 'resultados', mensaje_extra: '¡Ya están los resultados! Entrá a ver tus puntos.' } })
      if (!error) setMsg(`✓ Notificaciones enviadas a ${data?.enviadas || 0} usuarios`)
      else setMsg('Error al enviar notificaciones')
    } catch(e) { setMsg('Error: ' + e.message) }
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
            <input type="text" inputMode="numeric" pattern="[0-9]*" className="score-input"
              value={resultados[p.id]?.local ?? ''} placeholder="0"
              onChange={e => setResultados(prev => ({ ...prev, [p.id]: { ...prev[p.id], local: e.target.value.replace(/\D/g,'') }}))} />
            <span className="score-separator">-</span>
            <input type="text" inputMode="numeric" pattern="[0-9]*" className="score-input"
              value={resultados[p.id]?.visitante ?? ''} placeholder="0"
              onChange={e => setResultados(prev => ({ ...prev, [p.id]: { ...prev[p.id], visitante: e.target.value.replace(/\D/g,'') }}))} />
          </div>
        </div>
      ))}
      {partidos.length > 0 && (
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          <button className="btn btn-primary" style={{width:'100%',padding:14}} onClick={guardarResultados} disabled={guardando}>
            {guardando ? 'Calculando puntos...' : 'Guardar resultados y calcular puntos'}
          </button>
          <button className="btn btn-gold" style={{width:'100%',padding:12}} onClick={notificarResultadosAdmin}>
            🔔 Notificar resultados a todos los usuarios
          </button>
        </div>
      )}
    </div>
  )
}

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
    if (!error) { setMsg('Equipo agregado'); cargar(); setForm({ ...form, nombre: '', nombre_corto: '' }) }
    else setMsg('Error: ' + error.message)
  }

  const porCategoria = [1,2,3,4,5].map(cat => ({ cat, equipos: equipos.filter(e => e.categoria_id === cat) }))

  return (
    <div>
      <div className="card">
        <div className="card-header"><span className="card-title">Agregar equipo</span></div>
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
          <span style={{fontSize:13,color:'var(--texto-suave)',fontWeight:600}}>{usuarios.length} total</span>
        </div>
        {msg && <div className="alert alert-success">{msg}</div>}
        <input className="form-input" placeholder="Buscar por usuario, nombre o club..." value={busqueda} onChange={e => { setBusqueda(e.target.value); setExpandido(null) }} />
      </div>

      {loading && <div className="loading"><div className="spinner"></div></div>}

      {!loading && (
        <div className="card" style={{padding:0,overflow:'hidden'}}>
          {filtrados.length === 0 && <div style={{padding:24,textAlign:'center',color:'var(--texto-suave)'}}>Sin resultados</div>}
          {filtrados.map(u => (
            <div key={u.id}>
              <div
                onClick={() => setExpandido(expandido === u.id ? null : u.id)}
                style={{
                  display:'flex', alignItems:'center', gap:12, padding:'12px 16px',
                  borderBottom: expandido === u.id ? 'none' : '1px solid var(--gris-borde)',
                  cursor:'pointer', transition:'background 0.15s',
                  background: expandido === u.id ? 'rgba(201,162,39,0.08)' : u.es_admin ? 'rgba(201,162,39,0.04)' : 'white'
                }}
              >
                <div className="avatar-circle" style={{width:36,height:36,fontSize:13,flexShrink:0}}>
                  {u.avatar_url
                    ? <img src={u.avatar_url} alt={u.username} style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:'50%'}} />
                    : u.username?.[0]?.toUpperCase() || '?'}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:600,fontSize:14,display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}}>
                    {u.username}
                    {u.es_admin && <span style={{fontSize:10,background:'var(--dorado)',color:'var(--azul)',padding:'1px 6px',borderRadius:20,fontWeight:700}}>ADMIN</span>}
                  </div>
                  <div style={{fontSize:11,color:'var(--texto-suave)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                    {[u.nombre_completo, u.club].filter(Boolean).join(' · ') || '—'}
                  </div>
                </div>
                <div style={{fontSize:11,color:'var(--texto-suave)',flexShrink:0}}>
                  {u.created_at ? new Date(u.created_at).toLocaleDateString('es-AR') : '—'}
                </div>
                <div style={{color:'var(--dorado)',fontSize:18,flexShrink:0,transition:'transform 0.2s',transform: expandido === u.id ? 'rotate(90deg)' : 'none'}}>›</div>
              </div>
              {expandido === u.id && (
                <div style={{
                  background:'rgba(201,162,39,0.06)',
                  borderTop:'1px solid rgba(201,162,39,0.3)',
                  borderBottom:'1px solid var(--gris-borde)',
                  padding:'14px 16px',
                  display:'flex', alignItems:'center', gap:12, flexWrap:'wrap'
                }}>
                  <div style={{flex:1,minWidth:200}}>
                    <div style={{fontWeight:700,fontSize:15,color:'var(--azul)',marginBottom:2}}>@{u.username}</div>
                    {u.nombre_completo && <div style={{fontSize:13,color:'var(--texto)'}}>{u.nombre_completo}</div>}
                    {u.club && <div style={{fontSize:12,color:'var(--texto-suave)'}}>{u.club}</div>}
                    <div style={{fontSize:11,color:'var(--texto-suave)',marginTop:4}}>
                      Registrado: {u.created_at ? new Date(u.created_at).toLocaleDateString('es-AR') : '—'}
                    </div>
                  </div>
                  <div style={{display:'flex',gap:8,flexShrink:0}}>
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
          <span style={{fontSize:13,color:'var(--texto-suave)',fontWeight:600}}>{grupos.length} grupos</span>
        </div>
        {msg && <div className="alert alert-success">{msg}</div>}
      </div>

      {loading && <div className="loading"><div className="spinner"></div></div>}

      {grupoAbierto && (
        <div className="card" style={{border:'2px solid var(--dorado)',marginBottom:12}}>
          <div className="card-header">
            <span className="card-title">👥 {grupoAbierto.nombre}</span>
            <button className="btn btn-small btn-secondary" onClick={() => setGrupoAbierto(null)}>← Volver</button>
          </div>
          <div style={{fontSize:13,color:'var(--texto-suave)',marginBottom:12}}>
            Código: <strong style={{color:'var(--dorado-oscuro)',letterSpacing:1}}>{grupoAbierto.codigo}</strong>
            {' · '}Creado por: <strong>{grupoAbierto.perfiles?.username}</strong>
            {' · '}{miembros.length} miembros
          </div>
          {miembros.map(m => (
            <div key={m.usuario_id} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderBottom:'1px solid var(--gris-borde)'}}>
              <div className="avatar-circle" style={{width:30,height:30,fontSize:11,flexShrink:0}}>
                {m.perfiles?.avatar_url
                  ? <img src={m.perfiles.avatar_url} alt={m.perfiles.username} style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:'50%'}} />
                  : m.perfiles?.username?.[0]?.toUpperCase() || '?'}
              </div>
              <div style={{flex:1}}>
                <div style={{fontWeight:600,fontSize:13}}>{m.perfiles?.username}</div>
                {m.perfiles?.club && <div style={{fontSize:11,color:'var(--texto-suave)'}}>{m.perfiles.club}</div>}
              </div>
              <div style={{fontSize:11,color:'var(--texto-suave)'}}>{m.joined_at ? new Date(m.joined_at).toLocaleDateString('es-AR') : ''}</div>
            </div>
          ))}
          <div style={{marginTop:16}}>
            <button className="btn btn-danger btn-small" onClick={() => eliminarGrupo(grupoAbierto.id)}>🗑️ Eliminar grupo</button>
          </div>
        </div>
      )}

      {!loading && !grupoAbierto && (
        <div className="card" style={{padding:0,overflow:'hidden'}}>
          {grupos.length === 0 && <div style={{padding:24,textAlign:'center',color:'var(--texto-suave)'}}>No hay grupos todavía</div>}
          {grupos.map(g => (
            <div key={g.id} onClick={() => verMiembros(g)}
              style={{display:'flex',alignItems:'center',gap:12,padding:'12px 16px',borderBottom:'1px solid var(--gris-borde)',cursor:'pointer',transition:'background 0.15s'}}
            >
              <div style={{width:40,height:40,borderRadius:'50%',overflow:'hidden',background:'linear-gradient(135deg,var(--azul),var(--azul-medio))',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,border:'2px solid var(--dorado)',flexShrink:0}}>
                {g.imagen_url ? <img src={g.imagen_url} alt={g.nombre} style={{width:'100%',height:'100%',objectFit:'cover'}} /> : '🏉'}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:600,fontSize:14}}>{g.nombre}</div>
                <div style={{fontSize:11,color:'var(--texto-suave)'}}>
                  Por {g.perfiles?.username || '—'} · <strong style={{color:'var(--dorado-oscuro)'}}>{g.codigo}</strong>
                </div>
              </div>
              <div style={{fontSize:11,color:'var(--texto-suave)',flexShrink:0}}>{g.created_at ? new Date(g.created_at).toLocaleDateString('es-AR') : ''}</div>
              <div style={{color:'var(--dorado)',fontSize:18,flexShrink:0}}>›</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
