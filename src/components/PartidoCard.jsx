import { useState } from 'react'

function scoreRandom() {
  return Math.floor(Math.random() * 46) + 3
}

const estilosMoneda = `
@keyframes flipMoneda {
  0%   { transform: perspective(300px) rotateY(0deg); }
  100% { transform: perspective(300px) rotateY(1440deg); }
}
.moneda-flip {
  animation: flipMoneda 1.4s cubic-bezier(0.4,0,0.2,1) forwards;
}
.moneda-flip-global {
  animation: flipMoneda 1.4s cubic-bezier(0.4,0,0.2,1) forwards;
}
`

function MonedaBoton({ girando, onClick, size = 28 }) {
  return (
    <button
      onClick={onClick}
      disabled={girando}
      title="Tirar la moneda"
      style={{
        background: 'none', border: 'none',
        cursor: girando ? 'not-allowed' : 'pointer',
        padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: girando ? 0.6 : 1,
      }}
    >
      <div
        className={girando ? 'moneda-flip' : ''}
        style={{ width: size, height: size, transformStyle: 'preserve-3d' }}
      >
        <svg viewBox="0 0 28 28" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id={`coinG${size}`} cx="35%" cy="30%" r="65%">
              <stop offset="0%" stopColor="#ffe97a"/>
              <stop offset="45%" stopColor="#C9A227"/>
              <stop offset="100%" stopColor="#7a5c00"/>
            </radialGradient>
          </defs>
          <circle cx="14" cy="14" r="13" fill={`url(#coinG${size})`} stroke="#9a7a1a" strokeWidth="1.2"/>
          <circle cx="14" cy="14" r="10.5" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.8"/>
          {/* Pelota de rugby simple */}
          <ellipse cx="14" cy="14" rx="6" ry="4" fill="none" stroke="#7a5c00" strokeWidth="1.4"/>
          <line x1="14" y1="10" x2="14" y2="18" stroke="#7a5c00" strokeWidth="1.1" strokeLinecap="round"/>
          <line x1="10.5" y1="13" x2="17.5" y2="13" stroke="#7a5c00" strokeWidth="0.9" strokeLinecap="round"/>
          <line x1="10.5" y1="15" x2="17.5" y2="15" stroke="#7a5c00" strokeWidth="0.9" strokeLinecap="round"/>
        </svg>
      </div>
    </button>
  )
}

export function MonedaGlobal({ girando, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={girando}
      title="Tirar la moneda para todos"
      style={{
        background: 'none', border: 'none',
        cursor: girando ? 'not-allowed' : 'pointer',
        padding: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 3,
        opacity: girando ? 0.6 : 1,
        filter: 'drop-shadow(0 2px 5px rgba(201,162,39,0.5))',
      }}
    >
      <div
        className={girando ? 'moneda-flip-global' : ''}
        style={{ width: 44, height: 44, transformStyle: 'preserve-3d' }}
      >
        <svg viewBox="0 0 44 44" width="44" height="44" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="coinBig" cx="35%" cy="30%" r="65%">
              <stop offset="0%" stopColor="#ffe97a"/>
              <stop offset="45%" stopColor="#C9A227"/>
              <stop offset="100%" stopColor="#7a5c00"/>
            </radialGradient>
          </defs>
          <circle cx="22" cy="22" r="21" fill="url(#coinBig)" stroke="#9a7a1a" strokeWidth="1.5"/>
          <circle cx="22" cy="22" r="17" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1"/>
          <ellipse cx="22" cy="22" rx="9" ry="6" fill="none" stroke="#7a5c00" strokeWidth="2"/>
          <line x1="22" y1="16" x2="22" y2="28" stroke="#7a5c00" strokeWidth="1.6" strokeLinecap="round"/>
          <line x1="16" y1="20" x2="28" y2="20" stroke="#7a5c00" strokeWidth="1.3" strokeLinecap="round"/>
          <line x1="16" y1="22" x2="28" y2="22" stroke="#7a5c00" strokeWidth="1.3" strokeLinecap="round"/>
          <line x1="16" y1="24" x2="28" y2="24" stroke="#7a5c00" strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
      </div>
      <span style={{fontSize:10,color:'var(--dorado-oscuro)',fontWeight:700,letterSpacing:0.3}}>
        {girando ? 'TIRANDO...' : 'TIRAR TODO'}
      </span>
    </button>
  )
}

function Escudo({ equipo }) {
  if (!equipo) return null
  const ini = equipo.nombre_corto || equipo.nombre?.substring(0,3).toUpperCase()
  return (
    <div className="equipo-escudo" title={equipo.nombre}>
      {equipo.escudo_url ? <img src={equipo.escudo_url} alt={equipo.nombre} /> : ini}
    </div>
  )
}

function FilaEquipos({ partido, marcador }) {
  const vsStyle = partido.es_especial ? 'destacado-vs' : 'vs-badge'
  return (
    <div className="partido-fila">
      <div className="equipo-lado local">
        <span className="equipo-nombre">{partido.equipo_local?.nombre}</span>
        <Escudo equipo={partido.equipo_local} />
      </div>
      <div className="marcador-central">
        {marcador || <div className={vsStyle}>VS</div>}
      </div>
      <div className="equipo-lado visitante">
        <Escudo equipo={partido.equipo_visitante} />
        <span className="equipo-nombre">{partido.equipo_visitante?.nombre}</span>
      </div>
    </div>
  )
}

