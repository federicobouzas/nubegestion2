'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, TrendingUp, Users, Factory, Package, Wrench, Tags, FileText, HandCoins, ArrowUpCircle, ShoppingCart, Send, Receipt, FlaskConical, Landmark, History, Settings, Ticket, Cloud, Wallet, Tag, FolderOpen } from 'lucide-react'

const nav = [
  { section: 'Principal', items: [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Reportes', href: '/reportes', icon: TrendingUp },
  ]},
  { section: 'Negocio', items: [
    { label: 'Clientes', href: '/clientes', icon: Users },
    { label: 'Proveedores', href: '/proveedores', icon: Factory },
    { label: 'Productos', href: '/productos', icon: Package },
    { label: 'Servicios', href: '/servicios', icon: Wrench },
    { label: 'Listas de Precios', href: '/listas-precios', icon: Tags },
  ]},
  { section: 'Ingresos', items: [
    { label: 'Ventas', href: '/ventas', icon: FileText },
    { label: 'Cobros', href: '/cobros', icon: HandCoins },
    { label: 'Otros Ingresos', href: '/otros-ingresos', icon: ArrowUpCircle },
  ]},
  { section: 'Egresos', items: [
    { label: 'Compras', href: '/compras', icon: ShoppingCart },
    { label: 'Pagos', href: '/pagos', icon: Send },
    { label: 'Gastos', href: '/gastos', icon: Receipt },
  ]},
  { section: 'Producción', items: [
    { label: 'Insumos', href: '/insumos', icon: FlaskConical },
    { label: 'Fabricación', href: '/fabricacion', icon: Wrench },
  ]},
  { section: 'Tesorería', items: [
    { label: 'Saldos', href: '/tesoreria/saldos', icon: Landmark },
    { label: 'Cuentas', href: '/tesoreria/cuentas', icon: Wallet },
    { label: 'Movimientos', href: '/movimientos', icon: History },
  ]},
  { section: 'Sistema', items: [
    { href: '/listas-precios', label: 'Listas de Precios', icon: Tag },
    { href: '/categorias-gastos', label: 'Categorías de Gastos', icon: FolderOpen },
    { label: 'Configuración', href: '/configuracion', icon: Settings },
    { label: 'Soporte', href: '/soporte', icon: Ticket },
  ]},
]

export default function Sidebar() {
  const pathname = usePathname()
  return (
    <aside className="w-[228px] bg-[#2B445A] flex flex-col flex-shrink-0 h-full overflow-y-auto">
      <div className="bg-[#1E3247] px-4 py-3.5 flex items-center gap-2.5 border-b border-white/10 flex-shrink-0">
        <div className="w-[30px] h-[30px] bg-[#F2682E] rounded-[7px] flex items-center justify-center flex-shrink-0">
          <Cloud size={14} color="white" strokeWidth={2.5} />
        </div>
        <div>
          <div className="font-display text-[13px] font-bold text-white leading-tight">Nube Gestión</div>
          <div className="text-[10.5px] text-white/30 mt-0.5">Empresa Demo SRL</div>
        </div>
      </div>
      <nav className="flex-1 py-2 overflow-y-auto">
        {nav.map((group) => (
          <div key={group.section}>
            <div className="px-[15px] pt-[13px] pb-[3px] font-mono text-[8.5px] tracking-[0.16em] text-white/20 uppercase">{group.section}</div>
            {group.items.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + '/')
              const Icon = item.icon
              return (
                <Link key={item.href} href={item.href}
                  className={`mx-[7px] px-[9px] py-[7px] rounded-[8px] flex items-center gap-[9px] transition-colors ${active ? 'bg-[rgba(242,104,46,0.15)]' : 'hover:bg-white/5'}`}>
                  <Icon size={13} strokeWidth={2} className={active ? 'text-[#F2682E]' : 'text-white/30'} />
                  <span className={`text-[12px] ${active ? 'text-[#F2682E] font-semibold' : 'text-white/40 font-medium'}`}>{item.label}</span>
                </Link>
              )
            })}
          </div>
        ))}
      </nav>
      <div className="border-t border-white/10 px-[13px] py-[11px] flex items-center gap-2 flex-shrink-0">
        <div className="w-[26px] h-[26px] bg-[#7C3AED] rounded-full flex items-center justify-center text-[10px] text-white font-bold flex-shrink-0">AD</div>
        <div className="flex-1 min-w-0">
          <div className="text-[11.5px] font-semibold text-white/50 truncate">Admin Demo</div>
          <div className="font-mono text-[8.5px] text-white/20">Admin</div>
        </div>
        <Settings size={13} className="text-white/20 flex-shrink-0" />
      </div>
    </aside>
  )
}
