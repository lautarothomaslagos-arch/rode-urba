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
  const tienePred = pred?.local !== undefined && pred?.visitante !== undefined

  const estiloCard = partido.es_especial ? {} : tienePred ? {
    borderColor: '#16a34a',
    background: 'linear-gradient(135deg, #f0fdf4, #ffffff)'
  } : {}

  const claseCard = partido.es_especial ? 'partido-card especial' : 'partido-card'

  const contenido = (
    <>
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
