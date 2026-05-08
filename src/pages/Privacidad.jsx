import { useNavigate } from 'react-router-dom'

export default function Privacidad() {
  const navigate = useNavigate()

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 20px 80px', color: 'var(--pg-text)' }}>

      <button
        onClick={() => navigate(-1)}
        style={{ background: 'none', border: 'none', color: 'var(--pg-text-soft)', cursor: 'pointer', fontSize: 14, marginBottom: 24, padding: 0 }}
      >
        ← Volver
      </button>

      <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>Política de Privacidad</h1>
      <p style={{ fontSize: 13, color: 'var(--pg-text-mute)', marginBottom: 32 }}>Última actualización: mayo 2026</p>

      <Section titulo="1. ¿Quiénes somos?">
        Pick&amp;Go es una aplicación de prode deportivo para los torneos de rugby de la URBA (Unión de Rugby de Buenos Aires). El responsable del tratamiento de los datos personales es el administrador de la plataforma.
      </Section>

      <Section titulo="2. ¿Qué datos recolectamos?">
        <ul>
          <li><strong>Datos de registro:</strong> dirección de email, nombre de usuario y nombre completo (opcional).</li>
          <li><strong>Datos de uso:</strong> predicciones de partidos, puntos acumulados y participación en grupos.</li>
          <li><strong>Foto de perfil:</strong> imagen cargada voluntariamente por el usuario.</li>
        </ul>
        No recolectamos datos de geolocalización, información financiera ni datos sensibles de ningún tipo.
      </Section>

      <Section titulo="3. ¿Para qué usamos tus datos?">
        <ul>
          <li>Operar el prode: registrar predicciones, calcular puntos y mostrar rankings.</li>
          <li>Gestionar tu cuenta y permitirte participar en grupos con otros usuarios.</li>
          <li>Enviarte notificaciones relacionadas con la apertura o cierre de fechas (solo si las activás).</li>
        </ul>
        No utilizamos tus datos para publicidad ni los compartimos con terceros con fines comerciales.
      </Section>

      <Section titulo="4. ¿Dónde se almacenan los datos?">
        Los datos son almacenados en <strong>Supabase</strong> (infraestructura de base de datos) y la aplicación está alojada en <strong>Vercel</strong>. Ambos servicios cuentan con estándares de seguridad internacionales. Al registrarte aceptás que tus datos sean procesados en los servidores de estos proveedores.
      </Section>

      <Section titulo="5. Menores de edad">
        La aplicación puede ser utilizada por menores de edad en el marco de actividades deportivas organizadas. Si sos menor de 13 años, necesitás la autorización de tu padre, madre o tutor legal para registrarte. El administrador podrá eliminar cuentas de menores si no se acredita dicho consentimiento.
      </Section>

      <Section titulo="6. Tus derechos (Ley 25.326)">
        De acuerdo con la Ley Argentina de Protección de Datos Personales N° 25.326, tenés derecho a:
        <ul>
          <li><strong>Acceso:</strong> consultar qué datos tenemos sobre vos.</li>
          <li><strong>Rectificación:</strong> corregir datos incorrectos desde tu perfil.</li>
          <li><strong>Cancelación:</strong> solicitar la eliminación de tu cuenta y datos.</li>
          <li><strong>Oposición:</strong> oponerte al tratamiento de tus datos.</li>
        </ul>
        Para ejercer estos derechos podés contactarnos desde la sección de perfil de la app o escribirnos directamente al administrador.
      </Section>

      <Section titulo="7. Retención de datos">
        Tus datos se conservan mientras tu cuenta esté activa. Si solicitás la eliminación de tu cuenta, tus datos personales serán borrados en un plazo máximo de 30 días, a excepción de registros históricos anonimizados de participación que pueden conservarse con fines estadísticos.
      </Section>

      <Section titulo="8. Cookies y sesión">
        La app utiliza cookies de sesión necesarias para mantener tu inicio de sesión. No utilizamos cookies de seguimiento ni publicidad.
      </Section>

      <Section titulo="9. Cambios a esta política">
        Podemos actualizar esta política periódicamente. Te notificaremos de cambios significativos dentro de la app. El uso continuado de la aplicación luego de los cambios implica la aceptación de la nueva versión.
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
