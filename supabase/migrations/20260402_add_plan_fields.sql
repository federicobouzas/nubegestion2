-- Agrega campos de plan directamente en tenants
ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'free'
    CHECK (plan IN ('free', 'pro', 'business')),
  ADD COLUMN IF NOT EXISTS plan_ends_at timestamptz,
  ADD COLUMN IF NOT EXISTS plan_choice_made boolean NOT NULL DEFAULT false;

-- Inicializar el plan de prueba
-- UPDATE tenants SET plan = 'free' WHERE plan IS NULL;
