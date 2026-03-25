'use client'
import { TriangleAlert } from 'lucide-react'

interface Props { show: boolean }

export default function FormErrorBanner({ show }: Props) {
  if (!show) return null
  return (
    <div className="flex items-center gap-3 bg-[#FEE8E8] border border-[#FECACA] rounded-xl px-4 py-3">
      <div className="w-7 h-7 rounded-[7px] bg-[#EE3232] flex items-center justify-center flex-shrink-0">
        <TriangleAlert size={13} color="white" strokeWidth={2.2} />
      </div>
      <p className="text-[13px] font-semibold text-[#7F1D1D]">
        El formulario tiene errores. Revisá los campos marcados en rojo antes de continuar.
      </p>
    </div>
  )
}
