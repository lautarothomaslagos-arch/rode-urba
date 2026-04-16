import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Home() {
  const { user, perfil } = useAuth()

  return (
    <div className="container">
      <div className="card" style={{textAlign:'center',padding:'40px 20px',background:'linear-gradient(135deg, #145c36, #1a7f4b)',color:'white',border:'none'}}>
        <div style={{width:64,height:64,background:'rgba(255,255,255,0.15)',borderRadius:16,display:'flex',alignItems:'center',justifyContent:'center',fontSize:32,fontWeight:900,margin:'0 auto 16px'}}>P</div>
        <h1 style={{fontSize:28,fontWeight:800,marginBottom:8}}>Prode URBA 2026</h1>
        <p style={{fontSize:15,opacity:0.85,marginBottom:24}}>
          Competí prediciéndo los resultados del rugby de Buenos Aires.<br/>
          Top 14, Primera A, B y C.
        </p>
        {user ? (
          <Link to="/prode" className="btn" style={{background:'white',color:'#145c36',fontSize:16,padding:'12px 32px'}}>
            Ir a mis predicciones
          </Link>
        ) : (
          <div style={{display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap'}}>
            <Link to="/registro" className="btn" style={{background:'white',color:'#145c36',fontSize:15,padding:'12px 28px'}}>
              Crear cuenta gratis
            </Link>
            <Link to="/login" className="btn" style={{background:'rgba(255,255,255,0.15)',color:'white',border:'2px solid rgba(255,255,255,0.5)',fontSize:15,padding:'12px 28px'}}>
              Ingresar
            </Link>
          </div>
        )}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:12,marginTop:4}}>
        {[
          { titulo: '3 puntos', desc: 'Por resultado exacto', color: '#1a7f4b' },
          { titulo: '1 punto', desc: 'Por acertar el ganador', color: '#c9a227' },
          { titulo: '+5 bonus', desc: 'Si acertás toda la fecha', color: '#1565c0' },
          { titulo: '+2 bonus', desc: 'Si acertás la mitad o más', color: '#7b1fa2' },
        ].map((item, i) => (
          <div key={i} className="card" style={{textAlign:'center',padding:'20px 12px'}}>
            <div style={{fontSize:22,fontWeight:800,color:item.color}}>{item.titulo}</div>
            <div style={{fontSize:13,color:'var(--texto-suave)',marginTop:4}}>{item.desc}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{marginTop:4}}>
        <div className="card-header"><span className="card-title">¿Cómo funciona?</span></div>
        <ol style={{paddingLeft:20,fontSize:14,lineHeight:2,color:'var(--texto-suave)'}}>
          <li>Creá tu cuenta con usuario y contraseña</li>
          <li>Cada semana cargá tus predicciones antes del cierre (viernes 23:59)</li>
          <li>El sábado se juegan los partidos</li>
          <li>Se calculan automáticamente tus puntos</li>
          <li>Competí en el ranking semanal y el ranking anual</li>
        </ol>
      </div>
    </div>
  )
}
