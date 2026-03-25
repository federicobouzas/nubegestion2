'use client'
import { useState } from 'react'
import { X, Send } from 'lucide-react'
import type { FacturaVenta } from '@/types/ventas'

interface Props {
  factura: FacturaVenta
  onConfirm: (cae: string, vto: string) => Promise<void>
  onClose: () => void
}

const inp = "bg-white border border-[#E5E4E0] rounded-[9px] px-3 py-2 text-[13px] font-medium text-[#18181B] focus:outline-none focus:border-[#2CBAF2] focus:ring-2 focus:ring-[#2CBAF2]/10 transition-colors w-full"

export default function ModalCAE({ factura, onConfirm, onClose }: Props) {
  const [cae, setCae] = useState('')
  const [vto, setVto] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleConfirm() {
    if (!cae.trim() || !vto) { setError('Completá el CAE y la fecha de vencimiento.'); return }
    setLoading(true)
    try { await onConfirm(cae.trim(), vto) } catch (e: any) { setError(e.message || 'Error'); setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-[#F9F9F8] border-b border-[#E5E4E0] px-5 py-4 flex items-center justify-between">
          <div>
            <h2 className="font-display text-[15px] font-bold">Registrar CAE</h2>
            <p className="text-[11.5px] text-[#A8A49D] mt-0.5">{factura.codigo} · {factura.numero || 'Sin número'}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-[6px] border border-[#E5E4E0] flex items-center justify-center text-[#6B6762] hover:border-[#A8A49D]"><X size={13} strokeWidth={2} /></button>
        </div>
        <div className="p-5 flex flex-col gap-3">
          {error && <div className="bg-[#FEE8E8] text-[#7F1D1D] text-[12.5px] rounded-lg px-3 py-2">{error}</div>}
          <div className="flex flex-col gap-1">
            <label className="font-mono text-[9px] tracking-[0.12em] uppercase text-[#A8A49D]">CAE *</label>
            <input className={inp} value={cae} onChange={e => setCae(e.target.value)} placeholder="12345678901234" maxLength={14} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-mono text-[9px] tracking-[0.12em] uppercase text-[#A8A49D]">Fecha de vencimiento CAE *</label>
            <input className={inp} type="date" value={vto} onChange={e => setVto(e.target.value)} />
          </div>
          <div className="flex gap-2 justify-end mt-1">
            <button onClick={onClose} className="text-[12.5px] font-semibold px-4 py-2 rounded-[9px] border border-[#E5E4E0] text-[#6B6762] hover:border-[#A8A49D] transition-colors">Cancelar</button>
            <button onClick={handleConfirm} disabled={loading} className="flex items-center gap-1.5 text-[12.5px] font-semibold px-4 py-2 rounded-[9px] bg-[#2CBAF2] text-white shadow-[0_3px_12px_rgba(44,186,242,0.28)] hover:bg-[#1A9BD4] transition-colors disabled:opacity-50">
              <Send size={13} strokeWidth={2.2} /> {loading ? 'Guardando...' : 'Grabar CAE'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
