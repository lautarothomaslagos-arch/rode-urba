-- ============================================================
-- Pick&Go — Funciones SQL críticas
-- ============================================================
-- IMPORTANTE: Estas funciones son el corazón del sistema de puntos.
-- Si se borran o modifican en Supabase, volver a ejecutar este archivo.
--
-- Orden de ejecución:
--   1. actualizar_puntos_totales  (debe existir antes que calcular_puntos_fecha)
--   2. calcular_puntos_fecha
-- ============================================================


-- ============================================================
-- FUNCIÓN 1: actualizar_puntos_totales
-- ============================================================
-- Recalcula los puntos acumulados anuales para todos los usuarios
-- leyendo directamente desde puntos_fecha.
-- Llamada automáticamente al final de calcular_puntos_fecha.
-- También puede ejecutarse manualmente para reparar datos:
--   SELECT actualizar_puntos_totales(1);
-- ============================================================

CREATE OR REPLACE FUNCTION actualizar_puntos_totales(p_temporada_id int DEFAULT 1)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO puntos_totales (usuario_id, temporada_id, puntos_acumulados, fechas_jugadas)
  SELECT
    pf.usuario_id,
    p_temporada_id,
    SUM(pf.total_puntos)         AS puntos_acumulados,
    COUNT(DISTINCT f.numero)     AS fechas_jugadas
  FROM puntos_fecha pf
  JOIN fechas f ON f.id = pf.fecha_id
  WHERE f.temporada_id = p_temporada_id
  GROUP BY pf.usuario_id
  ON CONFLICT (usuario_id, temporada_id)
  DO UPDATE SET
    puntos_acumulados = EXCLUDED.puntos_acumulados,
    fechas_jugadas    = EXCLUDED.fechas_jugadas;
END;
$$;


-- ============================================================
-- FUNCIÓN 2: calcular_puntos_fecha
-- ============================================================
-- Calcula los puntos de TODOS los usuarios para una fecha dada.
-- Llamada desde Admin.jsx después de guardar resultados.
--
-- Sistema de puntaje:
--   - Exacto (resultado exacto): +3 pts
--   - Signo (ganador/empate correcto sin ser exacto): +1 pt
--   - Partido especial (es_especial = true): multiplica x2
--     → exacto especial = 6 pts, signo especial = 2 pts
--
-- Bonos por fecha (aplica sobre el total de partidos jugados):
--   - bonus_pleno: +5 pts si el usuario acertó el 100% de los partidos
--   - bonus_mitad: +2 pts si acertó ≥ 50% (pero no el 100%)
--   - Son mutuamente excluyentes: si hay pleno, no hay mitad
--
-- Columnas que actualiza en predicciones: (ninguna)
-- Tablas que actualiza:
--   - puntos_fecha      (upsert por usuario_id + fecha_id)
--   - perfiles          (racha_actual, racha_maxima)
--   - puntos_totales    (via actualizar_puntos_totales)
-- ============================================================

