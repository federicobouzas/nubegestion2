import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

type AdminClient = ReturnType<typeof createAdminClient>

function fmt(n: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS', minimumFractionDigits: 0,
  }).format(n)
}

/** Devuelve true si ya existe una notif igual en las últimas 24 hs. */
async function yaExiste(
  admin: AdminClient,
  tenantId: string,
  tipo: string,
  referenciaId: string,
): Promise<boolean> {
  const desde = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { data } = await admin
    .from('notificaciones')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('tipo', tipo)
    .eq('referencia_id', referenciaId)
    .gte('created_at', desde)
    .limit(1)
  return (data?.length ?? 0) > 0
}

async function insertar(
  admin: AdminClient,
  tenantId: string,
  tipo: string,
  referenciaId: string | null,
  mensaje: string,
  metadata?: Record<string, any>,
) {
  if (referenciaId && await yaExiste(admin, tenantId, tipo, referenciaId)) return
  const { error } = await admin.from('notificaciones').insert({
    tenant_id: tenantId,
    tipo,
    referencia_id: referenciaId,
    mensaje,
    leida: false,
    metadata: metadata ?? null,
  })
  if (error) console.error(`[notif] Error insertando ${tipo}:`, error.message)
}

// ────────────────────────────────────────────────────────────
// Chequeos por tenant
// ────────────────────────────────────────────────────────────

async function chequeoSaldoBajo(admin: AdminClient, tenantId: string) {
  const { data: cuentas } = await admin
    .from('cuentas')
    .select('id, nombre, saldo_minimo_alerta')
    .eq('tenant_id', tenantId)
    .eq('activo', true)

  for (const cuenta of cuentas ?? []) {
    const { data: saldo } = await admin.rpc('get_saldo_cuenta', { p_cuenta_id: cuenta.id })
    const minimo = Number(cuenta.saldo_minimo_alerta ?? 0)
    if (minimo <= 0) continue
    if (Number(saldo ?? 0) < minimo) {
      await insertar(
        admin, tenantId, 'saldo_bajo', cuenta.id,
        `La cuenta '${cuenta.nombre}' tiene saldo bajo: ${fmt(Number(saldo ?? 0))}`,
        { saldo: saldo, minimo }
      )
    }
  }
}

async function chequeoFacturasVencidas(admin: AdminClient, tenantId: string) {
  const hoy = new Date()
  const { data: facturas } = await admin
    .from('facturas_venta')
    .select('id, numero, fecha_vencimiento, clientes(nombre_razon_social)')
    .eq('tenant_id', tenantId)
    .lt('fecha_vencimiento', hoy.toISOString().split('T')[0])
    .neq('notas', '[ANULADO]')

  for (const f of facturas ?? []) {
    const diasMora = Math.floor(
      (hoy.getTime() - new Date(f.fecha_vencimiento).getTime()) / (1000 * 60 * 60 * 24)
    )
    if (![7, 30, 60].includes(diasMora)) continue

    const { data: saldo } = await admin.rpc('get_saldo_factura_venta', { p_factura_id: f.id })
    if (!saldo || Number(saldo) <= 0) continue

    const cliente = (f.clientes as any)?.nombre_razon_social ?? 'cliente desconocido'
    await insertar(
      admin, tenantId, 'factura_vencida', f.id,
      `Factura #${f.numero ?? f.id.slice(0, 8)} de ${cliente} lleva ${diasMora} días vencida (${fmt(Number(saldo))})`,
      { dias_mora: diasMora, saldo: saldo }
    )
  }
}

async function chequeoStockBajo(admin: AdminClient, tenantId: string) {
  const { data: productos } = await admin
    .from('productos')
    .select('id, nombre, stock_actual, stock_minimo')
    .eq('tenant_id', tenantId)
    .eq('estado', 'activo')
    .not('stock_minimo', 'is', null)
    .gt('stock_minimo', 0)

  for (const p of productos ?? []) {
    if (Number(p.stock_actual) > Number(p.stock_minimo)) continue
    await insertar(
      admin, tenantId, 'stock_bajo', p.id,
      `Stock bajo: '${p.nombre}' tiene ${p.stock_actual} unidades (mínimo: ${p.stock_minimo})`,
      { stock_actual: p.stock_actual, stock_minimo: p.stock_minimo }
    )
  }
}

async function chequeoComprasPorVencer(admin: AdminClient, tenantId: string) {
  const hoy = new Date()
  const en5dias = new Date(hoy.getTime() + 5 * 24 * 60 * 60 * 1000)

  const { data: facturas } = await admin
    .from('facturas_compra')
    .select('id, numero, fecha_vencimiento, proveedores(nombre_razon_social)')
    .eq('tenant_id', tenantId)
    .gte('fecha_vencimiento', hoy.toISOString().split('T')[0])
    .lte('fecha_vencimiento', en5dias.toISOString().split('T')[0])
    .neq('notas', '[ANULADA]')

  for (const f of facturas ?? []) {
    const { data: saldo } = await admin.rpc('get_saldo_factura_compra', { p_factura_id: f.id })
    if (!saldo || Number(saldo) <= 0) continue

    const proveedor = (f.proveedores as any)?.nombre_razon_social ?? 'proveedor desconocido'
    const fecha = new Date(f.fecha_vencimiento).toLocaleDateString('es-AR')
    await insertar(
      admin, tenantId, 'compra_por_vencer', f.id,
      `La factura de compra #${f.numero ?? f.id.slice(0, 8)} de ${proveedor} vence el ${fecha} (${fmt(Number(saldo))})`,
      { fecha_vencimiento: f.fecha_vencimiento, saldo: saldo }
    )
  }
}

// ────────────────────────────────────────────────────────────
// Handler principal
// ────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  // Verificar autorización
  const auth = req.headers.get('authorization') ?? ''
  const secret = process.env.CRON_SECRET
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const admin = createAdminClient()

  // Obtener todos los tenants activos
  const { data: usuarios, error: tenantsError } = await admin
    .from('usuarios')
    .select('tenant_id')
  if (tenantsError) {
    return NextResponse.json({ error: tenantsError.message }, { status: 500 })
  }

  const tenants = [...new Set((usuarios ?? []).map((u: any) => u.tenant_id).filter(Boolean))]
  const resultados: Record<string, string> = {}

  for (const tenantId of tenants) {
    try {
      await Promise.all([
        chequeoSaldoBajo(admin, tenantId),
        chequeoFacturasVencidas(admin, tenantId),
        chequeoStockBajo(admin, tenantId),
        chequeoComprasPorVencer(admin, tenantId),
        // chequeoChequesVencer: pendiente — tabla 'cheques' no existe aún
      ])
      resultados[tenantId] = 'ok'
    } catch (err: any) {
      resultados[tenantId] = `error: ${err?.message}`
      console.error(`[cron/notificaciones] Tenant ${tenantId}:`, err)
    }
  }

  return NextResponse.json({ tenants: tenants.length, resultados })
}
