import { formaIcon } from '../lib/equipoStats'

function CardContent({ stats, side, onClose }) {
  const { equipo, pj, g, e, pe, pf, pc, forma } = stats
  const ini = equipo.nombre_corto || equipo.nombre?.slice(0,3).toUpperCase() || '?'

  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      transform: 'translateY(-50%)',
      ...(side === 'left' ? { left: 8 } : { right: 8 }),
      zIndex: 1002,
      width: 'calc(50vw - 12px)',
      maxWidth: 260,
      background: 'white',
      borderRadius: 14,
      boxShadow: '0 12px 40px rgba(0,0,0,0.3)',
      overflow: 'hidden',
      animation: `${side === 'left' ? 'slideFromLeft' : 'slideFromRight'} 0.22s cubic-bezier(0.34,1.4,0.64,1)`,
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg,var(--azul),var(--azul-medio))',
        padding: '10px 10px 8px',
        display: 'flex', alignItems: 'center', gap: 7,
        position: 'relative',
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 7, flexShrink: 0,
          background: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden',
          border: '2px solid rgba(201,162,39,0.5)',
          boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
        }}>
          {equipo.escudo_url
            ? <img src={equipo.escudo_url} alt={equipo.nombre} style={{width:'85%',height:'85%',objectFit:'contain'}} onError={e => e.target.style.display='none'} />
            : <span style={{fontSize:8,fontWeight:700,color:'var(--azul)'}}>{ini}</span>
          }
        </div>

        <div style={{flex:1, minWidth:0}}>
          <div style={{fontFamily:'Rajdhani,sans-serif',fontSize:13,fontWeight:700,color:'white',lineHeight:1.2,wordBreak:'break-word'}}>
            {equipo.nombre_corto || equipo.nombre}
          </div>
          {pj > 0 && (
            <div style={{fontSize:9,color:'rgba(255,255,255,0.55)',marginTop:1}}>
              {pj} partido{pj!==1?'s':''}
            </div>
          )}
        </div>

        <button onClick={onClose} style={{
          position:'absolute', top:6, right:6,
          background:'rgba(255,255,255,0.15)', border:'none',
          borderRadius:20, width:20, height:20,
          color:'white', fontSize:10, cursor:'pointer',
          display:'flex', alignItems:'center', justifyContent:'center',
        }}>✕</button>
      </div>

      {pj === 0 ? (
        <div style={{padding:'14px 10px',textAlign:'center',color:'var(--texto-suave)',fontSize:11}}>
          Sin partidos registrados todavía.
        </div>
      ) : (
        <div style={{padding:'8px 8px 10px'}}>

          {/* G / E / P */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:3,marginBottom:5}}>
            {[
              {v:g,  l:'G', c:'#16a34a'},
              {v:e,  l:'E', c:'#ca8a04'},
              {v:pe, l:'P', c:'#dc2626'},
            ].map(s => (
              <div key={s.l} style={{textAlign:'center',padding:'5px 2px',background:'var(--gris)',borderRadius:6}}>
                <div style={{fontFamily:'Rajdhani,sans-serif',fontSize:17,fontWeight:700,color:s.c,lineHeight:1}}>{s.v}</div>
                <div style={{fontSize:8,color:'var(--texto-suave)',marginTop:2,fontWeight:600}}>{s.l}</div>
              </div>
            ))}
          </div>

          {/* PF / PC */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:3,marginBottom:6}}>
            {[
              {v:pf, l:'A favor',   c:'#16a34a'},
              {v:pc, l:'En contra', c:'#dc2626'},
            ].map(s => (
              <div key={s.l} style={{textAlign:'center',padding:'5px 2px',background:'var(--gris)',borderRadius:6}}>
                <div style={{fontFamily:'Rajdhani,sans-serif',fontSize:15,fontWeight:700,color:s.c,lineHeight:1}}>{s.v}</div>
                <div style={{fontSize:8,color:'var(--texto-suave)',marginTop:2,fontWeight:600,lineHeight:1.2}}>{s.l}</div>
              </div>
            ))}
          </div>

          {/* Forma */}
          {forma?.length > 0 && (
            <div>
              <div style={{fontSize:8,fontWeight:700,color:'var(--texto-suave)',textTransform:'uppercase',letterSpacing:0.5,marginBottom:3}}>
                Forma
              </div>
              <div style={{display:'flex',gap:2,justifyContent:'center'}}>
                {Array.from({length:5}).map((_,i) => {
                  const res = forma[i]
                  if (!res) return <div key={i} style={{width:22,height:22,borderRadius:5,background:'#f3f4f6',border:'1px solid #e5e7eb'}} />
                  const f = formaIcon(res)
                  return (
                    <div key={i} style={{
                      width:22,height:22,borderRadius:5,
                      background:f.bg,border:`1.5px solid ${f.color}40`,
                      display:'flex',alignItems:'center',justifyContent:'center',
                      fontSize:7,fontWeight:800,color:f.color,
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

export default function EquipoPopup({ items, onClose, onCloseOne, rivalStats, rivalSide, onAddRival }) {
  if (!items?.length) return null
  const isDouble = items.length === 2

  return (
    <>
      <style>{`
        @keyframes slideFromLeft {
          from { opacity:0; transform:translateY(-50%) translateX(-16px) scale(0.93) }
          to   { opacity:1; transform:translateY(-50%) translateX(0)      scale(1)   }
        }
        @keyframes slideFromRight {
          from { opacity:0; transform:translateY(-50%) translateX(16px)  scale(0.93) }
          to   { opacity:1; transform:translateY(-50%) translateX(0)      scale(1)   }
        }
        @keyframes rivalAppear {
          from { opacity:0; transform:translateY(-50%) scale(0.7) }
          to   { opacity:1; transform:translateY(-50%) scale(1)   }
        }
        @keyframes rivalPulse {
          0%,100% { box-shadow:0 4px 16px rgba(0,0,0,0.25), 0 0 0 0   rgba(201,162,39,0.5) }
          55%     { box-shadow:0 4px 16px rgba(0,0,0,0.15), 0 0 0 10px rgba(201,162,39,0)   }
        }
      `}</style>

      {/* Backdrop — bloquea el fondo siempre; cierra todo solo con 2 cards */}
      <div
        onClick={isDouble ? onClose : undefined}
        style={{
          position:'fixed', inset:0, zIndex:1000,
          background:'rgba(0,0,0,0.45)',
          backdropFilter:'blur(2px)', WebkitBackdropFilter:'blur(2px)',
          cursor: isDouble ? 'pointer' : 'default',
        }}
      />

      {/* Cards */}
      {items.map((item, idx) => (
        <CardContent
          key={item.stats.equipo.id}
          stats={item.stats}
          side={item.side}
          onClose={() => onCloseOne(idx)}
        />
      ))}

      {/* Escudo rival flotante — solo con 1 card abierta */}
      {!isDouble && rivalStats && (
        <div
          onClick={onAddRival}
          title={rivalStats.equipo.nombre}
          style={{
            position:'fixed',
            top:'50%',
            ...(rivalSide === 'left' ? { left:'calc(25vw - 28px)' } : { right:'calc(25vw - 28px)' }),
            zIndex:1003,
            width:56, height:56,
            borderRadius:'50%',
            background:'white',
            border:'2.5px solid rgba(201,162,39,0.75)',
            display:'flex', alignItems:'center', justifyContent:'center',
            cursor:'pointer',
            overflow:'hidden',
            animation:'rivalAppear 0.2s ease-out, rivalPulse 2s ease-in-out 0.3s infinite',
          }}
        >
          {rivalStats.equipo.escudo_url
            ? <img src={rivalStats.equipo.escudo_url} alt={rivalStats.equipo.nombre} style={{width:'78%',height:'78%',objectFit:'contain'}} onError={e => e.target.style.display='none'} />
            : <span style={{fontSize:10,fontWeight:700,color:'var(--azul)'}}>
                {(rivalStats.equipo.nombre_corto||rivalStats.equipo.nombre?.slice(0,3)||'?').toUpperCase()}
              </span>
          }
        </div>
      )}
    </>
  )
}