export function PartidoCardPrediccion({ partido, pred, abierto, onUpdate }) {
  const [girando, setGirando] = useState(false)
  const tienePred = pred?.local !== undefined && pred?.visitante !== undefined

  const estiloCard = partido.es_especial ? {} : tienePred ? {
    borderColor: '#16a34a',
    background: 'linear-gradient(135deg, #f0fdf4, #ffffff)'
  } : {}

  const claseCard = partido.es_especial ? 'partido-card especial' : 'partido-card'

  function tirarMoneda() {
    if (girando) return
    setGirando(true)
    setTimeout(() => {
      onUpdate(partido.id, 'local', scoreRandom())
      onUpdate(partido.id, 'visitante', scoreRandom())
      setGirando(false)
    }, 1500)
  }

  const contenido = (
    <>
      <style>{estilosMoneda}</style>

      {/* Moneda flotante esquina superior derecha */}
      {abierto && (
        <div style={{
          position: 'absolute', top: 6, right: 6,
          filter: 'drop-shadow(0 2px 4px rgba(201,162,39,0.4))'
        }}>
          <MonedaBoton girando={girando} onClick={tirarMoneda} size={28} />
        </div>
      )}

      {partido.es_especial && (
        <div className="destacado-header">
          <div className="destacado-linea destacado-linea-izq"></div>
          <div className="destacado-badge">EL DESTACADO ★</div>
          <div className="destacado-linea destacado-linea-der"></div>
        </div>
      )}
      {partido.es_especial && (
        <div className="destacado-subtitulo">puntaje doble · exacto 6 pts · ganador 2 pts</div>
      )}

      <FilaEquipos partido={partido} />

      {abierto ? (
        <div className="prediccion-inputs">
          <input type="number" className="score-input" min="0" max="120"
            value={pred?.local ?? ''} placeholder="0"
            onChange={e => onUpdate(partido.id, 'local', e.target.value)} />
          <span className="score-separator">—</span>
          <input type="number" className="score-input" min="0" max="120"
            value={pred?.visitante ?? ''} placeholder="0"
            onChange={e => onUpdate(partido.id, 'visitante', e.target.value)} />
        </div>
      ) : (
        <div style={{textAlign:'center',fontSize:13,color:'var(--texto-suave)',marginTop:8}}>
          {tienePred
            ? <>Tu predicción: <strong style={{color:'var(--azul)'}}>{pred.local} — {pred.visitante}</strong></>
            : 'Sin predicción cargada'
          }
        </div>
      )}
    </>
  )

  if (partido.es_especial) {
    return (
      <div className="destacado-wrapper">
        <div className="destacado-inner" style={{position:'relative'}}>{contenido}</div>
      </div>
    )
  }

  return (
    <div className={claseCard} style={{...estiloCard, position:'relative'}}>
      {contenido}
    </div>
  )
}

export function PartidoCardResultado({ partido, pred }) {
  let badge = null
  let claseCard = partido.es_especial ? 'partido-card especial' : 'partido-card'

  if (pred !== undefined) {
    const mult = partido.es_especial ? 2 : 1
    const exacto = pred.local === partido.resultado_local && pred.visitante === partido.resultado_visitante
    const signo = !exacto && (
      (pred.local > pred.visitante && partido.resultado_local > partido.resultado_visitante) ||
      (pred.local < pred.visitante && partido.resultado_local < partido.resultado_visitante) ||
      (pred.local === pred.visitante && partido.resultado_local === partido.resultado_visitante)
    )
    if (exacto) { claseCard += ' acertado-exacto'; badge = <span className="resultado-badge badge-exacto">+{3*mult} exacto</span> }
    else if (signo) { claseCard += ' acertado-signo'; badge = <span className="resultado-badge badge-signo">+{1*mult} signo</span> }
    else { claseCard += ' fallado'; badge = <span className="resultado-badge badge-nada">0 pts</span> }
  }

  const marcador = <div className="marcador-resultado">{partido.resultado_local} — {partido.resultado_visitante}</div>

  const contenido = (
    <>
      {partido.es_especial && (
        <div className="destacado-header">
          <div className="destacado-linea destacado-linea-izq"></div>
          <div className="destacado-badge">EL DESTACADO ★</div>
          <div className="destacado-linea destacado-linea-der"></div>
        </div>
      )}
      <FilaEquipos partido={partido} marcador={marcador} />
      <div style={{textAlign:'center',fontSize:13,color:'var(--texto-suave)',marginTop:8}}>
        {pred !== undefined
          ? <><span>Tu pred: <strong style={{color:'var(--azul)'}}>{pred.local} — {pred.visitante}</strong></span> {badge}</>
          : <span>Sin predicción cargada</span>
        }
      </div>
    </>
  )

  if (partido.es_especial) {
    return (
      <div className="destacado-wrapper">
        <div className="destacado-inner">{contenido}</div>
      </div>
    )
  }

  return <div className={claseCard}>{contenido}</div>
}
