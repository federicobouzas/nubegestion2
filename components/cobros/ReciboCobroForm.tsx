'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Save, X } from 'lucide-react'
import { getCuentas, getFacturasVentaCliente, formatMonto } from '@/lib/cobros'
import { getClientes } from '@/lib/clientes'
import FormErrorBanner from '@/components/shared/FormErrorBanner'
import FormErrorModal from '@/components/shared/FormErrorModal'
import FieldWrapper, { inputCls, inputSmCls } from '@/components/shared/FieldWrapper'
import type {
  ReciboCobroForm,
  ReciboCobroFactura,
  ReciboCobroMetodo,
  ReciboCobroRetencion,
  FacturaVentaCobroRow,
} from '@/types/cobros'
import type { Cliente } from '@/types/clientes'

function Section({
  title,
  children,
  action,
}: {
  title: string
  children: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div className="bg-white border border-[#E5E4E0] rounded-xl overflow-hidden shadow-sm">
      <div className="bg-[#F9F9F8] border-b border-[#F1F0EE] px-4 py-3 flex items-center justify-between">
        <span className="font-display text-[13.5px] font-bold">{title}</span>
        {action}
      </div>
      <div>{children}</div>
    </div>
  )
}

const emptyRetencion = (): ReciboCobroRetencion => ({
  impuesto: '',
  numero_comprobante: '',
  fecha: '',
  importe: 0,
})
const tiposImpuesto = ['Ganancias', 'IVA', 'IIBB', 'SUSS', 'Municipal']

interface Props {
  onSubmit: (data: ReciboCobroForm) => Promise<void>
}

