-- Agrega columnas de slug, límites y features a la tabla planes
ALTER TABLE planes
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS facturas_mes integer,
  ADD COLUMN IF NOT EXISTS usuarios integer,
  ADD COLUMN IF NOT EXISTS features jsonb DEFAULT '[]';

ALTER TABLE planes DROP CONSTRAINT IF EXISTS planes_slug_key;
ALTER TABLE planes ADD CONSTRAINT planes_slug_key UNIQUE (slug);

-- Upsert los tres planes base
INSERT INTO planes (slug, nombre, precio_mensual, facturas_mes, usuarios)
VALUES
  ('free',     'Gratuito',  0,     50,   1),
  ('pro',      'Pro',       5000,  300,  3),
  ('business', 'Business',  15000, NULL, NULL)
ON CONFLICT (slug) DO UPDATE SET
  facturas_mes = EXCLUDED.facturas_mes,
  usuarios     = EXCLUDED.usuarios;
