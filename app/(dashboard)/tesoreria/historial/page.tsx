'use client'
import { useState, useEffect, useCallback } from 'react'
import Topbar from '@/components/shared/Topbar'
import PaginationNav from '@/components/shared/PaginationNav'
import { createClient } from '@/lib/supabase'
import { getTenantId } from '@/lib/tenant'
import { getCuentas } from '@/lib/cuentas'

const PAGE_SIZES = [25, 50, 100]

function formatMonto(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 }).format(n)
}

interface HistorialRow {
  fecha: string
  cuenta_nombre: string
  cuenta_id: string
  tipo: string
  codigo: string | null
  observacion: string
  ingreso: number
  egreso: number
  saldo: number
  total_count: number
}

export default function HistorialPage() {
  const [data, setData] = useState<HistorialRow[]>([])
  const [loading, setLoading] = useState(true)
  const [cuentas, setCuentas] = useState<any[]>([])
  const [cuentaFilter, setCuentaFilter] = useState('')
  const [tipoFilter, setTipoFilter] = useState('')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(PAGE_SIZES[0])
  const [total, setTotal] = useState(0)

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  useEffect(() => {
    getCuentas({ activo: true }).then(d => setCuentas(d || []))
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const tenantId = await getTenantId()

      const { data: rows, error } = await supabase.rpc('get_historial_movimientos', {
        p_tenant_id: tenantId,
        p_cuenta_id: cuentaFilter || null,
        p_tipo: tipoFilter || null,
        p_fecha_desde: fechaDesde || null,
        p_fecha_hasta: fechaHasta || null,
        p_limit: pageSize,
        p_offset: page * pageSize,
      })

      if (error) throw error

      setData((rows || []) as HistorialRow[])
      setTotal(Number(rows?.[0]?.total_count ?? 0))
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, cuentaFilter, tipoFilter, fechaDesde, fechaHasta])

  useEffect(() => { load() }, [load])

  function handleCuentaChange(v: string) {
    setCuentaFilter(v)
    setPage(0)
  }

  function handleTipoChange(v: string) {
    setTipoFilter(v)
    setPage(0)
  }

  function handlePageSize(s: number) {
    setPageSize(s)
    setPage(0)
  }

  function clearFilters() {
    setCuentaFilter('')
    setTipoFilter('')
    setFechaDesde('')
    setFechaHasta('')
    setPage(0)
  }

  const hasFilters = cuentaFilter || tipoFilter || fechaDesde || fechaHasta

  const tipoBadge = (tipo: string) => {
    const map: Record<string, { bg: string; text: string }> = {
      'Cobro': { bg: 'bg-[#E8F7EF]', text: 'text-[#1A5C38]' },
      'Pago': { bg: 'bg-[#FEE8E8]', text: 'text-[#7F1D1D]' },
      'Gasto': { bg: 'bg-[#FEF0EA]', text: 'text-[#C94E18]' },
      'Otro Ingreso': { bg: 'bg-[#E8F4FE]', text: 'text-[#1A6FB5]' },
      'Transferencia': { bg: 'bg-[#F3F0FF]', text: 'text-[#5B21B6]' },
    }
    const style = map[tipo] || { bg: 'bg-[#F9F9F8]', text: 'text-[#6B6762]' }
    return <span className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}>{tipo}</span>
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar breadcrumb={[{ label: 'Tesorería' }, { label: 'Historial' }]} />

      {/* Header */}
      <div className="bg-white border-b border-[#E5E4E0] px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between gap-4">
          <h1 className="font-display text-[20px] font-extrabold tracking-tight text-[#18181B]">Movimientos Históricos</h1>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="font-mono text-[11px] text-[#A8A49D]">
              Total: <strong className="text-[#18181B]">{total.toLocaleString('es-AR')}</strong>
            </span>
            <select
              value={pageSize}
              onChange={e => handlePageSize(Number(e.target.value))}
              className="h-7 text-[11px] font-semibold border border-[#E5E4E0] rounded-[6px] px-2 bg-white text-[#18181B] focus:outline-none focus:border-[#F2682E]"
            >
              {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <PaginationNav page={page} totalPages={totalPages} onPage={setPage} />
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white border-b border-[#E5E4E0] px-6 py-3 flex items-center gap-3 flex-shrink-0">
        <span className="font-mono text-[9.5px] tracking-[0.12em] uppercase text-[#A8A49D]">Filtros</span>
        <select
          value={cuentaFilter}
          onChange={e => handleCuentaChange(e.target.value)}
          className="h-8 text-[12px] border border-[#E5E4E0] rounded-[7px] px-2.5 bg-white text-[#18181B] focus:outline-none focus:border-[#F2682E]"
        >
          <option value="">Todas las cuentas</option>
          {cuentas.filter(c => c.tipo === 'efectivo' || c.tipo === 'banco').map(c => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>
        <select
          value={tipoFilter}
          onChange={e => handleTipoChange(e.target.value)}
          className="h-8 text-[12px] border border-[#E5E4E0] rounded-[7px] px-2.5 bg-white text-[#18181B] focus:outline-none focus:border-[#F2682E]"
        >
          <option value="">Todos los tipos</option>
          <option value="Cobro">Cobro</option>
          <option value="Pago">Pago</option>
          <option value="Gasto">Gasto</option>
          <option value="Otro Ingreso">Otro Ingreso</option>
          <option value="Transferencia">Transferencia</option>
        </select>
        <input
          type="date"
          value={fechaDesde}
          onChange={e => { setFechaDesde(e.target.value); setPage(0) }}
          className="h-8 text-[12px] border border-[#E5E4E0] rounded-[7px] px-2.5 bg-white text-[#18181B] focus:outline-none focus:border-[#F2682E]"
        />
        <span className="text-[11px] text-[#A8A49D]">a</span>
        <input
          type="date"
          value={fechaHasta}
          onChange={e => { setFechaHasta(e.target.value); setPage(0) }}
          className="h-8 text-[12px] border border-[#E5E4E0] rounded-[7px] px-2.5 bg-white text-[#18181B] focus:outline-none focus:border-[#F2682E]"
        />
        {hasFilters && (
          <button onClick={clearFilters} className="text-[11px] font-semibold text-[#F2682E] hover:text-[#C94E18] transition-colors">
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Tabla */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="text-center text-[#A8A49D] text-sm py-10">Cargando...</div>
        ) : (
          <div className="bg-white border border-[#E5E4E0] rounded-xl overflow-hidden shadow-sm">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[#E5E4E0] bg-[#F9F9F8]">
                  {['Fecha', 'Cuenta', 'Tipo', 'Código', 'Observaciones', 'Ingreso', 'Egreso', 'Saldo'].map((h, i) => (
                    <th key={i} className="font-mono text-[9.5px] tracking-[0.12em] uppercase text-[#A8A49D] px-4 py-2.5 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-10 text-center text-[#A8A49D] text-sm">No hay movimientos.</td></tr>
                ) : data.map((m, idx) => (
                  <tr key={idx} className="border-b border-[#F1F0EE] last:border-0 hover:bg-[#FEF0EA]/50 transition-colors">
                    <td className="px-4 py-3 font-mono text-[11.5px] text-[#6B6762] whitespace-nowrap">{new Date(m.fecha).toLocaleDateString('es-AR')}</td>
                    <td className="px-4 py-3 text-[12px] font-semibold text-[#18181B] whitespace-nowrap">{m.cuenta_nombre}</td>
                    <td className="px-4 py-3">{tipoBadge(m.tipo)}</td>
                    <td className="px-4 py-3 font-mono text-[11px] text-[#6B6762]">{m.codigo || '—'}</td>
                    <td className="px-4 py-3 text-[12px] text-[#6B6762] max-w-[300px] truncate">{m.observacion || '—'}</td>
                    <td className="px-4 py-3 font-mono text-[12px] text-[#1A5C38] font-medium text-right">
                      {m.ingreso > 0 ? formatMonto(m.ingreso) : ''}
                    </td>
                    <td className="px-4 py-3 font-mono text-[12px] text-[#EE3232] font-medium text-right">
                      {m.egreso > 0 ? formatMonto(m.egreso) : ''}
                    </td>
                    <td className="px-4 py-3 font-mono text-[12px] font-bold text-[#18181B] text-right whitespace-nowrap">
                      {formatMonto(m.saldo)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}