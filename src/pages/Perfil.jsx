import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { usePushNotifications } from '../hooks/usePushNotifications'

const CLUBES_URBA = [
  '--- Top 14 ---','Alumni','Atlético del Rosario','Belgrano Athletic','Buenos Aires C&RC','CASI','Champagnat','CUBA','Hindú Club','La Plata RC','Los Matreros','Newman','Regatas Bella Vista','SIC','Los Tilos',
  '--- Primera A ---','San Luis','Pueyrredón','San Cirano','Pucará','Hurling','Curupaytí','San Andrés','Lomas Athletic','Deportiva Francesa','Olivos','Universitario LP','San Albano','GEBA','San Fernando',
  '--- Primera B ---','CUQ','Liceo Naval','San Martín (SP)','San Patricio','Mariano Moreno','Delta RC','Argentino (CAR)','Banco Nación','Manuel Belgrano','Club Italiano','Vicentinos','Monte Grande','Liceo Militar','Don Bosco',
  '--- Primera C ---','Ciudad de Buenos Aires','Centro Naval','Los Molinos','CASA de Padua','Luján RC','Del Sur','Areco RC','DAOM','SITAS','San Carlos','San Miguel RHC','Virreyes','Saint Brendans','Lanús RC',
  '--- Segunda División ---','Mercedes','Varela Jr.','Albatros','Tigre','Atlético Chascomús','Los Pinos','La Salle','El Retiro','San Marcos','Tiro F. San Pedro','A. y Progreso','Vicente López','Old Georgian','Las Cañas',
  'Otro club'
]

const BASE = 'https://xmtsxdzwurxygqqccgdc.supabase.co/storage/v1/object/public/trofeos'

const TROFEOS = [
  { nombre: 'Puma',    minimo: 15, img: `${BASE}/trofeo_puma.png`,     desc: 'Nivel seleccionado',    color: '#C9A227', bg: 'rgba(201,162,39,0.12)' },
  { nombre: 'Capitán', minimo: 10, img: `${BASE}/trofeo_capitan.png`,  desc: 'El referente del grupo', color: '#C9A227', bg: 'rgba(201,162,39,0.08)' },
  { nombre: 'Titular', minimo: 6,  img: `${BASE}/trofeo_titular.png`,  desc: 'Ganaste tu lugar',       color: '#9ca3af', bg: 'rgba(156,163,175,0.12)' },
  { nombre: 'Suplente',minimo: 3,  img: `${BASE}/trofeo_suplente.png`, desc: 'Entraste al equipo',     color: '#cd7c3e', bg: 'rgba(205,124,62,0.12)' },
]

function getTrofeo(rachaMaxima) {
  return TROFEOS.find(t => rachaMaxima >= t.minimo) || null
}

