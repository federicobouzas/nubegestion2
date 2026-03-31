-- Tabla de suscripciones (membresías por tenant)
CREATE TABLE IF NOT EXISTS suscripciones (
  id              uuid        DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id       uuid        NOT NULL,
  fecha_vencimiento date      NOT NULL,
  plan            varchar(50) DEFAULT 'mensual',
  monto           numeric(10,2),
  mp_payment_id   varchar(100),
  mp_status       varchar(50),
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS suscripciones_tenant_vencimiento
  ON suscripciones (tenant_id, fecha_vencimiento DESC);

-- Ejemplo: insertar una suscripción inicial para el tenant de prueba (30 días desde hoy)
-- INSERT INTO suscripciones (tenant_id, fecha_vencimiento, plan, monto)
-- VALUES ('a1b2c3d4-0000-0000-0000-000000000001', CURRENT_DATE + 30, 'mensual', 5000);
