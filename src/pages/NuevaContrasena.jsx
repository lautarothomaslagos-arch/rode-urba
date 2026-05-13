import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function NuevaContrasena() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [listo, setListo] = useState(false)
  // null = chequeando, 'pendiente' = tiene token pero no verificado, true = verificado, false = inválido
  const [tokenValido, setTokenValido] = useState(null)
  const [tokenHash, setTokenHash] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    // Caso 0: error en el hash (otp_expired, etc.)
    const hashParams = new URLSearchParams(window.location.hash.slice(1))
    if (hashParams.get('error')) { setTokenValido(false); return }

    // Caso 1: token_hash en query params — NO verificar automáticamente
    // (evita que Gmail pre-scan consuma el token)
    const params = new URLSearchParams(window.location.search)
    const hash = params.get('token_hash')
    const type = params.get('type')
    if (hash && type === 'recovery') {
      setTokenHash(hash)
      setTokenValido('pendiente')
      return
    }

    // Caso 2: flow hash clásico — esperar evento PASSWORD_RECOVERY
    let suscripcion = null
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setTokenValido(true)
    })
    suscripcion = data.subscription
    const timeout = setTimeout(() => {
      setTokenValido(prev => prev === null ? false : prev)
    }, 5000)
    return () => { suscripcion.unsubscribe(); clearTimeout(timeout) }
  }, [])

  async function confirmarToken() {
    setLoading(true)
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'recovery' })
    if (error) setTokenValido(false)
    else setTokenValido(true)
    setLoading(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return }
    if (password !== confirmPassword) { setError('Las contraseñas no coinciden'); return }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) setError('Error al actualizar la contraseña. El link puede haber expirado.')
    else setListo(true)
    setLoading(false)
  }

  if (tokenValido === null) {
    return (
      <div className="auth-container">
        <div className="auth-card" style={{textAlign:'center'}}>
          <div className="spinner" style={{margin:'0 auto 16px'}} />
          <p style={{color:'var(--pg-text-soft)'}}>Verificando link...</p>
        </div>
      </div>
    )
  }

  if (tokenValido === 'pendiente') {
    return (
      <div className="auth-container">
        <div className="auth-card" style={{textAlign:'center'}}>
          <div style={{fontSize:48,marginBottom:12}}>🔑</div>
          <h2 style={{marginBottom:8}}>Restaurar contraseña</h2>
          <p style={{color:'var(--pg-text-soft)',marginBottom:24,fontSize:14}}>
            Hacé click para continuar y crear tu nueva contraseña.
          </p>
          <button className="btn btn-primary" style={{width:'100%',padding:13}} onClick={confirmarToken} disabled={loading}>
            {loading ? <><span className="spinner"></span> Verificando...</> : 'Continuar'}
          </button>
        </div>
      </div>
    )
  }

  if (tokenValido === false) {
    return (
      <div className="auth-container">
        <div className="auth-card" style={{textAlign:'center'}}>
          <div style={{fontSize:48,marginBottom:12}}>🔒</div>
          <h2 style={{marginBottom:8}}>Link inválido o expirado</h2>
          <p style={{color:'var(--pg-text-soft)',marginBottom:24,fontSize:14}}>
            Este link de recuperación no es válido o ya fue usado. Solicitá uno nuevo desde la pantalla de login.
          </p>
          <button className="btn btn-primary" style={{width:'100%',padding:13}} onClick={() => navigate('/login')}>
            Volver al login
          </button>
        </div>
      </div>
    )
  }

  if (listo) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-logo">
            <img src="/logo.png" alt="Pick&Go" style={{width:100,height:100,borderRadius:20,border:'3px solid var(--dorado)'}} />
            <h1>¡Contraseña actualizada!</h1>
            <p className="sub">Ya podés ingresar con tu nueva contraseña</p>
          </div>
          <button className="btn btn-primary" style={{width:'100%',padding:13}} onClick={() => navigate('/login')}>
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
          <img src="/logo.png" alt="Pick&Go" style={{width:100,height:100,borderRadius:20,border:'3px solid var(--dorado)'}} />
          <h1>Pick&amp;Go</h1>
          <p className="sub">NUEVA CONTRASEÑA</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Nueva contraseña</label>
            <input className="form-input" type="password" placeholder="Mínimo 6 caracteres"
              value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
          </div>
          <div className="form-group">
            <label className="form-label">Confirmar contraseña</label>
            <input className="form-input" type="password" placeholder="Repetí la contraseña"
              value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required minLength={6} />
          </div>
          <button type="submit" className="btn btn-primary" style={{width:'100%',padding:13}} disabled={loading}>
            {loading ? <><span className="spinner"></span> Guardando...</> : 'Guardar nueva contraseña'}
          </button>
        </form>
      </div>
    </div>
  )
}