CREATE OR REPLACE FUNCTION calcular_puntos_fecha(p_fecha_id bigint)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_temporada_id int;
BEGIN

  -- ── Validar que la fecha existe ──────────────────────────────
  SELECT temporada_id INTO v_temporada_id
  FROM fechas
  WHERE id = p_fecha_id;

  IF v_temporada_id IS NULL THEN
    RAISE EXCEPTION 'calcular_puntos_fecha: fecha_id % no existe o no tiene temporada_id asignado', p_fecha_id;
  END IF;

  -- ── PASO 1: Calcular y guardar puntos en puntos_fecha ────────
  --
  -- Nota sobre columnas:
  --   predicciones.goles_local     → lo que predijo el usuario para el local
  --   predicciones.goles_visitante → lo que predijo el usuario para el visitante
  --   partidos.resultado_local     → resultado real local
  --   partidos.resultado_visitante → resultado real visitante

  WITH

  -- Partidos de esta fecha que ya tienen resultado cargado
  partidos_con_resultado AS (
    SELECT
      id,
      resultado_local,
      resultado_visitante,
      CASE WHEN es_especial THEN 2 ELSE 1 END AS mult
    FROM partidos
    WHERE fecha_id = p_fecha_id
      AND jugado = true
      AND resultado_local IS NOT NULL
      AND resultado_visitante IS NOT NULL
  ),

  -- Cruzar cada predicción con el resultado real
  preds_evaluadas AS (
    SELECT
      pr.usuario_id,

      -- ¿Fue exacto?
      CASE
        WHEN pr.goles_local = p.resultado_local
         AND pr.goles_visitante = p.resultado_visitante
        THEN 1 ELSE 0
      END AS es_exacto,

      -- ¿Fue signo (sin ser exacto)?
      CASE
        WHEN pr.goles_local = p.resultado_local
         AND pr.goles_visitante = p.resultado_visitante
        THEN 0  -- ya cubierto por exacto
        WHEN (pr.goles_local > pr.goles_visitante AND p.resultado_local > p.resultado_visitante)
          OR (pr.goles_local < pr.goles_visitante AND p.resultado_local < p.resultado_visitante)
          OR (pr.goles_local = pr.goles_visitante AND p.resultado_local = p.resultado_visitante)
        THEN 1 ELSE 0
      END AS es_signo,

      -- Puntos exactos de este partido (con multiplicador)
      CASE
        WHEN pr.goles_local = p.resultado_local
         AND pr.goles_visitante = p.resultado_visitante
        THEN 3 * p.mult
        ELSE 0
      END AS pts_exacto,

      -- Puntos signo de este partido (con multiplicador)
      CASE
        WHEN pr.goles_local = p.resultado_local
         AND pr.goles_visitante = p.resultado_visitante
        THEN 0
        WHEN (pr.goles_local > pr.goles_visitante AND p.resultado_local > p.resultado_visitante)
          OR (pr.goles_local < pr.goles_visitante AND p.resultado_local < p.resultado_visitante)
          OR (pr.goles_local = pr.goles_visitante AND p.resultado_local = p.resultado_visitante)
        THEN 1 * p.mult
        ELSE 0
      END AS pts_signo

    FROM predicciones pr
    JOIN partidos_con_resultado p ON p.id = pr.partido_id
  ),

  -- Agregar por usuario
  resumen_usuario AS (
    SELECT
      usuario_id,
      SUM(pts_exacto)                 AS puntos_exactos,
      SUM(pts_signo)                  AS puntos_signo,
      SUM(pts_exacto + pts_signo)     AS pts_base,
      SUM(es_exacto + es_signo)::int  AS partidos_acertados,
      COUNT(*)::int                   AS partidos_totales
    FROM preds_evaluadas
    GROUP BY usuario_id
  ),

  -- Calcular bonos por fecha (pleno y mitad son mutuamente excluyentes)
  con_bonus AS (
    SELECT
      usuario_id,
      puntos_exactos,
      puntos_signo,
      pts_base,
      partidos_acertados,
      partidos_totales,

      -- Bonus pleno: +5 si acertó el 100%
      CASE
        WHEN partidos_totales > 0
         AND partidos_acertados = partidos_totales
        THEN 5
        ELSE 0
      END AS bonus_pleno,

      -- Bonus mitad: +2 si acertó ≥ 50% pero no el 100%
      CASE
        WHEN partidos_totales > 0
         AND partidos_acertados::float >= partidos_totales::float / 2.0
         AND partidos_acertados < partidos_totales
        THEN 2
        ELSE 0
      END AS bonus_mitad

    FROM resumen_usuario
  )

  -- Upsert en puntos_fecha
  INSERT INTO puntos_fecha (
    usuario_id,
    fecha_id,
    puntos_exactos,
    puntos_signo,
    bonus_pleno,
    bonus_mitad,
    partidos_acertados,
    partidos_totales,
    total_puntos
  )
  SELECT
    usuario_id,
    p_fecha_id,
    puntos_exactos,
    puntos_signo,
    bonus_pleno,
    bonus_mitad,
    partidos_acertados,
    partidos_totales,
    pts_base + bonus_pleno + bonus_mitad AS total_puntos
  FROM con_bonus
  ON CONFLICT (usuario_id, fecha_id)
  DO UPDATE SET
    puntos_exactos     = EXCLUDED.puntos_exactos,
    puntos_signo       = EXCLUDED.puntos_signo,
    bonus_pleno        = EXCLUDED.bonus_pleno,
    bonus_mitad        = EXCLUDED.bonus_mitad,
    partidos_acertados = EXCLUDED.partidos_acertados,
    partidos_totales   = EXCLUDED.partidos_totales,
    total_puntos       = EXCLUDED.total_puntos;


  -- ── PASO 2: Actualizar rachas (racha_actual y racha_maxima) ──
  --
  -- Racha actual: cantidad de fechas consecutivas (del más reciente
  -- hacia atrás) en las que el usuario tuvo al menos 1 acierto.
  -- Se agrupa por f.numero (no por f.id) para que participar en
  -- varias categorías del mismo fin de semana cuente como una sola fecha.
  --
  -- Racha máxima: la racha más larga en toda la temporada.

  WITH

  -- Historial de cada usuario por número de fecha
  historial AS (
    SELECT
      pf.usuario_id,
      f.numero,
      SUM(pf.partidos_acertados) AS acertados
    FROM puntos_fecha pf
    JOIN fechas f ON f.id = pf.fecha_id
    WHERE f.temporada_id = v_temporada_id
      AND f.resultados_cargados = true
    GROUP BY pf.usuario_id, f.numero
  ),

  -- Acumular misses desde la fecha más reciente hacia atrás
  -- misses_acum = 0 significa "ningún miss desde la más reciente hasta aquí"
  con_misses AS (
    SELECT
      usuario_id,
      numero,
      acertados,
      SUM(CASE WHEN acertados = 0 THEN 1 ELSE 0 END)
        OVER (
          PARTITION BY usuario_id
          ORDER BY numero DESC
          ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        ) AS misses_acum
    FROM historial
  ),

  -- Racha actual = fechas con misses_acum=0 y al menos 1 acierto
  racha_actual_calc AS (
    SELECT
      usuario_id,
      COUNT(*) FILTER (WHERE misses_acum = 0 AND acertados > 0) AS racha_actual
    FROM con_misses
    GROUP BY usuario_id
  ),

  -- Racha máxima (técnica gaps-and-islands):
  -- Para cada fecha con aciertos, el "island_key" = numero - row_number
  -- Los números consecutivos producen el mismo island_key → mismo grupo
  solo_acertadas AS (
    SELECT
      usuario_id,
      numero,
      ROW_NUMBER() OVER (PARTITION BY usuario_id ORDER BY numero) AS rn
    FROM historial
    WHERE acertados > 0
  ),
  grupos AS (
    SELECT usuario_id, (numero - rn) AS island_key
    FROM solo_acertadas
  ),
  racha_maxima_calc AS (
    SELECT usuario_id, MAX(cnt) AS racha_maxima
    FROM (
      SELECT usuario_id, island_key, COUNT(*) AS cnt
      FROM grupos
      GROUP BY usuario_id, island_key
    ) t
    GROUP BY usuario_id
  )

  -- Actualizar perfiles
  UPDATE perfiles p
  SET
    racha_actual = COALESCE(ra.racha_actual, 0),
    racha_maxima = GREATEST(
      COALESCE(p.racha_maxima, 0),
      COALESCE(rm.racha_maxima, 0)
    )
  FROM racha_actual_calc ra
  LEFT JOIN racha_maxima_calc rm ON rm.usuario_id = ra.usuario_id
  WHERE p.id = ra.usuario_id;


  -- ── PASO 3: Actualizar puntos acumulados anuales ─────────────
  PERFORM actualizar_puntos_totales(v_temporada_id);

