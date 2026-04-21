import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const CLUBES_URBA = [
  '--- Top 14 ---','Alumni','Atlético del Rosario','Belgrano Athletic','Buenos Aires C&RC','CASI','Champagnat','CUBA','Hindú Club','La Plata RC','Los Matreros','Newman','Regatas Bella Vista','SIC','Los Tilos',
  '--- Primera A ---','San Luis','Pueyrredón','San Cirano','Pucará','Hurling','Curupaytí','San Andrés','Lomas Athletic','Deportiva Francesa','Olivos','Universitario LP','San Albano','GEBA','San Fernando',
  '--- Primera B ---','CUQ','Liceo Naval','San Martín (SP)','San Patricio','Mariano Moreno','Delta RC','Argentino (CAR)','Banco Nación','Manuel Belgrano','Club Italiano','Vicentinos','Monte Grande','Liceo Militar','Don Bosco',
  '--- Primera C ---','Ciudad de Buenos Aires','Centro Naval','Los Molinos','CASA de Padua','Luján RC','Del Sur','Areco RC','DAOM','SITAS','San Carlos','San Miguel RHC','Virreyes','Saint Brendans','Lanús RC',
  'Otro club'
]

export default function Perfil() {
  const { perfil, cargarPerfil, user } = useAuth()
  const [nombre, setNombre] = useState('')
  const [club, setClub] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [subiendo, setSubiendo] = useState(false)

  useEffect(() => {
    if (perfil) { setNombre(perfil.nombre_completo || ''); setClub(perfil.club || '') }
  }, [perfil])

  async function guardar(e) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.from('perfiles').update({ nombre_completo: nombre, club }).eq('id', user.id)
    if (!error) { setMsg('Perfil actualizado'); cargarPerfil(user.id) }
    else setMsg('Error al guardar')
    setLoading(false)
    setTimeout(() => setMsg(''), 3000)
  }

  async function subirFoto(e) {
    const file = e.target.files[0]
    if (!file) return
    setSubiendo(true)
    const ext = file.name.split('.').pop()
    const path = `avatars/${user.id}.${ext}`
    const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (!upErr) {
      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      await supabase.from('perfiles').update({ avatar_url: data.publicUrl }).eq('id', user.id)
      cargarPerfil(user.id)
      setMsg('Foto actualizada')
    } else {
      setMsg('Para subir fotos, activá el bucket "avatars" en Supabase Storage')
    }
    setSubiendo(false)
    setTimeout(() => setMsg(''), 4000)
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">Mi <span className="page-title-accent">perfil</span></h1>
      </div>

      <div className="card">
        <div style={{display:'flex',alignItems:'center',gap:20,marginBottom:24,paddingBottom:20,borderBottom:'2px solid var(--gris)'}}>
          <div style={{position:'relative'}}>
            <div className="avatar-circle" style={{width:72,height:72,fontSize:24,borderRadius:50}}>
              {perfil?.avatar_url
                ? <img src={perfil.avatar_url} alt={perfil.username} style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:'50%'}} />
                : perfil?.username?.[0]?.toUpperCase()
              }
            </div>
            <label style={{position:'absolute',bottom:-4,right:-4,width:24,height:24,background:'var(--rojo-vivo)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',border:'2px solid white',fontSize:12,color:'white'}}>
              {subiendo ? '...' : '+'}
              <input type="file" accept="image/*" style={{display:'none'}} onChange={subirFoto} disabled={subiendo} />
            </label>
          </div>
          <div>
            <div style={{fontFamily:'Rajdhani,sans-serif',fontSize:22,fontWeight:700,color:'var(--azul)'}}>@{perfil?.username}</div>
            <div style={{fontSize:13,color:'var(--texto-suave)',marginTop:2}}>{perfil?.club || 'Sin club asignado'}</div>
            {perfil?.es_admin && <span className="cat-badge cat-top14" style={{marginTop:4,display:'inline-block'}}>Admin</span>}
          </div>
        </div>

        {msg && <div className={`alert ${msg.includes('Error')||msg.includes('Para')?'alert-error':'alert-success'}`}>{msg}</div>}

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

      <div className="card">
        <div className="card-header"><span className="card-title">Instrucciones foto de perfil</span></div>
        <p style={{fontSize:13,color:'var(--texto-suave)',lineHeight:1.7}}>
          Para habilitar la subida de fotos, necesitás crear un bucket en Supabase:<br/>
          <strong>Storage → New bucket → Nombre: "avatars" → Public: ON → Create</strong><br/>
          Una vez creado podés subir tu foto desde acá.
        </p>
      </div>
    </div>
  )
}