export default function Perfil() {
  const { perfil, cargarPerfil, user } = useAuth()
  const { permiso, suscrito, cargando: cargandoNotif, suscribirse, desuscribirse } = usePushNotifications()
  const [nombre, setNombre] = useState('')
  const [club, setClub] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [subiendo, setSubiendo] = useState(false)
  const [preview, setPreview] = useState(null)
  const [racha, setRacha] = useState({ actual: 0, maxima: 0 })

  useEffect(() => {
    if (perfil) {
      setNombre(perfil.nombre_completo || '')
      setClub(perfil.club || '')
      setPreview(perfil.avatar_url || null)
    }
  }, [perfil])

  useEffect(() => {
    if (user) cargarRacha()
  }, [user])

  async function cargarRacha() {
    const { data } = await supabase.from('perfiles').select('racha_actual, racha_maxima').eq('id', user.id).single()
    if (data) setRacha({ actual: data.racha_actual || 0, maxima: data.racha_maxima || 0 })
  }

  async function guardar(e) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.from('perfiles').update({ nombre_completo: nombre, club }).eq('id', user.id)
    if (!error) { setMsg('✓ Perfil actualizado'); cargarPerfil(user.id) }
    else setMsg('Error al guardar: ' + error.message)
    setLoading(false)
    setTimeout(() => setMsg(''), 3000)
  }

  async function subirFoto(e) {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { setMsg('La imagen debe ser menor a 2MB'); return }
    setSubiendo(true)
    try {
      const ext = file.name.split('.').pop().toLowerCase()
      const path = `${user.id}.${ext}`
      const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true, contentType: file.type })
      if (upErr) throw upErr
      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      await supabase.from('perfiles').update({ avatar_url: data.publicUrl }).eq('id', user.id)
      setPreview(data.publicUrl + '?t=' + Date.now())
      cargarPerfil(user.id)
      setMsg('✓ Foto actualizada')
    } catch(err) {
      setMsg('Error al subir: ' + err.message)
    }
    setSubiendo(false)
    setTimeout(() => setMsg(''), 4000)
  }

  const ini = perfil?.username?.[0]?.toUpperCase() || 'U'
  const trofeo = getTrofeo(racha.maxima)
  const proximoTrofeo = TROFEOS.slice().reverse().find(t => racha.maxima < t.minimo)

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">Mi <span className="page-title-accent">perfil</span></h1>
      </div>

      <div className="card">
        <div style={{display:'flex',alignItems:'center',gap:20,marginBottom:24,paddingBottom:20,borderBottom:'2px solid var(--gris)'}}>
          <div style={{position:'relative',flexShrink:0}}>
            <div style={{width:80,height:80,borderRadius:'50%',background:'linear-gradient(135deg,var(--dorado),var(--dorado-oscuro))',display:'flex',alignItems:'center',justifyContent:'center',fontSize:28,fontWeight:700,color:'var(--azul)',overflow:'hidden',border:'3px solid var(--dorado)'}}>
              {preview
                ? <img src={preview} alt="avatar" style={{width:'100%',height:'100%',objectFit:'cover'}} />
                : ini}
            </div>
            <label style={{position:'absolute',bottom:-2,right:-2,width:26,height:26,background:'var(--rojo-vivo)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',border:'2px solid white',fontSize:16,color:'white',fontWeight:700}}>
              {subiendo ? '⟳' : '+'}
              <input type="file" accept="image/jpeg,image/png,image/webp" style={{display:'none'}} onChange={subirFoto} disabled={subiendo} />
            </label>
          </div>
          <div style={{flex:1}}>
            <div style={{fontFamily:'Rajdhani,sans-serif',fontSize:22,fontWeight:700,color:'var(--azul)'}}>@{perfil?.username}</div>
            <div style={{fontSize:13,color:'var(--texto-suave)',marginTop:2}}>{perfil?.club || 'Sin club asignado'}</div>
            {perfil?.es_admin && <span className="cat-badge cat-top14" style={{marginTop:6,display:'inline-block'}}>Admin</span>}
          </div>
        </div>

        {/* RACHA Y TROFEO */}
        <div style={{marginBottom:20}}>
          {/* Racha actual y máxima */}
          <div style={{display:'flex',gap:12,marginBottom:12}}>
            <div style={{flex:1,textAlign:'center',padding:'12px 8px',background:'rgba(201,162,39,0.08)',borderRadius:10,border:'1px solid rgba(201,162,39,0.25)'}}>
              <div style={{fontSize:28,fontWeight:700,fontFamily:'Rajdhani,sans-serif',color:'var(--azul)',lineHeight:1}}>
                {racha.actual > 0 ? '🔥' : '—'} {racha.actual}
              </div>
              <div style={{fontSize:11,color:'var(--texto-suave)',marginTop:4,textTransform:'uppercase',letterSpacing:0.5}}>Racha actual</div>
            </div>
            <div style={{flex:1,textAlign:'center',padding:'12px 8px',background:'rgba(201,162,39,0.08)',borderRadius:10,border:'1px solid rgba(201,162,39,0.25)'}}>
              <div style={{fontSize:28,fontWeight:700,fontFamily:'Rajdhani,sans-serif',color:'var(--dorado-oscuro)',lineHeight:1}}>
                🏆 {racha.maxima}
              </div>
              <div style={{fontSize:11,color:'var(--texto-suave)',marginTop:4,textTransform:'uppercase',letterSpacing:0.5}}>Racha máxima</div>
            </div>
          </div>

          {/* Trofeo actual */}
          {trofeo ? (
            <div style={{
              display:'flex', alignItems:'center', gap:16, padding:'16px',
              background: trofeo.bg, borderRadius:12,
              border:`1.5px solid ${trofeo.color}40`
            }}>
              <img src={trofeo.img} alt={trofeo.nombre} style={{width:64,height:64,objectFit:'contain',flexShrink:0}} />
              <div>
                <div style={{fontFamily:'Rajdhani,sans-serif',fontSize:20,fontWeight:700,color:trofeo.color,letterSpacing:1}}>
                  {trofeo.nombre.toUpperCase()}
                </div>
                <div style={{fontSize:13,color:'var(--texto)',marginTop:2}}>"{trofeo.desc}"</div>
                <div style={{fontSize:11,color:'var(--texto-suave)',marginTop:4}}>
                  Desbloqueado con {trofeo.minimo} fechas consecutivas
                </div>
              </div>
            </div>
          ) : (
            <div style={{padding:'14px 16px',background:'var(--gris)',borderRadius:10,textAlign:'center'}}>
              <div style={{fontSize:13,color:'var(--texto-suave)'}}>
                Todavía no tenés trofeo — completá {proximoTrofeo ? proximoTrofeo.minimo : 3} fechas consecutivas para ganar el primero 🏆
              </div>
            </div>
          )}

          {/* Próximo trofeo */}
          {trofeo && proximoTrofeo && (
            <div style={{marginTop:8,padding:'10px 14px',background:'var(--gris)',borderRadius:8,display:'flex',alignItems:'center',gap:10}}>
              <img src={proximoTrofeo.img} alt={proximoTrofeo.nombre} style={{width:32,height:32,objectFit:'contain',opacity:0.4,flexShrink:0}} />
              <div style={{fontSize:12,color:'var(--texto-suave)'}}>
                Próximo: <strong style={{color:'var(--texto)'}}>{proximoTrofeo.nombre}</strong> — completá {proximoTrofeo.minimo} fechas consecutivas
              </div>
            </div>
          )}
        </div>

        {msg && <div className={`alert ${msg.startsWith('Error')||msg.startsWith('La imagen')?'alert-error':'alert-success'}`}>{msg}</div>}

        <form onSubmit={guardar}>
          <div className="form-group">
            <label className="form-label">Nombre completo</label>
            <input className="form-input" type="text" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Tu nombre" />
          </div>
          <div className="form-group">
            <label className="form-label">Club al que pertenecés</label>
            <select className="form-select" value={club} onChange={e => setClub(e.target.value)}>
              <option value="">Seleccioná tu club</option>
              {CLUBES_URBA.map((c,i) => (
                c.startsWith('---')
                  ? <option key={i} disabled style={{fontWeight:700,color:'#999'}}>{c}</option>
                  : <option key={i} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </form>
      </div>

      {/* INVITAR AMIGOS */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">👥 Invitá a un amigo</span>
        </div>
        <p style={{fontSize:13,color:'var(--texto-suave)',marginBottom:16,lineHeight:1.7}}>
          ¿Conocés a alguien que le guste el rugby? Mandales el link para que se sumen al prode.
        </p>
        <button className="btn btn-primary" onClick={() => {
          const mensaje = encodeURIComponent("Ey, estoy jugando Pick&Go, un prode de rugby de la URBA 🏉 Predecís los resultados de Top 14, Primera A, B, C y Segunda, hay ranking semanal y anual.\n\nBajatela:\n📱 Android: Chrome → pickandgo-prode.vercel.app → \"Agregar a pantalla de inicio\"\n🍎 iPhone: Safari → pickandgo-prode.vercel.app → botón compartir → \"Agregar a pantalla de inicio\"\n\n¡Sumate y a ver quién gana! 🏆")
          window.open(`https://wa.me/?text=${mensaje}`, '_blank')
        }}>
          📲 Invitar por WhatsApp
        </button>
      </div>

      {/* NOTIFICACIONES */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">🔔 Notificaciones</span>
        </div>
        {'Notification' in window ? (
          permiso === 'denied' ? (
            <div className="alert alert-error">Bloqueaste las notificaciones. Para activarlas andá a la configuración de tu navegador y permitilas para este sitio.</div>
          ) : (
            <div>
              <p style={{fontSize:13,color:'var(--texto-suave)',marginBottom:16,lineHeight:1.7}}>
                Recibí recordatorios antes del cierre del prode y avisos cuando se cargan los resultados.
              </p>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 16px',background:'var(--gris)',borderRadius:10,marginBottom:8}}>
                <div>
                  <div style={{fontWeight:600,fontSize:14}}>{suscrito ? '✅ Notificaciones activadas' : '🔕 Notificaciones desactivadas'}</div>
                  <div style={{fontSize:12,color:'var(--texto-suave)',marginTop:2}}>{suscrito ? 'Vas a recibir recordatorios y resultados' : 'No estás recibiendo avisos'}</div>
                </div>
                <button className={`btn ${suscrito ? 'btn-secondary' : 'btn-primary'} btn-small`} onClick={suscrito ? desuscribirse : suscribirse} disabled={cargandoNotif}>
                  {cargandoNotif ? '...' : suscrito ? 'Desactivar' : 'Activar'}
                </button>
              </div>
              {suscrito && <div style={{fontSize:12,color:'var(--texto-suave)',lineHeight:1.8}}>Vas a recibir avisos: 24hs, 12hs, 4hs y 2hs antes del cierre · Al cargarse los resultados</div>}
            </div>
          )
        ) : (
          <div className="alert alert-info">Tu navegador no soporta notificaciones push.</div>
        )}
      </div>
    </div>
  )
}
