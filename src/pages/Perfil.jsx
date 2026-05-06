import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { usePushNotifications } from '../hooks/usePushNotifications'
import { CATS, CAT_CLASS } from '../lib/constants'
import { GruposContenido } from './Grupos'

const CLUBES_URBA = [
  '--- Top 14 ---','Alumni','Atlético del Rosario','Belgrano Athletic','Buenos Aires C&RC','CASI','Champagnat','CUBA','Hindú Club','La Plata RC','Los Matreros','Newman','Regatas Bella Vista','SIC','Los Tilos',
  '--- Primera A ---','San Luis','Pueyrredón','San Cirano','Pucará','Hurling','Curupaytí','San Andrés','Lomas Athletic','Deportiva Francesa','Olivos','Universitario LP','San Albano','GEBA','San Fernando',
  '--- Primera B ---','CUQ','Liceo Naval','San Martín (SP)','San Patricio','Mariano Moreno','Delta RC','Argentino (CAR)','Banco Nación','Manuel Belgrano','Club Italiano','Vicentinos','Monte Grande','Liceo Militar','Don Bosco',
  '--- Primera C ---','Ciudad de Buenos Aires','Centro Naval','Los Molinos','CASA de Padua','Luján RC','Del Sur','Areco RC','DAOM','SITAS','San Carlos','San Miguel RHC','Virreyes','Saint Brendans','Lanús RC',
  '--- Segunda División ---','Mercedes','Varela Jr.','Albatros','Tigre','Atlético Chascomús','Los Pinos','La Salle','El Retiro','San Marcos','Tiro F. San Pedro','A. y Progreso','Vicente López','Old Georgian','Las Cañas',
  'Otro club'
]

const BASE = 'https://xmtsxdzwurxygqqccgdc.supabase.co/storage/v1/object/public/trofeos'
const TROFEOS = [
  { nombre: 'Puma',    minimo: 15, img: `${BASE}/trofeo_puma_v2.png`,     desc: 'Nivel seleccionado',     color: '#C9A227', bg: 'rgba(201,162,39,0.12)' },
  { nombre: 'Capitán', minimo: 10, img: `${BASE}/trofeo_capitan_v2.png`,  desc: 'El referente del grupo',  color: '#C9A227', bg: 'rgba(201,162,39,0.08)' },
  { nombre: 'Titular', minimo: 6,  img: `${BASE}/trofeo_titular_v2.png`,  desc: 'Ganaste tu lugar',        color: '#9ca3af', bg: 'rgba(156,163,175,0.12)' },
  { nombre: 'Suplente',minimo: 3,  img: `${BASE}/trofeo_suplente_v2.png`, desc: 'Entraste al equipo',      color: '#cd7c3e', bg: 'rgba(205,124,62,0.12)' },
]
function getTrofeo(r) { return TROFEOS.find(t => r >= t.minimo) || null }

const CATS_SHORT = { 1: 'T14', 2: 'P.A', 3: 'P.B', 4: 'P.C', 5: '2da' }
const LOGROS_CATS = ['Exactos', 'Rendimiento', 'Ranking', 'Puntos', 'Especiales', 'Comunidad']

const TABS = [
  { id: 'historial',      label: '📋 Historial' },
  { id: 'logros',         label: '🏅 Logros' },
  { id: 'grupos',         label: '👥 Grupos' },
  { id: 'datos',          label: '👤 Mis datos' },
  { id: 'contrasena',     label: '🔐 Contraseña' },
  { id: 'notificaciones', label: '🔔 Notificaciones' },
  { id: 'invitar',        label: '📲 Invitar' },
]

function SalirBtn() {
  const { signOut } = useAuth()
  return (
    <div className="salir-mobile">
      <button onClick={signOut} style={{
        width:'100%', padding:'13px', borderRadius:10,
        background:'rgba(178,34,34,0.07)', border:'1px solid rgba(178,34,34,0.2)',
        color:'#B22222', fontFamily:'Rajdhani,sans-serif', fontSize:15,
        fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8
      }}>
        🚪 Cerrar sesión
      </button>
    </div>
  )
}

