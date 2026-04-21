import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Home() {
  const { user } = useAuth()

  return (
    <div className="container">
      <div className="hero">
        <img src="/logo.png" alt="Pick&Go" className="hero-logo" />
        <h1>Pick&amp;Go Prode</h1>
        <p>Predecí los resultados del rugby de Buenos Aires<br/>Top 14 · Primera A · Primera B · Primera C</p>
        {user ? (
          <Link to="/prode" className="btn btn-gold" style={{fontSize:16,padding:'13px 36px'}}>
            Ir a predecir
          </Link>
        ) : (
          <div style={{display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap'}}>
            <Link to="/registro" className="btn btn-gold" style={{fontSize:15,padding:'12px 30px'}}>Crear cuenta gratis</Link>
            <Link to="/login" className="btn" style={{background:'rgba(255,255,255,0.15)',color:'white',border:'1.5px solid rgba(255,255,255,0.3)',fontSize:15,padding:'12px 30px'}}>Ingresar</Link>
          </div>
        )}
      </div>

      <div className="stats-grid">
        {[
          {n:'3 pts', l:'Resultado exacto', c:''},
          {n:'1 pt',  l:'Acertar el ganador', c:'gold'},
          {n:'+5 pts',l:'Pleno de fecha', c:'blue'},
          {n:'+2 pts',l:'Mitad o más acertados', c:'purple'},
        ].map((s,i) => (
          <div key={i} className={`stat-card ${s.c}`}>
            <div className="stat-numero">{s.n}</div>
            <div className="stat-label">{s.l}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{marginTop:4}}>
        <div className="card-header"><span className="card-title">¿Cómo funciona?</span></div>
        <ol style={{paddingLeft:20,fontSize:14,lineHeight:2.2,color:'var(--texto-suave)'}}>
          <li>Creá tu cuenta con usuario y contraseña</li>
          <li>Cada semana cargá tus predicciones antes del cierre (<strong>viernes 23:59</strong>)</li>
          <li>El sábado se juegan los partidos</li>
          <li>Se calculan automáticamente tus puntos</li>
          <li>Competí en el ranking semanal y el ranking anual</li>
        </ol>
      </div>
    </div>
  )
}
