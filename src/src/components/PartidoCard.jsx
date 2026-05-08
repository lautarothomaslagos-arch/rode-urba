import { useState } from 'react'

function scoreRandom() {
  return Math.floor(Math.random() * 46) + 3
}

const estilosMoneda = `
@keyframes flipMoneda {
  0%   { transform: perspective(300px) rotateY(0deg); }
  100% { transform: perspective(300px) rotateY(1440deg); }
}
.moneda-flip { animation: flipMoneda 1.4s cubic-bezier(0.4,0,0.2,1) forwards; }
.moneda-flip-global { animation: flipMoneda 1.4s cubic-bezier(0.4,0,0.2,1) forwards; }
`

function SvgMoneda({ size }) {
  const cx = size / 2
  const cy = size / 2
  const r = size / 2 - 1
  const id = `cg${size}`
  const s = size / 28
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id={id} cx="38%" cy="32%" r="62%">
          <stop offset="0%" stopColor="#ffe566"/>
          <stop offset="50%" stopColor="#C9A227"/>
          <stop offset="100%" stopColor="#7a5500"/>
        </radialGradient>
      </defs>
      <circle cx={cx} cy={cy} r={r} fill={`url(#${id})`} stroke="#9a7a1a" strokeWidth={s*1.1}/>
      <ellipse cx={cx*0.72} cy={cy*0.62} rx={r*0.26} ry={r*0.12} fill="rgba(255,255,255,0.22)" transform={`rotate(-20,${cx*0.72},${cy*0.62})`}/>
      <ellipse cx={cx} cy={cy} rx={r*0.52} ry={r*0.34} fill="none" stroke="#7a5500" strokeWidth={s*2} transform={`rotate(-35,${cx},${cy})`}/>
      <ellipse cx={cx} cy={cy} rx={r*0.52} ry={r*0.12} fill="none" stroke="#9a7a1a" strokeWidth={s*1.1} transform={`rotate(-35,${cx},${cy})`}/>
      <line
        x1={cx - r*0.42*Math.cos(Math.PI*35/180)}
        y1={cy - r*0.42*Math.sin(Math.PI*35/180)}
        x2={cx + r*0.42*Math.cos(Math.PI*35/180)}
        y2={cy + r*0.42*Math.sin(Math.PI*35/180)}
        stroke="#7a5500" strokeWidth={s*1.1} strokeLinecap="round"
      />
    </svg>
  )
}

function MonedaBoton({ girando, onClick, size = 22 }) {
  return (
    <button
      onClick={onClick}
      disabled={girando}
      title="Sortear partido"
      style={{
        background: 'none', border: 'none',
        cursor: girando ? 'not-allowed' : 'pointer',
        padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: girando ? 0.5 : 1,
        filter: 'drop-shadow(0 1px 3px rgba(120,90,0,0.4))',
      }}
    >
      <div className={girando ? 'moneda-flip' : ''} style={{ width: size, height: size, transformStyle: 'preserve-3d' }}>
        <SvgMoneda size={size} />
      </div>
    </button>
  )
}

export function MonedaGlobal({ girando, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={girando}
      title="Sortear todos los partidos"
      style={{
        background: 'none', border: 'none',
        cursor: girando ? 'not-allowed' : 'pointer',
        padding: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', opacity: girando ? 0.6 : 1,
        filter: 'drop-shadow(0 2px 4px rgba(120,90,0,0.35))',
      }}
    >
      <div className={girando ? 'moneda-flip-global' : ''} style={{ width: 42, height: 42, transformStyle: 'preserve-3d' }}>
        <SvgMoneda size={42} />
      </div>
      <span style={{fontSize:9,color:'var(--pg-gold-dim)',fontWeight:700,letterSpacing:0.5,marginTop:3,whiteSpace:'nowrap'}}>
        {girando ? 'SORTEANDO...' : 'SORTEAR'}
      </span>
    </button>
  )
}

function Escudo({ equipo, onTap }) {
  if (!equipo) return null
  const ini = equipo.nombre_corto || equipo.nombre?.substring(0,3).toUpperCase()
  return (
    <div
      className="equipo-escudo"
      title={equipo.nombre}
      onClick={onTap ? (e) => { e.stopPropagation(); onTap(equipo) } : undefined}
      style={onTap ? { cursor: 'pointer', transition: 'transform 0.12s', userSelect: 'none' } : undefined}
      onMouseEnter={onTap ? (e) => { e.currentTarget.style.transform = 'scale(1.1)' } : undefined}
      onMouseLeave={onTap ? (e) => { e.currentTarget.style.transform = 'scale(1)' } : undefined}
    >
      {equipo.escudo_url ? <img src={equipo.escudo_url} alt={equipo.nombre} /> : ini}
    </div>
  )
}

function FilaEquipos({ partido, marcador, onEquipoTap }) {
  const vsStyle = partido.es_especial ? 'destacado-vs' : 'vs-badge'
  return (
    <div>
      <div className="partido-fila">
        <div className="equipo-lado local">
          <span className="equipo-nombre">{partido.equipo_local?.nombre}</span>
          <Escudo equipo={partido.equipo_local} onTap={onEquipoTap} />
        </div>
        <div className="marcador-central">
          {marcador || <div className={vsStyle}>VS</div>}
        </div>
        <div className="equipo-lado visitante">
          <Escudo equipo={partido.equipo_visitante} onTap={onEquipoTap} />
          <span className="equipo-nombre">{partido.equipo_visitante?.nombre}</span>
        </div>
      </div>
    </div>
  )
}

