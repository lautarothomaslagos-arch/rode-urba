/**
 * Computa estadísticas por equipo a partir de un array de partidos con resultados.
 * Cada partido debe tener: equipo_local {id,...}, equipo_visitante {id,...},
 * resultado_local, resultado_visitante, fecha_id.
 *
 * Retorna un objeto keyed por equipo_id.
 */
export function computeEquipoStats(partidos) {
  const teams = {}

  function addTeam(equipo, pf, pc, fechaId) {
    if (!equipo?.id) return
    const id = equipo.id
    if (!teams[id]) {
      teams[id] = { equipo, pj: 0, g: 0, e: 0, pe: 0, pf: 0, pc: 0, resultados: [] }
    }
    const t = teams[id]
    t.pj++
    t.pf += pf
    t.pc += pc
    if (pf > pc)      t.g++
    else if (pf === pc) t.e++
    else              t.pe++
    t.resultados.push({ res: pf > pc ? 'W' : pf === pc ? 'D' : 'L', fechaId })
  }

  partidos.forEach(p => {
    if (p.resultado_local == null || p.resultado_visitante == null) return
    addTeam(p.equipo_local, p.resultado_local,  p.resultado_visitante, p.fecha_id)
    addTeam(p.equipo_visitante, p.resultado_visitante, p.resultado_local, p.fecha_id)
  })

  Object.values(teams).forEach(t => {
    t.dif  = t.pf - t.pc
    t.resultados.sort((a, b) => b.fechaId - a.fechaId)
    t.forma = t.resultados.slice(0, 5).map(r => r.res)
  })

  return teams
}

/** Retorna los equipos ordenados: más victorias → mayor diferencia */
export function sortedTeams(statsMap) {
  return Object.values(statsMap).sort((a, b) =>
    b.g !== a.g ? b.g - a.g : b.dif - a.dif
  )
}

/** Ícono de forma: W=🟢  D=🟡  L=🔴 */
export function formaIcon(res) {
  if (res === 'W') return { icon: 'W', color: '#16a34a', bg: '#dcfce7' }
  if (res === 'D') return { icon: 'E', color: '#ca8a04', bg: '#fef9c3' }
  return                  { icon: 'D', color: '#dc2626', bg: '#fee2e2' }
}