export default function Perfil() {
  const { perfil, cargarPerfil, user } = useAuth()
  const { permiso, suscrito, cargando: cargandoNotif, suscribirse, desuscribirse } = usePushNotifications()
  const [searchParams] = useSearchParams()

  const [nombre, setNombre] = useState('')
  const [club, setClub] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [subiendo, setSubiendo] = useState(false)
  const [preview, setPreview] = useState(null)
  const [racha, setRacha] = useState({ actual: 0, maxima: 0 })
  const [stats, setStats] = useState(null)
  const [pass1, setPass1] = useState('')
  const [pass2, setPass2] = useState('')
  const [msgPass, setMsgPass] = useState('')
  const [loadingPass, setLoadingPass] = useState(false)
  const [pestaña, setPestaña] = useState(() => searchParams.get('codigo') ? 'grupos' : 'historial')
  const [historial, setHistorial] = useState([])
  const [logros, setLogros] = useState([])
  const [loadingPestaña, setLoadingPestaña] = useState(false)
  const [compartiendoFecha, setCompartiendoFecha] = useState(null)

  useEffect(() => {
    if (perfil) {
      setNombre(perfil.nombre_completo || '')
      setClub(perfil.club || '')
      setPreview(perfil.avatar_url || null)
    }
  }, [perfil])

  useEffect(() => {
    if (user) { cargarRacha(); cargarStats() }
  }, [user])

  useEffect(() => {
    if (!user || !pestaña) return
    if (pestaña === 'historial') cargarHistorial()
    else if (pestaña === 'logros') cargarLogros()
  }, [user, pestaña])

  async function cargarRacha() {
    const { data } = await supabase.from('perfiles').select('racha_actual, racha_maxima').eq('id', user.id).single()
    if (data) setRacha({ actual: data.racha_actual || 0, maxima: data.racha_maxima || 0 })
  }

  async function cargarStats() {
    const [{ data: totales }, { data: porFecha }, { data: allTotales }] = await Promise.all([
      supabase.from('puntos_totales').select('puntos_acumulados').eq('usuario_id', user.id),
      supabase.from('puntos_fecha').select('total_puntos, fechas(numero), partidos_acertados, partidos_totales').eq('usuario_id', user.id),
      supabase.from('puntos_totales').select('usuario_id, puntos_acumulados').eq('temporada_id', 1)
    ])
    const totalPuntos = totales?.reduce((s, r) => s + (r.puntos_acumulados || 0), 0) || 0
    const mapaFechas = {}
    porFecha?.forEach(p => {
      const num = p.fechas?.numero
      if (num == null) return
      if (!mapaFechas[num]) mapaFechas[num] = 0
      mapaFechas[num] += (p.total_puntos || 0)
    })
    const totalFechas = Object.keys(mapaFechas).length
    const mejorFecha = Object.values(mapaFechas).reduce((max, v) => Math.max(max, v), 0) || 0
    const promedio = totalFechas > 0 ? Math.round(totalPuntos / totalFechas * 10) / 10 : 0
    const totalAcertados = porFecha?.reduce((s, r) => s + (r.partidos_acertados || 0), 0) || 0
    const totalJugados = porFecha?.reduce((s, r) => s + (r.partidos_totales || 0), 0) || 0
    const pctAcierto = totalJugados > 0 ? Math.round(totalAcertados / totalJugados * 100) : 0
    const byUser = {}
    allTotales?.forEach(r => { byUser[r.usuario_id] = (byUser[r.usuario_id] || 0) + (r.puntos_acumulados || 0) })
    const sorted = Object.values(byUser).sort((a, b) => b - a)
    const posicion = sorted.findIndex(pts => pts <= totalPuntos) + 1
    setStats({ totalPuntos, totalFechas, mejorFecha, promedio, pctAcierto, posicion, totalJugadores: sorted.length })
  }

  async function cargarHistorial() {
    setLoadingPestaña(true)
    const { data: porFecha } = await supabase.from('puntos_fecha')
      .select('total_puntos, bonus_pleno, fecha_id, fechas(numero, categoria_id)')
      .eq('usuario_id', user.id)
    if (!porFecha?.length) { setHistorial([]); setLoadingPestaña(false); return }

    const allFechaIds = [...new Set(porFecha.map(p => p.fecha_id).filter(Boolean))]
    const { data: allPuntos } = await supabase.from('puntos_fecha')
      .select('usuario_id, total_puntos, fechas(numero)')
      .in('fecha_id', allFechaIds)

    const byNumAll = {}
    allPuntos?.forEach(p => {
      const num = p.fechas?.numero
      if (num == null) return
      if (!byNumAll[num]) byNumAll[num] = {}
      byNumAll[num][p.usuario_id] = (byNumAll[num][p.usuario_id] || 0) + p.total_puntos
    })
    const posicionPorFecha = {}
    Object.entries(byNumAll).forEach(([num, pts]) => {
      const s = Object.entries(pts).sort(([,a],[,b]) => b - a)
      posicionPorFecha[num] = { pos: s.findIndex(([uid]) => uid === user.id) + 1, total: s.length }
    })

    const byNum = {}
    porFecha.forEach(p => {
      const num = p.fechas?.numero
      const cat = p.fechas?.categoria_id
      if (num == null) return
      if (!byNum[num]) byNum[num] = { numero: num, totalPts: 0, pleno: 0, cats: new Set() }
      byNum[num].totalPts += (p.total_puntos || 0)
      byNum[num].pleno += (p.bonus_pleno || 0)
      if (cat) byNum[num].cats.add(cat)
    })

    setHistorial(
      Object.values(byNum)
        .sort((a, b) => b.numero - a.numero)
        .map(f => ({ ...f, cats: [...f.cats].sort((a,b) => a-b), ...(posicionPorFecha[f.numero] || {}) }))
    )
    setLoadingPestaña(false)
  }

  async function cargarLogros() {
    setLoadingPestaña(true)
    const [{ data: porFechaRaw }, { data: preds }, { data: perfilData }] = await Promise.all([
      supabase.from('puntos_fecha')
        .select('total_puntos, puntos_exactos, partidos_acertados, partidos_totales, bonus_pleno, fecha_id, fechas(numero)')
        .eq('usuario_id', user.id),
      supabase.from('predicciones')
        .select('goles_local, goles_visitante, partidos(resultado_local, resultado_visitante, es_especial, fechas(numero, categoria_id))')
        .eq('usuario_id', user.id),
      supabase.from('perfiles').select('invitaciones').eq('id', user.id).single()
    ])

    const byNum = {}
    porFechaRaw?.forEach(p => {
      const num = p.fechas?.numero
      if (num == null) return
      if (!byNum[num]) byNum[num] = { totalPts: 0, totalAcertados: 0, totalJugados: 0, pleno: 0, plenos: 0 }
      byNum[num].totalPts += (p.total_puntos || 0)
      byNum[num].totalAcertados += (p.partidos_acertados || 0)
      byNum[num].totalJugados += (p.partidos_totales || 0)
      if ((p.bonus_pleno || 0) > 0) byNum[num].plenos++
    })
    const fechasJugadas = Object.values(byNum)
    const totalPuntos = porFechaRaw?.reduce((s, p) => s + (p.total_puntos || 0), 0) || 0

    const predsConRes = preds?.filter(p => p.partidos?.resultado_local != null) || []
    const totalExactos = predsConRes.filter(p =>
      p.goles_local === p.partidos.resultado_local && p.goles_visitante === p.partidos.resultado_visitante
    ).length

    const exactosPorFecha = {}
    const catsPorFecha = {}
    const catsConExacto = new Set()
    predsConRes.forEach(p => {
      const num = p.partidos?.fechas?.numero
      const cat = p.partidos?.fechas?.categoria_id
      if (num == null) return
      const exacto = p.goles_local === p.partidos.resultado_local && p.goles_visitante === p.partidos.resultado_visitante
      if (exacto) {
        exactosPorFecha[num] = (exactosPorFecha[num] || 0) + 1
        if (cat) catsConExacto.add(cat)
      }
      if (cat) { if (!catsPorFecha[num]) catsPorFecha[num] = new Set(); catsPorFecha[num].add(cat) }
    })

    const reyDestacado = predsConRes.some(p => p.partidos.es_especial && p.goles_local === p.partidos.resultado_local && p.goles_visitante === p.partidos.resultado_visitante)
    const empatePreciso = predsConRes.some(p => p.partidos.resultado_local === p.partidos.resultado_visitante && p.goles_local === p.partidos.resultado_local && p.goles_visitante === p.partidos.resultado_visitante)
    const omnipresente = Object.values(catsPorFecha).some(cats => cats.size >= 5)
    const invicto = fechasJugadas.some(f => f.totalJugados >= 3 && f.totalAcertados === f.totalJugados)
    const pleno = fechasJugadas.some(f => f.pleno > 0)
    const granSemana = fechasJugadas.some(f => f.totalPts >= 25)
    const semanaIncreible = fechasJugadas.some(f => f.totalPts >= 50)
    const ojoClinico = fechasJugadas.some(f => f.totalJugados >= 4 && f.totalAcertados / f.totalJugados >= 0.7)
    const hatTrick = Object.values(exactosPorFecha).some(n => n >= 3)
    const francotirador = Object.values(exactosPorFecha).some(n => n >= 5)
    const perfecta = Object.entries(exactosPorFecha).some(([num, count]) => {
      const f = byNum[Number(num)]
      return f && f.totalJugados >= 3 && count === f.totalJugados
    })
    const doblePleno = fechasJugadas.some(f => f.plenos >= 2)
    const coleccionista = catsConExacto.size >= 5
    const invitaciones = perfilData?.invitaciones || 0

    const fechasSorted = Object.entries(byNum).sort(([a],[b]) => Number(a)-Number(b)).map(([num, f]) => ({ num: Number(num), ...f }))
    let constante = false
    for (let i = 0; i <= fechasSorted.length - 3; i++) {
      const [f1, f2, f3] = fechasSorted.slice(i, i+3)
      if (f2.num !== f1.num+1 || f3.num !== f2.num+1) continue
      if ([f1,f2,f3].every(f => f.totalJugados >= 3 && f.totalAcertados / f.totalJugados >= 0.6)) { constante = true; break }
    }

    const allFechaIds = [...new Set(porFechaRaw?.map(p => p.fecha_id).filter(Boolean) || [])]
    let lider = false, podio = false, contLider = 0, contPodio = 0
    if (allFechaIds.length) {
      const { data: allPuntos } = await supabase.from('puntos_fecha')
        .select('usuario_id, total_puntos, fechas(numero)').in('fecha_id', allFechaIds)
      const byNumAll = {}
      allPuntos?.forEach(p => {
        const num = p.fechas?.numero
        if (num == null) return
        if (!byNumAll[num]) byNumAll[num] = {}
        byNumAll[num][p.usuario_id] = (byNumAll[num][p.usuario_id] || 0) + p.total_puntos
      })
      Object.values(byNumAll).forEach(pts => {
        const s = Object.entries(pts).sort(([,a],[,b]) => b-a)
        const pos = s.findIndex(([uid]) => uid === user.id) + 1
        if (pos > 0) { if (pos === 1) { lider = true; contLider++ } if (pos <= 3) { podio = true; contPodio++ } }
      })
    }

    setLogros([
      { id:'primer_exacto',   icon:'🎯', nombre:'Primer exacto',     desc:'Tu primer resultado exacto',                        cat:'Exactos',     desbloqueado: totalExactos >= 1 },
      { id:'hat_trick',       icon:'⚽', nombre:'Hat-trick',          desc:'3 exactos en la misma fecha',                      cat:'Exactos',     desbloqueado: hatTrick },
      { id:'francotirador',   icon:'⚡', nombre:'Francotirador',      desc:'5 exactos en la misma fecha',                      cat:'Exactos',     desbloqueado: francotirador },
      { id:'diez_exactos',    icon:'🏹', nombre:'10 exactos',         desc:'10 exactos acumulados',                            cat:'Exactos',     desbloqueado: totalExactos >= 10,  progreso: totalExactos < 10 ? `${totalExactos}/10` : null },
      { id:'quince_exactos',  icon:'🔥', nombre:'15 exactos',         desc:'15 exactos acumulados',                            cat:'Exactos',     desbloqueado: totalExactos >= 15,  progreso: totalExactos < 15 ? `${totalExactos}/15` : null },
      { id:'veinticinco',     icon:'💎', nombre:'25 exactos',         desc:'25 exactos acumulados',                            cat:'Exactos',     desbloqueado: totalExactos >= 25,  progreso: totalExactos < 25 ? `${totalExactos}/25` : null },
      { id:'pleno',           icon:'💥', nombre:'Pleno',              desc:'Bonus pleno en una fecha',                         cat:'Rendimiento', desbloqueado: pleno },
      { id:'invicto',         icon:'🛡️', nombre:'Invicto',            desc:'Fecha sin ningún partido fallado',                  cat:'Rendimiento', desbloqueado: invicto },
      { id:'ojo_clinico',     icon:'👁️', nombre:'Ojo clínico',        desc:'70%+ de acierto en una fecha (mín. 4)',            cat:'Rendimiento', desbloqueado: ojoClinico },
      { id:'constante',       icon:'🔄', nombre:'Constante',          desc:'3 fechas seguidas con 60%+ de acierto',            cat:'Rendimiento', desbloqueado: constante },
      { id:'gran_semana',     icon:'📊', nombre:'Gran semana',        desc:'25+ pts en una semana (todos los torneos)',         cat:'Rendimiento', desbloqueado: granSemana },
      { id:'semana_increible',icon:'🌟', nombre:'Semana increíble',   desc:'50+ pts en una semana (todos los torneos)',         cat:'Rendimiento', desbloqueado: semanaIncreible },
      { id:'podio',           icon:'🥇', nombre:'Podio',              desc:'Top 3 en una fecha',                               cat:'Ranking',     desbloqueado: podio },
      { id:'lider',           icon:'👑', nombre:'Líder',              desc:'#1 en una fecha',                                  cat:'Ranking',     desbloqueado: lider },
      { id:'rey',             icon:'🏆', nombre:'Rey',                desc:'#1 en 3 fechas distintas',                         cat:'Ranking',     desbloqueado: contLider >= 3,  progreso: contLider < 3 ? `${contLider}/3` : null },
      { id:'podio_habitual',  icon:'🥈', nombre:'Podio habitual',     desc:'Top 3 en 5 fechas distintas',                      cat:'Ranking',     desbloqueado: contPodio >= 5,  progreso: contPodio < 5 ? `${contPodio}/5` : null },
      { id:'podio_elite',     icon:'🎖️', nombre:'Podio élite',        desc:'Top 3 en 10 fechas distintas',                     cat:'Ranking',     desbloqueado: contPodio >= 10, progreso: contPodio < 10 ? `${contPodio}/10` : null },
      { id:'rey_absoluto',    icon:'👸', nombre:'Rey absoluto',       desc:'#1 en 5 fechas distintas',                         cat:'Ranking',     desbloqueado: contLider >= 5,  progreso: contLider < 5 ? `${contLider}/5` : null },
      { id:'cincuenton',      icon:'🔢', nombre:'Cincuentón',         desc:'50 pts acumulados',                                cat:'Puntos',      desbloqueado: totalPuntos >= 50,  progreso: totalPuntos < 50  ? `${totalPuntos}/50`  : null },
      { id:'centenario',      icon:'💯', nombre:'Centenario',         desc:'100 pts acumulados',                               cat:'Puntos',      desbloqueado: totalPuntos >= 100, progreso: totalPuntos < 100 ? `${totalPuntos}/100` : null },
      { id:'bicentenario',    icon:'🚀', nombre:'Bicentenario',       desc:'200 pts acumulados',                               cat:'Puntos',      desbloqueado: totalPuntos >= 200, progreso: totalPuntos < 200 ? `${totalPuntos}/200` : null },
      { id:'tricentenario',   icon:'⚡', nombre:'350 pts',            desc:'350 pts acumulados',                               cat:'Puntos',      desbloqueado: totalPuntos >= 350, progreso: totalPuntos < 350 ? `${totalPuntos}/350` : null },
      { id:'quinientos',      icon:'🔱', nombre:'500 pts',            desc:'500 pts acumulados',                               cat:'Puntos',      desbloqueado: totalPuntos >= 500, progreso: totalPuntos < 500 ? `${totalPuntos}/500` : null },
      { id:'ochocientos',     icon:'🌠', nombre:'800 pts',            desc:'800 pts acumulados',                               cat:'Puntos',      desbloqueado: totalPuntos >= 800, progreso: totalPuntos < 800 ? `${totalPuntos}/800` : null },
      { id:'rey_destacado',   icon:'⭐', nombre:'Rey del destacado',  desc:'Exacto en el partido especial',                    cat:'Especiales',  desbloqueado: reyDestacado },
      { id:'empate_preciso',  icon:'🤝', nombre:'Empate preciso',     desc:'Exacto en un partido que terminó empatado',        cat:'Especiales',  desbloqueado: empatePreciso },
      { id:'omnipresente',    icon:'🌍', nombre:'Omnipresente',       desc:'Predijiste en los 5 torneos en la misma fecha',    cat:'Especiales',  desbloqueado: omnipresente },
      { id:'perfecta',        icon:'💫', nombre:'Perfecta',           desc:'Todos los picks correctos en una fecha (mín. 3)',   cat:'Especiales',  desbloqueado: perfecta },
      { id:'doble_pleno',     icon:'🎆', nombre:'Doble pleno',        desc:'Bonus pleno en 2 torneos en la misma fecha',       cat:'Especiales',  desbloqueado: doblePleno },
      { id:'coleccionista',   icon:'🗂️', nombre:'Coleccionista',      desc:'Al menos 1 exacto en cada uno de los 5 torneos',   cat:'Especiales',  desbloqueado: coleccionista, progreso: !coleccionista ? `${catsConExacto.size}/5` : null },
      { id:'embajador',       icon:'📢', nombre:'Embajador',          desc:'Compartiste la app 5 veces',                       cat:'Comunidad',   desbloqueado: invitaciones >= 5,  progreso: invitaciones < 5  ? `${invitaciones}/5`  : null },
      { id:'promotor',        icon:'📣', nombre:'Promotor',           desc:'Compartiste la app 15 veces',                      cat:'Comunidad',   desbloqueado: invitaciones >= 15, progreso: invitaciones < 15 ? `${invitaciones}/15` : null },
      { id:'leyenda_viral',   icon:'🎙️', nombre:'Leyenda viral',      desc:'Compartiste la app 30 veces',                      cat:'Comunidad',   desbloqueado: invitaciones >= 30, progreso: invitaciones < 30 ? `${invitaciones}/30` : null },
    ])

    // ─── Detección de logros nuevos ───────────────────────────────────
    const listaFinal = [
      { id:'primer_exacto',   desbloqueado: totalExactos >= 1 },
      { id:'hat_trick',       desbloqueado: hatTrick },
      { id:'francotirador',   desbloqueado: francotirador },
      { id:'diez_exactos',    desbloqueado: totalExactos >= 10 },
      { id:'quince_exactos',  desbloqueado: totalExactos >= 15 },
      { id:'veinticinco',     desbloqueado: totalExactos >= 25 },
      { id:'pleno',           desbloqueado: pleno },
      { id:'invicto',         desbloqueado: invicto },
      { id:'ojo_clinico',     desbloqueado: ojoClinico },
      { id:'constante',       desbloqueado: constante },
      { id:'gran_semana',     desbloqueado: granSemana },
      { id:'semana_increible',desbloqueado: semanaIncreible },
      { id:'podio',           desbloqueado: podio },
      { id:'lider',           desbloqueado: lider },
      { id:'rey',             desbloqueado: contLider >= 3 },
      { id:'podio_habitual',  desbloqueado: contPodio >= 5 },
      { id:'podio_elite',     desbloqueado: contPodio >= 10 },
      { id:'rey_absoluto',    desbloqueado: contLider >= 5 },
      { id:'cincuenton',      desbloqueado: totalPuntos >= 50 },
      { id:'centenario',      desbloqueado: totalPuntos >= 100 },
      { id:'bicentenario',    desbloqueado: totalPuntos >= 200 },
      { id:'tricentenario',   desbloqueado: totalPuntos >= 350 },
      { id:'quinientos',      desbloqueado: totalPuntos >= 500 },
      { id:'ochocientos',     desbloqueado: totalPuntos >= 800 },
      { id:'rey_destacado',   desbloqueado: reyDestacado },
      { id:'empate_preciso',  desbloqueado: empatePreciso },
      { id:'omnipresente',    desbloqueado: omnipresente },
      { id:'perfecta',        desbloqueado: perfecta },
      { id:'doble_pleno',     desbloqueado: doblePleno },
      { id:'coleccionista',   desbloqueado: coleccionista },
      { id:'embajador',       desbloqueado: invitaciones >= 5 },
      { id:'promotor',        desbloqueado: invitaciones >= 15 },
      { id:'leyenda_viral',   desbloqueado: invitaciones >= 30 },
    ]
    const storageKey = `logros_vistos_${user.id}`
    const visitadosRaw = localStorage.getItem(storageKey)
    const desbloqueadosIds = listaFinal.filter(l => l.desbloqueado).map(l => l.id)
    if (visitadosRaw === null) {
      // Primera vez: marcar todos como ya vistos (sin mostrar toast)
      localStorage.setItem(storageKey, JSON.stringify(desbloqueadosIds))
    } else {
      const vistos = JSON.parse(visitadosRaw)
      const nuevos = listaFinal.filter(l => l.desbloqueado && !vistos.includes(l.id))
      if (nuevos.length > 0) {
        localStorage.setItem(storageKey, JSON.stringify([...vistos, ...nuevos.map(l => l.id)]))
        // Buscar info completa (icon, nombre, desc) del array que ya construimos arriba
        // Re-usamos los datos que ya están en setLogros usando un mapa inline
        const infoMap = {
          primer_exacto:   { icon:'🎯', nombre:'Primer exacto',    desc:'Tu primer resultado exacto' },
          hat_trick:       { icon:'⚽', nombre:'Hat-trick',         desc:'3 exactos en la misma fecha' },
          francotirador:   { icon:'⚡', nombre:'Francotirador',     desc:'5 exactos en la misma fecha' },
          diez_exactos:    { icon:'🏹', nombre:'10 exactos',        desc:'10 exactos acumulados' },
          quince_exactos:  { icon:'🔥', nombre:'15 exactos',        desc:'15 exactos acumulados' },
          veinticinco:     { icon:'💎', nombre:'25 exactos',        desc:'25 exactos acumulados' },
          pleno:           { icon:'💥', nombre:'Pleno',             desc:'Bonus pleno en una fecha' },
          invicto:         { icon:'🛡️', nombre:'Invicto',           desc:'Fecha sin ningún partido fallado' },
          ojo_clinico:     { icon:'👁️', nombre:'Ojo clínico',       desc:'70%+ de acierto en una fecha' },
          constante:       { icon:'🔄', nombre:'Constante',         desc:'3 fechas seguidas con 60%+ de acierto' },
          gran_semana:     { icon:'📊', nombre:'Gran semana',       desc:'25+ pts en una semana' },
          semana_increible:{ icon:'🌟', nombre:'Semana increíble',  desc:'50+ pts en una semana' },
          podio:           { icon:'🥇', nombre:'Podio',             desc:'Top 3 en una fecha' },
          lider:           { icon:'👑', nombre:'Líder',             desc:'#1 en una fecha' },
          rey:             { icon:'🏆', nombre:'Rey',               desc:'#1 en 3 fechas distintas' },
          podio_habitual:  { icon:'🥈', nombre:'Podio habitual',    desc:'Top 3 en 5 fechas distintas' },
          podio_elite:     { icon:'🎖️', nombre:'Podio élite',       desc:'Top 3 en 10 fechas distintas' },
          rey_absoluto:    { icon:'👸', nombre:'Rey absoluto',      desc:'#1 en 5 fechas distintas' },
          cincuenton:      { icon:'🔢', nombre:'Cincuentón',        desc:'50 pts acumulados' },
          centenario:      { icon:'💯', nombre:'Centenario',        desc:'100 pts acumulados' },
          bicentenario:    { icon:'🚀', nombre:'Bicentenario',      desc:'200 pts acumulados' },
          tricentenario:   { icon:'⚡', nombre:'350 pts',           desc:'350 pts acumulados' },
          quinientos:      { icon:'🔱', nombre:'500 pts',           desc:'500 pts acumulados' },
          ochocientos:     { icon:'🌠', nombre:'800 pts',           desc:'800 pts acumulados' },
          rey_destacado:   { icon:'⭐', nombre:'Rey del destacado', desc:'Exacto en el partido especial' },
          empate_preciso:  { icon:'🤝', nombre:'Empate preciso',    desc:'Exacto en un partido empatado' },
          omnipresente:    { icon:'🌍', nombre:'Omnipresente',      desc:'Predijiste en los 5 torneos' },
          perfecta:        { icon:'💫', nombre:'Perfecta',          desc:'Todos los picks correctos en una fecha' },
          doble_pleno:     { icon:'🎆', nombre:'Doble pleno',       desc:'Bonus pleno en 2 torneos' },
          coleccionista:   { icon:'🗂️', nombre:'Coleccionista',     desc:'Al menos 1 exacto en cada torneo' },
          embajador:       { icon:'📢', nombre:'Embajador',         desc:'Compartiste la app 5 veces' },
          promotor:        { icon:'📣', nombre:'Promotor',          desc:'Compartiste la app 15 veces' },
          leyenda_viral:   { icon:'🎙️', nombre:'Leyenda viral',     desc:'Compartiste la app 30 veces' },
        }
        nuevos.forEach(l => {
          const info = infoMap[l.id]
          if (info) window.dispatchEvent(new CustomEvent('logro-desbloqueado', { detail: { id: l.id, ...info } }))
        })
      }
    }
    // ─────────────────────────────────────────────────────────────────

    setLoadingPestaña(false)
  }

  async function cambiarPassword(e) {
    e.preventDefault()
    if (pass1.length < 6) { setMsgPass('Mínimo 6 caracteres'); return }
    if (pass1 !== pass2) { setMsgPass('Las contraseñas no coinciden'); return }
    setLoadingPass(true)
    const { error } = await supabase.auth.updateUser({ password: pass1 })
    if (error) setMsgPass('Error: ' + error.message)
    else { setMsgPass('✓ Contraseña actualizada'); setPass1(''); setPass2('') }
    setLoadingPass(false)
    setTimeout(() => setMsgPass(''), 4000)
  }

  async function guardar(e) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.from('perfiles').update({ nombre_completo: nombre, club }).eq('id', user.id)
    if (!error) { setMsg('✓ Perfil actualizado'); cargarPerfil(user.id) }
    else setMsg('Error al guardar: ' + error.message)
    setLoading(false)
    setTimeout(() => setMsg(''), 3000)
  }

  async function subirFoto(e) {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { setMsg('La imagen debe ser menor a 2MB'); return }
    setSubiendo(true)
    try {
      const ext = file.name.split('.').pop().toLowerCase()
      const path = `${user.id}.${ext}`
      const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true, contentType: file.type })
      if (upErr) throw upErr
      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      await supabase.from('perfiles').update({ avatar_url: data.publicUrl }).eq('id', user.id)
      setPreview(data.publicUrl + '?t=' + Date.now())
      cargarPerfil(user.id)
      setMsg('✓ Foto actualizada')
    } catch(err) { setMsg('Error al subir: ' + err.message) }
    setSubiendo(false)
    setTimeout(() => setMsg(''), 4000)
  }

  async function registrarShare() {
    const { data } = await supabase.from('perfiles').select('invitaciones').eq('id', user.id).single()
    await supabase.from('perfiles').update({ invitaciones: (data?.invitaciones || 0) + 1 }).eq('id', user.id)
    if (pestaña === 'logros') cargarLogros()
  }

  function toggleTab(id) { setPestaña(pestaña === id ? null : id) }

  const ini = perfil?.username?.[0]?.toUpperCase() || 'U'
  const trofeo = getTrofeo(racha.maxima)
  const proximoTrofeo = TROFEOS.slice().reverse().find(t => racha.maxima < t.minimo)

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">Mi <span className="page-title-accent">perfil</span></h1>
      </div>

      {/* ===== SECCIÓN FIJA ===== */}
      <div className="card" style={{marginBottom:12}}>
        <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:14,paddingBottom:14,borderBottom:'1px solid var(--gris-borde)'}}>
          <div style={{width:60,height:60,borderRadius:'50%',background:'linear-gradient(135deg,var(--dorado),var(--dorado-oscuro))',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,fontWeight:700,color:'var(--azul)',overflow:'hidden',border:'2.5px solid var(--dorado)',flexShrink:0}}>
            {preview ? <img src={preview} alt="avatar" style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:'50%'}} /> : ini}
          </div>
          <div style={{flex:1}}>
            <div style={{fontFamily:'Rajdhani,sans-serif',fontSize:19,fontWeight:700,color:'var(--azul)'}}>@{perfil?.username}</div>
            <div style={{fontSize:12,color:'var(--texto-suave)',marginTop:1}}>{perfil?.club || 'Sin club asignado'}</div>
            {perfil?.es_admin && <span className="cat-badge cat-top14" style={{marginTop:4,display:'inline-block'}}>Admin</span>}
          </div>
        </div>

        {stats && (
          <div style={{marginBottom:14}}>
            <div style={{fontSize:10,fontWeight:700,color:'var(--texto-suave)',textTransform:'uppercase',letterSpacing:1,marginBottom:8}}>Estadísticas 2026</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:6}}>
              {[
                { v: stats.totalPuntos,              l: 'Total pts',   color: 'var(--azul)' },
                { v: stats.totalFechas,              l: 'Fechas',      color: 'var(--texto)' },
                { v: stats.mejorFecha,               l: 'Mejor fecha', color: 'var(--dorado-oscuro)' },
                { v: `${stats.promedio}`,            l: 'Promedio',    color: 'var(--texto)' },
                { v: `${stats.pctAcierto}%`,         l: 'Acierto',     color: '#16a34a' },
                { v: stats.posicion ? `#${stats.posicion}` : '—', l: `de ${stats.totalJugadores}`, color: 'var(--azul)' },
              ].map((s, i) => (
                <div key={i} style={{textAlign:'center',padding:'7px 4px',background:'var(--gris)',borderRadius:8,border:'1px solid var(--gris-borde)'}}>
                  <div style={{fontFamily:'Rajdhani,sans-serif',fontSize:17,fontWeight:700,color:s.color,lineHeight:1}}>{s.v}</div>
                  <div style={{fontSize:9,color:'var(--texto-suave)',marginTop:2,textTransform:'uppercase',letterSpacing:0.3}}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{fontSize:10,fontWeight:700,color:'var(--texto-suave)',textTransform:'uppercase',letterSpacing:1,marginBottom:8}}>Racha de fechas jugadas</div>
        <div style={{display:'flex',gap:8,marginBottom:10}}>
          <div style={{flex:1,textAlign:'center',padding:'8px 6px',background:'rgba(201,162,39,0.08)',borderRadius:8,border:'1px solid rgba(201,162,39,0.25)'}}>
            <div style={{fontSize:20,fontWeight:700,fontFamily:'Rajdhani,sans-serif',color:'var(--azul)',lineHeight:1}}>{racha.actual > 0 ? '🔥' : '—'} {racha.actual}</div>
            <div style={{fontSize:9,color:'var(--texto-suave)',marginTop:3,textTransform:'uppercase',letterSpacing:0.5}}>Racha actual</div>
          </div>
          <div style={{flex:1,textAlign:'center',padding:'8px 6px',background:'rgba(201,162,39,0.08)',borderRadius:8,border:'1px solid rgba(201,162,39,0.25)'}}>
            <div style={{fontSize:20,fontWeight:700,fontFamily:'Rajdhani,sans-serif',color:'var(--dorado-oscuro)',lineHeight:1}}>🏆 {racha.maxima}</div>
            <div style={{fontSize:9,color:'var(--texto-suave)',marginTop:3,textTransform:'uppercase',letterSpacing:0.5}}>Racha máxima</div>
          </div>
        </div>
        {trofeo ? (
          <div style={{display:'flex',alignItems:'center',gap:12,padding:'10px 12px',background:trofeo.bg,borderRadius:10,border:`1.5px solid ${trofeo.color}40`}}>
            <img src={trofeo.img} alt={trofeo.nombre} style={{width:44,height:44,objectFit:'contain',flexShrink:0}} />
            <div>
              <div style={{fontFamily:'Rajdhani,sans-serif',fontSize:15,fontWeight:700,color:trofeo.color,letterSpacing:1}}>{trofeo.nombre.toUpperCase()}</div>
              <div style={{fontSize:12,color:'var(--texto)',marginTop:1}}>"{trofeo.desc}"</div>
              <div style={{fontSize:10,color:'var(--texto-suave)',marginTop:2}}>Con {trofeo.minimo} fechas consecutivas</div>
            </div>
          </div>
        ) : (
          <div style={{padding:'10px 14px',background:'var(--gris)',borderRadius:8,textAlign:'center'}}>
            <div style={{fontSize:12,color:'var(--texto-suave)'}}>Completá {proximoTrofeo ? proximoTrofeo.minimo : 3} fechas consecutivas para ganar tu primer trofeo 🏆</div>
          </div>
        )}
        {trofeo && proximoTrofeo && (
          <div style={{marginTop:6,padding:'8px 12px',background:'var(--gris)',borderRadius:8,display:'flex',alignItems:'center',gap:8}}>
            <img src={proximoTrofeo.img} alt={proximoTrofeo.nombre} style={{width:24,height:24,objectFit:'contain',opacity:0.4,flexShrink:0}} />
            <div style={{fontSize:11,color:'var(--texto-suave)'}}>Próximo: <strong style={{color:'var(--texto)'}}>{proximoTrofeo.nombre}</strong> — {proximoTrofeo.minimo} fechas consecutivas</div>
          </div>
        )}
      </div>

      {/* ===== ACORDEÓN ===== */}
      {TABS.map(t => (
        <div key={t.id} className="card" style={{marginBottom:8,padding:0,overflow:'hidden'}}>
          <button
            onClick={() => toggleTab(t.id)}
            style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 18px',background:'none',border:'none',cursor:'pointer',textAlign:'left',gap:10}}
          >
            <span style={{fontFamily:'Rajdhani,sans-serif',fontSize:15,fontWeight:700,color:'var(--azul)'}}>
              {t.label}
            </span>
            <span style={{fontSize:11,color:'var(--texto-suave)',transition:'transform 0.2s',transform:pestaña === t.id ? 'rotate(180deg)' : 'rotate(0deg)',flexShrink:0,display:'inline-block'}}>
              ▼
            </span>
          </button>

          {pestaña === t.id && (
            <div className="seccion-fade" style={{padding:'0 18px 18px',borderTop:'1px solid var(--gris-borde)'}}>

              {/* HISTORIAL */}
              {t.id === 'historial' && (
                loadingPestaña
                  ? <div className="loading" style={{padding:'24px 0'}}><div className="spinner"></div></div>
                  : historial.length === 0
                    ? <div className="empty-state" style={{padding:'28px 20px'}}>
                        <div style={{fontSize:46,marginBottom:10}}>📋</div>
                        <div className="empty-title">Sin historial todavía</div>
                        <p style={{fontSize:13,color:'var(--texto-suave)',marginTop:6,maxWidth:220,margin:'8px auto 0',lineHeight:1.5}}>
                          Aparecerá después de tu primera fecha con resultados cargados.
                        </p>
                      </div>
                    : <div style={{paddingTop:12}}>
                        {historial.map(f => (
                          <div key={f.numero} style={{display:'flex',alignItems:'center',padding:'10px 0',borderBottom:'1px solid var(--gris-borde)',gap:10}}>
                            <div style={{minWidth:60}}>
                              <div style={{fontFamily:'Rajdhani,sans-serif',fontSize:14,fontWeight:700,color:'var(--azul)'}}>Fecha {f.numero}</div>
                              <div style={{display:'flex',gap:3,flexWrap:'wrap',marginTop:3}}>
                                {f.cats.map(cat => (
                                  <span key={cat} className={`cat-badge ${CAT_CLASS[cat]}`} style={{fontSize:9,padding:'1px 5px'}}>{CATS_SHORT[cat]}</span>
                                ))}
                              </div>
                            </div>
                            <div style={{flex:1}} />
                            <div style={{textAlign:'right'}}>
                              <span style={{fontFamily:'Rajdhani,sans-serif',fontSize:20,fontWeight:700,color:'var(--azul)'}}>{f.totalPts}</span>
                              <span style={{fontSize:11,color:'var(--texto-suave)',marginLeft:3}}>pts</span>
                              {f.pleno > 0 && <div style={{fontSize:10,color:'var(--dorado-oscuro)',fontWeight:700}}>💥 pleno</div>}
                            </div>
                            {f.pos > 0 && (
                              <div style={{textAlign:'center',minWidth:44,background:'var(--gris)',borderRadius:8,padding:'4px 6px',flexShrink:0}}>
                                <div style={{fontFamily:'Rajdhani,sans-serif',fontSize:14,fontWeight:700,color: f.pos <= 3 ? 'var(--dorado-oscuro)' : 'var(--azul)'}}>{f.pos <= 3 ? ['🥇','🥈','🥉'][f.pos-1] : `#${f.pos}`}</div>
                                <div style={{fontSize:9,color:'var(--texto-suave)'}}>de {f.total}</div>
                              </div>
                            )}
                            <button
                              disabled={compartiendoFecha === f.numero}
                              onClick={() => {
                                setCompartiendoFecha(f.numero)
                                const posTexto = f.pos === 1 ? '🥇 1ro' : f.pos === 2 ? '🥈 2do' : f.pos === 3 ? '🥉 3ro' : `#${f.pos}`
                                const msg = encodeURIComponent(
                                  `🏉 Pick&Go · Fecha ${f.numero} · URBA 2026\n` +
                                  `${f.pos > 0 ? `Quedé ${posTexto} de ${f.total} con ` : ''}${f.totalPts} pts${f.pleno > 0 ? ' 💥' : ''}\n\n` +
                                  `¿Jugás también? → pickandgo-prode.vercel.app`
                                )
                                window.open(`https://wa.me/?text=${msg}`, '_blank')
                                registrarShare()
                                setCompartiendoFecha(null)
                              }}
                              style={{flexShrink:0,background:'none',border:'none',cursor:'pointer',fontSize:16,padding:'4px',opacity:compartiendoFecha===f.numero?0.4:0.6,transition:'opacity 0.15s'}}
                              title="Compartir resultado"
                            >
                              📲
                            </button>
                          </div>
                        ))}
                      </div>
              )}

              {/* LOGROS */}
              {t.id === 'logros' && (
                loadingPestaña
                  ? <div className="loading" style={{padding:'24px 0'}}><div className="spinner"></div></div>
                  : <div style={{paddingTop:12}}>
                      {LOGROS_CATS.map(cat => {
                        const catLogros = logros.filter(l => l.cat === cat)
                        const desbloqueados = catLogros.filter(l => l.desbloqueado).length
                        return (
                          <div key={cat} style={{marginBottom:20}}>
                            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                              <div style={{fontSize:10,fontWeight:700,color:'var(--texto-suave)',textTransform:'uppercase',letterSpacing:1}}>{cat}</div>
                              <div style={{fontSize:10,color:'var(--texto-suave)'}}>{desbloqueados}/{catLogros.length}</div>
                            </div>
                            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:7}}>
                              {catLogros.map(l => (
                                <div key={l.id} style={{
                                  textAlign:'center', padding:'10px 6px', borderRadius:10, position:'relative',
                                  background: l.desbloqueado ? 'linear-gradient(135deg,var(--dorado-claro),#fff)' : 'var(--gris)',
                                  border: l.desbloqueado ? '1.5px solid rgba(201,162,39,0.4)' : '1px solid var(--gris-borde)',
                                  opacity: l.desbloqueado ? 1 : 0.55,
                                }}>
                                  {l.desbloqueado && (
                                    <div style={{position:'absolute',top:5,right:5,width:14,height:14,borderRadius:'50%',background:'#16a34a',display:'flex',alignItems:'center',justifyContent:'center',fontSize:8,color:'white',fontWeight:700}}>✓</div>
                                  )}
                                  <div style={{fontSize:22,marginBottom:3}}>{l.icon}</div>
                                  <div style={{fontFamily:'Rajdhani,sans-serif',fontSize:11,fontWeight:700,color:l.desbloqueado ? 'var(--azul)' : 'var(--texto-suave)',lineHeight:1.2,marginBottom:3}}>{l.nombre}</div>
                                  <div style={{fontSize:9,color:'var(--texto-suave)',lineHeight:1.3}}>{l.desc}</div>
                                  {l.progreso && <div style={{marginTop:5,fontSize:10,fontWeight:700,color:'var(--dorado-oscuro)',background:'rgba(201,162,39,0.1)',borderRadius:4,padding:'2px 6px',display:'inline-block'}}>{l.progreso}</div>}
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
              )}

              {/* GRUPOS */}
              {t.id === 'grupos' && (
                <GruposContenido />
              )}

              {/* MIS DATOS */}
              {t.id === 'datos' && (
                <div style={{paddingTop:14}}>
                  <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:16,paddingBottom:14,borderBottom:'1px solid var(--gris-borde)'}}>
                    <div style={{position:'relative',flexShrink:0}}>
                      <div style={{width:58,height:58,borderRadius:'50%',background:'linear-gradient(135deg,var(--dorado),var(--dorado-oscuro))',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,fontWeight:700,color:'var(--azul)',overflow:'hidden',border:'2px solid var(--dorado)'}}>
                        {preview ? <img src={preview} alt="avatar" style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:'50%'}} /> : ini}
                      </div>
                      <label style={{position:'absolute',bottom:-2,right:-2,width:22,height:22,background:'var(--rojo-vivo)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',border:'2px solid white',fontSize:14,color:'white',fontWeight:700}}>
                        {subiendo ? '⟳' : '+'}
                        <input type="file" accept="image/jpeg,image/png,image/webp" style={{display:'none'}} onChange={subirFoto} disabled={subiendo} />
                      </label>
                    </div>
                    <div style={{fontSize:12,color:'var(--texto-suave)'}}>Cambiá tu foto de perfil. Máximo 2MB.</div>
                  </div>
                  {msg && <div className={`alert ${msg.startsWith('Error')||msg.startsWith('La imagen')?'alert-error':'alert-success'}`}>{msg}</div>}
                  <form onSubmit={guardar}>
                    <div className="form-group">
                      <label className="form-label">Nombre completo</label>
                      <input className="form-input" type="text" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Tu nombre" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Club al que pertenecés</label>
                      <select className="form-select" value={club} onChange={e => setClub(e.target.value)}>
                        <option value="">Seleccioná tu club</option>
                        {CLUBES_URBA.map((c,i) => (
                          c.startsWith('---')
                            ? <option key={i} disabled style={{fontWeight:700,color:'#999'}}>{c}</option>
                            : <option key={i} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                      {loading ? 'Guardando...' : 'Guardar cambios'}
                    </button>
                  </form>
                </div>
              )}

              {/* CONTRASEÑA */}
              {t.id === 'contrasena' && (
                <div style={{paddingTop:14}}>
                  {msgPass && <div className={`alert ${msgPass.startsWith('Error')||msgPass==='Mínimo 6 caracteres'||msgPass==='Las contraseñas no coinciden'?'alert-error':'alert-success'}`}>{msgPass}</div>}
                  <form onSubmit={cambiarPassword}>
                    <div className="form-group">
                      <label className="form-label">Nueva contraseña</label>
                      <input className="form-input" type="password" placeholder="Mínimo 6 caracteres" value={pass1} onChange={e => setPass1(e.target.value)} minLength={6} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Repetir contraseña</label>
                      <input className="form-input" type="password" placeholder="Repetí la contraseña" value={pass2} onChange={e => setPass2(e.target.value)} minLength={6} required />
                    </div>
                    <button type="submit" className="btn btn-secondary" disabled={loadingPass}>
                      {loadingPass ? 'Guardando...' : 'Cambiar contraseña'}
                    </button>
                  </form>
                </div>
              )}

              {/* NOTIFICACIONES */}
              {t.id === 'notificaciones' && (
                <div style={{paddingTop:14}}>
                  {'Notification' in window ? (
                    permiso === 'denied'
                      ? <div className="alert alert-error">Bloqueaste las notificaciones. Para activarlas andá a la configuración de tu navegador y permitilas para este sitio.</div>
                      : <div>
                          <p style={{fontSize:13,color:'var(--texto-suave)',marginBottom:16,lineHeight:1.7}}>Recibí recordatorios antes del cierre del prode y avisos cuando se cargan los resultados.</p>
                          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 16px',background:'var(--gris)',borderRadius:10,marginBottom:8}}>
                            <div>
                              <div style={{fontWeight:600,fontSize:14}}>{suscrito ? '✅ Notificaciones activadas' : '🔕 Notificaciones desactivadas'}</div>
                              <div style={{fontSize:12,color:'var(--texto-suave)',marginTop:2}}>{suscrito ? 'Vas a recibir recordatorios y resultados' : 'No estás recibiendo avisos'}</div>
                            </div>
                            <button className={`btn ${suscrito?'btn-secondary':'btn-primary'} btn-small`} onClick={suscrito?desuscribirse:suscribirse} disabled={cargandoNotif}>
                              {cargandoNotif ? '...' : suscrito ? 'Desactivar' : 'Activar'}
                            </button>
                          </div>
                          {suscrito && <div style={{fontSize:12,color:'var(--texto-suave)',lineHeight:1.8}}>Vas a recibir avisos: 24hs, 12hs, 4hs y 2hs antes del cierre · Al cargarse los resultados</div>}
                        </div>
                  ) : (
                    <div className="alert alert-info">Tu navegador no soporta notificaciones push.</div>
                  )}
                </div>
              )}

              {/* INVITAR */}
              {t.id === 'invitar' && (
                <div style={{paddingTop:14}}>
                  <p style={{fontSize:13,color:'var(--texto-suave)',marginBottom:16,lineHeight:1.7}}>¿Conocés a alguien que le guste el rugby? Mandales el link para que se sumen al prode.</p>
                  <div style={{display:'flex',flexDirection:'column',gap:10}}>
                    <button className="btn btn-primary" onClick={() => {
                      const msg = encodeURIComponent("🏉 Pick&Go — Prode URBA 2026\nPredecí los partidos de Top 14, Primera A, B, C y Segunda. Hay ranking semanal y anual.\n\n¡Sumate! 👇\nhttps://pickandgo-prode.vercel.app")
                      window.open(`https://wa.me/?text=${msg}`, '_blank')
                      registrarShare()
                    }}>
                      📲 Invitar por WhatsApp
                    </button>
                    <button className="btn btn-secondary" onClick={async () => {
                      const texto = "🏉 Pick&Go — Prode URBA 2026\nPredecí los partidos de Top 14, Primera A, B, C y Segunda. Hay ranking semanal y anual.\n\n¡Sumate! 👇\nhttps://pickandgo-prode.vercel.app"
                      if (navigator.share) {
                        try {
                          await navigator.share({ text: texto })
                          registrarShare()
                        } catch(e) { /* usuario canceló */ }
                      } else {
                        await navigator.clipboard.writeText("https://pickandgo-prode.vercel.app")
                        alert("Link copiado. Pegalo en Instagram.")
                      }
                    }}>
                      📸 Compartir en Instagram
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      ))}

      {/* Salir — visible solo en móvil (desktop usa el botón de la navbar) */}
      <SalirBtn />
    </div>
  )
}
