import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

function mensajeError(msg) {
  if (!msg) return 'Ocurrió un error, intentá de nuevo'
  if (msg.includes('already registered') || msg.includes('already been registered')) return 'Ya existe una cuenta con este email'
  if (msg.includes('Password should be at least')) return 'La contraseña debe tener al menos 6 caracteres'
  if (msg.includes('invalid format') || msg.includes('Unable to validate email')) return 'El formato del email no es válido'
  if (msg.includes('rate limit') || msg.includes('too many')) return 'Demasiados intentos, esperá un momento'
  if (msg.includes('not confirmed')) return 'Confirmá tu email antes de ingresar'
  return 'Ocurrió un error, intentá de nuevo'
}

export default function Login({ modoInicial = 'login' }) {
  const [email, setEmail]           = useState('')
  const [password, setPassword]     = useState('')
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [modo, setModo]             = useState(modoInicial)
  const [username, setUsername]     = useState('')
  const [nombre, setNombre]         = useState('')
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
      else navigate('/home')
    } else if (modo === 'registro') {
      if (!username || username.length < 3) {
        setError('El usuario debe tener al menos 3 caracteres')
        setLoading(false)
        return
      }
      const { error } = await signUp({ email, password, username, nombreCompleto: nombre })
      if (error) setError(mensajeError(error.message))
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

  // ── Confirmación ──────────────────────────────────────────────
  if (modo === 'confirmacion') {
    return (
      <div className="login-screen">
        <div className="login-backdrop" aria-hidden="true">
          <div className="login-glow" />
          <div className="login-grid" />
        </div>
        <div className="login-body" style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: 16 }}>
          <div style={{ fontSize: 56 }}>🏉</div>
          <div className="login-mark-logo">
            <span className="login-mark-01">01</span>
            <span className="login-mark-dot">·</span>
            <span className="login-mark-cur">CURRENT</span>
          </div>
          <div style={{ fontFamily: 'var(--pg-display)', fontSize: 24, fontWeight: 800, color: 'var(--pg-text)', marginTop: 8 }}>
            ¡Listo!
          </div>
          <div className="login-tag" style={{ letterSpacing: '0.14em' }}>
            Revisá tu email para confirmar la cuenta
          </div>
          <button
            className="login-cta"
            style={{ marginTop: 16, width: '100%' }}
            onClick={() => setModo('login')}
          >
            <span>Ir a ingresar</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M5 12h13m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    )
  }

  const ctaLabel = loading
    ? 'Cargando...'
    : modo === 'login'    ? 'Entrar al campo'
    : modo === 'registro' ? 'Sumarme al prode'
    : 'Enviar email de recuperación'

  return (
    <div className="login-screen">

      {/* ── Backdrop ── */}
      <div className="login-backdrop" aria-hidden="true">
        <div className="login-glow" />
        <div className="login-grid" />
      </div>

      <div className="login-body">

        {/* ── Mark ── */}
        <div className="login-mark">
          <div className="login-mark-rays" />
          <div className="login-mark-logo">
            <span className="login-mark-01">01</span>
            <span className="login-mark-dot">·</span>
            <span className="login-mark-cur">CURRENT</span>
          </div>
          <div className="login-tag">Prode URBA · Temporada 2026</div>
        </div>

        {/* ── Tickers ── */}
        <div className="login-tickers">
          <div className="login-ticker">
            <span className="login-ticker-dot" />
            Top 14 · En curso
          </div>
          <div className="login-ticker">
            <span className="login-ticker-num">5</span>
            torneos URBA
          </div>
        </div>

        {/* ── Tabs (login / registro) ── */}
        {modo !== 'recuperar' && (
          <div className="login-tabs">
            <button
              type="button"
              className={`login-tab-btn${modo === 'login' ? ' login-tab-btn-active' : ''}`}
              onClick={() => { setModo('login'); setError('') }}
            >
              Ingresar
            </button>
            <button
              type="button"
              className={`login-tab-btn${modo === 'registro' ? ' login-tab-btn-active' : ''}`}
              onClick={() => { setModo('registro'); setError('') }}
            >
              Crear cuenta
            </button>
          </div>
        )}

        {/* ── Form ── */}
        <form className="login-form" onSubmit={handleSubmit}>

          {error      && <div className="alert alert-error">{error}</div>}
          {msgRecupero && <div className="alert alert-success">{msgRecupero}</div>}

          {modo === 'registro' && (
            <>
              <label className="login-field">
                <span className="login-field-lbl">Usuario</span>
                <input
                  className="login-field-input"
                  type="text"
                  placeholder="ej: juanrugby"
                  value={username}
                  onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                  required
                />
              </label>
              <label className="login-field">
                <span className="login-field-lbl">Nombre completo (opcional)</span>
                <input
                  className="login-field-input"
                  type="text"
                  placeholder="Tu nombre"
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                />
              </label>
            </>
          )}

          <label className="login-field">
            <span className="login-field-lbl">Email</span>
            <input
              className="login-field-input"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </label>

          {modo !== 'recuperar' && (
            <label className="login-field">
              <span className="login-field-lbl">Contraseña</span>
              <input
                className="login-field-input"
                type="password"
                placeholder={modo === 'registro' ? 'Mínimo 6 caracteres' : '••••••••'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </label>
          )}

          <button type="submit" className="login-cta" disabled={loading}>
            <span>{ctaLabel}</span>
            {!loading && (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h13m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>

          {modo === 'login' && (
            <>
              <div className="login-divider"><span>o</span></div>
              <button
                type="button"
                className="login-cta-ghost"
                onClick={() => { setModo('recuperar'); setError(''); setMsgRecupero('') }}
              >
                Olvidé mi contraseña
              </button>
            </>
          )}

        </form>

        {/* ── Switch ── */}
        <div className="login-switch">
          {modo === 'login' && (
            <span>¿No tenés cuenta? <a onClick={() => { setModo('registro'); setError('') }}>Registrate</a></span>
          )}
          {modo === 'registro' && (
            <span>¿Ya tenés cuenta? <a onClick={() => { setModo('login'); setError('') }}>Ingresá</a></span>
          )}
          {modo === 'recuperar' && (
            <a onClick={() => { setModo('login'); setError(''); setMsgRecupero('') }}>← Volver a ingresar</a>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="login-foot">
          Al continuar aceptás las reglas del juego. Ningún try queda sin contar.
        </div>

      </div>
    </div>
  )
}
