'use client'
import { Bell, CircleHelp } from 'lucide-react'

export default function DashboardPage() {
  const fecha = new Date().toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="bg-white border-b border-[#E5E4E0] px-6 h-[52px] flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-display text-[13.5px] font-bold text-[#18181B]">Buenos días 👋</span>
          <span className="text-[#D0CEC9]">·</span>
          <span className="text-[12px] text-[#A8A49D] capitalize">{fecha}</span>
        </div>
        <div className="flex gap-2">
          <button className="w-8 h-8 rounded-[9px] border border-[#E5E4E0] bg-white flex items-center justify-center text-[#6B6762]"><Bell size={14} strokeWidth={2} /></button>
          <button className="w-8 h-8 rounded-[9px] border border-[#E5E4E0] bg-white flex items-center justify-center text-[#6B6762]"><CircleHelp size={14} strokeWidth={2} /></button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Total a Cobrar', accent: '#FDBC16', sub: 'Sin facturas pendientes' },
            { label: 'Total a Pagar', accent: '#EE3232', sub: 'Sin facturas pendientes' },
            { label: 'Disponible Cajas', accent: '#F2682E', sub: 'Cajas activas' },
            { label: 'Disponible Bancos', accent: '#2CBAF2', sub: 'Cuentas activas' },
          ].map(k => (
            <div key={k.label} className="bg-white border border-[#E5E4E0] rounded-xl overflow-hidden shadow-sm">
              <div className="h-[3px]" style={{ background: k.accent }} />
              <div className="p-4">
                <div className="font-mono text-[9px] tracking-[0.12em] uppercase text-[#A8A49D] mb-2">{k.label}</div>
                <div className="font-display text-[22px] font-extrabold tracking-tight text-[#18181B]">$0</div>
                <div className="text-[11px] text-[#A8A49D] mt-1">{k.sub}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-white border border-[#E5E4E0] rounded-xl p-8 text-center text-[#A8A49D] text-sm">
          Dashboard en construcción — los módulos se van conectando de a uno.
        </div>
      </div>
    </div>
  )
}