export default function ReciboCobroFormComp({ onSubmit }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [cuentas, setCuentas] = useState<{ id: string; nombre: string; saldo_actual: number | null }[]>([])
  const [facturasDisponibles, setFacturasDisponibles] = useState<FacturaVentaCobroRow[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showModal, setShowModal] = useState(false)

  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState<ReciboCobroForm>({
    cliente_id: '',
    numero: '',
    fecha: today,
    notas: '',
    facturas: [],
    metodos: [],
    retenciones: [],
  })

  useEffect(() => {
    getClientes().then((d) => setClientes(d || []))
    getCuentas().then((d) => setCuentas(d || []))
  }, [])

  async function selectCliente(id: string) {
    setForm((p) => ({ ...p, cliente_id: id, facturas: [] }))
    if (id) {
      const fv = await getFacturasVentaCliente(id)
      setFacturasDisponibles((fv as FacturaVentaCobroRow[]) || [])
    } else {
      setFacturasDisponibles([])
    }
  }

  function addFactura(factura: FacturaVentaCobroRow) {
    if (form.facturas.find((f) => f.factura_venta_id === factura.id)) return
    const row: ReciboCobroFactura = {
      factura_venta_id: factura.id,
      importe: factura.saldo_pendiente,
      _factura: factura,
    }
    setForm((p) => ({ ...p, facturas: [...p.facturas, row] }))
  }

  function setFacturaImporte(idx: number, v: number) {
    setForm((p) => {
      const facturas = [...p.facturas]
      const saldo = facturas[idx]?._factura?.saldo_pendiente ?? 0
      facturas[idx] = { ...facturas[idx], importe: Math.min(Number(v), saldo) }
      return { ...p, facturas }
    })
  }

  function removeFactura(idx: number) {
    setForm((p) => ({ ...p, facturas: p.facturas.filter((_, i) => i !== idx) }))
  }

  function addMetodo() {
    setForm((p) => ({ ...p, metodos: [...p.metodos, { cuenta_id: '', monto: 0 }] }))
  }
  function setMetodo(idx: number, k: keyof ReciboCobroMetodo, v: string | number) {
    setForm((p) => {
      const metodos = [...p.metodos]
      metodos[idx] = { ...metodos[idx], [k]: v }
      return { ...p, metodos }
    })
  }
  function removeMetodo(idx: number) {
    setForm((p) => ({ ...p, metodos: p.metodos.filter((_, i) => i !== idx) }))
  }

  function addRetencion() {
    setForm((p) => ({ ...p, retenciones: [...p.retenciones, emptyRetencion()] }))
  }
  function setRetencion(idx: number, k: keyof ReciboCobroRetencion, v: string | number) {
    setForm((p) => {
      const retenciones = [...p.retenciones]
      retenciones[idx] = { ...retenciones[idx], [k]: v }
      return { ...p, retenciones }
    })
  }
  function removeRetencion(idx: number) {
    setForm((p) => ({ ...p, retenciones: p.retenciones.filter((_, i) => i !== idx) }))
  }

  const totalFacturas = form.facturas.reduce((a, f) => a + Number(f.importe), 0)
  const totalMetodos = form.metodos.reduce((a, m) => a + Number(m.monto), 0)
  const totalRetenciones = form.retenciones.reduce((a, r) => a + Number(r.importe), 0)
  const totalCobro = totalMetodos + totalRetenciones
  const diferencia = totalFacturas - totalCobro

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const newErrors: Record<string, string> = {}

    if (!form.cliente_id) newErrors['cliente_id'] = 'El cliente es obligatorio.'
    if (!form.fecha) newErrors['fecha'] = 'La fecha es obligatoria.'
    if (form.facturas.length === 0) newErrors['facturas'] = 'Agregá al menos una factura.'
    if (form.metodos.length === 0) newErrors['metodos'] = 'Agregá al menos un método de cobro.'

    form.metodos.forEach((m, idx) => {
      if (!m.cuenta_id) newErrors[`metodo_${idx}_cuenta`] = `Método ${idx + 1}: seleccioná una cuenta.`
      if (!m.monto || Number(m.monto) <= 0)
        newErrors[`metodo_${idx}_monto`] = `Método ${idx + 1}: el monto debe ser mayor a 0.`
    })

    form.retenciones.forEach((r, idx) => {
      if (!r.impuesto) newErrors[`ret_${idx}_impuesto`] = `Retención ${idx + 1}: seleccioná un impuesto.`
      if (!r.importe || Number(r.importe) <= 0)
        newErrors[`ret_${idx}_importe`] = `Retención ${idx + 1}: el importe debe ser mayor a 0.`
    })

    if (form.facturas.length > 0 && form.metodos.length > 0) {
      const dif = Math.abs(totalFacturas - totalCobro)
      if (dif > 0.01) {
        newErrors['ecuacion'] = `La suma de facturas (${formatMonto(totalFacturas)}) no coincide con métodos + retenciones (${formatMonto(totalCobro)}).`
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setShowModal(true)
      return
    }

    setErrors({})
    setLoading(true)
    try {
      await onSubmit(form)
    } catch (err: unknown) {
      setLoading(false)
      const msg = err instanceof Error ? err.message : 'Error al guardar.'
      setErrors({ _server: msg })
      setShowModal(true)
    }
  }

  const facturasSinAgregar = facturasDisponibles.filter(
    (f) => !form.facturas.find((ff) => ff.factura_venta_id === f.id)
  )

  return (
    <>
      <FormErrorModal open={showModal} onClose={() => setShowModal(false)} errors={errors} />
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
        <FormErrorBanner show={Object.keys(errors).length > 0} />

        <div className="bg-white border border-[#E5E4E0] rounded-xl overflow-hidden shadow-sm">
          <div className="bg-[#F9F9F8] border-b border-[#F1F0EE] px-4 py-3">
            <span className="font-display text-[13.5px] font-bold">Datos del recibo</span>
          </div>
          <div className="p-4 grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <FieldWrapper label="Cliente" required error={errors.cliente_id}>
                <select
                  className={inputCls(errors.cliente_id)}
                  value={form.cliente_id}
                  onChange={(e) => selectCliente(e.target.value)}
                >
                  <option value="">Seleccionar cliente...</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre_razon_social}
                    </option>
                  ))}
                </select>
              </FieldWrapper>
            </div>
            <FieldWrapper label="Fecha" required error={errors.fecha}>
              <input
                className={inputCls(errors.fecha)}
                type="date"
                value={form.fecha}
                onChange={(e) => setForm((p) => ({ ...p, fecha: e.target.value }))}
              />
            </FieldWrapper>
            <FieldWrapper label="Número (opcional)">
              <input
                className={inputCls()}
                value={form.numero}
                onChange={(e) => setForm((p) => ({ ...p, numero: e.target.value }))}
                placeholder="Ej: 0001"
              />
            </FieldWrapper>
          </div>
        </div>

        <Section
          title="Facturas saldadas"
          action={
            facturasSinAgregar.length > 0 && (
              <div className="flex items-center gap-2">
                <select
                  className="text-[11.5px] border border-[#E5E4E0] rounded-[7px] px-2 py-1 bg-white text-[#18181B] focus:outline-none focus:border-[#F2682E]"
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value) {
                      const f = facturasDisponibles.find((x) => x.id === e.target.value)
                      if (f) addFactura(f)
                      e.target.value = ''
                    }
                  }}
                >
                  <option value="">+ Agregar factura...</option>
                  {facturasSinAgregar.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.numero || f.codigo} — Saldo: {formatMonto(f.saldo_pendiente)}
                    </option>
                  ))}
                </select>
              </div>
            )
          }
        >
          {errors.facturas && <div className="px-4 py-2 text-[12px] text-[#EE3232]">{errors.facturas}</div>}
          {form.facturas.length === 0 ? (
            <div className="px-4 py-6 text-center text-[12px] text-[#A8A49D]">
              {form.cliente_id ? 'Seleccioná una factura del selector de arriba.' : 'Primero seleccioná un cliente.'}
            </div>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[#F1F0EE] bg-[#F9F9F8]">
                  {['Factura', 'Total', 'Saldo pendiente', 'Importe abonado', ''].map((h, i) => (
                    <th
                      key={i}
                      className="font-mono text-[8.5px] tracking-[0.1em] uppercase text-[#A8A49D] px-4 py-2 text-left font-medium"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {form.facturas.map((f, idx) => {
                  const fv = f._factura
                  return (
                    <tr key={idx} className="border-b border-[#F1F0EE] last:border-0">
                      <td className="px-4 py-2.5 font-mono text-[12px] font-bold text-[#18181B]">
                        {fv?.numero || fv?.codigo || '—'}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-[12px] text-[#6B6762]">
                        {fv ? formatMonto(fv.total) : '—'}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-[12px] text-[#6B6762]">
                        {fv ? formatMonto(fv.saldo_pendiente) : '—'}
                      </td>
                      <td className="px-4 py-2.5 w-[160px]">
                        <input
                          className={inputSmCls()}
                          type="number"
                          min={0}
                          step={0.01}
                          value={f.importe}
                          onChange={(e) => setFacturaImporte(idx, parseFloat(e.target.value) || 0)}
                        />
                      </td>
                      <td className="px-4 py-2.5">
                        <button
                          type="button"
                          onClick={() => removeFactura(idx)}
                          className="w-6 h-6 rounded-[5px] bg-[#FEE8E8] flex items-center justify-center text-[#EE3232] hover:bg-[#EE3232] hover:text-white transition-colors"
                        >
                          <Trash2 size={11} strokeWidth={2} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </Section>

        <Section
          title="Métodos de cobro"
          action={
            <button
              type="button"
              onClick={addMetodo}
              className="flex items-center gap-1 text-[11.5px] font-semibold text-[#F2682E] hover:text-[#C94E18] transition-colors"
            >
              <Plus size={12} strokeWidth={2.2} /> Agregar
            </button>
          }
        >
          {errors.metodos && <div className="px-4 py-2 text-[12px] text-[#EE3232]">{errors.metodos}</div>}
          {form.metodos.length === 0 ? (
            <div className="px-4 py-6 text-center text-[12px] text-[#A8A49D]">Agregá un método de cobro.</div>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[#F1F0EE] bg-[#F9F9F8]">
                  {['Cuenta', 'Monto', ''].map((h, i) => (
                    <th
                      key={i}
                      className="font-mono text-[8.5px] tracking-[0.1em] uppercase text-[#A8A49D] px-4 py-2 text-left font-medium"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {form.metodos.map((m, idx) => (
                  <tr key={idx} className="border-b border-[#F1F0EE] last:border-0">
                    <td className="px-4 py-2.5 min-w-[260px] align-top">
                      <select
                        className={inputSmCls(errors[`metodo_${idx}_cuenta`])}
                        value={m.cuenta_id}
                        onChange={(e) => setMetodo(idx, 'cuenta_id', e.target.value)}
                      >
                        <option value="">Seleccionar cuenta...</option>
                        {cuentas.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.nombre} ({formatMonto(Number(c.saldo_actual ?? 0))})
                          </option>
                        ))}
                      </select>
                      {errors[`metodo_${idx}_cuenta`] && (
                        <div className="text-[10px] text-[#EE3232] mt-0.5">{errors[`metodo_${idx}_cuenta`]}</div>
                      )}
                    </td>
                    <td className="px-4 py-2.5 w-[160px] align-top">
                      <input
                        className={inputSmCls(errors[`metodo_${idx}_monto`])}
                        type="number"
                        min={0}
                        step={0.01}
                        value={m.monto}
                        onChange={(e) => setMetodo(idx, 'monto', parseFloat(e.target.value) || 0)}
                      />
                      {errors[`metodo_${idx}_monto`] && (
                        <div className="text-[10px] text-[#EE3232] mt-0.5">{errors[`metodo_${idx}_monto`]}</div>
                      )}
                    </td>
                    <td className="px-4 py-2.5 align-top">
                      <button
                        type="button"
                        onClick={() => removeMetodo(idx)}
                        className="w-6 h-6 rounded-[5px] bg-[#FEE8E8] flex items-center justify-center text-[#EE3232] hover:bg-[#EE3232] hover:text-white transition-colors"
                      >
                        <Trash2 size={11} strokeWidth={2} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>

        <Section
          title="Retenciones"
          action={
            <button
              type="button"
              onClick={addRetencion}
              className="flex items-center gap-1 text-[11.5px] font-semibold text-[#F2682E] hover:text-[#C94E18] transition-colors"
            >
              <Plus size={12} strokeWidth={2.2} /> Agregar
            </button>
          }
        >
          {form.retenciones.length === 0 ? (
            <div className="px-4 py-6 text-center text-[12px] text-[#A8A49D]">Sin retenciones.</div>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[#F1F0EE] bg-[#F9F9F8]">
                  {['Impuesto', 'N° Comprobante', 'Fecha', 'Importe', ''].map((h, i) => (
                    <th
                      key={i}
                      className="font-mono text-[8.5px] tracking-[0.1em] uppercase text-[#A8A49D] px-4 py-2 text-left font-medium"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {form.retenciones.map((r, idx) => (
                  <tr key={idx} className="border-b border-[#F1F0EE] last:border-0">
                    <td className="px-4 py-2.5 min-w-[160px] align-top">
                      <select
                        className={inputSmCls(errors[`ret_${idx}_impuesto`])}
                        value={r.impuesto}
                        onChange={(e) => setRetencion(idx, 'impuesto', e.target.value)}
                      >
                        <option value="">Seleccionar...</option>
                        {tiposImpuesto.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                      {errors[`ret_${idx}_impuesto`] && (
                        <div className="text-[10px] text-[#EE3232] mt-0.5">{errors[`ret_${idx}_impuesto`]}</div>
                      )}
                    </td>
                    <td className="px-4 py-2.5 min-w-[140px] align-top">
                      <input
                        className={inputSmCls()}
                        value={r.numero_comprobante}
                        onChange={(e) => setRetencion(idx, 'numero_comprobante', e.target.value)}
                        placeholder="Opcional"
                      />
                    </td>
                    <td className="px-4 py-2.5 w-[140px] align-top">
                      <input
                        className={inputSmCls()}
                        type="date"
                        value={r.fecha}
                        onChange={(e) => setRetencion(idx, 'fecha', e.target.value)}
                      />
                    </td>
                    <td className="px-4 py-2.5 w-[140px] align-top">
                      <input
                        className={inputSmCls(errors[`ret_${idx}_importe`])}
                        type="number"
                        min={0}
                        step={0.01}
                        value={r.importe}
                        onChange={(e) => setRetencion(idx, 'importe', parseFloat(e.target.value) || 0)}
                      />
                      {errors[`ret_${idx}_importe`] && (
                        <div className="text-[10px] text-[#EE3232] mt-0.5">{errors[`ret_${idx}_importe`]}</div>
                      )}
                    </td>
                    <td className="px-4 py-2.5 align-top">
                      <button
                        type="button"
                        onClick={() => removeRetencion(idx)}
                        className="w-6 h-6 rounded-[5px] bg-[#FEE8E8] flex items-center justify-center text-[#EE3232] hover:bg-[#EE3232] hover:text-white transition-colors"
                      >
                        <Trash2 size={11} strokeWidth={2} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>

        <div className="bg-white border border-[#E5E4E0] rounded-xl overflow-hidden shadow-sm">
          <div className="bg-[#F9F9F8] border-b border-[#F1F0EE] px-4 py-3">
            <span className="font-display text-[13.5px] font-bold">Resumen</span>
          </div>
          <div className="p-4 flex flex-col items-end gap-2">
            <div className="flex gap-8 text-[12.5px] text-[#6B6762]">
              <span>Total facturas</span>
              <span className="font-mono font-bold text-[#18181B] w-36 text-right">{formatMonto(totalFacturas)}</span>
            </div>
            <div className="flex gap-8 text-[12.5px] text-[#6B6762]">
              <span>Métodos de cobro</span>
              <span className="font-mono font-bold text-[#18181B] w-36 text-right">{formatMonto(totalMetodos)}</span>
            </div>
            {totalRetenciones > 0 && (
              <div className="flex gap-8 text-[12.5px] text-[#6B6762]">
                <span>Retenciones</span>
                <span className="font-mono font-bold text-[#18181B] w-36 text-right">
                  {formatMonto(totalRetenciones)}
                </span>
              </div>
            )}
            <div
              className={`flex gap-8 text-[13px] font-bold border-t border-[#E5E4E0] pt-2 mt-1 ${Math.abs(diferencia) > 0.01 ? 'text-[#EE3232]' : 'text-[#4EBB7F]'}`}
            >
              <span>Diferencia</span>
              <span className="font-mono w-36 text-right text-[15px]">{formatMonto(diferencia)}</span>
            </div>
            {errors.ecuacion && <div className="text-[11.5px] text-[#EE3232] text-right">{errors.ecuacion}</div>}
          </div>
        </div>

        <div className="bg-white border border-[#E5E4E0] rounded-xl overflow-hidden shadow-sm">
          <div className="bg-[#F9F9F8] border-b border-[#F1F0EE] px-4 py-3">
            <span className="font-display text-[13.5px] font-bold">Notas</span>
          </div>
          <div className="p-4">
            <textarea
              className={inputCls()}
              rows={2}
              value={form.notas}
              onChange={(e) => setForm((p) => ({ ...p, notas: e.target.value }))}
              placeholder="Observaciones opcionales..."
            />
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={() => router.push('/cobros')}
            className="flex items-center gap-1.5 text-[12.5px] font-semibold px-4 py-2 rounded-[9px] border border-[#E5E4E0] bg-transparent text-[#6B6762] hover:border-[#A8A49D] transition-colors"
          >
            <X size={13} strokeWidth={2.2} /> Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-1.5 text-[12.5px] font-semibold px-4 py-2 rounded-[9px] bg-[#F2682E] text-white shadow-[0_3px_12px_rgba(242,104,46,0.30)] hover:bg-[#C94E18] transition-colors disabled:opacity-50"
          >
            <Save size={13} strokeWidth={2.2} /> {loading ? 'Guardando...' : 'Guardar recibo'}
          </button>
        </div>
      </form>
    </>
  )
}
