'use client'
import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Bar, PieChart, Pie, Cell } from 'recharts'
import Topbar from '@/components/shared/Topbar'
import { createClient } from '@/lib/supabase'
import { TENANT_ID } from '@/lib/constants'

function formatM(n: number) {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n.toFixed(0)}`
}
function formatMonto(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(n)
}

const TIPO_COLORS: Record<string, string> = {
  'Empleados': '#F2682E',
  'Impuestos': '#2CBAF2',
  'Marketing': '#FDBC16',
  'Oficina': '#4EBB7F',
  'Servicios Profesionales': '#2B445A',
  'Otro': '#A8A49D',
}
const CAT_COLORS = ['#F2682E','#FF8C5A','#FFA87A','#FFB890','#2CBAF2','#5CCEF5','#8DDEF8','#4EBB7F','#7DCCA0','#FDBC16','#FDD050','#2B445A','#4A6B84','#EE3232','#F55F5F']

const tooltipStyle = {
  contentStyle: { background: '#fff', border: '1px solid #E5E4E0', borderRadius: 8, fontSize: 12 },
  labelStyle: { fontWeight: 600, color: '#18181B' },
}

function SectionCard({ title, children, right }: { title: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="bg-white border border-[#E5E4E0] rounded-xl overflow-hidden shadow-sm">
      <div className="bg-[#F9F9F8] border-b border-[#F1F0EE] px-4 py-3 flex items-center justify-between">
        <span className="font-display text-[13.5px] font-bold">{title}</span>
        {right}
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

export default function ReportesPage() {
  const [loadingSemana, setLoadingSemana] = useState(true)
  const [loadingFacturas, setLoadingFacturas] = useState(true)
  const [loadingFlujo, setLoadingFlujo] = useState(true)
  const [loadingGastos, setLoadingGastos] = useState(true)

  const [saldoSemana, setSaldoSemana] = useState<any[]>([])
  const [facturasMeses, setFacturasMeses] = useState<any[]>([])
  const [flujoMeses, setFlujoMeses] = useState<any[]>([])
  const [distribucionTipos, setDistribucionTipos] = useState<any[]>([])
  const [distribucionCats, setDistribucionCats] = useState<any[]>([])
  const [totalGastosMes, setTotalGastosMes] = useState(0)
  const [mesReporte, setMesReporte] = useState('')
  const [opcionesMeses, setOpcionesMeses] = useState<{ val: string; label: string }[]>([])

  useEffect(() => {
    // Cargar opciones de meses desde la BD
    async function initMeses() {
      const supabase = createClient()
      const { data } = await supabase
        .from('gastos')
        .select('fecha_pago')
        .eq('tenant_id', TENANT_ID)
        .order('fecha_pago', { ascending: false })
        .limit(1)

      // Generar opciones desde la fecha más reciente con datos hasta hoy
      const latest = data?.[0]?.fecha_pago ? new Date(data[0].fecha_pago) : new Date()
      const opts: { val: string; label: string }[] = []
      const cursor = new Date(latest.getFullYear(), latest.getMonth(), 1)
      // Ir hacia atrás 24 meses desde el más reciente
      for (let i = 0; i < 24; i++) {
        const val = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`
        const label = cursor.toLocaleString('es-AR', { month: 'long', year: 'numeric' })
        opts.push({ val, label })
        cursor.setMonth(cursor.getMonth() - 1)
      }
      setOpcionesMeses(opts)
      setMesReporte(opts[0]?.val || '')
    }
    initMeses()
    loadSaldoSemana()
    loadFacturasMeses()
    loadFlujoMeses()
  }, [])

  useEffect(() => {
    if (mesReporte) loadDistribucionGastos()
  }, [mesReporte])

  async function loadSaldoSemana() {
    setLoadingSemana(true)
    const supabase = createClient()
    const { data: cuentas } = await supabase.from('cuentas').select('id').eq('tenant_id', TENANT_ID).eq('activo', true)
    // Saldo actual es el mismo para todos los días (no tenemos historial diario)
    // Mostramos saldo actual replicado por 7 días como aproximación
    // Para un sistema real necesitaríamos snapshots diarios
    let saldoActual = 0
    await Promise.all((cuentas || []).map(async (c: any) => {
      const { data: s } = await supabase.rpc('get_saldo_cuenta', { p_cuenta_id: c.id })
      saldoActual += Number(s ?? 0)
    }))
    const dias = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      dias.push({ fecha: `${d.getDate()}/${d.getMonth() + 1}`, saldo: saldoActual })
    }
    setSaldoSemana(dias)
    setLoadingSemana(false)
  }

  async function loadFacturasMeses() {
    setLoadingFacturas(true)
    const supabase = createClient()
    // Vencidos + mes actual + 2 meses futuros = 3 "columnas"
    const puntos = [
      { label: 'Vencidos', vencidos: true },
      { label: new Date().toLocaleString('es-AR', { month: 'short' }), offset: 0 },
      { label: new Date(new Date().setMonth(new Date().getMonth() + 1)).toLocaleString('es-AR', { month: 'short' }), offset: 1 },
      { label: new Date(new Date().setMonth(new Date().getMonth() + 2)).toLocaleString('es-AR', { month: 'short' }), offset: 2 },
    ]

    const hoy = new Date().toISOString().split('T')[0]
    const resultado = []
    let saldoAcum = 0

    for (const punto of puntos) {
      let ventasQ, comprasQ

      if (punto.vencidos) {
        ventasQ = supabase.from('facturas_venta').select('id').eq('tenant_id', TENANT_ID).lt('fecha_vencimiento', hoy).or('notas.is.null,notas.neq.[ANULADA]')
        comprasQ = supabase.from('facturas_compra').select('id').eq('tenant_id', TENANT_ID).lt('fecha_vencimiento', hoy).or('notas.is.null,notas.neq.[ANULADA]')
      } else {
        const d = new Date()
        d.setMonth(d.getMonth() + (punto.offset || 0))
        const inicio = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0]
        const fin = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0]
        ventasQ = supabase.from('facturas_venta').select('id').eq('tenant_id', TENANT_ID).gte('fecha_vencimiento', inicio).lte('fecha_vencimiento', fin).or('notas.is.null,notas.neq.[ANULADA]')
        comprasQ = supabase.from('facturas_compra').select('id').eq('tenant_id', TENANT_ID).gte('fecha_vencimiento', inicio).lte('fecha_vencimiento', fin).or('notas.is.null,notas.neq.[ANULADA]')
      }

      const [{ data: fvs }, { data: fcs }] = await Promise.all([ventasQ, comprasQ])
      let ventas = 0, compras = 0
      await Promise.all([
        ...(fvs || []).map(async (f: any) => { const { data: s } = await supabase.rpc('get_saldo_factura_venta', { p_factura_id: f.id }); ventas += Number(s ?? 0) }),
        ...(fcs || []).map(async (f: any) => { const { data: s } = await supabase.rpc('get_saldo_factura_compra', { p_factura_id: f.id }); compras += Number(s ?? 0) }),
      ])
      saldoAcum += ventas - compras
      resultado.push({ mes: punto.label, ventas, compras, saldo: saldoAcum })
    }
    setFacturasMeses(resultado)
    setLoadingFacturas(false)
  }

  async function loadFlujoMeses() {
    setLoadingFlujo(true)
    const supabase = createClient()
    const meses = []
    let saldoAcum = 0
    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      const inicio = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0]
      const fin = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0]
      const label = d.toLocaleString('es-AR', { month: 'short', year: '2-digit' })

      const [{ data: rcs }, { data: rps }, { data: ois }, { data: gass }] = await Promise.all([
        supabase.from('recibos_cobro').select('id').eq('tenant_id', TENANT_ID).gte('fecha', inicio).lte('fecha', fin).or('notas.is.null,notas.neq.[ANULADO]'),
        supabase.from('recibos_pago').select('id').eq('tenant_id', TENANT_ID).gte('fecha', inicio).lte('fecha', fin).or('notas.is.null,notas.neq.[ANULADO]'),
        supabase.from('otros_ingresos').select('importe').eq('tenant_id', TENANT_ID).gte('fecha', inicio).lte('fecha', fin),
        supabase.from('gastos').select('id').eq('tenant_id', TENANT_ID).gte('fecha_pago', inicio).lte('fecha_pago', fin).or('notas.is.null,notas.neq.[ANULADO]'),
      ])

      let cobros = 0, pagos = 0, gastos = 0
      await Promise.all([
        ...(rcs || []).map(async (r: any) => { const { data: t } = await supabase.rpc('get_total_recibo_cobro', { p_recibo_id: r.id }); cobros += Number(t ?? 0) }),
        ...(rps || []).map(async (r: any) => { const { data: t } = await supabase.rpc('get_total_recibo_pago', { p_recibo_id: r.id }); pagos += Number(t ?? 0) }),
        ...(gass || []).map(async (g: any) => { const { data: t } = await supabase.rpc('get_total_gasto', { p_gasto_id: g.id }); gastos += Number(t ?? 0) }),
      ])
      const otrosIngresos = (ois || []).reduce((a: number, o: any) => a + Number(o.importe), 0)
      saldoAcum += cobros + otrosIngresos - pagos - gastos
      meses.push({ mes: label, cobros, otrosIngresos, pagos, gastos, saldo: saldoAcum })
    }
    setFlujoMeses(meses)
    setLoadingFlujo(false)
  }

  async function loadDistribucionGastos() {
    setLoadingGastos(true)
    const supabase = createClient()
    const [year, month] = mesReporte.split('-').map(Number)
    const inicio = new Date(year, month - 1, 1).toISOString().split('T')[0]
    const fin = new Date(year, month, 0).toISOString().split('T')[0]

    const { data: gastos } = await supabase
      .from('gastos')
      .select('id, categorias_gastos(tipo, descripcion)')
      .eq('tenant_id', TENANT_ID)
      .gte('fecha_pago', inicio)
      .lte('fecha_pago', fin)
      .or('notas.is.null,notas.neq.[ANULADO]')

    // Agrupar por tipo (anillo interno) y categoría (anillo externo)
    const byTipo: Record<string, number> = {}
    const byCat: Record<string, { tipo: string; nombre: string; total: number }> = {}
    let total = 0

    await Promise.all((gastos || []).map(async (g: any) => {
      const { data: t } = await supabase.rpc('get_total_gasto', { p_gasto_id: g.id })
      const monto = Number(t ?? 0)
      const tipo = g.categorias_gastos?.tipo || 'Otro'
      const cat = g.categorias_gastos?.descripcion || 'Sin categoría'
      const catKey = `${tipo}::${cat}`
      byTipo[tipo] = (byTipo[tipo] || 0) + monto
      if (!byCat[catKey]) byCat[catKey] = { tipo, nombre: cat, total: 0 }
      byCat[catKey].total += monto
      total += monto
    }))

    const tiposArr = Object.entries(byTipo).map(([nombre, total]) => ({ nombre, total })).sort((a, b) => b.total - a.total)
    const catsArr = Object.values(byCat).sort((a, b) => b.total - a.total)
    setDistribucionTipos(tiposArr)
    setDistribucionCats(catsArr)
    setTotalGastosMes(total)
    setLoadingGastos(false)
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar breadcrumb={[{ label: 'Reportes' }]} />
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">

        {/* Fila 1 */}
        <div className="grid grid-cols-2 gap-4">
          <SectionCard title="Saldo de Tesorería — Última semana">
            {loadingSemana ? <div className="h-[200px] flex items-center justify-center text-[#A8A49D] text-sm">Cargando...</div> : (
              <div style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={saldoSemana}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F0EE" />
                    <XAxis dataKey="fecha" tick={{ fontSize: 11, fill: '#A8A49D' }} />
                    <YAxis tickFormatter={formatM} tick={{ fontSize: 11, fill: '#A8A49D' }} width={70} />
                    <Tooltip formatter={(v: any) => formatMonto(v)} {...tooltipStyle} />
                    <Line type="monotone" dataKey="saldo" stroke="#F2682E" strokeWidth={2.5} dot={{ fill: '#F2682E', r: 4 }} name="Saldo" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </SectionCard>

          <SectionCard title="Facturas de Compras y Ventas por Saldar">
            {loadingFacturas ? <div className="h-[200px] flex items-center justify-center text-[#A8A49D] text-sm">Cargando...</div> : (
              <div style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={facturasMeses}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F0EE" />
                    <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#A8A49D' }} />
                    <YAxis tickFormatter={formatM} tick={{ fontSize: 11, fill: '#A8A49D' }} width={70} />
                    <Tooltip formatter={(v: any) => formatMonto(v)} {...tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="ventas" name="Ventas" fill="#4EBB7F" radius={[3,3,0,0]} />
                    <Bar dataKey="compras" name="Compras" fill="#EE3232" radius={[3,3,0,0]} />
                    <Line type="monotone" dataKey="saldo" stroke="#2B445A" strokeWidth={2} dot={{ r: 3 }} name="Saldo neto" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}
          </SectionCard>
        </div>

        {/* Fila 2 */}
        <div className="grid grid-cols-2 gap-4">
          <SectionCard title="Ingresos y Egresos de Fondos — Últimos 6 meses">
            {loadingFlujo ? <div className="h-[240px] flex items-center justify-center text-[#A8A49D] text-sm">Cargando...</div> : (
              <div style={{ height: 240 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={flujoMeses}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F0EE" />
                    <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#A8A49D' }} />
                    <YAxis tickFormatter={formatM} tick={{ fontSize: 11, fill: '#A8A49D' }} width={70} />
                    <Tooltip formatter={(v: any) => formatMonto(v)} {...tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="cobros" name="Cobros" stackId="ing" fill="#4EBB7F" radius={[0,0,0,0]} />
                    <Bar dataKey="otrosIngresos" name="Otros Ingresos" stackId="ing" fill="#2CBAF2" radius={[3,3,0,0]} />
                    <Bar dataKey="pagos" name="Pagos" stackId="egr" fill="#EE3232" radius={[0,0,0,0]} />
                    <Bar dataKey="gastos" name="Gastos" stackId="egr" fill="#F2682E" radius={[3,3,0,0]} />
                    <Line type="monotone" dataKey="saldo" stroke="#2B445A" strokeWidth={2.5} dot={{ r: 3 }} name="Saldo acum." />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Distribución Mensual de los Gastos"
            right={
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-[#A8A49D]">Total: <strong className="text-[#18181B]">{formatMonto(totalGastosMes)}</strong></span>
                <select
                  value={mesReporte}
                  onChange={e => setMesReporte(e.target.value)}
                  className="h-7 text-[11px] font-semibold border border-[#E5E4E0] rounded-[6px] px-2 bg-white text-[#18181B] focus:outline-none focus:border-[#F2682E]"
                >
                  {opcionesMeses.map(o => <option key={o.val} value={o.val}>{o.label}</option>)}
                </select>
              </div>
            }
          >
            {loadingGastos ? <div className="h-[240px] flex items-center justify-center text-[#A8A49D] text-sm">Cargando...</div> :
             distribucionTipos.length === 0 ? <div className="h-[240px] flex items-center justify-center text-[#A8A49D] text-sm">Sin gastos en este período</div> : (
              <div className="flex gap-4" style={{ height: 240 }}>
                <div style={{ width: 200, flexShrink: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      {/* Anillo interno: tipos */}
                      <Pie data={distribucionTipos} dataKey="total" nameKey="nombre" cx="50%" cy="50%" outerRadius={60} innerRadius={30}>
                        {distribucionTipos.map((d, i) => (
                          <Cell key={i} fill={TIPO_COLORS[d.nombre] || CAT_COLORS[i % CAT_COLORS.length]} />
                        ))}
                      </Pie>
                      {/* Anillo externo: categorías */}
                      <Pie data={distribucionCats} dataKey="total" nameKey="nombre" cx="50%" cy="50%" outerRadius={95} innerRadius={65}>
                        {distribucionCats.map((d, i) => (
                          <Cell key={i} fill={TIPO_COLORS[d.tipo] || CAT_COLORS[i % CAT_COLORS.length]} opacity={0.6 + (i % 3) * 0.13} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: any) => formatMonto(v)} {...tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {distribucionTipos.map((tipo, i) => {
                    const cats = distribucionCats.filter(c => c.tipo === tipo.nombre)
                    return (
                      <div key={i} className="mb-2">
                        <div className="flex items-center justify-between py-1">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: TIPO_COLORS[tipo.nombre] || CAT_COLORS[i % CAT_COLORS.length] }} />
                            <span className="text-[12px] font-bold text-[#18181B]">{tipo.nombre}</span>
                          </div>
                          <span className="font-mono text-[11.5px] font-bold text-[#18181B]">{formatMonto(tipo.total)}</span>
                        </div>
                        {cats.map((cat, j) => (
                          <div key={j} className="flex items-center justify-between py-0.5 pl-4">
                            <span className="text-[11px] text-[#6B6762] truncate">{cat.nombre}</span>
                            <span className="font-mono text-[11px] text-[#6B6762] ml-2 flex-shrink-0">{formatMonto(cat.total)}</span>
                          </div>
                        ))}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </SectionCard>
        </div>

      </div>
    </div>
  )
}