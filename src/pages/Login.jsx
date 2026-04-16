import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [modo, setModo] = useState('login')
  const [username, setUsername] = useState('')
  const [nombre, setNombre] = useState('')
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
    } else {
      if (!username || username.length < 3) {
        setError('El nombre de usuario debe tener al menos 3 caracteres')
        setLoading(false)
        return
      }
      const { error } = await signUp({ email, password, username, nombreCompleto: nombre })
      if (error) setError(error.message)
      else {
        setError('')
        setModo('confirmacion')
      }
    }
    setLoading(false)
  }

  if (modo === 'confirmacion') {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-logo">
            <div className="logo-big">✓</div>
            <h1>¡Cuenta creada!</h1>
            <p>Revisá tu email para confirmar tu cuenta y luego ingresá</p>
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
          <div className="logo-big">P</div>
          <h1>Prode URBA</h1>
          <p>{modo === 'login' ? 'Ingresá a tu cuenta' : 'Creá tu cuenta gratis'}</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          {modo === 'registro' && (
            <>
              <div className="form-group">
                <label className="form-label">Nombre de usuario</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="ej: juanrugby"
                  value={username}
                  onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s/g,''))}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Nombre completo (opcional)</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="Tu nombre"
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              className="form-input"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <input
              className="form-input"
              type="password"
              placeholder={modo === 'registro' ? 'Mínimo 6 caracteres' : '••••••••'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{width:'100%'}} disabled={loading}>
            {loading ? 'Cargando...' : modo === 'login' ? 'Ingresar' : 'Crear cuenta'}
          </button>
        </form>

        <div className="auth-switch">
          {modo === 'login' ? (
            <span>¿No tenés cuenta? <a onClick={() => { setModo('registro'); setError('') }}>Registrate</a></span>
          ) : (
            <span>¿Ya tenés cuenta? <a onClick={() => { setModo('login'); setError('') }}>Ingresá</a></span>
          )}
        </div>
      </div>
    </div>
  )
}
