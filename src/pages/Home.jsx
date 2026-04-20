import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Home() {
  const { user } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="container">
      <div className="hero">
        <img src="/logo.png" alt="Pick&Go" style={{
          width:160, height:160,
          borderRadius:24,
          border:'3px solid var(--dorado)',
          boxShadow:'0 6px 24px rgba(201,162,39,0.4)',
          marginBottom:16,
          objectFit:'contain'
        }} />
        <h1>Pick&amp;Go Prode</h1>
        <p>Predecí los resultados del rugby de Buenos Aires<br/>Top 14 · Primera A · Primera B · Primera C · Segunda</p>
        {user ? (
          <button className="btn btn-gold" style={{fontSize:16,padding:'13px 36px'}}
            onClick={() => navigate('/prode')}>
            Ir a predecir
          </button>
        ) : (
          <div style={{display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap'}}>
            <button className="btn btn-gold" style={{fontSize:15,padding:'12px 30px',fontWeight:700}}
              onClick={() => navigate('/registro')}>
              Crear cuenta gratis
            </button>
            <button className="btn" style={{background:'rgba(255,255,255,0.2)',color:'white',border:'2px solid rgba(255,255,255,0.5)',fontSize:15,padding:'12px 30px',fontWeight:600}}
              onClick={() => navigate('/login')}>
              Ingresar
            </button>
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
          <li>El sábado se juegan los partidos de todos los torneos</li>
          <li>Se calculan automáticamente tus puntos por torneo</li>
          <li>Competí en el ranking personal y el ranking por clubes</li>
        </ol>
      </div>
    </div>
  )
}
