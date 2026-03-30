import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  Rocket, Settings2, Users, Package, FileText, HandCoins,
  Receipt, Landmark, FlaskConical, TrendingUp,
  ChevronLeft, Info as InfoIcon, Lightbulb, AlertTriangle,
} from 'lucide-react'
import Topbar from '@/components/shared/Topbar'
import type { ReactNode } from 'react'

// ---------------------------------------------------------------------------
// Helper components
// ---------------------------------------------------------------------------

function H2({ children }: { children: ReactNode }) {
  return (
    <h2 className="font-display text-[19px] font-bold text-[#18181B] mt-8 mb-3 pb-2 border-b border-[#E5E4E0]">
      {children}
    </h2>
  )
}

function H3({ children }: { children: ReactNode }) {
  return (
    <h3 className="font-display text-[14.5px] font-bold text-[#18181B] mt-5 mb-2">
      {children}
    </h3>
  )
}

function P({ children }: { children: ReactNode }) {
  return (
    <p className="text-[13px] text-[#6B6762] leading-relaxed mb-3">
      {children}
    </p>
  )
}

function Info({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl p-4 mb-4 flex gap-3">
      <InfoIcon size={16} className="text-[#3B82F6] flex-shrink-0 mt-0.5" strokeWidth={2} />
      <div className="flex-1">
        {title && <div className="font-semibold text-[12.5px] text-[#1D4ED8] mb-1">{title}</div>}
        <div className="text-[13px] text-[#1E40AF] leading-relaxed">{children}</div>
      </div>
    </div>
  )
}

function Tip({ children }: { children: ReactNode }) {
  return (
    <div className="bg-[#E8F7EF] border border-[#A7F3D0] rounded-xl p-4 mb-4 flex gap-3">
      <Lightbulb size={16} className="text-[#059669] flex-shrink-0 mt-0.5" strokeWidth={2} />
      <div className="text-[13px] text-[#065F46] leading-relaxed">{children}</div>
    </div>
  )
}

function Warning({ children }: { children: ReactNode }) {
  return (
    <div className="bg-[#FEF8E1] border border-[#FDE68A] rounded-xl p-4 mb-4 flex gap-3">
      <AlertTriangle size={16} className="text-[#D97706] flex-shrink-0 mt-0.5" strokeWidth={2} />
      <div className="text-[13px] text-[#92400E] leading-relaxed">{children}</div>
    </div>
  )
}

