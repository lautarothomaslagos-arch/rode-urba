import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function Grupos() {
  const { user, perfil } = useAuth()
  const [seccion, setSeccion] = useState('mis-grupos')
  const [misGrupos, setMisGrupos] = useState([])
  const [grupoActivo, setGrupoActivo] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { cargarMisGrupos() }, [user])

  async function cargarMisGrupos() {
    setLoading(true)
    const { data } = await supabase
      .from('grupo_miembros')
      .select('grupo_id, grupos(id, nombre, imagen_url, codigo, creador_id)')
      .eq('usuario_id', user.id)
    setMisGrupos(data?.map(d => d.grupos) || [])
    setLoading(false)
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">Grupos <span className="page-title-accent">privados</span></h1>
      </div>

      <div className="tabs-box">
        <button className={`tab-btn ${seccion === 'mis-grupos' ? 'active' : ''}`} onClick={() => { setSeccion('mis-grupos'); setGrupoActivo(null) }}>Mis grupos</button>
        <button className={`tab-btn ${seccion === 'crear' ? 'active' : ''}`} onClick={() => setSeccion('crear')}>Crear grupo</button>
        <button className={`tab-btn ${seccion === 'unirse' ? 'active' : ''}`} onClick={() => setSeccion('unirse')}>Unirse</button>
      </div>

      {seccion === 'mis-grupos' && !grupoActivo && (
        <MisGrupos
          grupos={misGrupos}
          loading={loading}
          userId={user.id}
          onSelect={setGrupoActivo}
          onRefresh={cargarMisGrupos}
        />
      )}
      {seccion === 'mis-grupos' && grupoActivo && (
        <RankingGrupo
          grupo={grupoActivo}
          userId={user.id}
          perfil={perfil}
          onVolver={() => setGrupoActivo(null)}
          onRefresh={cargarMisGrupos}
        />
      )}
      {seccion === 'crear' && (
        <CrearGrupo userId={user.id} onCreado={() => { cargarMisGrupos(); setSeccion('mis-grupos') }} />
      )}
      {seccion === 'unirse' && (
        <UnirseGrupo userId={user.id} onUnido={() => { cargarMisGrupos(); setSeccion('mis-grupos') }} />
      )}
    </div>
  )
}

