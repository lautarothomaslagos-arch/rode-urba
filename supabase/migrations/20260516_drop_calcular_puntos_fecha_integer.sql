-- Drop the UUID overload of calcular_puntos_fecha.
-- fechas.id is an integer column, so the UUID version is the incorrect leftover.
-- Having both causes PostgreSQL to fail with ambiguity or pick the wrong overload.
DROP FUNCTION IF EXISTS public.calcular_puntos_fecha(p_fecha_id uuid);
