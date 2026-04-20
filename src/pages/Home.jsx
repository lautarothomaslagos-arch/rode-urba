import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const PASOS = [
  { icon: '👤', titulo: 'Creá tu cuenta', desc: 'Registrate con usuario y contraseña' },
  { icon: '🏉', titulo: 'Cargá tus picks', desc: 'Predecí cada partido antes del viernes 23:59' },
  { icon: '📊', titulo: 'Se juegan los partidos', desc: 'Todos los sábados se disputan los torneos' },
  { icon: '🏆', titulo: 'Sumate al ranking', desc: 'Competí por fecha y en el ranking anual' },
]

const PUNTOS = [
  { valor: '3', label: 'pts', desc: 'Resultado exacto', color: '#C9A227', bg: 'rgba(201,162,39,0.15)', icon: '🎯' },
  { valor: '1', label: 'pt',  desc: 'Acertar el ganador', color: '#e8e8e8', bg: 'rgba(255,255,255,0.08)', icon: '✓' },
  { valor: '+5', label: 'pts', desc: 'Pleno de fecha', color: '#4fc3f7', bg: 'rgba(79,195,247,0.12)', icon: '⚡' },
  { valor: '+2', label: 'pts', desc: 'Mitad o más', color: '#ce93d8', bg: 'rgba(206,147,216,0.12)', icon: '★' },
]

