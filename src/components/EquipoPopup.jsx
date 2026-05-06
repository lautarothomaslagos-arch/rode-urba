import { formaIcon } from '../lib/equipoStats'

export default function EquipoPopup({ stats, onClose }) {
  if (!stats) return null
  const { equipo, pj, g, e, pe, pf, pc, dif, pts, bd, forma } = stats

  return (
    <>
      <div onClick={onClose} style={{
        position:'fixed',inset:0,zIndex:1000,
        background:'rgba(0,0,0,0.4)',
        backdropFilter:'blur(2px)',WebkitBackdropFilter:'blur(2px)',
      }} />

      <div style={{
        position:'fixed',top:'50%',left:'50%',
        transform:'translate(-50%,-50%)',
        zIndex:1001,
        width:'min(290px,88vw)',
        background:'white',
        borderRadius:16,
        boxShadow:'0 16px 48px rgba(0,0,0,0.3)',
        overflow:'hidden',
        animation:'popupEnter 0.2s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        <style>{`
          @keyframes popupEnter {
            from{opacity:0;transform:translate(-50%,-50%) scale(0.88)}
            to  {opacity:1;transform:translate(-50%,-50%) scale(1)}
          }
        `}</style>

        {/* Header */}
        <div style={{
          background:'linear-gradient(135deg,var(--azul),var(--azul-medio))',
          padding:'14px 14px 12px',
          display:'flex',alignItems:'center',gap:12,
          position:'relative',
        }}>
          {/* Escudo */}
          <div style={{
            width:48,height:48,borderRadius:10,flexShrink:0,
            background:'white',
            display:'flex',alignItems:'center',justifyContent:'center',
            overflow:'hidden',
            border:'2px solid rgba(201,162,39,0.5)',
            boxShadow:'0 2px 8px rgba(0,0,0,0.2)',
          }}>
            {equipo.escudo_url
              ? <img src={equipo.escudo_url} alt={equipo.nombre} style={{width:'85%',height:'85%',objectFit:'contain'}} />
              : <span style={{fontSize:13,fontWeight:700,color:'var(--azul)'}}>{(equipo.nombre_corto||equipo.nombre?.slice(0,3)||'?').toUpperCase()}</span>
            }
          </div>

          {/* Nombre */}
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontFamily:'Rajdhani,sans-serif',fontSize:16,fontWeight:700,color:'white',lineHeight:1.2,wordBreak:'break-word'}}>
              {equipo.nombre}
            </div>
            {pj > 0 && (
              <div style={{fontSize:11,color:'rgba(255,255,255,0.55)',marginTop:2}}>
                {pj} partido{pj!==1?'s':''} jugado{pj!==1?'s':''}
              </div>
            )}
          </div>

          {/* Cerrar */}
          <button onClick={onClose} style={{
            position:'absolute',top:8,right:8,
            background:'rgba(255,255,255,0.15)',border:'none',
            borderRadius:20,width:24,height:24,
            color:'white',fontSize:12,cursor:'pointer',
            display:'flex',alignItems:'center',justifyContent:'center',
            flexShrink:0,
          }}>✕</button>
        </div>

        {pj === 0 ? (
          <div style={{padding:'20px 16px',textAlign:'center',color:'var(--texto-suave)',fontSize:13}}>
            Sin partidos registrados todavía.
          </div>
        ) : (
          <div style={{padding:'12px 14px 14px'}}>

            {/* PTS URBA destacado */}
            <div style={{
              display:'flex',alignItems:'center',justifyContent:'center',
              gap:6,marginBottom:12,
              background:'var(--dorado-claro)',borderRadius:10,
              padding:'8px 12px',border:'1px solid rgba(201,162,39,0.3)',
            }}>
              <span style={{fontFamily:'Rajdhani,sans-serif',fontSize:26,fontWeight:800,color:'var(--dorado-oscuro)',lineHeight:1}}>{pts}</span>
              <div>
                <div style={{fontSize:10,fontWeight:700,color:'var(--dorado-oscuro)',letterSpacing:0.5}}>PUNTOS URBA</div>
                {bd > 0 && <div style={{fontSize:9,color:'#dc2626',fontWeight:600}}>incl. {bd} bonus def.</div>}
              </div>
            </div>

            {/* G / E / P / DIF */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:5,marginBottom:10}}>
              {[
                {v:g,  l:'G',  c:'#16a34a'},
                {v:e,  l:'E',  c:'#ca8a04'},
                {v:pe, l:'P',  c:'#dc2626'},
                {v:(dif>=0?'+':'')+dif, l:'DIF', c:dif>=0?'#16a34a':'#dc2626'},
              ].map(s => (
                <div key={s.l} style={{
                  textAlign:'center',padding:'7px 4px',
                  background:'var(--gris)',borderRadius:8,
                }}>
                  <div style={{fontFamily:'Rajdhani,sans-serif',fontSize:18,fontWeight:700,color:s.c,lineHeight:1}}>{s.v}</div>
                  <div style={{fontSize:9,color:'var(--texto-suave)',marginTop:2,fontWeight:600}}>{s.l}</div>
                </div>
              ))}
            </div>

            {/* PF / PC */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:5,marginBottom:10}}>
              {[
                {v:pf,l:'Pts a favor',  c:'#16a34a'},
                {v:pc,l:'Pts en contra', c:'#dc2626'},
              ].map(s => (
                <div key={s.l} style={{
                  textAlign:'center',padding:'7px 4px',
                  background:'var(--gris)',borderRadius:8,
                }}>
                  <div style={{fontFamily:'Rajdhani,sans-serif',fontSize:16,fontWeight:700,color:s.c,lineHeight:1}}>{s.v}</div>
                  <div style={{fontSize:9,color:'var(--texto-suave)',marginTop:2,fontWeight:600,lineHeight:1.2}}>{s.l}</div>
                </div>
              ))}
            </div>

            {/* Forma */}
            {forma.length > 0 && (
              <div>
                <div style={{fontSize:9,fontWeight:700,color:'var(--texto-suave)',textTransform:'uppercase',letterSpacing:1,marginBottom:5}}>
                  Últimos {forma.length} resultado{forma.length!==1?'s':''}
                </div>
                <div style={{display:'flex',gap:4}}>
                  {Array.from({length:5}).map((_,i) => {
                    const res = forma[i]
                    if (!res) return <div key={i} style={{width:28,height:28,borderRadius:7,background:'#f3f4f6',border:'1px solid #e5e7eb'}} />
                    const f = formaIcon(res)
                    return (
                      <div key={i} style={{
                        width:28,height:28,borderRadius:7,
                        background:f.bg,border:`1.5px solid ${f.color}40`,
                        display:'flex',alignItems:'center',justifyContent:'center',
                        fontSize:10,fontWeight:800,color:f.color,
                      }}>{f.icon}</div>
                    )
                  })}
                </div>
                <div style={{fontSize:9,color:'var(--texto-suave)',marginTop:4}}>
                  W = ganó · E = empató · D = perdió
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