END;
$$;


-- ============================================================
-- VERIFICACIÓN (ejecutar manualmente para testear)
-- ============================================================
--
-- Ver puntos de una fecha específica:
--   SELECT pf.*, pr.username
--   FROM puntos_fecha pf
--   JOIN perfiles pr ON pr.id = pf.usuario_id
--   WHERE pf.fecha_id = <ID_FECHA>
--   ORDER BY pf.total_puntos DESC;
--
-- Ver ranking anual actual:
--   SELECT pr.username, pt.puntos_acumulados, pt.fechas_jugadas
--   FROM puntos_totales pt
--   JOIN perfiles pr ON pr.id = pt.usuario_id
--   WHERE pt.temporada_id = 1
--   ORDER BY pt.puntos_acumulados DESC;
--
-- Recalcular manualmente una fecha (si algo salió mal):
--   SELECT calcular_puntos_fecha(<ID_FECHA>);
--
-- Recalcular totales anuales desde cero:
--   SELECT actualizar_puntos_totales(1);
--
-- Recalcular TODAS las fechas de la temporada (reparación total):
--   DO $$
--   DECLARE f record;
--   BEGIN
--     FOR f IN SELECT id FROM fechas WHERE resultados_cargados = true AND temporada_id = 1 ORDER BY numero
--     LOOP
--       PERFORM calcular_puntos_fecha(f.id);
--     END LOOP;
--   END $$;
-- ============================================================
