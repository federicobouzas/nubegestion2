-- Agregar campos faltantes a suscripciones
ALTER TABLE public.suscripciones
  ADD COLUMN IF NOT EXISTS user_id uuid,
  ADD COLUMN IF NOT EXISTS mp_preference_id text,
  ADD COLUMN IF NOT EXISTS tipo_cambio numeric(10,2),
  ADD COLUMN IF NOT EXISTS periodo_inicio date,
  ADD COLUMN IF NOT EXISTS plan_id uuid REFERENCES public.planes(id);

-- Agregar estado si no existe
ALTER TABLE public.suscripciones
  ADD COLUMN IF NOT EXISTS estado text DEFAULT 'pendiente'
  CHECK (estado IN ('pendiente', 'activa', 'vencida', 'suspendida'));
