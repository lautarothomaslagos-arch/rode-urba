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
      <span style={{fontSize:9,color:'var(--dorado-oscuro)',fontWeight:700,letterSpacing:0.5,marginTop:3,whiteSpace:'nowrap'}}>
        {girando ? 'SORTEANDO...' : 'SORTEAR'}
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
    <div>
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
    </div>
  )
}

export function PartidoCardPrediccion({ partido, pred, abierto, onUpdate }) {
  const [girando, setGirando] = useState(false)
  const tienePred = pred?.local !== undefined && pred?.visitante !== undefined

  const estiloCard = partido.es_especial ? {} : tienePred ? {
    borderColor: 'var(--dorado)',
    background: 'linear-gradient(135deg, var(--dorado-claro), #ffffff)'
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

      {abierto && (
        <div style={{position:'absolute', top:6, right:6}}>
          <MonedaBoton girando={girando} onClick={tirarMoneda} size={22} />
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
          <input type="text" inputMode="numeric" pattern="[0-9]*" className="score-input"
            value={pred?.local ?? ''} placeholder="0"
            onChange={e => onUpdate(partido.id, 'local', e.target.value.replace(/\D/g, ''))} />
          <span className="score-separator">—</span>
          <input type="text" inputMode="numeric" pattern="[0-9]*" className="score-input"
            value={pred?.visitante ?? ''} placeholder="0"
            onChange={e => onUpdate(partido.id, 'visitante', e.target.value.replace(/\D/g, ''))} />
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
