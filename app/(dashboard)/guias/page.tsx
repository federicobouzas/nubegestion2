import Link from 'next/link'
import { BookOpen, Rocket, Settings2, Users, Package, FileText, HandCoins, Receipt, Landmark, FlaskConical, TrendingUp } from 'lucide-react'
import Topbar from '@/components/shared/Topbar'

const guides = [
  {
    slug: 'primeros-pasos',
    title: 'Primeros Pasos',
    icon: Rocket,
    color: 'bg-[#F2682E]',
    description: 'Entendé las operaciones principales y cómo se relacionan entre sí.',
    tags: ['Intro', 'Conceptos'],
  },
  {
    slug: 'configurar-negocio',
    title: 'Configurar tu Negocio',
    icon: Settings2,
    color: 'bg-[#2B445A]',
    description: 'Configurá las cuentas, categorías de gastos y listas de precios antes de empezar.',
    tags: ['Inicial', 'Configuración'],
  },
  {
    slug: 'clientes-proveedores',
    title: 'Clientes y Proveedores',
    icon: Users,
    color: 'bg-[#7C3AED]',
    description: 'Gestioná tu nómina de clientes y proveedores con todos sus datos.',
    tags: ['Contactos', 'Cuenta corriente'],
  },
  {
    slug: 'productos-servicios',
    title: 'Productos y Servicios',
    icon: Package,
    color: 'bg-[#0EA5E9]',
    description: 'Administrá tu catálogo de productos con stock, precios e insumos para producción.',
    tags: ['Catálogo', 'Stock'],
  },
  {
    slug: 'facturacion',
    title: 'Facturación',
    icon: FileText,
    color: 'bg-[#FDBC16]',
    iconDark: true,
    description: 'Creá facturas de venta para clientes y registrá facturas de compra de proveedores.',
    tags: ['Ventas', 'Compras'],
  },
  {
    slug: 'cobros-pagos',
    title: 'Cobros y Pagos',
    icon: HandCoins,
    color: 'bg-[#4EBB7F]',
    description: 'Saldar facturas con recibos que impactan directamente en las cuentas de tesorería.',
    tags: ['Tesorería', 'Recibos'],
  },
  {
    slug: 'gastos-ingresos',
    title: 'Gastos y Otros Ingresos',
    icon: Receipt,
    color: 'bg-[#EF4444]',
    description: 'Registrá los gastos operativos y otros ingresos para mantener el flujo de caja actualizado.',
    tags: ['Egresos', 'Ingresos'],
  },
  {
    slug: 'tesoreria',
    title: 'Tesorería',
    icon: Landmark,
    color: 'bg-[#6366F1]',
    description: 'Controlá los saldos, movimientos y el historial de todas tus cuentas de dinero.',
    tags: ['Cuentas', 'Saldos'],
  },
  {
    slug: 'produccion',
    title: 'Producción',
    icon: FlaskConical,
    color: 'bg-[#EC4899]',
    description: 'Gestioná órdenes de fabricación que transforman insumos en productos terminados.',
    tags: ['Fabricación', 'Stock'],
  },
  {
    slug: 'reportes',
    title: 'Reportes y Dashboard',
    icon: TrendingUp,
    color: 'bg-[#14B8A6]',
    description: 'Visualizá KPIs clave, alertas de stock y cuentas corrientes en tiempo real.',
    tags: ['Análisis', 'KPIs'],
  },
]

export default function GuiasPage() {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar breadcrumb={[{ label: 'Sistema' }, { label: 'Guías de Ayuda' }]} />

      <div className="flex-1 overflow-y-auto">
        {/* Hero */}
        <div className="bg-white border-b border-[#E5E4E0] px-10 py-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 bg-[#FEF0EA] rounded-xl flex items-center justify-center flex-shrink-0">
              <BookOpen size={16} className="text-[#F2682E]" strokeWidth={2} />
            </div>
            <h1 className="font-display text-[22px] font-bold text-[#18181B] leading-tight">Guías de Ayuda</h1>
          </div>
          <p className="text-[13px] text-[#A8A49D] leading-relaxed pl-11">
            Documentación completa para sacarle el mayor provecho a Nube Gestión. Encontrá respuestas rápidas sobre cada módulo del sistema.
          </p>
        </div>

        {/* Grid */}
        <div className="px-10 py-8">
          <p className="text-[11px] font-mono tracking-[0.12em] uppercase text-[#A8A49D] mb-5">
            {guides.length} guías disponibles
          </p>
          <div className="grid grid-cols-3 gap-4">
            {guides.map((g) => {
              const Icon = g.icon
              return (
                <Link
                  key={g.slug}
                  href={`/guias/${g.slug}`}
                  className="group bg-white border border-[#E5E4E0] rounded-xl p-5 shadow-sm hover:border-[#F2682E] hover:shadow-md transition-all flex flex-col gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 ${g.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <Icon size={18} strokeWidth={2} className={g.iconDark ? 'text-[#18181B]' : 'text-white'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-display text-[14px] font-bold text-[#18181B] leading-snug mb-1">
                        {g.title}
                      </div>
                      <p className="text-[12.5px] text-[#6B6762] leading-relaxed">
                        {g.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-auto pt-1">
                    <div className="flex gap-1.5 flex-wrap">
                      {g.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] font-medium text-[#6B6762] bg-[#F1F0EE] px-2 py-0.5 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <span className="text-[12px] font-semibold text-[#F2682E] group-hover:underline flex-shrink-0">
                      Ver guía →
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
