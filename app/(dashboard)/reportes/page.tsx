'use client'
import { useEffect, useState } from 'react'
import { XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Bar, BarChart, PieChart, Pie, Cell, Line } from 'recharts'
import Topbar from '@/components/shared/Topbar'
import { createClient } from '@/lib/supabase'
import { getTenantId } from '@/lib/tenant'
import { CheckCircle, Calendar, XCircle, DollarSign } from 'lucide-react'

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

function KpiCard({ icon: Icon, iconBg, label, value, sub }: { icon: any; iconBg: string; label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white border border-[#E5E4E0] rounded-xl p-4 shadow-sm flex items-center gap-4">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${iconBg}`}>
        <Icon size={18} strokeWidth={2} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-mono text-[9.5px] tracking-[0.12em] uppercase text-[#A8A49D]">{label}</div>
        <div className="font-display text-[18px] font-extrabold text-[#18181B] tracking-tight">{value}</div>
        {sub && <div className="text-[11px] text-[#A8A49D] mt-0.5">{sub}</div>}
      </div>
    </div>
  )
}

function getMesRange(mesVal: string) {
  const [year, month] = mesVal.split('-').map(Number)
  const desde = new Date(year, month - 1, 1).toISOString().split('T')[0]
  const hasta = new Date(year, month, 0).toISOString().split('T')[0]
  return { desde, hasta, year, month }
}

export default function ReportesPage() {
  const [mesReporte, setMesReporte] = useState('')
  const [opcionesMeses, setOpcionesMeses] = useState<{ val: string; label: string }[]>([])

  // Data states
  const [kpis, setKpis] = useState({ cobrado: 0, aCobrar: 0, vencido: 0, total: 0 })
  const [facClientes, setFacClientes] = useState<any[]>([])
  const [estadoFac, setEstadoFac] = useState<any[]>([])
  const [facturasMeses, setFacturasMeses] = useState<any[]>([])
  const [flujoMeses, setFlujoMeses] = useState<any[]>([])
  const [distribucionTipos, setDistribucionTipos] = useState<any[]>([])
  const [distribucionCats, setDistribucionCats] = useState<any[]>([])
  const [totalGastosMes, setTotalGastosMes] = useState(0)

  const [loadingKpis, setLoadingKpis] = useState(true)
  const [loadingFacturas, setLoadingFacturas] = useState(true)
  const [loadingFlujo, setLoadingFlujo] = useState(true)
  const [loadingGastos, setLoadingGastos] = useState(true)

  // Init: build month options from current month backwards
  useEffect(() => {
    const now = new Date()
    const opts: { val: string; label: string }[] = []
    const cursor = new Date(now.getFullYear(), now.getMonth(), 1)
    for (let i = 0; i < 24; i++) {
      const val = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`
      const label = cursor.toLocaleString('es-AR', { month: 'long', year: 'numeric' })
      opts.push({ val, label })
      cursor.setMonth(cursor.getMonth() - 1)
    }
    setOpcionesMeses(opts)
    setMesReporte(opts[0]?.val || '')
  }, [])

  // Load everything when month changes
  useEffect(() => {
    if (!mesReporte) return
    loadMonthData()
  }, [mesReporte])

  // Load data that depends on selected month
  async function loadMonthData() {
    const supabase = createClient()
    const TENANT_ID = await getTenantId()
    const { desde, hasta, year, month } = getMesRange(mesReporte)

    loadKpis(supabase, TENANT_ID, desde, hasta)
    loadFlujoMeses(supabase, TENANT_ID, year, month)
    loadDistribucionGastos(supabase, TENANT_ID, desde, hasta)
    loadFacturasMeses(supabase, TENANT_ID, year, month)
  }

  async function loadKpis(supabase: any, TENANT_ID: string, desde: string, hasta: string) {
    setLoadingKpis(true)
    try {
      const [kpiRes, clientesRes] = await Promise.all([
        supabase.rpc('get_kpis_facturacion_mes', { p_tenant_id: TENANT_ID, p_desde: desde, p_hasta: hasta }),
        supabase.rpc('get_facturacion_clientes_mes', { p_tenant_id: TENANT_ID, p_desde: desde, p_hasta: hasta }),
      ])

      const k = kpiRes.data?.[0] || {}
      setKpis({
        cobrado: Number(k.total_cobrado ?? 0),
        aCobrar: Number(k.total_a_cobrar ?? 0),
        vencido: Number(k.total_vencido ?? 0),
        total: Number(k.total_facturado ?? 0),
      })

      const clientes = (clientesRes.data || []) as any[]
      setFacClientes(clientes)

      const totalCob = clientes.reduce((a: number, c: any) => a + Number(c.cobrado), 0)
      const totalVenc = clientes.reduce((a: number, c: any) => a + Number(c.vencido), 0)
      const totalAcob = clientes.reduce((a: number, c: any) => a + Number(c.a_cobrar), 0)
      const pie = []
      if (totalCob > 0) pie.push({ name: 'Cobrado', value: totalCob, color: '#4EBB7F' })
      if (totalAcob > 0) pie.push({ name: 'A cobrar', value: totalAcob, color: '#FDBC16' })
      if (totalVenc > 0) pie.push({ name: 'Vencido', value: totalVenc, color: '#EE3232' })
      setEstadoFac(pie)
    } finally {
      setLoadingKpis(false)
    }
  }

  async function loadFacturasMeses(supabase: any, TENANT_ID: string, year: number, month: number) {
    setLoadingFacturas(true)
    try {
      const puntos = [
        { label: 'Vencidos', desde: null, hasta: new Date(year, month - 1, 0).toISOString().split('T')[0] },
        ...Array.from({ length: 3 }, (_, i) => {
          const d = new Date(year, month - 1 + i, 1)
          return {
            label: d.toLocaleString('es-AR', { month: 'short', year: '2-digit' }),
            desde: new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0],
            hasta: new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0],
          }
        })
      ]
      const resultado = await Promise.all(puntos.map(async (p) => {
        const { data } = await supabase.rpc('get_saldos_facturas_periodo', { p_tenant_id: TENANT_ID, p_desde: p.desde, p_hasta: p.hasta })
        return { mes: p.label, ventas: Number(data?.[0]?.ventas ?? 0), compras: Number(data?.[0]?.compras ?? 0) }
      }))
      let acum = 0
      const final = resultado.map(r => { acum += r.ventas - r.compras; return { ...r, saldo: acum } })
      setFacturasMeses(final)
    } finally {
      setLoadingFacturas(false)
    }
  }

  async function loadFlujoMeses(supabase: any, TENANT_ID: string, year: number, month: number) {
    setLoadingFlujo(true)
    try {
      const periodos = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(year, month - 1 - (5 - i), 1)
        return {
          label: d.toLocaleString('es-AR', { month: 'short', year: '2-digit' }),
          desde: new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0],
          hasta: new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0],
        }
      })
      const resultados = await Promise.all(periodos.map(async (p) => {
        const { data } = await supabase.rpc('get_flujo_mes', { p_tenant_id: TENANT_ID, p_desde: p.desde, p_hasta: p.hasta })
        return {
          mes: p.label,
          cobros: Number(data?.[0]?.cobros ?? 0),
          pagos: Number(data?.[0]?.pagos ?? 0),
          otrosIngresos: Number(data?.[0]?.otros_ingresos ?? 0),
          gastos: Number(data?.[0]?.gastos ?? 0),
        }
      }))
      let saldoAcum = 0
      const final = resultados.map(r => { saldoAcum += r.cobros + r.otrosIngresos - r.pagos - r.gastos; return { ...r, saldo: saldoAcum } })
      setFlujoMeses(final)
    } finally {
      setLoadingFlujo(false)
    }
  }

  async function loadDistribucionGastos(supabase: any, TENANT_ID: string, desde: string, hasta: string) {
    setLoadingGastos(true)
    try {
      const { data: gastos } = await supabase
        .from('gastos')
        .select('id, categorias_gastos(tipo, descripcion)')
        .eq('tenant_id', TENANT_ID)
        .gte('fecha_pago', desde)
        .lte('fecha_pago', hasta)

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
    } finally {
      setLoadingGastos(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar
        breadcrumb={[{ label: 'Reportes' }]}
        actions={
          <div className="flex items-center gap-2">
            <span className="font-mono text-[9.5px] tracking-[0.12em] uppercase text-[#A8A49D]">Mes de reporte</span>
            <select
              value={mesReporte}
              onChange={e => setMesReporte(e.target.value)}
              className="h-8 text-[12px] font-semibold border border-[#E5E4E0] rounded-[7px] px-2.5 bg-white text-[#18181B] focus:outline-none focus:border-[#F2682E]"
            >
              {opcionesMeses.map(o => <option key={o.val} value={o.val}>{o.label}</option>)}
            </select>
          </div>
        }
      />
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">

        {/* KPIs */}
        {loadingKpis ? (
          <div className="grid grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="bg-white border border-[#E5E4E0] rounded-xl p-4 shadow-sm h-[80px] animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-4">
            <KpiCard icon={CheckCircle} iconBg="bg-[#4EBB7F]" label="Cobrado" value={formatMonto(kpis.cobrado)} />
            <KpiCard icon={Calendar} iconBg="bg-[#FDBC16]" label="A Cobrar" value={formatMonto(kpis.aCobrar)} />
            <KpiCard icon={XCircle} iconBg="bg-[#EE3232]" label="Vencido" value={formatMonto(kpis.vencido)} />
            <KpiCard icon={DollarSign} iconBg="bg-[#2B445A]" label="Total Facturado" value={formatMonto(kpis.total)} />
          </div>
        )}

        {/* Facturación a Clientes + Estado de Facturación + Distribución de Gastos */}
        <div className="grid gap-4" style={{ gridTemplateColumns: '5fr 2fr 3fr' }}>
          <SectionCard title="Facturación a Clientes">
            {loadingKpis ? <div className="h-[260px] flex items-center justify-center text-[#A8A49D] text-sm">Cargando...</div> :
             facClientes.length === 0 ? <div className="h-[260px] flex items-center justify-center text-[#A8A49D] text-sm">Sin facturación en este período</div> : (
              <div style={{ height: Math.max(260, facClientes.length * 50) }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={facClientes} layout="vertical" margin={{ left: 10, right: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F0EE" horizontal={false} />
                    <XAxis type="number" tickFormatter={formatM} tick={{ fontSize: 11, fill: '#A8A49D' }} />
                    <YAxis type="category" dataKey="cliente_nombre" width={100} tick={{ fontSize: 10, fill: '#6B6762' }} />
                    <Tooltip formatter={(v: any) => formatMonto(v)} {...tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Bar dataKey="cobrado" name="Cobrado" stackId="a" fill="#4EBB7F" />
                    <Bar dataKey="a_cobrar" name="A cobrar" stackId="a" fill="#FDBC16" />
                    <Bar dataKey="vencido" name="Vencido" stackId="a" fill="#EE3232" radius={[0,3,3,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </SectionCard>

          <SectionCard title="Estado de la Facturación">
            {loadingKpis ? <div className="h-[260px] flex items-center justify-center text-[#A8A49D] text-sm">Cargando...</div> :
             estadoFac.length === 0 ? <div className="h-[260px] flex items-center justify-center text-[#A8A49D] text-sm">Sin datos</div> : (
              <div style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={estadoFac} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={45} paddingAngle={2}>
                      {estadoFac.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                    <Tooltip formatter={(v: any) => formatMonto(v)} {...tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 11 }} formatter={(value: string, entry: any) => {
                      const pct = kpis.total > 0 ? ((entry.payload.value / kpis.total) * 100).toFixed(1) : '0'
                      return `${value} ${pct}%`
                    }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Distribución de Gastos"
            right={<span className="text-[11px] text-[#A8A49D]">Total: <strong className="text-[#18181B]">{formatMonto(totalGastosMes)}</strong></span>}
          >
            {loadingGastos ? <div className="h-[260px] flex items-center justify-center text-[#A8A49D] text-sm">Cargando...</div> :
             distribucionTipos.length === 0 ? <div className="h-[260px] flex items-center justify-center text-[#A8A49D] text-sm">Sin gastos en este período</div> : (
              <div className="flex flex-col gap-3" style={{ height: 260 }}>
                <div style={{ height: 120, flexShrink: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={distribucionTipos} dataKey="total" nameKey="nombre" cx="50%" cy="50%" outerRadius={45} innerRadius={22}>
                        {distribucionTipos.map((d, i) => <Cell key={i} fill={TIPO_COLORS[d.nombre] || CAT_COLORS[i % CAT_COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: any) => formatMonto(v)} {...tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {distribucionTipos.map((tipo, i) => {
                    const cats = distribucionCats.filter(c => c.tipo === tipo.nombre)
                    return (
                      <div key={i} className="mb-1.5">
                        <div className="flex items-center justify-between py-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: TIPO_COLORS[tipo.nombre] || CAT_COLORS[i % CAT_COLORS.length] }} />
                            <span className="text-[11px] font-bold text-[#18181B]">{tipo.nombre}</span>
                          </div>
                          <span className="font-mono text-[10.5px] font-bold text-[#18181B]">{formatMonto(tipo.total)}</span>
                        </div>
                        {cats.map((cat, j) => (
                          <div key={j} className="flex items-center justify-between py-0.5 pl-3.5">
                            <span className="text-[10px] text-[#6B6762] truncate">{cat.nombre}</span>
                            <span className="font-mono text-[10px] text-[#6B6762] ml-2 flex-shrink-0">{formatMonto(cat.total)}</span>
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

        {/* Facturas por Saldar + Flujo de Fondos */}
        <div className="grid grid-cols-2 gap-4">
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

          <SectionCard title="Ingresos y Egresos de Fondos — Últimos 6 meses">
            {loadingFlujo ? <div className="h-[200px] flex items-center justify-center text-[#A8A49D] text-sm">Cargando...</div> : (
              <div style={{ height: 200 }}>
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
        </div>

      </div>
    </div>
  )
}