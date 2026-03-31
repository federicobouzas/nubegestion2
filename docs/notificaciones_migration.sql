-- ============================================================
-- Módulo de Notificaciones — Nube Gestión v2
-- Ejecutar en el editor SQL de Supabase
-- ============================================================

-- 1. Tabla principal de notificaciones
create table if not exists notificaciones (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  tipo text not null,
  -- 'saldo_bajo' | 'factura_vencida' | 'cheque_por_vencer' | 'stock_bajo' | 'compra_por_vencer'
  referencia_id uuid,
  mensaje text not null,
  leida boolean not null default false,
  created_at timestamptz not null default now(),
  metadata jsonb
);

create index if not exists notificaciones_tenant_leida_idx
  on notificaciones(tenant_id, leida, created_at desc);

alter table notificaciones disable row level security;

-- 2. Columna saldo_minimo_alerta en cuentas
alter table cuentas add column if not exists saldo_minimo_alerta numeric default 0;
