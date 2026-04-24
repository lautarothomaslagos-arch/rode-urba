import { useState } from 'react'

function scoreRandom() {
  return Math.floor(Math.random() * 46) + 3
}

const estilosMoneda = `
@keyframes flipMoneda {
  0%   { transform: perspective(200px) rotateY(0deg); }
  50%  { transform: perspective(200px) rotateY(900deg); }
  100% { transform: perspective(200px) rotateY(1800deg); }
}
@keyframes flipMonedaGlobal {
  0%   { transform: perspective(200px) rotateY(0deg); }
  50%  { transform: perspective(200px) rotateY(900deg); }
  100% { transform: perspective(200px) rotateY(1800deg); }
}
.moneda-flip {
  animation: flipMoneda 1.4s cubic-bezier(0.4,0,0.2,1) forwards;
}
.moneda-flip-global {
  animation: flipMonedaGlobal 1.4s cubic-bezier(0.4,0,0.2,1) forwards;
}
`

// SVG cara A — arco de rugby (H)
const CaraArco = () => (
  <svg viewBox="0 0 36 36" width="36" height="36" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="coinA" cx="35%" cy="30%" r="65%">
        <stop offset="0%" stopColor="#e8e8e8"/>
        <stop offset="40%" stopColor="#c0c0c0"/>
        <stop offset="100%" stopColor="#787878"/>
      </radialGradient>
      <radialGradient id="coinEdgeA" cx="50%" cy="50%" r="50%">
        <stop offset="85%" stopColor="transparent"/>
        <stop offset="100%" stopColor="rgba(0,0,0,0.25)"/>
      </radialGradient>
    </defs>
    <circle cx="18" cy="18" r="17" fill="url(#coinA)" stroke="#888" strokeWidth="1.2"/>
    <circle cx="18" cy="18" r="17" fill="url(#coinEdgeA)"/>
    {/* Arco de rugby (H) */}
    <line x1="11" y1="8" x2="11" y2="28" stroke="#555" strokeWidth="2.2" strokeLinecap="round"/>
    <line x1="25" y1="8" x2="25" y2="28" stroke="#555" strokeWidth="2.2" strokeLinecap="round"/>
    <line x1="11" y1="18" x2="25" y2="18" stroke="#555" strokeWidth="2.2" strokeLinecap="round"/>
    {/* Pelota en el arco */}
    <ellipse cx="18" cy="11" rx="3.5" ry="2.2" fill="none" stroke="#777" strokeWidth="1.2"/>
  </svg>
)

// SVG cara B — pelota de rugby
const CaraPelota = () => (
  <svg viewBox="0 0 36 36" width="36" height="36" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="coinB" cx="35%" cy="30%" r="65%">
        <stop offset="0%" stopColor="#d8d8d8"/>
        <stop offset="40%" stopColor="#b0b0b0"/>
        <stop offset="100%" stopColor="#686868"/>
      </radialGradient>
    </defs>
    <circle cx="18" cy="18" r="17" fill="url(#coinB)" stroke="#888" strokeWidth="1.2"/>
    {/* Pelota de rugby */}
    <ellipse cx="18" cy="18" rx="9" ry="6" fill="none" stroke="#555" strokeWidth="1.8"/>
    <line x1="18" y1="12" x2="18" y2="24" stroke="#555" strokeWidth="1.4" strokeLinecap="round"/>
    <line x1="13" y1="16" x2="23" y2="16" stroke="#555" strokeWidth="1.1" strokeLinecap="round"/>
    <line x1="13" y1="18" x2="23" y2="18" stroke="#555" strokeWidth="1.1" strokeLinecap="round"/>
    <line x1="13" y1="20" x2="23" y2="20" stroke="#555" strokeWidth="1.1" strokeLinecap="round"/>
  </svg>
)

function Moneda({ girando, onClick, size = 36 }) {
  const [cara, setCara] = useState('arco')

  function handleClick() {
    if (girando) return
    onClick()
    // Alternar cara al terminar la animación
    setTimeout(() => setCara(c => c === 'arco' ? 'pelota' : 'arco'), 1400)
  }

  return (
    <button
      onClick={handleClick}
      disabled={girando}
      title="Tirar la moneda"
      style={{
        background: 'none', border: 'none',
        cursor: girando ? 'not-allowed' : 'pointer',
        padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, opacity: girando ? 0.7 : 1,
        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.25))',
        transition: 'filter 0.15s',
      }}
    >
      <div
        className={girando ? 'moneda-flip' : ''}
        style={{ width: size, height: size, transformStyle: 'preserve-3d' }}
      >
        {cara === 'arco' ? <CaraArco /> : <CaraPelota />}
      </div>
    </button>
  )
}

