'use client'
import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Bar, PieChart, Pie, Cell } from 'recharts'
import Topbar from '@/components/shared/Topbar'
import { createClient } from '@/lib/supabase'
import { getTenantId } from '@/lib/tenant'

function formatM(n: number) {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n.toFixed(0)}`
}
function formatMonto(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(n)
}

const TIPO_COLORS: Record<string, string> = {
  'Empleados': '#F2682E', 'Impuestos': '#2CBAF2', 'Marketing': '#FDBC16',
  'Oficina': '#4EBB7F', 'Servicios Profesionales': '#2B445A', 'Otro': '#A8A49D',
}
const CAT_COLORS = ['#F2682E','#FF8C5A','#FFA87A','#2CBAF2','#5CCEF5','#4EBB7F','#7DCCA0','#FDBC16','#FDD050','#2B445A','#4A6B84','#EE3232']
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

async function getFechaBase(supabase: any, TENANT_ID: string): Promise<Date> {
  const results = await Promise.all([
    supabase.from('recibos_cobro').select('fecha').eq('tenant_id', TENANT_ID).order('fecha', { ascending: false }).limit(1),
    supabase.from('recibos_pago').select('fecha').eq('tenant_id', TENANT_ID).order('fecha', { ascending: false }).limit(1),
    supabase.from('gastos').select('fecha_pago').eq('tenant_id', TENANT_ID).order('fecha_pago', { ascending: false }).limit(1),
  ])
  const fechas = [
    results[0].data?.[0]?.fecha,
    results[1].data?.[0]?.fecha,
    results[2].data?.[0]?.fecha_pago,
  ].filter(Boolean).map((f: string) => new Date(f))
  if (fechas.length === 0) return new Date()
  return new Date(Math.max(...fechas.map((f: Date) => f.getTime())))
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
    async function init() {
      const supabase = createClient()
      const TENANT_ID = await getTenantId()
      const base = await getFechaBase(supabase, TENANT_ID)

      const opts: { val: string; label: string }[] = []
      const cursor = new Date(base.getFullYear(), base.getMonth(), 1)
      for (let i = 0; i < 24; i++) {
        const val = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`
        const label = cursor.toLocaleString('es-AR', { month: 'long', year: 'numeric' })
        opts.push({ val, label })
        cursor.setMonth(cursor.getMonth() - 1)
      }
      setOpcionesMeses(opts)
      setMesReporte(opts[0]?.val || '')

      loadSaldoSemana(supabase, base, TENANT_ID)
      loadFacturasMeses(supabase, base, TENANT_ID)
      loadFlujoMeses(supabase, base, TENANT_ID)
    }
    init()
  }, [])

  useEffect(() => {
    if (mesReporte) loadDistribucionGastos()
  }, [mesReporte])

  async function loadSaldoSemana(supabase: any, base: Date, TENANT_ID: string) {
    setLoadingSemana(true)
    const { data: cuentas } = await supabase.from('cuentas').select('id').eq('tenant_id', TENANT_ID).eq('activo', true)
    let saldoActual = 0
    await Promise.all((cuentas || []).map(async (c: any) => {
      const { data: s } = await supabase.rpc('get_saldo_cuenta', { p_cuenta_id: c.id })
      saldoActual += Number(s ?? 0)
    }))
    const dias = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(base)
      d.setDate(d.getDate() - i)
      dias.push({ fecha: `${d.getDate()}/${d.getMonth() + 1}`, saldo: saldoActual })
    }
    setSaldoSemana(dias)
    setLoadingSemana(false)
  }

  async function loadFacturasMeses(supabase: any, base: Date, TENANT_ID: string) {
    setLoadingFacturas(true)
    const inicioBase = new Date(base.getFullYear(), base.getMonth(), 1)
    const puntos = [
      { label: 'Vencidos', desde: null, hasta: new Date(inicioBase.getTime() - 1).toISOString().split('T')[0] },
      ...Array.from({ length: 3 }, (_, i) => {
        const d = new Date(base.getFullYear(), base.getMonth() - i, 1)
        return {
          label: d.toLocaleString('es-AR', { month: 'short', year: '2-digit' }),
          desde: new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0],
          hasta: new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0],
        }
      })
    ]

    let saldoAcum = 0
    const resultado = await Promise.all(puntos.map(async (p) => {
      const { data } = await supabase.rpc('get_saldos_facturas_periodo', {
        p_tenant_id: TENANT_ID,
        p_desde: p.desde,
        p_hasta: p.hasta,
      })
      const ventas = Number(data?.[0]?.ventas ?? 0)
      const compras = Number(data?.[0]?.compras ?? 0)
      saldoAcum += ventas - compras
      return { mes: p.label, ventas, compras, saldo: saldoAcum }
    }))

    // Recalcular saldo acumulado secuencialmente
    let acum = 0
    const final = resultado.map(r => {
      acum += r.ventas - r.compras
      return { ...r, saldo: acum }
    })

    setFacturasMeses(final)
    setLoadingFacturas(false)
  }

  async function loadFlujoMeses(supabase: any, base: Date, TENANT_ID: string) {
    setLoadingFlujo(true)
    const periodos = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(base.getFullYear(), base.getMonth() - (5 - i), 1)
      return {
        label: d.toLocaleString('es-AR', { month: 'short', year: '2-digit' }),
        desde: new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0],
        hasta: new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0],
      }
    })

    const resultados = await Promise.all(periodos.map(async (p) => {
      const { data } = await supabase.rpc('get_flujo_mes', {
        p_tenant_id: TENANT_ID,
        p_desde: p.desde,
        p_hasta: p.hasta,
      })
      return {
        mes: p.label,
        cobros: Number(data?.[0]?.cobros ?? 0),
        pagos: Number(data?.[0]?.pagos ?? 0),
        otrosIngresos: Number(data?.[0]?.otros_ingresos ?? 0),
        gastos: Number(data?.[0]?.gastos ?? 0),
      }
    }))

    let saldoAcum = 0
    const final = resultados.map(r => {
      saldoAcum += r.cobros + r.otrosIngresos - r.pagos - r.gastos
      return { ...r, saldo: saldoAcum }
    })

    setFlujoMeses(final)
    setLoadingFlujo(false)
  }

  async function loadDistribucionGastos() {
    setLoadingGastos(true)
    const supabase = createClient()
    const TENANT_ID = await getTenantId()
    const [year, month] = mesReporte.split('-').map(Number)
    const inicio = new Date(year, month - 1, 1).toISOString().split('T')[0]
    const fin = new Date(year, month, 0).toISOString().split('T')[0]

    const { data: gastos } = await supabase
      .from('gastos')
      .select('id, categorias_gastos(tipo, descripcion)')
      .eq('tenant_id', TENANT_ID)
      .gte('fecha_pago', inicio)
      .lte('fecha_pago', fin)

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

    setDistribucionTipos(Object.entries(byTipo).map(([nombre, total]) => ({ nombre, total })).sort((a, b) => b.total - a.total))
    setDistribucionCats(Object.values(byCat).sort((a, b) => b.total - a.total))
    setTotalGastosMes(total)
    setLoadingGastos(false)
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar breadcrumb={[{ label: 'Reportes' }]} />
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">

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
                    <Bar dataKey="cobros" name="Cobros" stackId="ing" fill="#4EBB7F" />
                    <Bar dataKey="otrosIngresos" name="Otros Ingresos" stackId="ing" fill="#2CBAF2" radius={[3,3,0,0]} />
                    <Bar dataKey="pagos" name="Pagos" stackId="egr" fill="#EE3232" />
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
                <select value={mesReporte} onChange={e => setMesReporte(e.target.value)} className="h-7 text-[11px] font-semibold border border-[#E5E4E0] rounded-[6px] px-2 bg-white text-[#18181B] focus:outline-none focus:border-[#F2682E]">
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
                      <Pie data={distribucionTipos} dataKey="total" nameKey="nombre" cx="50%" cy="50%" outerRadius={60} innerRadius={30}>
                        {distribucionTipos.map((d, i) => <Cell key={i} fill={TIPO_COLORS[d.nombre] || CAT_COLORS[i % CAT_COLORS.length]} />)}
                      </Pie>
                      <Pie data={distribucionCats} dataKey="total" nameKey="nombre" cx="50%" cy="50%" outerRadius={95} innerRadius={65}>
                        {distribucionCats.map((d, i) => <Cell key={i} fill={TIPO_COLORS[d.tipo] || CAT_COLORS[i % CAT_COLORS.length]} opacity={0.65 + (i % 3) * 0.12} />)}
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