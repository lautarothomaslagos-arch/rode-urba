/**
 * Computa estadísticas por equipo a partir de un array de partidos con resultados.
 * Sistema de puntos URBA:
 *   Victoria      → 4 pts
 *   Empate        → 2 pts
 *   Derrota       → 0 pts
 *   Bonus defensivo → +1 si perdés por 7 puntos o menos
 *   Bonus ofensivo  → +1 por 3+ tries más que el rival (no computable sin datos de tries)
 *
 * Cada partido debe tener: equipo_local {id,...}, equipo_visitante {id,...},
 * resultado_local (pts), resultado_visitante (pts), fecha_id.
 */
export function computeEquipoStats(partidos) {
  const teams = {}

  function addTeam(equipo, pf, pc, fechaId) {
    if (!equipo?.id) return
    const id = equipo.id
    if (!teams[id]) {
      teams[id] = {
        equipo, pj: 0, g: 0, e: 0, pe: 0,
        pf: 0, pc: 0, pts: 0, bd: 0,
        resultados: [],
      }
    }
    const t = teams[id]
    t.pj++
    t.pf += pf
    t.pc += pc

    if (pf > pc) {
      t.g++
      t.pts += 4
    } else if (pf === pc) {
      t.e++
      t.pts += 2
    } else {
      t.pe++
      // Bonus defensivo: derrota por 7 puntos o menos
      if ((pc - pf) <= 7) { t.pts += 1; t.bd++ }
    }

    t.resultados.push({ res: pf > pc ? 'W' : pf === pc ? 'D' : 'L', fechaId })
  }

  partidos.forEach(p => {
    if (p.resultado_local == null || p.resultado_visitante == null) return
    addTeam(p.equipo_local,    p.resultado_local,    p.resultado_visitante, p.fecha_id)
    addTeam(p.equipo_visitante, p.resultado_visitante, p.resultado_local,    p.fecha_id)
  })

  Object.values(teams).forEach(t => {
    t.dif = t.pf - t.pc
    t.resultados.sort((a, b) => b.fechaId - a.fechaId)
    t.forma = t.resultados.slice(0, 5).map(r => r.res)
  })

  return teams
}

/**
 * Retorna los equipos ordenados por tabla URBA:
 * pts desc → dif desc → pf desc
 */
export function sortedTeams(statsMap) {
  return Object.values(statsMap).sort((a, b) =>
    b.pts !== a.pts ? b.pts - a.pts :
    b.dif !== a.dif ? b.dif - a.dif :
    b.pf  - a.pf
  )
}

/** Chip de forma: W=ganó  D=empató  L=perdió */
export function formaIcon(res) {
  if (res === 'W') return { icon: 'W', color: '#16a34a', bg: '#dcfce7' }
  if (res === 'D') return { icon: 'E', color: '#ca8a04', bg: '#fef9c3' }
  return                  { icon: 'D', color: '#dc2626', bg: '#fee2e2' }
}
