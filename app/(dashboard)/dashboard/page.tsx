'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { TrendingUp, TrendingDown, Wallet, Users, Building2, AlertTriangle } from 'lucide-react'
import Topbar from '@/components/shared/Topbar'
import { createClient } from '@/lib/supabase'
import { TENANT_ID } from '@/lib/constants'

function formatMonto(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)
}

function KpiCard({ title, value, sub, icon, color }: { title: string; value: string; sub?: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="bg-white border border-[#E5E4E0] rounded-xl p-5 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <span className="font-mono text-[9.5px] tracking-[0.12em] uppercase text-[#A8A49D]">{title}</span>
        <div className={`w-8 h-8 rounded-[8px] flex items-center justify-center ${color}`}>{icon}</div>
      </div>
      <div className="font-display text-[22px] font-extrabold text-[#18181B] tracking-tight">{value}</div>
      {sub && <div className="text-[11.5px] text-[#A8A49D] mt-1">{sub}</div>}
    </div>
  )
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState({
    facturadoMes: 0, facturadoMesAnt: 0,
    cobradoMes: 0, comprasMes: 0, pagadoMes: 0,
    saldoCuentas: [] as { nombre: string; saldo: number }[],
    ccClientes: [] as { nombre: string; saldo: number }[],
    ccProveedores: [] as { nombre: string; saldo: number }[],
    ultimasVentas: [] as any[],
    stockBajo: [] as any[],
    factVencidas: 0, factCompraVencidas: 0,
  })

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const now = new Date()
      const mesInicio = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
      const mesInicioAnt = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0]
      const mesFinAnt = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0]
      const hoy = now.toISOString().split('T')[0]

      const { data: fvMes } = await supabase.from('facturas_venta').select('id').eq('tenant_id', TENANT_ID).gte('fecha_emision', mesInicio).or('notas.is.null,notas.neq.[ANULADA]')
      const { data: fvMesAnt } = await supabase.from('facturas_venta').select('id').eq('tenant_id', TENANT_ID).gte('fecha_emision', mesInicioAnt).lte('fecha_emision', mesFinAnt).or('notas.is.null,notas.neq.[ANULADA]')
      let facturadoMes = 0, facturadoMesAnt = 0
      await Promise.all([
        ...(fvMes || []).map(async (f: any) => { const { data: t } = await supabase.rpc('get_total_factura_venta_con_percepciones', { p_factura_id: f.id }); facturadoMes += Number(t ?? 0) }),
        ...(fvMesAnt || []).map(async (f: any) => { const { data: t } = await supabase.rpc('get_total_factura_venta_con_percepciones', { p_factura_id: f.id }); facturadoMesAnt += Number(t ?? 0) }),
      ])

      const { data: rcMes } = await supabase.from('recibos_cobro').select('id').eq('tenant_id', TENANT_ID).gte('fecha', mesInicio).or('notas.is.null,notas.neq.[ANULADO]')
      let cobradoMes = 0
      await Promise.all((rcMes || []).map(async (r: any) => { const { data: t } = await supabase.rpc('get_total_recibo_cobro', { p_recibo_id: r.id }); cobradoMes += Number(t ?? 0) }))

      const { data: fcMes } = await supabase.from('facturas_compra').select('id').eq('tenant_id', TENANT_ID).gte('fecha_emision', mesInicio).or('notas.is.null,notas.neq.[ANULADA]')
      let comprasMes = 0
      await Promise.all((fcMes || []).map(async (f: any) => { const { data: t } = await supabase.rpc('get_total_factura_compra_con_percepciones', { p_factura_id: f.id }); comprasMes += Number(t ?? 0) }))

      const { data: rpMes } = await supabase.from('recibos_pago').select('id').eq('tenant_id', TENANT_ID).gte('fecha', mesInicio).or('notas.is.null,notas.neq.[ANULADO]')
      let pagadoMes = 0
      await Promise.all((rpMes || []).map(async (r: any) => { const { data: t } = await supabase.rpc('get_total_recibo_pago', { p_recibo_id: r.id }); pagadoMes += Number(t ?? 0) }))

      const { data: cuentas } = await supabase.from('cuentas').select('id, nombre').eq('tenant_id', TENANT_ID).eq('activo', true).order('nombre')
      const saldoCuentas = await Promise.all((cuentas || []).map(async (c: any) => {
        const { data: s } = await supabase.rpc('get_saldo_cuenta', { p_cuenta_id: c.id })
        return { nombre: c.nombre, saldo: Number(s ?? 0) }
      }))

      // CC Clientes por cliente
      const { data: clientes } = await supabase.from('clientes').select('id, nombre_razon_social').eq('tenant_id', TENANT_ID).eq('estado', 'activo')
      const ccClientesRaw = await Promise.all((clientes || []).map(async (c: any) => {
        const { data: fvs } = await supabase.from('facturas_venta').select('id').eq('tenant_id', TENANT_ID).eq('cliente_id', c.id).or('notas.is.null,notas.neq.[ANULADA]')
        let saldo = 0
        await Promise.all((fvs || []).map(async (f: any) => {
          const { data: s } = await supabase.rpc('get_saldo_factura_venta', { p_factura_id: f.id })
          saldo += Number(s ?? 0)
        }))
        return { nombre: c.nombre_razon_social, saldo }
      }))
      const ccClientes = ccClientesRaw.filter(c => c.saldo > 0).sort((a, b) => b.saldo - a.saldo)

      // CC Proveedores por proveedor
      const { data: proveedores } = await supabase.from('proveedores').select('id, nombre_razon_social').eq('tenant_id', TENANT_ID).eq('estado', 'activo')
      const ccProveedoresRaw = await Promise.all((proveedores || []).map(async (p: any) => {
        const { data: fcs } = await supabase.from('facturas_compra').select('id').eq('tenant_id', TENANT_ID).eq('proveedor_id', p.id).or('notas.is.null,notas.neq.[ANULADA]')
        let saldo = 0
        await Promise.all((fcs || []).map(async (f: any) => {
          const { data: s } = await supabase.rpc('get_saldo_factura_compra', { p_factura_id: f.id })
          saldo += Number(s ?? 0)
        }))
        return { nombre: p.nombre_razon_social, saldo }
      }))
      const ccProveedores = ccProveedoresRaw.filter(p => p.saldo > 0).sort((a, b) => b.saldo - a.saldo)

      const { data: ultimasVentas } = await supabase.from('facturas_venta').select('id, codigo, numero, tipo, fecha_emision, clientes(nombre_razon_social)').eq('tenant_id', TENANT_ID).or('notas.is.null,notas.neq.[ANULADA]').order('created_at', { ascending: false }).limit(5)
      const ultimasVentasConTotal = await Promise.all((ultimasVentas || []).map(async (f: any) => {
        const { data: t } = await supabase.rpc('get_total_factura_venta_con_percepciones', { p_factura_id: f.id })
        const { data: s } = await supabase.rpc('get_saldo_factura_venta', { p_factura_id: f.id })
        return { ...f, total: Number(t ?? 0), saldo_pendiente: Number(s ?? 0) }
      }))

      const { data: stockBajo } = await supabase.from('productos').select('id, nombre, stock_actual, stock_minimo').eq('tenant_id', TENANT_ID).eq('estado', 'activo').order('stock_actual', { ascending: true }).limit(10)
      const stockBajoFiltrado = (stockBajo || []).filter((p: any) => p.stock_actual <= (p.stock_minimo || 0)).slice(0, 5)

      const { count: factVencidas } = await supabase.from('facturas_venta').select('id', { count: 'exact', head: true }).eq('tenant_id', TENANT_ID).lt('fecha_vencimiento', hoy).or('notas.is.null,notas.neq.[ANULADA]')
      const { count: factCompraVencidas } = await supabase.from('facturas_compra').select('id', { count: 'exact', head: true }).eq('tenant_id', TENANT_ID).lt('fecha_vencimiento', hoy).or('notas.is.null,notas.neq.[ANULADA]')

      setData({ facturadoMes, facturadoMesAnt, cobradoMes, comprasMes, pagadoMes, saldoCuentas, ccClientes, ccProveedores, ultimasVentas: ultimasVentasConTotal, stockBajo: stockBajoFiltrado, factVencidas: factVencidas ?? 0, factCompraVencidas: factCompraVencidas ?? 0 })
      setLoading(false)
    }
    load()
  }, [])

  const mesNombre = new Date().toLocaleString('es-AR', { month: 'long', year: 'numeric' })
  const varFact = data.facturadoMesAnt > 0 ? ((data.facturadoMes - data.facturadoMesAnt) / data.facturadoMesAnt * 100).toFixed(1) : null
  const saldoTotal = data.saldoCuentas.reduce((a, c) => a + c.saldo, 0)
  const totalCCClientes = data.ccClientes.reduce((a, c) => a + c.saldo, 0)
  const totalCCProveedores = data.ccProveedores.reduce((a, c) => a + c.saldo, 0)

  if (loading) return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar breadcrumb={[{ label: 'Dashboard' }]} />
      <div className="flex-1 flex items-center justify-center text-[#A8A49D] text-sm">Cargando datos...</div>
    </div>
  )

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar breadcrumb={[{ label: 'Dashboard' }]} />
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">

        {/* Alertas */}
        {(data.factVencidas > 0 || data.factCompraVencidas > 0 || data.stockBajo.length > 0) && (
          <div className="flex gap-3 flex-wrap">
            {data.factVencidas > 0 && <Link href="/ventas" className="flex items-center gap-2 bg-[#FEF8E1] border border-[#FDBC16] rounded-[9px] px-3 py-2 text-[12px] font-semibold text-[#7A5500] hover:bg-[#FEF0C0] transition-colors"><AlertTriangle size={13} strokeWidth={2.2} className="text-[#FDBC16]" />{data.factVencidas} factura{data.factVencidas > 1 ? 's' : ''} de venta vencida{data.factVencidas > 1 ? 's' : ''}</Link>}
            {data.factCompraVencidas > 0 && <Link href="/compras" className="flex items-center gap-2 bg-[#FEE8E8] border border-[#EE3232] rounded-[9px] px-3 py-2 text-[12px] font-semibold text-[#7F1D1D] hover:bg-[#FED7D7] transition-colors"><AlertTriangle size={13} strokeWidth={2.2} className="text-[#EE3232]" />{data.factCompraVencidas} factura{data.factCompraVencidas > 1 ? 's' : ''} de compra vencida{data.factCompraVencidas > 1 ? 's' : ''}</Link>}
            {data.stockBajo.length > 0 && <Link href="/productos" className="flex items-center gap-2 bg-[#FEF0EA] border border-[#F2682E] rounded-[9px] px-3 py-2 text-[12px] font-semibold text-[#C94E18] hover:bg-[#FDE4D4] transition-colors"><AlertTriangle size={13} strokeWidth={2.2} className="text-[#F2682E]" />{data.stockBajo.length} producto{data.stockBajo.length > 1 ? 's' : ''} con stock bajo</Link>}
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-4">
          <KpiCard title={`Facturado — ${mesNombre}`} value={formatMonto(data.facturadoMes)} sub={varFact ? `${Number(varFact) > 0 ? '+' : ''}${varFact}% vs mes anterior` : undefined} icon={<TrendingUp size={16} color="white" strokeWidth={2.2} />} color="bg-[#F2682E]" />
          <KpiCard title={`Cobrado — ${mesNombre}`} value={formatMonto(data.cobradoMes)} sub={`Pendiente: ${formatMonto(data.facturadoMes - data.cobradoMes)}`} icon={<TrendingUp size={16} color="white" strokeWidth={2.2} />} color="bg-[#4EBB7F]" />
          <KpiCard title={`Compras — ${mesNombre}`} value={formatMonto(data.comprasMes)} icon={<TrendingDown size={16} color="white" strokeWidth={2.2} />} color="bg-[#2CBAF2]" />
          <KpiCard title={`Pagado — ${mesNombre}`} value={formatMonto(data.pagadoMes)} sub={`Pendiente: ${formatMonto(data.comprasMes - data.pagadoMes)}`} icon={<TrendingDown size={16} color="white" strokeWidth={2.2} />} color="bg-[#2B445A]" />
        </div>

        {/* Tesorería + CC */}
        <div className="grid grid-cols-3 gap-4">
          {/* Tesorería */}
          <div className="bg-white border border-[#E5E4E0] rounded-xl overflow-hidden shadow-sm flex flex-col" style={{ height: 280 }}>
            <div className="bg-[#F9F9F8] border-b border-[#F1F0EE] px-4 py-3 flex items-center gap-2 flex-shrink-0">
              <Wallet size={14} className="text-[#A8A49D]" />
              <span className="font-display text-[13.5px] font-bold">Tesorería</span>
              <span className="ml-auto font-mono text-[13px] font-bold text-[#F2682E]">{formatMonto(saldoTotal)}</span>
            </div>
            <div className="overflow-y-auto flex-1 divide-y divide-[#F1F0EE]">
              {data.saldoCuentas.map((c, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-[12.5px] text-[#18181B] truncate">{c.nombre}</span>
                  <span className={`font-mono text-[12px] font-bold ml-3 flex-shrink-0 ${c.saldo < 0 ? 'text-[#EE3232]' : 'text-[#18181B]'}`}>{formatMonto(c.saldo)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CC Clientes */}
          <div className="bg-white border border-[#E5E4E0] rounded-xl overflow-hidden shadow-sm flex flex-col" style={{ height: 280 }}>
            <div className="bg-[#F9F9F8] border-b border-[#F1F0EE] px-4 py-3 flex items-center gap-2 flex-shrink-0">
              <Users size={14} className="text-[#A8A49D]" />
              <span className="font-display text-[13.5px] font-bold">CC Clientes</span>
              <span className={`ml-auto font-mono text-[13px] font-bold ${totalCCClientes > 0 ? 'text-[#FDBC16]' : 'text-[#4EBB7F]'}`}>{formatMonto(totalCCClientes)}</span>
              <Link href="/ventas" className="text-[11px] font-semibold text-[#F2682E] hover:underline ml-2 flex-shrink-0">Ver →</Link>
            </div>
            <div className="overflow-y-auto flex-1 divide-y divide-[#F1F0EE]">
              {data.ccClientes.length === 0 ? (
                <div className="flex items-center justify-center h-full text-[12px] text-[#4EBB7F] font-semibold">✓ Sin saldos pendientes</div>
              ) : data.ccClientes.map((c, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-[12.5px] font-semibold text-[#18181B] truncate">{c.nombre}</span>
                  <span className="font-mono text-[12px] font-bold text-[#FDBC16] ml-3 flex-shrink-0">{formatMonto(c.saldo)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CC Proveedores */}
          <div className="bg-white border border-[#E5E4E0] rounded-xl overflow-hidden shadow-sm flex flex-col" style={{ height: 280 }}>
            <div className="bg-[#F9F9F8] border-b border-[#F1F0EE] px-4 py-3 flex items-center gap-2 flex-shrink-0">
              <Building2 size={14} className="text-[#A8A49D]" />
              <span className="font-display text-[13.5px] font-bold">CC Proveedores</span>
              <span className={`ml-auto font-mono text-[13px] font-bold ${totalCCProveedores > 0 ? 'text-[#EE3232]' : 'text-[#4EBB7F]'}`}>{formatMonto(totalCCProveedores)}</span>
              <Link href="/compras" className="text-[11px] font-semibold text-[#F2682E] hover:underline ml-2 flex-shrink-0">Ver →</Link>
            </div>
            <div className="overflow-y-auto flex-1 divide-y divide-[#F1F0EE]">
              {data.ccProveedores.length === 0 ? (
                <div className="flex items-center justify-center h-full text-[12px] text-[#4EBB7F] font-semibold">✓ Sin saldos pendientes</div>
              ) : data.ccProveedores.map((p, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-[12.5px] font-semibold text-[#18181B] truncate">{p.nombre}</span>
                  <span className="font-mono text-[12px] font-bold text-[#EE3232] ml-3 flex-shrink-0">{formatMonto(p.saldo)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Últimas ventas + Stock bajo */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white border border-[#E5E4E0] rounded-xl overflow-hidden shadow-sm">
            <div className="bg-[#F9F9F8] border-b border-[#F1F0EE] px-4 py-3 flex items-center justify-between">
              <span className="font-display text-[13.5px] font-bold">Últimas ventas</span>
              <Link href="/ventas" className="text-[11.5px] font-semibold text-[#F2682E] hover:underline">Ver todas →</Link>
            </div>
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[#F1F0EE] bg-[#F9F9F8]">
                  {['Código','Cliente','Fecha','Total','Saldo'].map((h,i) => (
                    <th key={i} className="font-mono text-[8.5px] tracking-[0.1em] uppercase text-[#A8A49D] px-4 py-2 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.ultimasVentas.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-6 text-center text-[#A8A49D] text-sm">Sin ventas.</td></tr>
                ) : data.ultimasVentas.map((f: any) => (
                  <tr key={f.id} className="border-b border-[#F1F0EE] last:border-0 hover:bg-[#FEF0EA] transition-colors">
                    <td className="px-4 py-2.5 font-mono text-[11px] text-[#6B6762]">{f.codigo}</td>
                    <td className="px-4 py-2.5 text-[12px] font-semibold text-[#18181B] truncate max-w-[120px]">{f.clientes?.nombre_razon_social || '—'}</td>
                    <td className="px-4 py-2.5 font-mono text-[11px] text-[#6B6762]">{new Date(f.fecha_emision).toLocaleDateString('es-AR')}</td>
                    <td className="px-4 py-2.5 font-mono text-[12px] font-bold text-[#18181B]">{formatMonto(f.total)}</td>
                    <td className="px-4 py-2.5 font-mono text-[11.5px]">
                      <span className={f.saldo_pendiente <= 0 ? 'text-[#4EBB7F] font-bold' : 'text-[#FDBC16] font-bold'}>
                        {f.saldo_pendiente <= 0 ? '✓' : formatMonto(f.saldo_pendiente)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-white border border-[#E5E4E0] rounded-xl overflow-hidden shadow-sm">
            <div className="bg-[#F9F9F8] border-b border-[#F1F0EE] px-4 py-3 flex items-center justify-between">
              <span className="font-display text-[13.5px] font-bold">Stock bajo mínimo</span>
              <Link href="/productos" className="text-[11.5px] font-semibold text-[#F2682E] hover:underline">Ver productos →</Link>
            </div>
            {data.stockBajo.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <div className="text-[#4EBB7F] text-[28px] mb-1">✓</div>
                <div className="text-[12.5px] font-semibold text-[#4EBB7F]">Todo el stock está OK</div>
              </div>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-[#F1F0EE] bg-[#F9F9F8]">
                    {['Producto','Stock actual','Mínimo'].map((h,i) => (
                      <th key={i} className="font-mono text-[8.5px] tracking-[0.1em] uppercase text-[#A8A49D] px-4 py-2 text-left font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.stockBajo.map((p: any) => (
                    <tr key={p.id} className="border-b border-[#F1F0EE] last:border-0 hover:bg-[#FEF0EA] transition-colors">
                      <td className="px-4 py-2.5 text-[12.5px] font-semibold text-[#18181B] truncate max-w-[180px]">{p.nombre}</td>
                      <td className="px-4 py-2.5 font-mono text-[12px] font-bold text-[#EE3232]">{p.stock_actual}</td>
                      <td className="px-4 py-2.5 font-mono text-[12px] text-[#A8A49D]">{p.stock_minimo || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}