// ---- MIS GRUPOS ----
function MisGrupos({ grupos, loading, userId, onSelect, onRefresh }) {
  async function abandonar(grupoId) {
    if (!confirm('¿Abandonar este grupo?')) return
    await supabase.from('grupo_miembros').delete().eq('grupo_id', grupoId).eq('usuario_id', userId)
    onRefresh()
  }

  if (loading) return <div className="loading"><div className="spinner"></div></div>

  if (!grupos.length) return (
    <div className="empty-state">
      <div className="empty-icon">👥</div>
      <div className="empty-title">No estás en ningún grupo</div>
      <p style={{ fontSize: 13, color: 'var(--texto-suave)' }}>Creá uno o unite con un código</p>
    </div>
  )

  return (
    <div>
      {grupos.map(g => (
        <div key={g.id} className="card" style={{ padding: 0, marginBottom: 12, cursor: 'pointer' }}>
          <div
            onClick={() => onSelect(g)}
            style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderBottom: '1px solid var(--gris-borde)' }}
          >
            <div style={{ width: 48, height: 48, borderRadius: '50%', overflow: 'hidden', background: 'linear-gradient(135deg,var(--azul),var(--azul-medio))', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, border: '2px solid var(--dorado)' }}>
              {g.imagen_url
                ? <img src={g.imagen_url} alt={g.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : '🏉'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'Rajdhani,sans-serif', fontSize: 18, fontWeight: 700, color: 'var(--azul)' }}>{g.nombre}</div>
              <div style={{ fontSize: 12, color: 'var(--texto-suave)', marginTop: 2 }}>
                Código: <span style={{ fontWeight: 700, color: 'var(--dorado-oscuro)', letterSpacing: 1 }}>{g.codigo}</span>
                {g.creador_id === userId && <span style={{ marginLeft: 8, fontSize: 10, background: 'var(--dorado)', color: 'var(--azul)', padding: '1px 6px', borderRadius: 20, fontWeight: 700 }}>ADMIN</span>}
              </div>
            </div>
            <div style={{ color: 'var(--dorado)', fontSize: 20 }}>›</div>
          </div>
          <div style={{ display: 'flex', gap: 8, padding: '10px 16px' }}>
            <button
              className="btn btn-primary btn-small"
              onClick={() => onSelect(g)}
            >Ver ranking</button>
            <button
              className="btn btn-small"
              style={{ background: 'transparent', border: '1px solid var(--gris-borde)', color: 'var(--texto-suave)' }}
              onClick={() => {
                navigator.clipboard.writeText(g.codigo)
                alert('Código copiado: ' + g.codigo)
              }}
            >📋 Copiar código</button>
            {g.creador_id !== userId && (
              <button
                className="btn btn-small btn-danger"
                onClick={() => abandonar(g.id)}
              >Salir</button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// ---- RANKING DEL GRUPO ----
function RankingGrupo({ grupo, userId, perfil, onVolver, onRefresh }) {
  const [ranking, setRanking] = useState([])
  const [miembros, setMiembros] = useState([])
  const [loading, setLoading] = useState(true)
  const [subVista, setSubVista] = useState('anual')
  const [fechas, setFechas] = useState([])
  const [fechaNum, setFechaNum] = useState(null)
  const [editando, setEditando] = useState(false)
  const [nuevoNombre, setNuevoNombre] = useState(grupo.nombre)
  const [subiendo, setSubiendo] = useState(false)
  const [preview, setPreview] = useState(grupo.imagen_url)
  const [msg, setMsg] = useState('')

  const esAdmin = grupo.creador_id === userId

  useEffect(() => { cargarFechas(); cargarMiembros() }, [])
  useEffect(() => { cargarRanking() }, [subVista, fechaNum, miembros])

  async function cargarFechas() {
    const { data } = await supabase.from('fechas')
      .select('numero, fecha_partido')
      .eq('resultados_cargados', true)
      .order('numero', { ascending: false })
    const unicas = [...new Map(data?.map(f => [f.numero, f])).values()]
    setFechas(unicas)
    if (unicas.length) setFechaNum(unicas[0].numero)
  }

  async function cargarMiembros() {
    const { data } = await supabase
      .from('grupo_miembros')
      .select('usuario_id, perfiles(username, nombre_completo, avatar_url, club)')
      .eq('grupo_id', grupo.id)
    setMiembros(data || [])
  }

  async function cargarRanking() {
    if (!miembros.length) { setLoading(false); return }
    setLoading(true)
    const uids = miembros.map(m => m.usuario_id)

    try {
      if (subVista === 'anual') {
        const { data } = await supabase.from('puntos_totales')
          .select('puntos_acumulados, fechas_jugadas, usuario_id')
          .eq('temporada_id', 1)
          .in('usuario_id', uids)

        const agrupado = {}
        data?.forEach(item => {
          const uid = item.usuario_id
          if (!agrupado[uid]) {
            const m = miembros.find(m => m.usuario_id === uid)
            agrupado[uid] = { usuario_id: uid, puntos_acumulados: 0, fechas_jugadas: 0, perfiles: m?.perfiles }
          }
          agrupado[uid].puntos_acumulados += (item.puntos_acumulados || 0)
          agrupado[uid].fechas_jugadas = Math.max(agrupado[uid].fechas_jugadas, item.fechas_jugadas || 0)
        })

        // Incluir miembros sin puntos
        miembros.forEach(m => {
          if (!agrupado[m.usuario_id]) {
            agrupado[m.usuario_id] = { usuario_id: m.usuario_id, puntos_acumulados: 0, fechas_jugadas: 0, perfiles: m.perfiles }
          }
        })

        setRanking(Object.values(agrupado).sort((a, b) => b.puntos_acumulados - a.puntos_acumulados))
      } else if (fechaNum !== null) {
        const { data: fechasIds } = await supabase.from('fechas')
          .select('id').eq('numero', fechaNum).eq('resultados_cargados', true)
        const ids = fechasIds?.map(f => f.id) || []
        if (!ids.length) { setRanking([]); setLoading(false); return }

        const { data } = await supabase.from('puntos_fecha')
          .select('total_puntos, partidos_acertados, partidos_totales, usuario_id')
          .in('fecha_id', ids)
          .in('usuario_id', uids)

        const agrupado = {}
        data?.forEach(item => {
          const uid = item.usuario_id
          if (!agrupado[uid]) {
            const m = miembros.find(m => m.usuario_id === uid)
            agrupado[uid] = { usuario_id: uid, total_puntos: 0, partidos_acertados: 0, partidos_totales: 0, perfiles: m?.perfiles }
          }
          agrupado[uid].total_puntos += (item.total_puntos || 0)
          agrupado[uid].partidos_acertados += (item.partidos_acertados || 0)
          agrupado[uid].partidos_totales += (item.partidos_totales || 0)
        })

        miembros.forEach(m => {
          if (!agrupado[m.usuario_id]) {
            agrupado[m.usuario_id] = { usuario_id: m.usuario_id, total_puntos: 0, partidos_acertados: 0, partidos_totales: 0, perfiles: m.perfiles }
          }
        })

        setRanking(Object.values(agrupado).sort((a, b) => b.total_puntos - a.total_puntos))
      }
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  async function expulsarMiembro(uid) {
    if (!confirm('¿Expulsar a este usuario del grupo?')) return
    await supabase.from('grupo_miembros').delete().eq('grupo_id', grupo.id).eq('usuario_id', uid)
    cargarMiembros()
  }

  async function eliminarGrupo() {
    if (!confirm('¿Eliminar el grupo permanentemente? Esta acción no se puede deshacer.')) return
    await supabase.from('grupos').delete().eq('id', grupo.id)
    onRefresh()
    onVolver()
  }

  async function guardarCambios() {
    const { error } = await supabase.from('grupos').update({ nombre: nuevoNombre }).eq('id', grupo.id)
    if (!error) { setMsg('✓ Guardado'); setEditando(false); grupo.nombre = nuevoNombre }
    else setMsg('Error: ' + error.message)
    setTimeout(() => setMsg(''), 3000)
  }

  async function subirImagen(e) {
    const file = e.target.files[0]
    if (!file) return
    setSubiendo(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `${grupo.id}.${ext}`
      await supabase.storage.from('grupos').upload(path, file, { upsert: true, contentType: file.type })
      const { data } = supabase.storage.from('grupos').getPublicUrl(path)
      await supabase.from('grupos').update({ imagen_url: data.publicUrl }).eq('id', grupo.id)
      setPreview(data.publicUrl + '?t=' + Date.now())
      setMsg('✓ Imagen actualizada')
    } catch (err) {
      setMsg('Error: ' + err.message)
    }
    setSubiendo(false)
    setTimeout(() => setMsg(''), 3000)
  }

  const medal = (i) => ['🥇', '🥈', '🥉'][i] || null
  const posClass = (i) => i === 0 ? 'pos-1' : i === 1 ? 'pos-2' : i === 2 ? 'pos-3' : ''

  return (
    <div>
      {/* Header del grupo */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: esAdmin ? 12 : 0 }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', overflow: 'hidden', background: 'linear-gradient(135deg,var(--azul),var(--azul-medio))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, border: '2px solid var(--dorado)' }}>
              {preview ? <img src={preview} alt={grupo.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🏉'}
            </div>
            {esAdmin && (
              <label style={{ position: 'absolute', bottom: -2, right: -2, width: 22, height: 22, background: 'var(--rojo-vivo)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '2px solid white', fontSize: 13, color: 'white' }}>
                {subiendo ? '⟳' : '+'}
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={subirImagen} disabled={subiendo} />
              </label>
            )}
          </div>
          <div style={{ flex: 1 }}>
            {editando ? (
              <input className="form-input" value={nuevoNombre} onChange={e => setNuevoNombre(e.target.value)} style={{ marginBottom: 6 }} />
            ) : (
              <div style={{ fontFamily: 'Rajdhani,sans-serif', fontSize: 22, fontWeight: 700, color: 'var(--azul)' }}>{grupo.nombre}</div>
            )}
            <div style={{ fontSize: 12, color: 'var(--texto-suave)' }}>
              Código: <span style={{ fontWeight: 700, color: 'var(--dorado-oscuro)', letterSpacing: 1 }}>{grupo.codigo}</span>
              {' · '}{miembros.length} {miembros.length === 1 ? 'miembro' : 'miembros'}
            </div>
          </div>
        </div>

        {msg && <div className={`alert ${msg.startsWith('Error') ? 'alert-error' : 'alert-success'}`} style={{ marginBottom: 8 }}>{msg}</div>}

        {esAdmin && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {editando ? (
              <>
                <button className="btn btn-primary btn-small" onClick={guardarCambios}>Guardar</button>
                <button className="btn btn-small btn-secondary" onClick={() => setEditando(false)}>Cancelar</button>
              </>
            ) : (
              <button className="btn btn-small btn-secondary" onClick={() => setEditando(true)}>✏️ Editar nombre</button>
            )}
            <button className="btn btn-small btn-danger" onClick={eliminarGrupo}>🗑️ Eliminar grupo</button>
          </div>
        )}
      </div>

      <button onClick={onVolver} style={{ background: 'none', border: 'none', color: 'var(--dorado-oscuro)', cursor: 'pointer', fontSize: 13, marginBottom: 12, fontWeight: 600 }}>
        ← Volver a mis grupos
      </button>

      {/* Tabs ranking */}
      <div className="tabs-box">
        <button className={`tab-btn ${subVista === 'anual' ? 'active' : ''}`} onClick={() => setSubVista('anual')}>Anual 2026</button>
        <button className={`tab-btn ${subVista === 'fecha' ? 'active' : ''}`} onClick={() => setSubVista('fecha')}>Por fecha</button>
      </div>

      {subVista === 'fecha' && fechas.length > 0 && (
        <div className="tabs-box" style={{ marginBottom: 16 }}>
          {fechas.map(f => (
            <button key={f.numero} className={`tab-btn ${fechaNum === f.numero ? 'active' : ''}`} onClick={() => setFechaNum(f.numero)}>
              Fecha {f.numero}
            </button>
          ))}
        </div>
      )}

      {loading && <div className="loading"><div className="spinner"></div></div>}

      {!loading && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', background: 'linear-gradient(135deg,var(--azul),var(--azul-medio))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: 'Rajdhani,sans-serif', fontSize: 15, fontWeight: 700, color: 'var(--dorado)', letterSpacing: 1 }}>
              {subVista === 'anual' ? `${grupo.nombre} — Anual` : `${grupo.nombre} — Fecha ${fechaNum}`}
            </span>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{ranking.length} participantes</span>
          </div>
          {ranking.map((item, idx) => {
            const esYo = item.usuario_id === userId
            const av = item.perfiles?.avatar_url
            const ini = item.perfiles?.username?.[0]?.toUpperCase() || '?'
            return (
              <div key={item.usuario_id} className={`ranking-row ${esYo ? 'yo' : ''}`}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className={`ranking-pos ${posClass(idx)}`}>{medal(idx) || (idx + 1)}</div>
                    <div className="avatar-circle" style={{ width: 34, height: 34, fontSize: 13 }}>
                      {av ? <img src={av} alt={ini} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : ini}
                    </div>
                    <div className="ranking-info">
                      <div className="ranking-username">
                        {item.perfiles?.username || 'Usuario'}
                        {esYo && <span style={{ marginLeft: 6, fontSize: 10, background: 'var(--dorado)', color: 'var(--azul)', padding: '1px 6px', borderRadius: 20, fontWeight: 700 }}>VOS</span>}
                      </div>
                      {item.perfiles?.club && <div className="ranking-club">{item.perfiles.club}</div>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="ranking-pts">
                      {subVista === 'anual' ? item.puntos_acumulados : item.total_puntos}
                      <span> pts</span>
                    </div>
                    {esAdmin && item.usuario_id !== userId && (
                      <button className="btn btn-small btn-danger" style={{ fontSize: 11, padding: '3px 8px' }} onClick={() => expulsarMiembro(item.usuario_id)}>
                        Expulsar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ---- CREAR GRUPO ----
function CrearGrupo({ userId, onCreado }) {
  const [nombre, setNombre] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  async function crear() {
    if (!nombre.trim()) { setMsg('Escribí un nombre para el grupo'); return }
    setLoading(true)
    const { data, error } = await supabase.from('grupos').insert({
      nombre: nombre.trim(),
      creador_id: userId
    }).select().single()

    if (error) { setMsg('Error: ' + error.message); setLoading(false); return }

    // Unirse automáticamente al grupo creado
    await supabase.from('grupo_miembros').insert({ grupo_id: data.id, usuario_id: userId })
    setMsg('✓ Grupo creado')
    setLoading(false)
    setTimeout(onCreado, 1000)
  }

  return (
    <div className="card">
      <div className="card-header"><span className="card-title">Crear nuevo grupo</span></div>
      {msg && <div className={`alert ${msg.startsWith('Error') ? 'alert-error' : 'alert-success'}`}>{msg}</div>}
      <div className="form-group">
        <label className="form-label">Nombre del grupo</label>
        <input
          className="form-input"
          value={nombre}
          onChange={e => setNombre(e.target.value)}
          placeholder="ej: Los del SIC, Grupo laburo..."
          maxLength={40}
        />
      </div>
      <p style={{ fontSize: 13, color: 'var(--texto-suave)', marginBottom: 16, lineHeight: 1.7 }}>
        Al crear el grupo vas a recibir un código único para compartir con tus amigos. Podés agregar una imagen desde la pantalla del grupo.
      </p>
      <button className="btn btn-primary" onClick={crear} disabled={loading}>
        {loading ? 'Creando...' : 'Crear grupo'}
      </button>
    </div>
  )
}

// ---- UNIRSE A GRUPO ----
function UnirseGrupo({ userId, onUnido }) {
  const [codigo, setCodigo] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  async function unirse() {
    if (!codigo.trim()) { setMsg('Ingresá el código del grupo'); return }
    setLoading(true)

    const { data: grupo, error } = await supabase
      .from('grupos')
      .select('id, nombre')
      .eq('codigo', codigo.trim().toLowerCase())
      .single()

    if (error || !grupo) { setMsg('Código inválido, verificá que esté bien escrito'); setLoading(false); return }

    const { error: joinError } = await supabase.from('grupo_miembros').insert({
      grupo_id: grupo.id,
      usuario_id: userId
    })

    if (joinError?.code === '23505') { setMsg('Ya sos miembro de este grupo'); setLoading(false); return }
    if (joinError) { setMsg('Error al unirse: ' + joinError.message); setLoading(false); return }

    setMsg(`✓ Te uniste a "${grupo.nombre}"`)
    setLoading(false)
    setTimeout(onUnido, 1000)
  }

  return (
    <div className="card">
      <div className="card-header"><span className="card-title">Unirse a un grupo</span></div>
      {msg && <div className={`alert ${msg.startsWith('Error') || msg.startsWith('Código') || msg.startsWith('Ya') ? 'alert-error' : 'alert-success'}`}>{msg}</div>}
      <div className="form-group">
        <label className="form-label">Código del grupo</label>
        <input
          className="form-input"
          value={codigo}
          onChange={e => setCodigo(e.target.value)}
          placeholder="ej: a1b2c3d4"
          maxLength={8}
          style={{ letterSpacing: 2, textTransform: 'lowercase' }}
        />
      </div>
      <p style={{ fontSize: 13, color: 'var(--texto-suave)', marginBottom: 16, lineHeight: 1.7 }}>
        Pedile el código al creador del grupo y pegalo acá.
      </p>
      <button className="btn btn-primary" onClick={unirse} disabled={loading}>
        {loading ? 'Uniéndose...' : 'Unirse al grupo'}
      </button>
    </div>
  )
}