export default function Home() {
  const { user } = useAuth()
  const navigate = useNavigate()

  return (
    <div style={{minHeight:'100vh', background:'#0d1117', color:'white', fontFamily:"'Rajdhani', sans-serif"}}>

      {/* HERO */}
      <div style={{
        position:'relative', overflow:'hidden',
        background:'linear-gradient(160deg, #1a0a00 0%, #1a1a2e 40%, #0d0d1a 100%)',
        padding:'48px 20px 60px',
        textAlign:'center',
      }}>
        {/* Fondo decorativo */}
        <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse at 50% 0%, rgba(139,0,0,0.3) 0%, transparent 70%)',pointerEvents:'none'}} />
        <div style={{position:'absolute',inset:0,backgroundImage:'repeating-linear-gradient(0deg,transparent,transparent 40px,rgba(201,162,39,0.03) 40px,rgba(201,162,39,0.03) 41px),repeating-linear-gradient(90deg,transparent,transparent 40px,rgba(201,162,39,0.03) 40px,rgba(201,162,39,0.03) 41px)',pointerEvents:'none'}} />

        <div style={{position:'relative',zIndex:1,maxWidth:600,margin:'0 auto'}}>
          {/* Logo */}
          <div style={{marginBottom:20}}>
            <img src="/logo.png" alt="Pick&Go"
              style={{width:140,height:140,objectFit:'contain',borderRadius:28,
                border:'2px solid rgba(201,162,39,0.6)',
                boxShadow:'0 0 40px rgba(139,0,0,0.5), 0 0 80px rgba(201,162,39,0.15)',
                filter:'drop-shadow(0 0 20px rgba(201,162,39,0.3))'
              }} />
          </div>

          {/* Título */}
          <div style={{fontSize:'clamp(36px,8vw,64px)',fontWeight:700,letterSpacing:3,lineHeight:1,
            background:'linear-gradient(135deg, #fff 0%, #C9A227 50%, #fff 100%)',
            WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',marginBottom:8}}>
            Pick&amp;Go
          </div>
          <div style={{fontSize:'clamp(14px,3vw,18px)',color:'rgba(201,162,39,0.8)',letterSpacing:6,textTransform:'uppercase',marginBottom:8}}>
            Prode URBA 2026
          </div>
          <div style={{fontSize:'clamp(12px,2.5vw,15px)',color:'rgba(255,255,255,0.5)',letterSpacing:2,marginBottom:32}}>
            Top 14 · Primera A · Primera B · Primera C · Segunda
          </div>

          {/* Botones */}
          {user ? (
            <button onClick={() => navigate('/prode')} style={{
              background:'linear-gradient(135deg,#C9A227,#9a7a1a)',
              color:'#0d1117', border:'none', borderRadius:50,
              padding:'14px 48px', fontSize:18, fontWeight:700,
              letterSpacing:2, cursor:'pointer', fontFamily:"'Rajdhani',sans-serif",
              boxShadow:'0 4px 24px rgba(201,162,39,0.4)',
              transition:'all 0.2s',
            }}
            onMouseOver={e => e.target.style.transform='translateY(-2px)'}
            onMouseOut={e => e.target.style.transform='translateY(0)'}
            >
              IR A PREDECIR
            </button>
          ) : (
            <div style={{display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap'}}>
              <button onClick={() => navigate('/registro')} style={{
                background:'linear-gradient(135deg,#C9A227,#9a7a1a)',
                color:'#0d1117', border:'none', borderRadius:50,
                padding:'14px 36px', fontSize:16, fontWeight:700,
                letterSpacing:1, cursor:'pointer', fontFamily:"'Rajdhani',sans-serif",
                boxShadow:'0 4px 24px rgba(201,162,39,0.4)',
              }}>
                CREAR CUENTA GRATIS
              </button>
              <button onClick={() => navigate('/login')} style={{
                background:'transparent',
                color:'white', border:'2px solid rgba(255,255,255,0.3)', borderRadius:50,
                padding:'12px 36px', fontSize:16, fontWeight:600,
                letterSpacing:1, cursor:'pointer', fontFamily:"'Rajdhani',sans-serif",
              }}>
                INGRESAR
              </button>
            </div>
          )}
        </div>

        {/* Línea decorativa inferior */}
        <div style={{position:'absolute',bottom:0,left:0,right:0,height:2,background:'linear-gradient(90deg,transparent,#C9A227,transparent)'}} />
      </div>

      {/* SISTEMA DE PUNTOS */}
      <div style={{padding:'40px 16px 24px',maxWidth:900,margin:'0 auto'}}>
        <div style={{textAlign:'center',marginBottom:24}}>
          <div style={{fontSize:11,letterSpacing:4,color:'rgba(201,162,39,0.7)',marginBottom:6}}>SISTEMA DE PUNTUACIÓN</div>
          <div style={{width:40,height:2,background:'linear-gradient(90deg,transparent,#C9A227,transparent)',margin:'0 auto'}} />
        </div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:12}}>
          {PUNTOS.map((p,i) => (
            <div key={i} style={{
              background:p.bg,
              border:`1px solid ${p.color}33`,
              borderRadius:16, padding:'20px 16px',
              textAlign:'center',
              backdropFilter:'blur(10px)',
              transition:'transform 0.2s',
            }}
            onMouseOver={e => e.currentTarget.style.transform='translateY(-4px)'}
            onMouseOut={e => e.currentTarget.style.transform='translateY(0)'}
            >
              <div style={{fontSize:28,marginBottom:8}}>{p.icon}</div>
              <div style={{display:'flex',alignItems:'baseline',justifyContent:'center',gap:4,marginBottom:6}}>
                <span style={{fontSize:36,fontWeight:700,color:p.color,fontFamily:"'Rajdhani',sans-serif"}}>{p.valor}</span>
                <span style={{fontSize:16,color:p.color,fontWeight:600}}>{p.label}</span>
              </div>
              <div style={{fontSize:12,color:'rgba(255,255,255,0.55)',letterSpacing:0.5,lineHeight:1.4}}>{p.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CÓMO FUNCIONA */}
      <div style={{padding:'16px 16px 48px',maxWidth:900,margin:'0 auto'}}>
        <div style={{
          background:'rgba(255,255,255,0.03)',
          border:'1px solid rgba(201,162,39,0.15)',
          borderRadius:20, padding:'28px 24px',
        }}>
          <div style={{textAlign:'center',marginBottom:28}}>
            <div style={{fontSize:11,letterSpacing:4,color:'rgba(201,162,39,0.7)',marginBottom:6}}>¿CÓMO FUNCIONA?</div>
            <div style={{width:40,height:2,background:'linear-gradient(90deg,transparent,#C9A227,transparent)',margin:'0 auto'}} />
          </div>

          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:20}}>
            {PASOS.map((p,i) => (
              <div key={i} style={{textAlign:'center',padding:'0 8px'}}>
                <div style={{
                  width:56,height:56,borderRadius:'50%',
                  background:'linear-gradient(135deg,rgba(139,0,0,0.4),rgba(26,10,0,0.8))',
                  border:'1px solid rgba(201,162,39,0.3)',
                  display:'flex',alignItems:'center',justifyContent:'center',
                  fontSize:24,margin:'0 auto 12px',
                  boxShadow:'0 4px 16px rgba(139,0,0,0.3)',
                }}>
                  {p.icon}
                </div>
                <div style={{
                  fontSize:11,fontWeight:700,letterSpacing:1,
                  color:'rgba(201,162,39,0.6)',marginBottom:4,
                }}>PASO {i+1}</div>
                <div style={{fontSize:15,fontWeight:600,color:'white',marginBottom:6,fontFamily:"'Rajdhani',sans-serif",letterSpacing:0.5}}>
                  {p.titulo}
                </div>
                <div style={{fontSize:12,color:'rgba(255,255,255,0.45)',lineHeight:1.5}}>
                  {p.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  )
}
