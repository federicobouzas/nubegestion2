'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Save, X } from 'lucide-react'
import type { Cliente, ClienteForm as ClienteFormType, CondicionIVA, TipoFactura } from '@/types/clientes'

interface Props {
  initialData?: Cliente
  onSubmit: (data: ClienteFormType) => Promise<void>
}

const condicionesIVA: CondicionIVA[] = ['RI', 'Mono', 'Exento', 'CF']
const tiposFactura: TipoFactura[] = ['A', 'B', 'C', 'E', 'M']

const condicionToTipo: Record<CondicionIVA, TipoFactura> = {
  RI: 'A', Mono: 'C', Exento: 'B', CF: 'B'
}

export default function ClienteForm({ initialData, onSubmit }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<ClienteFormType>({
    nombre_razon_social: initialData?.nombre_razon_social || '',
    cuit: initialData?.cuit || '',
    condicion_iva: initialData?.condicion_iva || 'CF',
    domicilio_fiscal: initialData?.domicilio_fiscal || '',
    direccion: initialData?.direccion || '',
    localidad: initialData?.localidad || '',
    provincia: initialData?.provincia || '',
    codigo_postal: initialData?.codigo_postal || '',
    telefono: initialData?.telefono || '',
    email: initialData?.email || '',
    web: initialData?.web || '',
    tipo_factura: initialData?.tipo_factura || 'B',
    estado: initialData?.estado || 'activo',
  })

  function set(field: keyof ClienteFormType, value: string) {
    setForm(prev => {
      const next = { ...prev, [field]: value }
      // Auto tipo_factura desde condicion_iva
      if (field === 'condicion_iva') {
        next.tipo_factura = condicionToTipo[value as CondicionIVA]
      }
      return next
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nombre_razon_social.trim()) {
      setError('El nombre o razón social es obligatorio.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await onSubmit(form)
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error. Intentá de nuevo.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6 overflow-y-auto">
      {error && (
        <div className="bg-[#FEE8E8] border border-[#FECACA] text-[#7F1D1D] text-[13px] rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* Datos principales */}
      <div className="bg-white border border-[#E5E4E0] rounded-xl overflow-hidden shadow-sm">
        <div className="bg-[#F9F9F8] border-b border-[#F1F0EE] px-4 py-3 flex items-center gap-2">
          <span className="font-display text-[13.5px] font-bold">Datos principales</span>
        </div>
        <div className="p-4 grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Field label="Nombre / Razón social" required>
              <input className={inputCls} value={form.nombre_razon_social} onChange={e => set('nombre_razon_social', e.target.value)} placeholder="Ej: Juan Pérez o Empresa SA" />
            </Field>
          </div>
          <Field label="CUIT">
            <input className={inputCls} value={form.cuit} onChange={e => set('cuit', e.target.value)} placeholder="20-12345678-9" />
          </Field>
          <Field label="Condición IVA">
            <select className={inputCls} value={form.condicion_iva} onChange={e => set('condicion_iva', e.target.value)}>
              {condicionesIVA.map(c => <option key={c} value={c}>{c === 'RI' ? 'Resp. Inscripto' : c === 'CF' ? 'Consumidor Final' : c === 'Mono' ? 'Monotributista' : 'Exento'}</option>)}
            </select>
          </Field>
          <Field label="Tipo de Factura">
            <select className={inputCls} value={form.tipo_factura} onChange={e => set('tipo_factura', e.target.value)}>
              {tiposFactura.map(t => <option key={t} value={t}>Factura {t}</option>)}
            </select>
          </Field>
          <Field label="Estado">
            <select className={inputCls} value={form.estado} onChange={e => set('estado', e.target.value)}>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </Field>
        </div>
      </div>

      {/* Domicilio */}
      <div className="bg-white border border-[#E5E4E0] rounded-xl overflow-hidden shadow-sm">
        <div className="bg-[#F9F9F8] border-b border-[#F1F0EE] px-4 py-3">
          <span className="font-display text-[13.5px] font-bold">Domicilio</span>
        </div>
        <div className="p-4 grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Field label="Domicilio fiscal">
              <input className={inputCls} value={form.domicilio_fiscal} onChange={e => set('domicilio_fiscal', e.target.value)} placeholder="Calle y número" />
            </Field>
          </div>
          <Field label="Localidad">
            <input className={inputCls} value={form.localidad} onChange={e => set('localidad', e.target.value)} placeholder="Ciudad" />
          </Field>
          <Field label="Provincia">
            <input className={inputCls} value={form.provincia} onChange={e => set('provincia', e.target.value)} placeholder="Provincia" />
          </Field>
          <Field label="Código Postal">
            <input className={inputCls} value={form.codigo_postal} onChange={e => set('codigo_postal', e.target.value)} placeholder="1234" />
          </Field>
        </div>
      </div>

      {/* Contacto */}
      <div className="bg-white border border-[#E5E4E0] rounded-xl overflow-hidden shadow-sm">
        <div className="bg-[#F9F9F8] border-b border-[#F1F0EE] px-4 py-3">
          <span className="font-display text-[13.5px] font-bold">Contacto</span>
        </div>
        <div className="p-4 grid grid-cols-2 gap-3">
          <Field label="Teléfono">
            <input className={inputCls} value={form.telefono} onChange={e => set('telefono', e.target.value)} placeholder="+54 11 1234-5678" />
          </Field>
          <Field label="Email">
            <input className={inputCls} type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="contacto@empresa.com" />
          </Field>
          <Field label="Sitio web">
            <input className={inputCls} value={form.web} onChange={e => set('web', e.target.value)} placeholder="www.empresa.com" />
          </Field>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={() => router.back()}
          className="flex items-center gap-1.5 text-[12.5px] font-semibold px-4 py-2 rounded-[9px] border border-[#E5E4E0] bg-transparent text-[#6B6762] hover:border-[#A8A49D] transition-colors">
          <X size={13} strokeWidth={2.2} /> Cancelar
        </button>
        <button type="submit" disabled={loading}
          className="flex items-center gap-1.5 text-[12.5px] font-semibold px-4 py-2 rounded-[9px] bg-[#F2682E] text-white shadow-[0_3px_12px_rgba(242,104,46,0.30)] hover:bg-[#C94E18] transition-colors disabled:opacity-50">
          <Save size={13} strokeWidth={2.2} /> {loading ? 'Guardando...' : 'Guardar cliente'}
        </button>
      </div>
    </form>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="font-mono text-[9px] tracking-[0.12em] uppercase text-[#A8A49D]">
        {label}{required && <span className="text-[#F2682E] ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

const inputCls = "bg-white border border-[#E5E4E0] rounded-[9px] px-3 py-2 text-[13px] font-medium text-[#18181B] focus:outline-none focus:border-[#F2682E] focus:ring-2 focus:ring-[#F2682E]/10 transition-colors placeholder:text-[#A8A49D] placeholder:font-normal"
