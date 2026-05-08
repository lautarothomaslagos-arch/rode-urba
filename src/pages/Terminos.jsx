import { useNavigate } from 'react-router-dom'

export default function Terminos() {
  const navigate = useNavigate()

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 20px 80px', color: 'var(--pg-text)' }}>

      <button
        onClick={() => navigate(-1)}
        style={{ background: 'none', border: 'none', color: 'var(--pg-text-soft)', cursor: 'pointer', fontSize: 14, marginBottom: 24, padding: 0 }}
      >
        ← Volver
      </button>

      <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>Términos de Uso</h1>
      <p style={{ fontSize: 13, color: 'var(--pg-text-mute)', marginBottom: 32 }}>Última actualización: mayo 2026</p>

      <Section titulo="1. Aceptación de los términos">
        Al registrarte y usar Pick&amp;Go aceptás estos Términos de Uso en su totalidad. Si no estás de acuerdo, no debés usar la aplicación. El uso de la app por parte de menores de edad implica que cuentan con la autorización de su padre, madre o tutor legal.
      </Section>

      <Section titulo="2. ¿Qué es Pick&Go?">
        Pick&amp;Go es una plataforma de prode deportivo sin fines de lucro, orientada a los torneos de rugby organizados por la URBA. Los puntos acumulados son únicamente para el entretenimiento y la competencia entre usuarios; no tienen valor monetario ni implican ningún tipo de premio económico salvo que el administrador lo indique expresamente.
      </Section>

      <Section titulo="3. Registro y cuenta">
        <ul>
          <li>Debés proporcionar información veraz al registrarte.</li>
          <li>Sos responsable de mantener la confidencialidad de tu contraseña.</li>
          <li>Está prohibido crear cuentas en nombre de otra persona o de forma automatizada.</li>
          <li>Cada persona puede tener una sola cuenta activa.</li>
        </ul>
      </Section>

      <Section titulo="4. Conducta del usuario">
        Está prohibido:
        <ul>
          <li>Usar la app con fines fraudulentos o para manipular resultados.</li>
          <li>Compartir el acceso a tu cuenta con otras personas para acumular puntos.</li>
          <li>Cargar imágenes de perfil ofensivas, violentas o inapropiadas.</li>
          <li>Intentar acceder a secciones o datos de otros usuarios sin autorización.</li>
        </ul>
        El incumplimiento puede resultar en la suspensión o eliminación de tu cuenta.
      </Section>

      <Section titulo="5. Predicciones y puntos">
        <ul>
          <li>Las predicciones deben cargarse antes del cierre de cada fecha. No se aceptan predicciones fuera de término.</li>
          <li>Los puntos se calculan automáticamente según el sistema definido por el administrador (resultado exacto, signo correcto, bonus).</li>
          <li>En caso de error técnico que afecte el cálculo de puntos, el administrador tiene la potestad de corregirlos manualmente.</li>
        </ul>
      </Section>

      <Section titulo="6. Grupos">
        Los grupos son espacios privados que los usuarios crean para competir entre sí. El creador de un grupo es responsable de gestionar su membresía. Pick&amp;Go no se responsabiliza por el contenido o conducta dentro de los grupos.
      </Section>

      <Section titulo="7. Modificaciones a la app">
        El administrador puede modificar, suspender o discontinuar cualquier funcionalidad de la app en cualquier momento, sin previo aviso. No nos responsabilizamos por pérdidas de datos derivadas de interrupciones técnicas o mantenimiento.
      </Section>

      <Section titulo="8. Propiedad intelectual">
        El diseño, código y contenido de Pick&amp;Go son propiedad de sus creadores. Los escudos e imágenes de los equipos pertenecen a sus respectivos clubes y se usan con fines ilustrativos sin ánimo de lucro.
      </Section>

      <Section titulo="9. Limitación de responsabilidad">
        Pick&amp;Go se provee "tal cual es". No garantizamos disponibilidad ininterrumpida ni ausencia de errores. No somos responsables por daños directos o indirectos derivados del uso de la plataforma.
      </Section>

      <Section titulo="10. Ley aplicable">
        Estos términos se rigen por las leyes de la República Argentina. Cualquier controversia será resuelta ante los tribunales competentes de la Ciudad Autónoma de Buenos Aires.
      </Section>

    </div>
  )
}

function Section({ titulo, children }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10, color: 'var(--pg-text)' }}>{titulo}</h2>
      <div style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--pg-text-soft)' }}>{children}</div>
    </div>
  )
}
