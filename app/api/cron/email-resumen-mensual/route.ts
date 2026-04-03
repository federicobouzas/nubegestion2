import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { sendEmail } from '@/lib/email'
import { getResumenMensualEmail } from '@/emails'

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization') ?? ''
  const secret = process.env.CRON_SECRET
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const admin = createAdminClient()

  // Mes anterior
  const now = new Date()
  const mesAnterior = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const mesAnteriorFin = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfMes = mesAnterior.toISOString()
  const endOfMes = mesAnteriorFin.toISOString()
  const mesNombre = MESES[mesAnterior.getMonth()]
  const anio = mesAnterior.getFullYear()
  const emailMonth = `${anio}-${String(mesAnterior.getMonth() + 1).padStart(2, '0')}`

  const { data: tenants, error } = await admin.from('tenants').select('id, nombre')
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const resultados: Record<string, string> = {}

  for (const tenant of tenants ?? []) {
    const tenantId = tenant.id

    // No mandar dos veces el mismo mes
    const { data: log } = await admin
      .from('email_log')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('email_type', 'resumen_mensual')
      .eq('email_month', emailMonth)
      .limit(1)

    if (log && log.length > 0) {
      resultados[tenantId] = 'ya enviado'
      continue
    }

    // Usuario admin del tenant
    const { data: adminUser } = await admin
      .from('usuarios')
      .select('id, nombre, email')
      .eq('tenant_id', tenantId)
      .eq('rol', 'admin')
      .limit(1)
      .single()

    if (!adminUser?.email) {
      resultados[tenantId] = 'sin usuario admin'
      continue
    }

    try {
      // Facturas del mes anterior
      const [
        { count: facturasEmitidas },
        { count: facturasCompra },
        { data: ventasTotales },
        { data: cobros },
        { data: pagos },
        { data: cuentas },
      ] = await Promise.all([
        admin.from('facturas_venta').select('id', { count: 'exact', head: true })
          .eq('tenant_id', tenantId).gte('created_at', startOfMes).lt('created_at', endOfMes),
        admin.from('facturas_compra').select('id', { count: 'exact', head: true })
          .eq('tenant_id', tenantId).gte('created_at', startOfMes).lt('created_at', endOfMes),
        admin.from('facturas_venta').select('total')
          .eq('tenant_id', tenantId).gte('created_at', startOfMes).lt('created_at', endOfMes),
        admin.from('movimientos_cuentas').select('monto')
          .eq('tenant_id', tenantId).gt('monto', 0)
          .gte('created_at', startOfMes).lt('created_at', endOfMes),
        admin.from('movimientos_cuentas').select('monto')
          .eq('tenant_id', tenantId).lt('monto', 0)
          .gte('created_at', startOfMes).lt('created_at', endOfMes),
        admin.from('cuentas').select('id, tipo')
          .eq('tenant_id', tenantId).eq('activo', true),
      ])

      const totalFacturado = (ventasTotales ?? []).reduce((sum, r) => sum + Number(r.total ?? 0), 0)
      const totalCobros = (cobros ?? []).reduce((sum, r) => sum + Number(r.monto ?? 0), 0)
      const totalPagos = Math.abs((pagos ?? []).reduce((sum, r) => sum + Number(r.monto ?? 0), 0))

      // Saldos actuales vía RPC por cuenta
      let saldoCierre = 0
      let saldoClientes = 0
      let saldoProveedores = 0

      for (const cuenta of cuentas ?? []) {
        const { data: saldo } = await admin.rpc('get_saldo_cuenta', { p_cuenta_id: cuenta.id })
        const val = Number(saldo ?? 0)
        saldoCierre += val
        if (cuenta.tipo === 'a_cobrar') saldoClientes += val
        if (cuenta.tipo === 'a_pagar') saldoProveedores += Math.abs(val)
      }

      const html = getResumenMensualEmail({
        nombre: adminUser.nombre || adminUser.email.split('@')[0],
        email: adminUser.email,
        empresa: tenant.nombre || '',
        mes_nombre: mesNombre,
        anio,
        facturas_emitidas: facturasEmitidas ?? 0,
        facturas_compra: facturasCompra ?? 0,
        total_facturado: totalFacturado,
        total_cobros: totalCobros,
        total_pagos: totalPagos,
        saldo_cierre: saldoCierre,
        saldo_clientes: saldoClientes,
        saldo_proveedores: saldoProveedores,
      })

      await sendEmail(adminUser.email, `Tu resumen de ${mesNombre} — Nube Gestión`, html)

      await admin.from('email_log').insert({
        tenant_id: tenantId,
        user_id: adminUser.id,
        email_type: 'resumen_mensual',
        email_month: emailMonth,
      })

      resultados[tenantId] = 'enviado'
    } catch (err: any) {
      resultados[tenantId] = `error: ${err?.message}`
      console.error(`[cron/email-resumen-mensual] Tenant ${tenantId}:`, err)
    }
  }

  return NextResponse.json({ procesados: Object.keys(resultados).length, resultados })
}