function MonedaGlobal({ girando, onClick }) {
  const [cara, setCara] = useState('arco')

  function handleClick() {
    if (girando) return
    onClick()
    setTimeout(() => setCara(c => c === 'arco' ? 'pelota' : 'arco'), 1400)
  }

  return (
    <button
      onClick={handleClick}
      disabled={girando}
      title="Tirar la moneda para todos los partidos"
      style={{
        background: 'none', border: 'none',
        cursor: girando ? 'not-allowed' : 'pointer',
        padding: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 3,
        opacity: girando ? 0.7 : 1,
        filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.3))',
      }}
    >
      <div
        className={girando ? 'moneda-flip-global' : ''}
        style={{ width: 48, height: 48, transformStyle: 'preserve-3d' }}
      >
        <svg viewBox="0 0 48 48" width="48" height="48" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="coinG" cx="35%" cy="30%" r="65%">
              <stop offset="0%" stopColor="#e8e8e8"/>
              <stop offset="40%" stopColor="#c0c0c0"/>
              <stop offset="100%" stopColor="#787878"/>
            </radialGradient>
          </defs>
          <circle cx="24" cy="24" r="22" fill="url(#coinG)" stroke="#888" strokeWidth="1.5"/>
          {cara === 'arco' ? (
            <>
              <line x1="14" y1="10" x2="14" y2="38" stroke="#555" strokeWidth="2.8" strokeLinecap="round"/>
              <line x1="34" y1="10" x2="34" y2="38" stroke="#555" strokeWidth="2.8" strokeLinecap="round"/>
              <line x1="14" y1="24" x2="34" y2="24" stroke="#555" strokeWidth="2.8" strokeLinecap="round"/>
              <ellipse cx="24" cy="14" rx="4.5" ry="2.8" fill="none" stroke="#777" strokeWidth="1.5"/>
            </>
          ) : (
            <>
              <ellipse cx="24" cy="24" rx="12" ry="8" fill="none" stroke="#555" strokeWidth="2.2"/>
              <line x1="24" y1="16" x2="24" y2="32" stroke="#555" strokeWidth="1.8" strokeLinecap="round"/>
              <line x1="17" y1="21" x2="31" y2="21" stroke="#555" strokeWidth="1.4" strokeLinecap="round"/>
              <line x1="17" y1="24" x2="31" y2="24" stroke="#555" strokeWidth="1.4" strokeLinecap="round"/>
              <line x1="17" y1="27" x2="31" y2="27" stroke="#555" strokeWidth="1.4" strokeLinecap="round"/>
            </>
          )}
        </svg>
      </div>
      <span style={{fontSize:10,color:'#777',fontWeight:600,letterSpacing:0.3}}>
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

function FilaEquipos({ partido, marcador, onTirar, girando }) {
  const vsStyle = partido.es_especial ? 'destacado-vs' : 'vs-badge'
  return (
    <div className="partido-fila">
      <div className="equipo-lado local">
        <span className="equipo-nombre">{partido.equipo_local?.nombre}</span>
        <Escudo equipo={partido.equipo_local} />
      </div>
      <div className="marcador-central" style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
        {marcador || <div className={vsStyle}>VS</div>}
        {onTirar && (
          <Moneda girando={girando} onClick={onTirar} size={30} />
        )}
      </div>
      <div className="equipo-lado visitante">
        <Escudo equipo={partido.equipo_visitante} />
        <span className="equipo-nombre">{partido.equipo_visitante?.nombre}</span>
      </div>
    </div>
  )
}

export { MonedaGlobal }

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

      <FilaEquipos
        partido={partido}
        onTirar={abierto ? tirarMoneda : null}
        girando={girando}
      />

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
        <div className="destacado-inner">{contenido}</div>
      </div>
    )
  }

  return <div className={claseCard} style={estiloCard}>{contenido}</div>
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
