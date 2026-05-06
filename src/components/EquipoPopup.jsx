import { formaIcon } from '../lib/equipoStats'

function SingleCard({ stats, onClose, compact }) {
  const { equipo, pj, g, e, pe, pf, pc, forma } = stats
  const ini = equipo.nombre_corto || equipo.nombre?.slice(0,3).toUpperCase() || '?'

  return (
    <div style={{
      background: 'white',
      borderRadius: compact ? 12 : 16,
      boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
      overflow: 'hidden',
      flex: 1,
      minWidth: 0,
      animation: 'popupEnter 0.2s cubic-bezier(0.34,1.56,0.64,1)',
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg,var(--azul),var(--azul-medio))',
        padding: compact ? '10px 10px 8px' : '14px 14px 12px',
        display: 'flex', alignItems: 'center', gap: compact ? 7 : 12,
        position: 'relative',
      }}>
        <div style={{
          width: compact ? 32 : 48, height: compact ? 32 : 48,
          borderRadius: compact ? 7 : 10, flexShrink: 0,
          background: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden',
          border: '2px solid rgba(201,162,39,0.5)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        }}>
          {equipo.escudo_url
            ? <img src={equipo.escudo_url} alt={equipo.nombre} style={{width:'85%',height:'85%',objectFit:'contain'}} />
            : <span style={{fontSize: compact ? 8 : 13, fontWeight:700, color:'var(--azul)'}}>{ini}</span>
          }
        </div>

        <div style={{flex:1, minWidth:0}}>
          <div style={{
            fontFamily:'Rajdhani,sans-serif',
            fontSize: compact ? 13 : 16,
            fontWeight:700, color:'white', lineHeight:1.2, wordBreak:'break-word',
          }}>
            {equipo.nombre_corto || equipo.nombre}
          </div>
          {pj > 0 && (
            <div style={{fontSize: compact ? 9 : 11, color:'rgba(255,255,255,0.55)', marginTop:2}}>
              {pj} partido{pj!==1?'s':''}
            </div>
          )}
        </div>

        <button onClick={onClose} style={{
          position:'absolute', top: compact ? 6 : 8, right: compact ? 6 : 8,
          background:'rgba(255,255,255,0.15)', border:'none',
          borderRadius:20, width: compact ? 20 : 24, height: compact ? 20 : 24,
          color:'white', fontSize: compact ? 10 : 12, cursor:'pointer',
          display:'flex', alignItems:'center', justifyContent:'center',
          flexShrink:0,
        }}>✕</button>
      </div>

      {pj === 0 ? (
        <div style={{padding: compact ? '14px 10px' : '20px 16px', textAlign:'center', color:'var(--texto-suave)', fontSize:12}}>
          Sin partidos registrados todavía.
        </div>
      ) : (
        <div style={{padding: compact ? '8px 8px 10px' : '12px 14px 14px'}}>

          {/* G / E / P */}
          <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap: compact ? 3 : 5, marginBottom: compact ? 5 : 10}}>
            {[
              {v:g,  l:'G', c:'#16a34a'},
              {v:e,  l:'E', c:'#ca8a04'},
              {v:pe, l:'P', c:'#dc2626'},
            ].map(s => (
              <div key={s.l} style={{
                textAlign:'center', padding: compact ? '5px 2px' : '7px 4px',
                background:'var(--gris)', borderRadius: compact ? 6 : 8,
              }}>
                <div style={{fontFamily:'Rajdhani,sans-serif', fontSize: compact ? 17 : 18, fontWeight:700, color:s.c, lineHeight:1}}>{s.v}</div>
                <div style={{fontSize: compact ? 8 : 9, color:'var(--texto-suave)', marginTop:2, fontWeight:600}}>{s.l}</div>
              </div>
            ))}
          </div>

          {/* PF / PC */}
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap: compact ? 3 : 5, marginBottom: compact ? 6 : 10}}>
            {[
              {v:pf, l:'A favor',   c:'#16a34a'},
              {v:pc, l:'En contra', c:'#dc2626'},
            ].map(s => (
              <div key={s.l} style={{
                textAlign:'center', padding: compact ? '5px 2px' : '7px 4px',
                background:'var(--gris)', borderRadius: compact ? 6 : 8,
              }}>
                <div style={{fontFamily:'Rajdhani,sans-serif', fontSize: compact ? 15 : 16, fontWeight:700, color:s.c, lineHeight:1}}>{s.v}</div>
                <div style={{fontSize: compact ? 8 : 9, color:'var(--texto-suave)', marginTop:2, fontWeight:600, lineHeight:1.2}}>{s.l}</div>
              </div>
            ))}
          </div>

          {/* Forma */}
          {forma?.length > 0 && (
            <div>
              <div style={{fontSize: compact ? 8 : 9, fontWeight:700, color:'var(--texto-suave)', textTransform:'uppercase', letterSpacing:0.5, marginBottom: compact ? 3 : 5}}>
                Forma
              </div>
              <div style={{display:'flex', gap: compact ? 2 : 4, justifyContent:'center'}}>
                {Array.from({length:5}).map((_,i) => {
                  const res = forma[i]
                  const sz = compact ? 22 : 28
                  if (!res) return <div key={i} style={{width:sz, height:sz, borderRadius: compact ? 5 : 7, background:'#f3f4f6', border:'1px solid #e5e7eb'}} />
                  const f = formaIcon(res)
                  return (
                    <div key={i} style={{
                      width:sz, height:sz, borderRadius: compact ? 5 : 7,
                      background:f.bg, border:`1.5px solid ${f.color}40`,
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize: compact ? 7 : 10, fontWeight:800, color:f.color,
                    }}>{f.icon}</div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function EquipoPopup({ equipos, onClose, onCloseOne, rivalStats, onAddRival }) {
  if (!equipos?.length) return null
  const isDouble = equipos.length === 2

  return (
    <>
      <div onClick={onClose} style={{
        position:'fixed', inset:0, zIndex:1000,
        background:'rgba(0,0,0,0.4)',
        backdropFilter:'blur(2px)', WebkitBackdropFilter:'blur(2px)',
      }} />

      <style>{`
        @keyframes popupEnter {
          from { opacity:0; transform:scale(0.88) }
          to   { opacity:1; transform:scale(1)    }
        }
      `}</style>

      <div style={{
        position:'fixed', top:'50%', left:'50%',
        transform:'translate(-50%,-50%)',
        zIndex:1001,
        width: isDouble ? 'min(94vw, 540px)' : 'min(290px, 88vw)',
        display:'flex',
        gap: isDouble ? 8 : 0,
        alignItems: 'stretch',
      }}>
        {equipos.map((stats, idx) => (
          <SingleCard
            key={stats.equipo.id}
            stats={stats}
            compact={isDouble}
            onClose={() => isDouble ? onCloseOne(idx) : onClose()}
          />
        ))}

        {/* Botón "vs Rival" — solo cuando hay 1 card y existe rival */}
        {!isDouble && rivalStats && (
          <button
            onClick={e => { e.stopPropagation(); onAddRival() }}
            style={{
              position:'absolute',
              bottom: -44,
              left:'50%',
              transform:'translateX(-50%)',
              background:'white',
              border:'1px solid var(--gris-borde)',
              borderRadius:20,
              padding:'7px 18px',
              fontSize:12,
              fontWeight:600,
              color:'var(--azul)',
              cursor:'pointer',
              display:'flex',
              alignItems:'center',
              gap:6,
              boxShadow:'0 2px 10px rgba(0,0,0,0.14)',
              whiteSpace:'nowrap',
              transition:'box-shadow 0.15s',
            }}
          >
            {rivalStats.equipo.escudo_url && (
              <img src={rivalStats.equipo.escudo_url} alt="" style={{width:16, height:16, objectFit:'contain'}} />
            )}
            vs {rivalStats.equipo.nombre_corto || rivalStats.equipo.nombre}
          </button>
        )}
      </div>
    </>
  )
}
