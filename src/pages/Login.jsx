import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [modo, setModo] = useState('login')
  const [username, setUsername] = useState('')
  const [nombre, setNombre] = useState('')
  const [msgRecupero, setMsgRecupero] = useState('')
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (modo === 'login') {
      const { error } = await signIn({ email, password })
      if (error) setError('Email o contraseña incorrectos')
      else navigate('/prode')
    } else if (modo === 'registro') {
      if (!username || username.length < 3) {
        setError('El usuario debe tener al menos 3 caracteres')
        setLoading(false)
        return
      }
      const { error } = await signUp({ email, password, username, nombreCompleto: nombre })
      if (error) setError(error.message)
      else setModo('confirmacion')
    } else if (modo === 'recuperar') {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://pickandgo-prode.vercel.app/nueva-contrasena'
      })
      if (error) setError('Error al enviar el email')
      else setMsgRecupero('Te enviamos un email para recuperar tu contraseña')
      setLoading(false)
      return
    }
    setLoading(false)
  }

  if (modo === 'confirmacion') {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-logo">
            <img src="/logo.png" alt="Pick&Go" style={{width:100,height:100,borderRadius:20}} />
            <h1>¡Listo!</h1>
            <p className="sub">Revisá tu email para confirmar la cuenta</p>
          </div>
          <button className="btn btn-primary" style={{width:'100%'}} onClick={() => setModo('login')}>
            Ir a ingresar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">
          <img src="/logo.png" alt="Pick&Go" style={{width:110,height:110,borderRadius:22,border:'3px solid var(--dorado)',boxShadow:'0 4px 20px rgba(201,162,39,0.4)'}} />
          <h1>Pick&amp;Go</h1>
          <p className="sub">
            {modo === 'login' ? 'INGRESÁ A TU CUENTA' : modo === 'registro' ? 'CREÁ TU CUENTA GRATIS' : 'RECUPERAR CONTRASEÑA'}
          </p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {msgRecupero && <div className="alert alert-success">{msgRecupero}</div>}

        <form onSubmit={handleSubmit}>
          {modo === 'registro' && (
            <>
              <div className="form-group">
                <label className="form-label">Nombre de usuario</label>
                <input className="form-input" type="text" placeholder="ej: juanrugby" value={username}
                  onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s/g,''))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Nombre completo (opcional)</label>
                <input className="form-input" type="text" placeholder="Tu nombre" value={nombre}
                  onChange={e => setNombre(e.target.value)} />
              </div>
            </>
          )}

          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" placeholder="tu@email.com" value={email}
              onChange={e => setEmail(e.target.value)} required />
          </div>

          {modo !== 'recuperar' && (
            <div className="form-group">
              <label className="form-label">Contraseña</label>
              <input className="form-input" type="password"
                placeholder={modo === 'registro' ? 'Mínimo 6 caracteres' : '••••••••'}
                value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{width:'100%',padding:'13px',marginBottom:8}} disabled={loading}>
            {loading
              ? <><span className="spinner"></span> Cargando...</>
              : modo === 'login' ? 'Ingresar'
              : modo === 'registro' ? 'Crear cuenta'
              : 'Enviar email de recuperación'
            }
          </button>

          {modo === 'login' && (
            <button type="button" className="btn btn-secondary" style={{width:'100%',padding:'11px'}}
              onClick={() => { setModo('recuperar'); setError(''); setMsgRecupero('') }}>
              Olvidé mi contraseña
            </button>
          )}
        </form>

        <div className="auth-switch" style={{marginTop:16}}>
          {modo === 'login' && (
            <span>¿No tenés cuenta? <a onClick={() => { setModo('registro'); setError('') }}>Registrate</a></span>
          )}
          {modo === 'registro' && (
            <span>¿Ya tenés cuenta? <a onClick={() => { setModo('login'); setError('') }}>Ingresá</a></span>
          )}
          {modo === 'recuperar' && (
            <span><a onClick={() => { setModo('login'); setError(''); setMsgRecupero('') }}>← Volver a ingresar</a></span>
          )}
        </div>
      </div>
    </div>
  )
}
