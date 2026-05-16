-- Drop the old integer overload of calcular_puntos_fecha.
-- The fechas table uses UUID primary keys; this leftover integer-parameter
-- version causes PostgreSQL to fail with "could not choose best candidate"
-- ambiguity when the RPC is called from the frontend.
DROP FUNCTION IF EXISTS public.calcular_puntos_fecha(p_fecha_id integer);