function Concept({ label, color, description }: { label: string; color: string; description: string }) {
  return (
    <div className="bg-white border border-[#E5E4E0] rounded-xl p-3.5 flex gap-3 items-start">
      <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full text-white ${color} flex-shrink-0 mt-0.5`}>
        {label}
      </span>
      <p className="text-[12.5px] text-[#6B6762] leading-relaxed">{description}</p>
    </div>
  )
}

function ConceptGrid({ items }: { items: { label: string; color: string; description: string }[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 mb-4">
      {items.map((item) => (
        <Concept key={item.label} {...item} />
      ))}
    </div>
  )
}

function UL({ children }: { children: ReactNode }) {
  return (
    <ul className="list-none mb-4 space-y-1.5">
      {children}
    </ul>
  )
}

function LI({ children }: { children: ReactNode }) {
  return (
    <li className="flex gap-2 items-start text-[13px] text-[#6B6762] leading-relaxed">
      <span className="w-1.5 h-1.5 rounded-full bg-[#F2682E] flex-shrink-0 mt-[6px]" />
      <span>{children}</span>
    </li>
  )
}

function OL({ children }: { children: ReactNode }) {
  return (
    <ol className="mb-4 space-y-2 list-none counter-reset-[ol]">
      {children}
    </ol>
  )
}

function OLI({ n, children }: { n: number; children: ReactNode }) {
  return (
    <li className="flex gap-3 items-start text-[13px] text-[#6B6762] leading-relaxed">
      <span className="w-5 h-5 rounded-full bg-[#F2682E] text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
        {n}
      </span>
      <span>{children}</span>
    </li>
  )
}

function StateBadge({ label, bg, text }: { label: string; bg: string; text: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ${bg} ${text}`}>
      {label}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Guide metadata
// ---------------------------------------------------------------------------

const guides = [
  { slug: 'primeros-pasos',       title: 'Primeros Pasos',          icon: Rocket,       color: 'bg-[#F2682E]' },
  { slug: 'configurar-negocio',   title: 'Configurar tu Negocio',   icon: Settings2,    color: 'bg-[#2B445A]' },
  { slug: 'clientes-proveedores', title: 'Clientes y Proveedores',  icon: Users,        color: 'bg-[#7C3AED]' },
  { slug: 'productos-servicios',  title: 'Productos y Servicios',   icon: Package,      color: 'bg-[#0EA5E9]' },
  { slug: 'facturacion',          title: 'Facturación',             icon: FileText,     color: 'bg-[#FDBC16]', iconDark: true },
  { slug: 'cobros-pagos',         title: 'Cobros y Pagos',          icon: HandCoins,    color: 'bg-[#4EBB7F]' },
  { slug: 'gastos-ingresos',      title: 'Gastos y Otros Ingresos', icon: Receipt,      color: 'bg-[#EF4444]' },
  { slug: 'tesoreria',            title: 'Tesorería',               icon: Landmark,     color: 'bg-[#6366F1]' },
  { slug: 'produccion',           title: 'Producción',              icon: FlaskConical, color: 'bg-[#EC4899]' },
  { slug: 'reportes',             title: 'Reportes y Dashboard',    icon: TrendingUp,   color: 'bg-[#14B8A6]' },
]

// ---------------------------------------------------------------------------
// Guide content
// ---------------------------------------------------------------------------

function ContentPrimerosPasos() {
  return (
    <>
      <P>
        Nube Gestión está construido alrededor de <strong>6 operaciones principales</strong> que cubren el ciclo completo de un negocio: desde la venta o compra hasta el movimiento de dinero en tus cuentas. Entender cómo se relacionan estas operaciones es el primer paso para usar el sistema con confianza.
      </P>

      <H2>Operaciones que generan facturas</H2>
      <P>
        Estas operaciones crean documentos formales que quedan pendientes hasta que se saldan con un cobro o pago.
      </P>
      <ConceptGrid items={[
        { label: 'Ventas', color: 'bg-[#F2682E]', description: 'Generás una factura para un cliente. Aumenta la cuenta corriente del cliente (te deben), y reduce el stock de los productos vendidos.' },
        { label: 'Compras', color: 'bg-[#0EA5E9]', description: 'Registrás una factura de un proveedor. Aumenta la cuenta corriente del proveedor (le debés), e incrementa el stock de los productos comprados.' },
      ]} />

      <H2>Operaciones que saldan facturas</H2>
      <P>
        Estas operaciones cancelan total o parcialmente las facturas pendientes e impactan directamente en las cuentas de tesorería.
      </P>
      <ConceptGrid items={[
        { label: 'Cobros', color: 'bg-[#4EBB7F]', description: 'Recibís el pago de un cliente. Reduce la cuenta corriente del cliente y acredita las cuentas de tesorería seleccionadas.' },
        { label: 'Pagos', color: 'bg-[#6366F1]', description: 'Pagás a un proveedor. Reduce la cuenta corriente del proveedor y debita las cuentas de tesorería seleccionadas.' },
      ]} />

      <H2>Movimientos directos</H2>
      <P>
        Estas operaciones no generan facturas ni cuenta corriente — simplemente mueven dinero de entrada o salida con impacto inmediato en las cuentas de tesorería.
      </P>
      <ConceptGrid items={[
        { label: 'Gastos', color: 'bg-[#EF4444]', description: 'Egreso directo categorizado: sueldos, alquiler, servicios, etc. Debita la cuenta de tesorería elegida.' },
        { label: 'Otros Ingresos', color: 'bg-[#14B8A6]', description: 'Ingreso directo: aportes de socios, préstamos, devoluciones, etc. Acredita la cuenta de tesorería elegida.' },
      ]} />

      <Info title="Stock y servicios">
        El stock de productos se ve afectado por Ventas (resta) y Compras (suma). Los Servicios no tienen stock y se pueden incluir en facturas de venta sin afectar inventario.
      </Info>

      <H2>Flujo de trabajo recomendado</H2>
      <P>
        Seguí este orden al comenzar a usar Nube Gestión para asegurarte de que todo funcione correctamente desde el primer día.
      </P>
      <OL>
        <OLI n={1}><strong>Configuración inicial:</strong> Creá las cuentas de tesorería (efectivo, banco, etc.), las categorías de gastos y las listas de precios que vas a usar.</OLI>
        <OLI n={2}><strong>Cargá tu catálogo:</strong> Agregá clientes y proveedores con sus datos fiscales. Creá productos, servicios e insumos con sus precios por lista.</OLI>
        <OLI n={3}><strong>Empezá a operar:</strong> Registrá ventas y compras, luego cargá los cobros y pagos correspondientes. Usá gastos y otros ingresos para los movimientos directos.</OLI>
        <OLI n={4}><strong>Seguí el dashboard:</strong> Revisá los KPIs, las alertas de stock vencido y los saldos de tesorería para mantener el control en tiempo real.</OLI>
      </OL>

      <Warning>
        Antes de operar, asegurate de tener al menos una cuenta de tesorería cargada. Sin cuentas, no vas a poder registrar cobros, pagos, gastos ni otros ingresos.
      </Warning>

      <H2>Relaciones entre módulos</H2>
      <P>
        Todos los módulos están conectados: una Venta impacta el stock y la cuenta corriente del cliente. Un Cobro cancela esa deuda y mueve el dinero a una cuenta de tesorería. Un Gasto sale de esa misma cuenta. El Dashboard muestra el resultado de todas estas operaciones en tiempo real.
      </P>
      <Tip>
        No necesitás usar todos los módulos desde el primer día. Podés empezar solo con Ventas y Cobros, e ir incorporando Compras, Gastos y Tesorería a medida que te familiarizás con el sistema.
      </Tip>
    </>
  )
}

function ContentConfigurarNegocio() {
  return (
    <>
      <P>
        Antes de registrar tu primera operación, es importante dejar configurados los elementos básicos del sistema. Una buena configuración inicial te va a ahorrar mucho tiempo y va a asegurar que los reportes y saldos sean precisos desde el primer día.
      </P>

      <H2>Cuentas de Tesorería</H2>
      <P>
        Las cuentas de tesorería representan todos los lugares donde receptás o guardás dinero. Podés tener tantas cuentas como necesites, y cada una tiene un tipo que determina cómo se comporta.
      </P>
      <ConceptGrid items={[
        { label: 'Efectivo', color: 'bg-[#4EBB7F]', description: 'Representa el dinero en efectivo físico. Usala para cajas registradoras, cajas chicas o cualquier dinero que manejás en mano.' },
        { label: 'Banco', color: 'bg-[#0EA5E9]', description: 'Cuentas bancarias, cuentas de Mercado Pago, billeteras virtuales o cualquier cuenta digital donde tenés saldo disponible.' },
        { label: 'A pagar', color: 'bg-[#EF4444]', description: 'Cuentas virtuales para egresos diferidos: cheques propios entregados, tarjetas de crédito usadas para pagar. Generan saldo negativo que tenés que reponer.' },
        { label: 'A cobrar', color: 'bg-[#F2682E]', description: 'Cuentas virtuales para ingresos diferidos: cheques de terceros recibidos que todavía no depositaste. Acumulan saldo positivo que luego podés transferir.' },
      ]} />

      <H3>Entendiendo A pagar y A cobrar</H3>
      <P>
        Las cuentas de tipo <strong>A pagar</strong> y <strong>A cobrar</strong> son virtuales — representan compromisos futuros, no dinero disponible hoy. Cuando cobrás con un cheque de terceros, ese cheque va a una cuenta A cobrar. Cuando emitís un cheque propio o pagás con tarjeta de crédito, el monto va a una cuenta A pagar.
      </P>
      <Warning>
        Una cuenta <strong>A pagar</strong> tiene saldo negativo. Esto es normal: significa que hay dinero que "salió" antes de que vos lo depositaras. Para normalizar el saldo, debés hacer una transferencia desde una cuenta con fondos reales (Efectivo o Banco) hacia esa cuenta A pagar cuando llegue el vencimiento.
      </Warning>
      <Tip>
        Cuando depositás un cheque de terceros en el banco, hacé una transferencia desde la cuenta A cobrar hacia tu cuenta Banco. Así el saldo de la cuenta A cobrar baja y el del banco sube, reflejando el movimiento real.
      </Tip>

      <H2>Categorías de Gastos</H2>
      <P>
        El sistema de categorías tiene dos niveles: <strong>Tipos</strong> (la categoría principal) y <strong>Categorías</strong> (subcategorías dentro de cada tipo). Por ejemplo: Tipo "Personal" con categorías "Sueldos", "Cargas sociales", "Honorarios".
      </P>
      <P>
        Esta jerarquía te permite ver los reportes de gastos tanto agrupados por tipo general como desglosados por categoría específica. Antes de empezar a cargar gastos, creá al menos los tipos que vas a necesitar y sus categorías correspondientes.
      </P>
      <UL>
        <LI>Tipos sugeridos: Operativos, Personal, Comercial, Financieros, Impuestos y tasas.</LI>
        <LI>Las categorías sin tipo asignado no van a aparecer correctamente en los reportes.</LI>
        <LI>Podés agregar tipos y categorías en cualquier momento desde el módulo Categorías de Gastos.</LI>
      </UL>

      <H2>Listas de Precios</H2>
      <P>
        Las listas de precios te permiten manejar diferentes precios para distintos segmentos de clientes. Lo más habitual es tener una lista <strong>Minorista</strong> y una <strong>Mayorista</strong>, pero podés crear tantas como necesites.
      </P>
      <P>
        Una vez creadas las listas, podés asignar una lista por defecto a cada cliente. Cuando creás una factura de venta para ese cliente, los precios de los productos se cargan automáticamente desde su lista asignada. Si el producto no tiene precio en esa lista, se usa el precio base.
      </P>
      <Info title="Precios por producto">
        Cada producto puede tener un precio diferente por cada lista. La configuración de precios se hace desde el formulario de edición del producto, en la sección "Precios por lista".
      </Info>
    </>
  )
}

function ContentClientesProveedores() {
  return (
    <>
      <P>
        Clientes y proveedores son los dos tipos de contactos principales del sistema. Aunque funcionan de manera similar, cada uno está orientado a un flujo distinto: los clientes aparecen en las ventas y cobros, y los proveedores en las compras y pagos.
      </P>

      <H2>Datos principales</H2>
      <P>
        Al crear un cliente o proveedor, los datos más importantes son los fiscales y de contacto. Una vez cargados correctamente, podés usarlos en facturas sin necesidad de volver a tipearlos.
      </P>
      <UL>
        <LI><strong>Nombre / Razón social:</strong> El nombre legal o comercial del contacto.</LI>
        <LI><strong>CUIT:</strong> El número de identificación tributaria. Importante para la facturación correcta.</LI>
        <LI><strong>Condición frente al IVA:</strong> Responsable inscripto, monotributista, exento, consumidor final, etc.</LI>
        <LI><strong>Domicilio:</strong> Dirección completa para los documentos.</LI>
        <LI><strong>Datos de contacto:</strong> Teléfono, email y nombre de la persona de contacto.</LI>
      </UL>

      <H2>Lista de Precios</H2>
      <P>
        A cada cliente podés asignarle una lista de precios por defecto. Cuando creás una factura de venta para ese cliente, los productos se agregan automáticamente con el precio de su lista asignada. Esto evita errores y agiliza la carga de facturas.
      </P>
      <P>
        Si no asignás una lista, el sistema usa el precio base del producto. Los proveedores no tienen lista de precios asignada, ya que los precios de compra se cargan manualmente en cada factura.
      </P>

      <H2>Cuenta Corriente</H2>
      <P>
        La cuenta corriente (CC) muestra el saldo pendiente de ese contacto con tu empresa. Es calculada automáticamente en base a todas las facturas y cobros/pagos registrados — no hay ningún campo que necesites actualizar manualmente.
      </P>
      <H3>Cuenta corriente de clientes</H3>
      <P>
        El saldo de CC de un cliente representa cuánto te deben. Cada factura de venta que creás aumenta ese saldo. Cada cobro que registrás lo reduce. Si el saldo es cero, el cliente no te debe nada.
      </P>
      <ConceptGrid items={[
        { label: 'Venta', color: 'bg-[#F2682E]', description: 'Aumenta la CC del cliente. El cliente ahora te debe el importe de la factura.' },
        { label: 'Cobro', color: 'bg-[#4EBB7F]', description: 'Reduce la CC del cliente. Se aplica contra una o más facturas pendientes.' },
      ]} />

      <H3>Cuenta corriente de proveedores</H3>
      <P>
        El saldo de CC de un proveedor representa cuánto les debés. Cada factura de compra que registrás aumenta ese saldo. Cada pago que hacés lo reduce.
      </P>
      <ConceptGrid items={[
        { label: 'Compra', color: 'bg-[#0EA5E9]', description: 'Aumenta la CC del proveedor. Ahora le debés el importe de la factura.' },
        { label: 'Pago', color: 'bg-[#6366F1]', description: 'Reduce la CC del proveedor. Se aplica contra una o más facturas pendientes.' },
      ]} />

      <Tip>
        Mantenés la cuenta corriente siempre actualizada cargando cobros y pagos a medida que se realizan. El dashboard muestra alertas cuando hay facturas vencidas sin cobrar.
      </Tip>
    </>
  )
}

function ContentProductosServicios() {
  return (
    <>
      <P>
        El catálogo de Nube Gestión tiene tres tipos de ítems: Productos, Servicios e Insumos. Cada uno tiene un comportamiento diferente en cuanto a stock y cómo se usa en el sistema.
      </P>

      <H2>Productos</H2>
      <P>
        Los productos son artículos físicos que vendés y comprás. Tienen stock, y ese stock se actualiza automáticamente con cada venta o compra registrada.
      </P>
      <UL>
        <LI><strong>Stock actual:</strong> La cantidad disponible en este momento. Se calcula sumando todas las compras y restando todas las ventas.</LI>
        <LI><strong>Stock mínimo:</strong> El umbral mínimo aceptable. Cuando el stock actual cae por debajo de este valor, el dashboard muestra una alerta.</LI>
        <LI><strong>Precio por lista:</strong> Cada producto puede tener un precio diferente en cada lista de precios activa.</LI>
      </UL>
      <Warning>
        El stock se actualiza automáticamente con las facturas. No lo modifiques manualmente salvo en casos de ajuste de inventario confirmado, ya que puede generar inconsistencias con los movimientos registrados.
      </Warning>

      <H2>Servicios</H2>
      <P>
        Los servicios son prestaciones intangibles que no tienen stock. Podés incluirlos en facturas de venta sin que afecten ningún inventario. Son ideales para honorarios profesionales, trabajos de instalación, asesorías, transporte, etc.
      </P>
      <P>
        Al igual que los productos, los servicios pueden tener un precio diferente en cada lista de precios. No aparecen en la sección de Insumos ni en las órdenes de fabricación.
      </P>

      <H2>Insumos</H2>
      <P>
        Los insumos son materias primas o materiales que se usan en el proceso de producción. Tienen stock propio, separado del stock de productos terminados. Su stock sube cuando los comprás (a través de facturas de compra) y baja cuando los consumís en una orden de fabricación.
      </P>
      <Info title="Separación de catálogos">
        Mantener insumos separados de los productos de venta te permite controlar con precisión tu inventario productivo. Un producto terminado tiene su propio stock; los insumos que se usaron para fabricarlo tienen el suyo.
      </Info>

      <H2>Listas de precios en productos</H2>
      <P>
        Desde el formulario de edición de cualquier producto o servicio, podés configurar un precio específico para cada lista de precios activa en el sistema. Si un cliente tiene asignada la lista Mayorista y el producto tiene precio en esa lista, la factura se carga con ese precio automáticamente.
      </P>
      <P>
        Si el producto no tiene precio definido para la lista del cliente, se usa el precio base del producto. Es recomendable mantener siempre actualizado al menos el precio base para evitar facturas con precio cero.
      </P>
      <Tip>
        Podés ver el estado del stock de todos los productos desde la sección Productos. Las filas con stock por debajo del mínimo se marcan visualmente para que las identifiques rápido.
      </Tip>
    </>
  )
}

function ContentFacturacion() {
  return (
    <>
      <P>
        La facturación es el corazón operativo de Nube Gestión. Cada factura — ya sea de venta o de compra — genera un registro formal que afecta el stock, la cuenta corriente del contacto y queda pendiente hasta que se salda con un cobro o pago.
      </P>

      <H2>Facturas de Venta</H2>
      <P>
        Creás una factura de venta cuando le vendés algo a un cliente. Seleccionás el cliente, la fecha de emisión y vencimiento, y agregás los ítems (productos o servicios) con sus cantidades y precios.
      </P>
      <UL>
        <LI>El stock de los productos vendidos <strong>se reduce automáticamente</strong> al registrar la factura.</LI>
        <LI>La cuenta corriente del cliente aumenta por el monto total de la factura.</LI>
        <LI>Los precios se cargan automáticamente desde la lista de precios asignada al cliente.</LI>
        <LI>Podés incluir servicios en la misma factura que productos — los servicios no afectan stock.</LI>
      </UL>
      <H3>Estados de una factura de venta</H3>
      <div className="flex flex-wrap gap-2 mb-4">
        <StateBadge label="Pendiente" bg="bg-[#FEF8E1]" text="text-[#92400E]" />
        <StateBadge label="Cobrada" bg="bg-[#E8F7EF]" text="text-[#1A5C38]" />
        <StateBadge label="Vencida" bg="bg-[#FEE8E8]" text="text-[#7F1D1D]" />
        <StateBadge label="Anulada" bg="bg-[#F1F0EE]" text="text-[#6B6762]" />
      </div>
      <P>
        Una factura empieza como <em>Pendiente</em>. Pasa a <em>Cobrada</em> cuando el total de cobros aplicados cubre el monto completo. Pasa a <em>Vencida</em> automáticamente si la fecha de vencimiento se supera sin cobrarse. Se puede <em>Anular</em> manualmente, lo que revierte el stock y la cuenta corriente.
      </P>

      <H2>Facturas de Compra</H2>
      <P>
        Registrás una factura de compra cuando recibís mercadería o servicios de un proveedor. Seleccionás el proveedor, las fechas y los ítems comprados. A diferencia de las ventas, en las compras generalmente solo se pueden agregar productos (con stock).
      </P>
      <UL>
        <LI>El stock de los productos comprados <strong>aumenta automáticamente</strong> al registrar la factura.</LI>
        <LI>La cuenta corriente del proveedor aumenta por el monto total (le debés esa plata).</LI>
        <LI>La factura queda pendiente hasta que la saldás con un Pago.</LI>
      </UL>
      <H3>Estados de una factura de compra</H3>
      <P>
        Los estados son idénticos a los de venta: <em>Pendiente</em>, <em>Pagada</em>, <em>Vencida</em> y <em>Anulada</em>. La lógica es la misma, pero inversa: se salda con Pagos en lugar de Cobros.
      </P>

      <Info>
        Al anular una factura (tanto de venta como de compra), el stock y la cuenta corriente se revierten automáticamente. Si el stock ya se consumió o si hay cobros/pagos aplicados, el sistema te avisará antes de proceder.
      </Info>

      <H2>Buenas prácticas</H2>
      <UL>
        <LI>Cargá siempre la fecha de vencimiento real para que el sistema pueda marcar automáticamente las facturas vencidas y mostrarte las alertas en el dashboard.</LI>
        <LI>Verificá el stock disponible antes de facturar grandes cantidades. El sistema te permitirá registrar la venta incluso con stock insuficiente, pero quedará en negativo.</LI>
        <LI>Para facturas con múltiples métodos de cobro o pago, no necesitás dividirlas: un solo cobro puede aplicar montos parciales desde distintas cuentas.</LI>
      </UL>
      <Tip>
        Si necesitás hacer una nota de crédito o devolución parcial, la forma correcta es anular la factura original y crear una nueva con los ítems correctos.
      </Tip>
    </>
  )
}

function ContentCobrosPagos() {
  return (
    <>
      <P>
        Los Cobros y Pagos son las operaciones que cierran el ciclo financiero iniciado por las facturas. Cuando registrás un cobro o pago, dos cosas ocurren al mismo tiempo: se reduce la cuenta corriente del contacto y se mueve el dinero en las cuentas de tesorería.
      </P>

      <H2>Cobros</H2>
      <P>
        Un cobro representa el ingreso de dinero de parte de un cliente, ya sea en efectivo, transferencia, cheque, o cualquier otro medio. Al crearlo, seleccionás el cliente y elegís cuáles de sus facturas pendientes querés saldar total o parcialmente.
      </P>
      <UL>
        <LI>Podés aplicar el cobro a <strong>una o varias facturas</strong> en el mismo recibo.</LI>
        <LI>Podés distribuir el monto entre <strong>múltiples cuentas de tesorería</strong> (ej: parte en efectivo, parte en banco).</LI>
        <LI>La cuenta corriente del cliente se reduce por el monto total cobrado.</LI>
        <LI>Las cuentas de tesorería seleccionadas se acreditan por los montos correspondientes.</LI>
      </UL>
      <Info title="Cobros parciales">
        Si el monto cobrado no cubre el total de la factura, la factura queda parcialmente cobrada y sigue apareciendo como pendiente con el saldo restante. Podés completarla con otro cobro posterior.
      </Info>

      <H2>Pagos</H2>
      <P>
        Un pago representa el egreso de dinero hacia un proveedor para saldar una o más facturas de compra. Funciona exactamente igual que un cobro, pero en sentido inverso.
      </P>
      <UL>
        <LI>Seleccionás el proveedor y las facturas de compra que querés saldar.</LI>
        <LI>Elegís desde qué cuentas de tesorería va a salir el dinero.</LI>
        <LI>La cuenta corriente del proveedor se reduce por el monto total pagado.</LI>
        <LI>Las cuentas de tesorería seleccionadas se debitan por los montos correspondientes.</LI>
      </UL>

      <H2>Múltiples métodos de pago</H2>
      <P>
        Una de las funcionalidades más útiles de Cobros y Pagos es la posibilidad de usar <strong>múltiples cuentas en un mismo recibo</strong>. Esto refleja la realidad de muchos negocios, donde los clientes pagan con combinaciones de efectivo, transferencia, cheques, etc.
      </P>
      <P>
        Por ejemplo: un cliente paga $50.000 en efectivo + $30.000 por transferencia. Creás un solo cobro por $80.000 y distribuís: $50.000 a la cuenta Efectivo y $30.000 a la cuenta Banco. Las dos cuentas se acreditan de forma independiente.
      </P>
      <Tip>
        Un cobro puede aplicarse a varias facturas en un solo recibo. No necesitás hacer uno por factura. Esto simplifica la operatoria cuando un cliente paga varias facturas juntas en un mismo movimiento.
      </Tip>
      <Warning>
        Si usás una cuenta de tipo A cobrar (ej: "Cheques de terceros"), recordá que el saldo de esa cuenta no es dinero disponible todavía. Cuando deposités el cheque, hacé una transferencia desde A cobrar hacia tu cuenta Banco.
      </Warning>
    </>
  )
}

function ContentGastosIngresos() {
  return (
    <>
      <P>
        Gastos y Otros Ingresos son operaciones de movimiento directo — no generan facturas ni cuentas corrientes. Son la forma de registrar todos los flujos de dinero que no están ligados a una transacción comercial con un cliente o proveedor.
      </P>

      <H2>Gastos</H2>
      <P>
        Un gasto representa un egreso operativo del negocio que no está asociado a una compra de mercadería. Ejemplos típicos: sueldos, alquiler, servicios (luz, gas, internet), mantenimiento, publicidad, impuestos, etc.
      </P>
      <UL>
        <LI>Seleccionás el <strong>tipo y categoría</strong> del gasto (configurados previamente en Categorías de Gastos).</LI>
        <LI>Elegís la cuenta de tesorería desde la que sale el dinero.</LI>
        <LI>El monto se debita inmediatamente de la cuenta seleccionada.</LI>
        <LI>Podés agregar una descripción libre para identificar el gasto.</LI>
      </UL>
      <Warning>
        Los gastos no generan cuenta corriente ni facturas. Si le debés dinero a alguien por un servicio recibido y querés rastrear esa deuda, usá Compras + Pagos en lugar de un Gasto directo.
      </Warning>

      <H2>Otros Ingresos</H2>
      <P>
        Los Otros Ingresos son entradas de dinero que no provienen de la actividad comercial directa. Son ideales para registrar aportes de socios, préstamos bancarios, devoluciones de impuestos, subsidios u otros ingresos extraordinarios.
      </P>
      <P>
        Al registrar un Otro Ingreso, seleccionás el tipo de ingreso y la cuenta de tesorería que se va a acreditar. El dinero queda disponible inmediatamente en esa cuenta para ser usado en otras operaciones.
      </P>
      <ConceptGrid items={[
        { label: 'Aporte socios', color: 'bg-[#7C3AED]', description: 'Los socios ingresan capital propio al negocio. Acredita la cuenta de tesorería seleccionada.' },
        { label: 'Préstamo', color: 'bg-[#0EA5E9]', description: 'Ingreso de un préstamo bancario o de terceros. Recordá registrar también los pagos de cuotas como Gastos.' },
        { label: 'Devolución', color: 'bg-[#4EBB7F]', description: 'Devolución de un pago en exceso, reintegro impositivo u otro recupero de dinero.' },
        { label: 'Otros', color: 'bg-[#A8A49D]', description: 'Cualquier ingreso que no encaja en las categorías anteriores.' },
      ]} />

      <H2>Categorías de gastos en los reportes</H2>
      <P>
        El principal beneficio de categorizar los gastos es poder analizarlos en los reportes. El sistema puede mostrar cuánto gastaste por tipo, por categoría y por período, lo que te permite identificar dónde se va el dinero y tomar mejores decisiones.
      </P>
      <Tip>
        Cuanto más consistente seas con las categorías al cargar gastos, más útiles van a ser los reportes. Definí tus categorías de acuerdo a cómo querés ver el resumen de egresos: por área del negocio, por tipo de costo, etc.
      </Tip>
    </>
  )
}

function ContentTesoreria() {
  return (
    <>
      <P>
        La Tesorería es la sección donde podés ver y gestionar todo el dinero del negocio. Muestra los saldos actuales de cada cuenta, el historial completo de movimientos y te permite transferir fondos entre cuentas.
      </P>

      <H2>Cuentas</H2>
      <P>
        Desde Tesorería → Cuentas podés crear, editar y administrar todas tus cuentas de dinero. Cada cuenta tiene un tipo que determina su comportamiento, un nombre descriptivo y un saldo calculado en tiempo real.
      </P>
      <ConceptGrid items={[
        { label: 'Efectivo', color: 'bg-[#4EBB7F]', description: 'Dinero físico. Saldo positivo = hay billetes disponibles.' },
        { label: 'Banco', color: 'bg-[#0EA5E9]', description: 'Cuentas bancarias y digitales. El saldo refleja lo que tenés disponible para usar.' },
        { label: 'A pagar', color: 'bg-[#EF4444]', description: 'Compromisos de pago futuros. Saldo negativo = debés ese dinero.' },
        { label: 'A cobrar', color: 'bg-[#F2682E]', description: 'Cobros diferidos. Saldo positivo = hay dinero esperando ser depositado.' },
      ]} />

      <Info>
        Los saldos son siempre calculados en tiempo real sumando todos los movimientos de esa cuenta. No hay un campo "saldo" editable — el saldo es consecuencia directa de las operaciones registradas.
      </Info>

      <H2>Saldos</H2>
      <P>
        La vista de Saldos muestra un resumen consolidado de todas las cuentas activas con sus saldos actuales. Es la forma más rápida de ver el estado general de tu tesorería de un vistazo: cuánto tenés en efectivo, cuánto en el banco, cuánto debés y cuánto te deben cobrar.
      </P>
      <P>
        El saldo total de tesorería se calcula sumando Efectivo y Banco (los activos reales), lo que te da la <em>liquidez disponible</em> del negocio en este momento.
      </P>

      <H2>Movimientos</H2>
      <P>
        Los Movimientos te permiten transferir fondos entre dos cuentas de tu sistema. Esto es necesario cuando el dinero cambia de "lugar" sin que haya una operación comercial de por medio.
      </P>
      <UL>
        <LI>Depositás efectivo en el banco: transferencia de Efectivo → Banco.</LI>
        <LI>Depositás un cheque de terceros: transferencia de A cobrar → Banco.</LI>
        <LI>Extraés efectivo del banco: transferencia de Banco → Efectivo.</LI>
        <LI>Pagás un cheque propio al vencimiento: transferencia de Banco → A pagar.</LI>
      </UL>
      <Tip>
        Los movimientos entre cuentas no generan ganancia ni pérdida — son traslados internos. Usá esta función para mantener los saldos de cada cuenta alineados con la realidad.
      </Tip>

      <H2>Historial</H2>
      <P>
        El Historial muestra todos los movimientos de todas las cuentas en orden cronológico inverso. Podés filtrar por cuenta, por tipo de operación y por rango de fechas para auditar cualquier movimiento específico.
      </P>
      <P>
        Cada entrada del historial muestra la fecha, el tipo de operación (cobro, pago, gasto, ingreso, transferencia), el monto, y si fue un crédito o un débito para esa cuenta. Es la herramienta principal para conciliar saldos y detectar inconsistencias.
      </P>
      <Warning>
        Para desactivar una cuenta, su saldo debe ser $0. Si la cuenta tiene saldo, primero transferí ese monto a otra cuenta y luego procedé con la desactivación.
      </Warning>
    </>
  )
}

function ContentProduccion() {
  return (
    <>
      <P>
        El módulo de Producción está diseñado para negocios que fabrican sus propios productos a partir de materias primas. Permite registrar el proceso completo: desde la compra de insumos hasta la obtención del producto terminado listo para la venta.
      </P>

      <H2>Insumos</H2>
      <P>
        Los insumos son las materias primas o materiales que se consumen en el proceso de fabricación. Funcionan similar a los productos, pero tienen su propio stock separado y no se incluyen en las facturas de venta.
      </P>
      <UL>
        <LI>Los insumos tienen stock actual y stock mínimo.</LI>
        <LI>El stock de insumos <strong>sube cuando comprás</strong> a través de una Factura de Compra.</LI>
        <LI>El stock de insumos <strong>baja cuando fabricás</strong> a través de una Orden de Fabricación completada.</LI>
        <LI>Se gestionan desde el módulo Insumos en la sección Producción del menú lateral.</LI>
      </UL>
      <Info>
        Si un insumo se puede vender directamente además de usarse en producción, lo correcto es mantenerlo como insumo y registrar la venta como una Factura de Venta con ese ítem, siempre que el tipo de ítem lo permita.
      </Info>

      <H2>Órdenes de Fabricación</H2>
      <P>
        Una Orden de Fabricación (OF) es el documento que registra la transformación de insumos en producto terminado. Al crearla, especificás qué producto querés fabricar, en qué cantidad, y cuáles son los insumos que se van a consumir con sus respectivas cantidades.
      </P>
      <UL>
        <LI>Seleccionás el <strong>producto terminado</strong> que vas a producir y la cantidad.</LI>
        <LI>Agregás los insumos a consumir con las cantidades necesarias por unidad producida.</LI>
        <LI>Al <strong>completar</strong> la orden: el stock de cada insumo usado disminuye, y el stock del producto terminado aumenta.</LI>
        <LI>Si cancelás una orden, el stock no se ve afectado.</LI>
      </UL>
      <Warning>
        Verificá que tenés suficiente stock de insumos antes de completar una orden de fabricación. El sistema consumirá los insumos registrados en la orden sin verificar disponibilidad, lo que podría dejar stocks en negativo.
      </Warning>

      <H2>Flujo completo de producción</H2>
      <P>
        El ciclo productivo completo en Nube Gestión sigue estos pasos:
      </P>
      <OL>
        <OLI n={1}><strong>Comprar insumos:</strong> Registrá una Factura de Compra con los insumos adquiridos. El stock de insumos sube.</OLI>
        <OLI n={2}><strong>Fabricar:</strong> Creá una Orden de Fabricación indicando el producto a obtener y los insumos a consumir. Al completarla, los insumos bajan y el producto terminado sube.</OLI>
        <OLI n={3}><strong>Vender:</strong> Registrá una Factura de Venta con el producto terminado. El stock del producto terminado baja y la cuenta corriente del cliente sube.</OLI>
        <OLI n={4}><strong>Cobrar:</strong> Registrá el Cobro para saldar la factura. La cuenta corriente baja y el dinero entra a tesorería.</OLI>
      </OL>
      <Tip>
        Usá los insumos separados de los productos de venta para tener control preciso del proceso productivo. Si mezclás insumos con productos de venta, perdés visibilidad sobre qué consumiste en fabricación y qué vendiste directamente.
      </Tip>
      <H3>Control de stock en producción</H3>
      <P>
        El dashboard muestra alertas cuando el stock de insumos cae por debajo del mínimo configurado, igual que con los productos. Configurá stocks mínimos adecuados para recibir alertas con anticipación y evitar que se detenga la producción por falta de materiales.
      </P>
    </>
  )
}

function ContentReportes() {
  return (
    <>
      <P>
        El Dashboard y los Reportes te dan una visión consolidada del estado del negocio en tiempo real. No requieren configuración — se actualizan automáticamente cada vez que cargás datos en el sistema.
      </P>

      <H2>Dashboard</H2>
      <P>
        El Dashboard es la pantalla principal del sistema. Muestra los indicadores clave del mes en curso y te permite detectar situaciones que requieren atención sin necesidad de revisar cada módulo por separado.
      </P>
      <H3>KPIs del mes</H3>
      <UL>
        <LI><strong>Facturado:</strong> Total de ventas emitidas en el mes, con comparación vs el mes anterior.</LI>
        <LI><strong>Cobrado:</strong> Total de cobros recibidos en el mes.</LI>
        <LI><strong>Compras:</strong> Total de facturas de compra registradas en el mes.</LI>
        <LI><strong>Pagado:</strong> Total de pagos realizados a proveedores en el mes.</LI>
      </UL>
      <H3>Gráfico de tesorería</H3>
      <P>
        El gráfico de los últimos 7 días muestra la evolución del saldo total de tesorería (Efectivo + Banco). Permite identificar tendencias de corto plazo y días con movimientos significativos.
      </P>
      <H3>Cuentas corrientes</H3>
      <P>
        El dashboard muestra el total pendiente de Clientes (cuánto te deben en total) y de Proveedores (cuánto debés en total), con un desglose de los vencimientos más próximos.
      </P>

      <H2>Alertas</H2>
      <P>
        El sistema genera automáticamente tres tipos de alertas que aparecen destacadas en el dashboard y en las secciones correspondientes:
      </P>
      <ConceptGrid items={[
        { label: 'Ventas vencidas', color: 'bg-[#EF4444]', description: 'Facturas de venta cuya fecha de vencimiento ya pasó y que no están totalmente cobradas. Hacé clic para ir directo a esas facturas.' },
        { label: 'Compras vencidas', color: 'bg-[#F2682E]', description: 'Facturas de compra cuya fecha de vencimiento ya pasó y que no están totalmente pagadas. Evitá moras con proveedores.' },
        { label: 'Stock bajo', color: 'bg-[#FDBC16]', description: 'Productos e insumos con stock actual por debajo del stock mínimo configurado. Hacé clic para ver cuáles son.' },
      ]} />
      <P>
        Todas las alertas son <strong>clicables</strong>: al hacer clic te llevan directamente a la sección relevante del sistema, filtrada para mostrar solo los ítems que requieren atención.
      </P>

      <H2>Últimas operaciones</H2>
      <P>
        El dashboard muestra las últimas 5 ventas registradas con su estado actual, para tener visibilidad inmediata de la actividad reciente sin necesidad de ir al módulo de Ventas.
      </P>

      <H2>Reportes</H2>
      <P>
        La sección de Reportes está en desarrollo continuo. Los reportes planeados incluyen:
      </P>
      <UL>
        <LI>Reporte de ventas por período, cliente y producto.</LI>
        <LI>Reporte de gastos por categoría y tipo.</LI>
        <LI>Evolución de cuentas corrientes a lo largo del tiempo.</LI>
        <LI>Rentabilidad por producto (precio de venta vs costo de insumos).</LI>
      </UL>
      <Info title="Próximamente">
        Los reportes detallados estarán disponibles en una próxima actualización. Mientras tanto, podés exportar los listados de cada módulo para analizarlos externamente.
      </Info>
      <Tip>
        El dashboard se actualiza en tiempo real cada vez que cargás datos. No necesitás refrescarlo manualmente — los KPIs, alertas y gráficos reflejan siempre el estado más reciente del negocio.
      </Tip>
    </>
  )
}

const guideContent: Record<string, () => React.ReactElement> = {
  'primeros-pasos':       ContentPrimerosPasos,
  'configurar-negocio':   ContentConfigurarNegocio,
  'clientes-proveedores': ContentClientesProveedores,
  'productos-servicios':  ContentProductosServicios,
  'facturacion':          ContentFacturacion,
  'cobros-pagos':         ContentCobrosPagos,
  'gastos-ingresos':      ContentGastosIngresos,
  'tesoreria':            ContentTesoreria,
  'produccion':           ContentProduccion,
  'reportes':             ContentReportes,
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function GuiaDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const guide = guides.find((g) => g.slug === slug)
  if (!guide) notFound()

  const currentIndex = guides.indexOf(guide)
  const prevGuide = currentIndex > 0 ? guides[currentIndex - 1] : null
  const nextGuide = currentIndex < guides.length - 1 ? guides[currentIndex + 1] : null

  const ContentComponent = guideContent[slug]
  const GuideLargeIcon = guide.icon

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar
        breadcrumb={[
          { label: 'Sistema' },
          { label: 'Guías de Ayuda', href: '/guias' },
          { label: guide.title },
        ]}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar */}
        <div className="w-[220px] flex-shrink-0 bg-white border-r border-[#E5E4E0] overflow-y-auto py-4">
          <Link
            href="/guias"
            className="flex items-center gap-1.5 text-[12px] text-[#A8A49D] hover:text-[#18181B] transition-colors px-4 pb-4 border-b border-[#E5E4E0] mb-2"
          >
            <ChevronLeft size={13} strokeWidth={2} />
            Todas las guías
          </Link>

          {guides.map((g) => {
            const Icon = g.icon
            const isActive = g.slug === slug
            return (
              <Link
                key={g.slug}
                href={`/guias/${g.slug}`}
                className={`flex items-center gap-2.5 mx-2 px-3 py-2 rounded-[8px] transition-colors ${
                  isActive
                    ? 'bg-[#FEF0EA] text-[#F2682E]'
                    : 'text-[#6B6762] hover:bg-[#F9F9F8]'
                }`}
              >
                <Icon
                  size={13}
                  strokeWidth={2}
                  className={isActive ? 'text-[#F2682E]' : 'text-[#A8A49D]'}
                />
                <span className={`text-[12px] leading-snug ${isActive ? 'font-semibold text-[#F2682E]' : ''}`}>
                  {g.title}
                </span>
              </Link>
            )
          })}
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-10 py-8 max-w-[760px]">
            {/* Guide header */}
            <div className="flex items-start gap-4 mb-6 pb-6 border-b border-[#E5E4E0]">
              <div
                className={`w-12 h-12 ${guide.color} rounded-2xl flex items-center justify-center flex-shrink-0`}
              >
                <GuideLargeIcon
                  size={22}
                  strokeWidth={2}
                  className={(guide as { iconDark?: boolean }).iconDark ? 'text-[#18181B]' : 'text-white'}
                />
              </div>
              <div>
                <h1 className="font-display text-[24px] font-bold text-[#18181B] leading-tight mb-1">
                  {guide.title}
                </h1>
                <p className="text-[13.5px] text-[#6B6762] leading-relaxed">
                  {guides.find((g) => g.slug === slug)
                    ? {
                        'primeros-pasos': 'Entendé las operaciones principales y cómo se relacionan entre sí.',
                        'configurar-negocio': 'Configurá las cuentas, categorías de gastos y listas de precios antes de empezar.',
                        'clientes-proveedores': 'Gestioná tu nómina de clientes y proveedores con todos sus datos.',
                        'productos-servicios': 'Administrá tu catálogo de productos con stock, precios e insumos para producción.',
                        'facturacion': 'Creá facturas de venta para clientes y registrá facturas de compra de proveedores.',
                        'cobros-pagos': 'Saldar facturas con recibos que impactan directamente en las cuentas de tesorería.',
                        'gastos-ingresos': 'Registrá los gastos operativos y otros ingresos para mantener el flujo de caja actualizado.',
                        'tesoreria': 'Controlá los saldos, movimientos y el historial de todas tus cuentas de dinero.',
                        'produccion': 'Gestioná órdenes de fabricación que transforman insumos en productos terminados.',
                        'reportes': 'Visualizá KPIs clave, alertas de stock y cuentas corrientes en tiempo real.',
                      }[slug]
                    : ''}
                </p>
              </div>
            </div>

            {/* Guide content */}
            <ContentComponent />

            {/* Prev / Next navigation */}
            <div className="mt-10 pt-6 border-t border-[#E5E4E0] flex gap-3">
              {prevGuide ? (
                <Link
                  href={`/guias/${prevGuide.slug}`}
                  className="flex-1 flex items-center gap-3 bg-white border border-[#E5E4E0] rounded-xl p-4 hover:border-[#F2682E] hover:shadow-sm transition-all group"
                >
                  <ChevronLeft size={16} className="text-[#A8A49D] group-hover:text-[#F2682E] transition-colors" strokeWidth={2} />
                  <div>
                    <div className="text-[10px] font-mono tracking-[0.1em] uppercase text-[#A8A49D] mb-0.5">Anterior</div>
                    <div className="text-[13px] font-semibold text-[#18181B]">{prevGuide.title}</div>
                  </div>
                </Link>
              ) : (
                <div className="flex-1" />
              )}

              {nextGuide ? (
                <Link
                  href={`/guias/${nextGuide.slug}`}
                  className="flex-1 flex items-center justify-end gap-3 bg-white border border-[#E5E4E0] rounded-xl p-4 hover:border-[#F2682E] hover:shadow-sm transition-all group text-right"
                >
                  <div>
                    <div className="text-[10px] font-mono tracking-[0.1em] uppercase text-[#A8A49D] mb-0.5">Siguiente</div>
                    <div className="text-[13px] font-semibold text-[#18181B]">{nextGuide.title}</div>
                  </div>
                  <ChevronLeft size={16} className="text-[#A8A49D] group-hover:text-[#F2682E] transition-colors rotate-180" strokeWidth={2} />
                </Link>
              ) : (
                <div className="flex-1" />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