// ── Stepper (− input +) ──────────────────────────────────────
function Stepper({ pid, side, value, onUpdate, filled }) {
  const num = parseInt(value) || 0
  return (
    <div className={`prode-stepper${filled ? ' prode-stepper-filled' : ''}`}>
      <button
        className="prode-stepper-btn"
        onClick={() => onUpdate(pid, side, Math.max(0, num - 1))}
      >−</button>
      <input
        type="text" inputMode="numeric" pattern="[0-9]*"
        className="prode-stepper-input"
        value={value ?? ''}
        placeholder="0"
        onChange={e => onUpdate(pid, side, e.target.value.replace(/\D/g, ''))}
      />
      <button
        className="prode-stepper-btn"
        onClick={() => onUpdate(pid, side, Math.min(99, num + 1))}
      >+</button>
    </div>
  )
}

export function PartidoCardPrediccion({ partido, pred, abierto, saved, onUpdate, onEquipoTap }) {
  const [girando, setGirando] = useState(false)

  const filled = pred?.local !== undefined && pred?.visitante !== undefined
  const winner = filled
    ? pred.local > pred.visitante  ? 'local'
    : pred.visitante > pred.local  ? 'visitante'
    : 'empate'
    : null

  function tirarMoneda() {
    if (girando) return
    setGirando(true)
    setTimeout(() => {
      onUpdate(partido.id, 'local',    scoreRandom())
      onUpdate(partido.id, 'visitante', scoreRandom())
      setGirando(false)
    }, 1500)
  }

  const local     = partido.equipo_local
  const visitante = partido.equipo_visitante

  const cardClass = [
    'prode-match-card',
    saved                 && 'prode-match-card-filled',
    partido.es_especial   && 'prode-match-card-hot',
  ].filter(Boolean).join(' ')

  return (
    <div className={cardClass} style={{position:'relative'}}>
      <style>{estilosMoneda}</style>

      {/* Flame badge (destacado) */}
      {partido.es_especial && (
        <div className="prode-match-flame">★ DESTACADO 2× · exacto 6 pts</div>
      )}

      {/* Main row: escudo/nombre — stepper — escudo/nombre */}
      <div className="prode-match-row">

        {/* Local */}
        <div className={`prode-match-side${winner === 'local' ? ' prode-match-side-win' : ''}`}>
          <div
            className="prode-match-crest"
            onClick={onEquipoTap ? () => onEquipoTap(local) : undefined}
            title={local?.nombre}
          >
            {local?.escudo_url
              ? <img src={local.escudo_url} alt={local.nombre}
                  onError={e => e.target.style.display = 'none'} />
              : <span>{local?.nombre_corto?.slice(0,3) || '?'}</span>
            }
          </div>
          <div className="prode-match-team">{local?.nombre_corto || local?.nombre}</div>
        </div>

        {/* Centro: steppers o score cerrado */}
        <div className="prode-match-center">
          {abierto ? (
            <>
              <Stepper pid={partido.id} side="local"     value={pred?.local}     onUpdate={onUpdate} filled={filled} />
              <span className="prode-match-dash">—</span>
              <Stepper pid={partido.id} side="visitante" value={pred?.visitante} onUpdate={onUpdate} filled={filled} />
            </>
          ) : (
            filled
              ? <span className="prode-closed-score">{pred.local} — {pred.visitante}</span>
              : <span style={{fontSize:13,color:'var(--pg-text-mute)',padding:'4px 8px'}}>—</span>
          )}
        </div>

        {/* Visitante */}
        <div className={`prode-match-side${winner === 'visitante' ? ' prode-match-side-win' : ''}`}>
          <div
            className="prode-match-crest"
            onClick={onEquipoTap ? () => onEquipoTap(visitante) : undefined}
            title={visitante?.nombre}
          >
            {visitante?.escudo_url
              ? <img src={visitante.escudo_url} alt={visitante.nombre}
                  onError={e => e.target.style.display = 'none'} />
              : <span>{visitante?.nombre_corto?.slice(0,3) || '?'}</span>
            }
          </div>
          <div className="prode-match-team">{visitante?.nombre_corto || visitante?.nombre}</div>
        </div>
      </div>

      {/* Footer: resumen del pick */}
      {filled && (
        <div className="prode-match-foot">
          Tu pick: <strong>{pred.local} — {pred.visitante}</strong>
          {winner === 'local'     && ` · gana ${local?.nombre_corto     || 'Local'}`}
          {winner === 'visitante' && ` · gana ${visitante?.nombre_corto || 'Visita'}`}
          {winner === 'empate'    && ' · empate'}
        </div>
      )}
    </div>
  )
}

export function PartidoCardResultado({ partido, pred, soloScore = false }) {
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

  const rl = partido.resultado_local
  const rv = partido.resultado_visitante
  const boLocal     = partido.bonus_of_local
  const boVisitante = partido.bonus_of_visitante

  const marcador = (
    <div style={{textAlign:'center'}}>
      <div className="marcador-resultado">{rl} — {rv}</div>
      {(boLocal || boVisitante) && (
        <div style={{display:'flex',justifyContent:'space-between',padding:'0 6px',marginTop:1}}>
          <span style={{fontSize:10,color:'var(--texto)',fontWeight:700,minWidth:16}}>
            {boLocal ? '(B)' : ''}
          </span>
          <span style={{fontSize:10,color:'var(--texto)',fontWeight:700,minWidth:16,textAlign:'right'}}>
            {boVisitante ? '(B)' : ''}
          </span>
        </div>
      )}
    </div>
  )

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
      {!soloScore && (
        <div style={{textAlign:'center',fontSize:13,color:'var(--texto-suave)',marginTop:8}}>
          {pred !== undefined
            ? <><span>Tu pred: <strong style={{color:'var(--pg-text)'}}>{pred.local} — {pred.visitante}</strong></span> {badge}</>
            : <span>Sin predicción cargada</span>
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

  return <div className={claseCard}>{contenido}</div>
}
