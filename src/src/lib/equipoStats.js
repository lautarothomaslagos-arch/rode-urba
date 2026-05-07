/**
 * Computa estadísticas por equipo a partir de un array de partidos con resultados.
 *
 * Sistema de puntos URBA:
 *   Victoria        → 4 pts
 *   Empate          → 2 pts
 *   Derrota         → 0 pts
 *   Bonus ofensivo  → +1 si bonus_of_local / bonus_of_visitante está marcado
 *   Bonus defensivo → +1 si perdés por 7 puntos o menos
 *
 * Cada partido debe tener:
 *   equipo_local / equipo_visitante        {id, nombre, nombre_corto, escudo_url}
 *   resultado_local / resultado_visitante  (puntos finales)
 *   bonus_of_local / bonus_of_visitante    (booleanos)
 *   fecha_id
 */
export function computeEquipoStats(partidos) {
  const teams = {}

  function addTeam(equipo, pf, pc, bonusOf, fechaId) {
    if (!equipo?.id) return
    const id = equipo.id
    if (!teams[id]) {
      teams[id] = {
        equipo, pj: 0, g: 0, e: 0, pe: 0,
        pf: 0, pc: 0, pts: 0, bo: 0, bd: 0,
        resultados: [],
      }
    }
    const t = teams[id]
    t.pj++
    t.pf += pf
    t.pc += pc

    const bonusOfensivo  = bonusOf ? 1 : 0
    const bonusDefensivo = (pf < pc && (pc - pf) <= 7) ? 1 : 0

    if (pf > pc) {
      t.g++
      t.pts += 4 + bonusOfensivo
    } else if (pf === pc) {
      t.e++
      t.pts += 2 + bonusOfensivo
    } else {
      t.pe++
      t.pts += bonusDefensivo + bonusOfensivo
      if (bonusDefensivo) t.bd++
    }
    if (bonusOfensivo) t.bo++

    t.resultados.push({ res: pf > pc ? 'W' : pf === pc ? 'D' : 'L', fechaId })
  }

  partidos.forEach(p => {
    if (p.resultado_local == null || p.resultado_visitante == null) return
    addTeam(p.equipo_local,    p.resultado_local,    p.resultado_visitante, p.bonus_of_local,    p.fecha_id)
    addTeam(p.equipo_visitante, p.resultado_visitante, p.resultado_local,   p.bonus_of_visitante, p.fecha_id)
  })

  Object.values(teams).forEach(t => {
    t.dif = t.pf - t.pc
    t.resultados.sort((a, b) => b.fechaId - a.fechaId)
    t.forma = t.resultados.slice(0, 5).map(r => r.res)
  })

  return teams
}

/** Ordenamiento URBA: PTS → DIF → PF */
export function sortedTeams(statsMap) {
  return Object.values(statsMap).sort((a, b) =>
    b.pts !== a.pts ? b.pts - a.pts :
    b.dif !== a.dif ? b.dif - a.dif :
    b.pf  - a.pf
  )
}

/** Chip de forma */
export function formaIcon(res) {
  if (res === 'W') return { icon: 'W', color: '#16a34a', bg: '#dcfce7' }
  if (res === 'D') return { icon: 'E', color: '#ca8a04', bg: '#fef9c3' }
  return                  { icon: 'D', color: '#dc2626', bg: '#fee2e2' }
}
