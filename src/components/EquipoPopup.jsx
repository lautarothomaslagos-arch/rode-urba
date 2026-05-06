import { formaIcon } from '../lib/equipoStats'

/**
 * Popup flotante con estadísticas de un equipo.
 * Props:
 *   stats  — objeto de stats para el equipo (o null)
 *   onClose — función para cerrar
 */
export default function EquipoPopup({ stats, onClose }) {
  if (!stats) return null

  const { equipo, pj, g, e, pe, pf, pc, dif, forma } = stats

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
        }}
      />

      {/* Panel */}
      <div style={{
        position: 'fixed',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 1001,
        width: 'min(320px, 90vw)',
        background: 'white',
        borderRadius: 18,
        boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
        overflow: 'hidden',
        animation: 'popupEnter 0.22s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        <style>{`
          @keyframes popupEnter {
            from { opacity:0; transform:translate(-50%,-50%) scale(0.88); }
            to   { opacity:1; transform:translate(-50%,-50%) scale(1); }
          }
        `}</style>

        {/* Header con escudo */}
        <div style={{
          background: 'linear-gradient(135deg, var(--azul) 0%, var(--azul-medio) 100%)',
          padding: '20px 16px 16px',
          textAlign: 'center',
          position: 'relative',
        }}>
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: 10, right: 10,
              background: 'rgba(255,255,255,0.15)', border: 'none',
              borderRadius: 20, width: 28, height: 28,
              color: 'white', fontSize: 14, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >✕</button>

          <div style={{
            width: 64, height: 64, borderRadius: 12,
            background: 'white', margin: '0 auto 10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden',
            border: '2px solid rgba(201,162,39,0.5)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          }}>
            {equipo.escudo_url
              ? <img src={equipo.escudo_url} alt={equipo.nombre} style={{width:'85%',height:'85%',objectFit:'contain'}} />
              : <span style={{fontSize:18,fontWeight:700,color:'var(--azul)'}}>{(equipo.nombre_corto || equipo.nombre?.slice(0,3) || '?').toUpperCase()}</span>
            }
          </div>

          <div style={{
            fontFamily: 'Rajdhani, sans-serif',
            fontSize: 17, fontWeight: 700, color: 'white', letterSpacing: 0.5,
          }}>
            {equipo.nombre}
          </div>

          {pj === 0 && (
            <div style={{fontSize:12,color:'rgba(255,255,255,0.6)',marginTop:4}}>
              Sin partidos registrados aún
            </div>
          )}
        </div>

        {pj > 0 && (
          <div style={{padding: '16px'}}>

            {/* Fila G / E / P / PJ */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(4,1fr)',
              gap: 6, marginBottom: 12,
            }}>
              {[
                { v: pj, l: 'PJ', color: 'var(--azul)' },
                { v: g,  l: 'G',  color: '#16a34a' },
                { v: e,  l: 'E',  color: '#ca8a04' },
                { v: pe, l: 'P',  color: '#dc2626' },
              ].map(s => (
                <div key={s.l} style={{
                  textAlign: 'center', padding: '10px 6px',
                  background: 'var(--gris)', borderRadius: 8,
                }}>
                  <div style={{
                    fontFamily: 'Rajdhani, sans-serif',
                    fontSize: 22, fontWeight: 700, color: s.color, lineHeight: 1,
                  }}>{s.v}</div>
                  <div style={{fontSize: 10, color: 'var(--texto-suave)', marginTop: 2, fontWeight: 600}}>{s.l}</div>
                </div>
              ))}
            </div>

            {/* PF / PC / DIF */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(3,1fr)',
              gap: 6, marginBottom: 12,
            }}>
              {[
                { v: pf, l: 'PF (a favor)', color: '#16a34a' },
                { v: pc, l: 'PC (en contra)', color: '#dc2626' },
                { v: (dif >= 0 ? '+' : '') + dif, l: 'DIF', color: dif >= 0 ? '#16a34a' : '#dc2626' },
              ].map(s => (
                <div key={s.l} style={{
                  textAlign: 'center', padding: '8px 4px',
                  background: 'var(--gris)', borderRadius: 8,
                }}>
                  <div style={{
                    fontFamily: 'Rajdhani, sans-serif',
                    fontSize: 18, fontWeight: 700, color: s.color, lineHeight: 1,
                  }}>{s.v}</div>
                  <div style={{fontSize: 9, color: 'var(--texto-suave)', marginTop: 2, fontWeight: 600, lineHeight:1.2}}>{s.l}</div>
                </div>
              ))}
            </div>

            {/* Forma */}
            {forma.length > 0 && (
              <div>
                <div style={{
                  fontSize: 10, fontWeight: 700, color: 'var(--texto-suave)',
                  textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6,
                }}>
                  Últimos {forma.length} resultado{forma.length !== 1 ? 's' : ''}
                </div>
                <div style={{display: 'flex', gap: 5}}>
                  {forma.map((res, i) => {
                    const f = formaIcon(res)
                    return (
                      <div key={i} style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: f.bg,
                        color: f.color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, fontWeight: 800,
                        border: `1.5px solid ${f.color}40`,
                      }}>
                        {f.icon}
                      </div>
                    )
                  })}
                  {/* Espacios vacíos si < 5 partidos */}
                  {Array.from({ length: Math.max(0, 5 - forma.length) }).map((_, i) => (
                    <div key={`empty-${i}`} style={{
                      width: 32, height: 32, borderRadius: 8,
                      background: '#f3f4f6', border: '1.5px solid #e5e7eb',
                    }} />
                  ))}
                </div>
                <div style={{fontSize: 10, color: 'var(--texto-suave)', marginTop: 5}}>
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
