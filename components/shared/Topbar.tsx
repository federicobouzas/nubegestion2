'use client'
import Link from 'next/link'
import { ChevronRight, Bell, BookOpen, Ticket, Settings } from 'lucide-react'

interface BreadcrumbItem { label: string; href?: string }
interface TopbarProps { breadcrumb: BreadcrumbItem[]; actions?: React.ReactNode }

function TopbarIconBtn({ icon, tooltip, onClick, href }: { icon: React.ReactNode; tooltip: string; onClick?: () => void; href?: string }) {
  const cls = "relative group w-8 h-8 rounded-[9px] border border-[#E5E4E0] bg-white flex items-center justify-center text-[#6B6762] hover:border-[#2B445A] hover:text-[#2B445A] transition-colors"
  const tooltip_el = (
    <span className="pointer-events-none absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap bg-[#18181B] text-white text-[11px] font-medium px-2 py-1 rounded-[6px] opacity-0 group-hover:opacity-100 transition-opacity z-50">
      {tooltip}
    </span>
  )
  if (href) return (
    <Link href={href} className={cls}>
      {icon}
      {tooltip_el}
    </Link>
  )
  return (
    <button onClick={onClick} className={cls}>
      {icon}
      {tooltip_el}
    </button>
  )
}

export default function Topbar({ breadcrumb, actions }: TopbarProps) {
  return (
    <div className="bg-white border-b border-[#E5E4E0] px-6 h-[52px] flex items-center justify-between flex-shrink-0">
      <div className="flex items-center gap-1.5">
        {breadcrumb.map((item, i) => (
          <div key={i} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight size={10} className="text-[#D0CEC9]" />}
            {item.href
              ? <Link href={item.href} className="text-[13px] text-[#A8A49D] hover:text-[#18181B] transition-colors">{item.label}</Link>
              : <span className="text-[13px] font-semibold text-[#18181B]">{item.label}</span>}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2">
        {actions}
        <TopbarIconBtn icon={<Bell size={14} strokeWidth={2} />} tooltip="Notificaciones" />
        <TopbarIconBtn icon={<BookOpen size={14} strokeWidth={2} />} tooltip="Guías de Ayuda" href="/guias" />
        <TopbarIconBtn icon={<Ticket size={14} strokeWidth={2} />} tooltip="Soporte" href="/soporte" />
        <TopbarIconBtn icon={<Settings size={14} strokeWidth={2} />} tooltip="Configuración" href="/configuracion" />
      </div>
    </div>
  )
}
