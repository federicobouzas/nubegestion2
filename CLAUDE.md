# CLAUDE.md — Nubegestion

## Stack

- **Framework**: Next.js App Router (React + TypeScript)
- **Base de datos**: Supabase (PostgreSQL)
- **UI**: Shadcn/ui + Tailwind CSS
- **Auth**: Supabase Auth

## Multitenancy

Toda la data está segmentada por `tenant_id`. No hay RLS — el filtro se hace siempre desde el código.

```ts
import { getTenantId } from '@/lib/tenant'

const tenantId = await getTenantId()
// usar .eq('tenant_id', tenantId) en todas las queries
```

- **Supabase user de desarrollo**: `federicobouzas@gmail.com`
- **Tenant de prueba**: `a1b2c3d4-0000-0000-0000-000000000001`

## Patrón CRUD (seguir el modelo de gastos)

### Estructura de archivos

```
app/(dashboard)/<entidad>/
  page.tsx              # Listado con usePaginatedList
  nuevo/page.tsx        # Formulario de creación
  [id]/page.tsx         # Vista de detalle
  [id]/editar/page.tsx  # Formulario de edición (si aplica)

components/<entidad>/
  <Entidad>Form.tsx     # Formulario como componente separado

lib/<entidad>.ts        # Funciones CRUD (getX, createX, updateX, deleteX)

types/<entidad>.ts      # Interfaces TypeScript
```

### Listado (page.tsx)

Usar `usePaginatedList` de `@/hooks/usePaginatedList`:

```tsx
'use client'
import { usePaginatedList } from '@/hooks/usePaginatedList'
import Topbar from '@/components/shared/Topbar'
import ListHeader from '@/components/shared/ListHeader'

export default function EntidadPage() {
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')

  const { data, total, loading, page, setPage, pageSize, setPageSize, totalPages } = usePaginatedList({
    table: 'entidades',
    select: '*',
    orderBy: 'created_at',
    orderAsc: false,
    search: { column: 'nombre', value: search },
  })

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar breadcrumb={[{ label: 'Sección' }, { label: 'Entidad' }]} actions={...} />
      <ListHeader ... />
      <div className="flex-1 overflow-y-auto p-6">
        {/* tabla */}
      </div>
    </div>
  )
}
```

### Formulario (components/<entidad>/<Entidad>Form.tsx)

```tsx
interface Props {
  initialData?: Partial<EntidadForm>
  onSubmit: (data: EntidadForm) => Promise<void>
  submitLabel?: string
}
```

Usar `FieldWrapper`, `inputCls`, `inputSmCls` de `@/components/shared/FieldWrapper`.
Manejar errores con `FormErrorBanner` y `FormErrorModal`.

### Funciones lib (lib/<entidad>.ts)

```ts
import { createClient } from './supabase'
import { getTenantId } from '@/lib/tenant'

export async function getEntidades() { ... }
export async function getEntidad(id: string) { ... }
export async function createEntidad(form: EntidadForm) { ... }
export async function updateEntidad(id: string, form: EntidadForm) { ... }
export async function deleteEntidad(id: string) { ... }
```

Siempre filtrar por `tenant_id` en cada función. Al insertar, incluir `tenant_id: tenantId`.

### Tipos (types/<entidad>.ts)

```ts
export interface Entidad {
  id: string
  tenant_id: string
  // ...campos
  created_at: string
}

export interface EntidadForm {
  // solo campos editables, sin id/tenant_id/created_at
}
```

## Base de datos

- Las tablas usan `id uuid DEFAULT uuid_generate_v4() PRIMARY KEY`
- No usar RLS — el filtro siempre va en el código con `.eq('tenant_id', tenantId)`
- Códigos autogenerados: RPC `generar_codigo(p_tenant_id, p_tipo)` (ej: `'GA'` para gastos)
- Totales calculados via RPCs (ej: `get_total_gasto`, `get_saldo_cuenta`)

## Design System

### Colores principales

| Token | Valor | Uso |
|-------|-------|-----|
| Naranja principal | `#F2682E` | CTAs, botones primarios, hover rows |
| Naranja hover | `#C94E18` | Hover de botones primarios |
| Azul oscuro | `#2B445A` | Acentos secundarios, hover de iconos |
| Borde | `#E5E4E0` | Borders de tablas, cards, inputs |
| Fondo tabla header | `#F9F9F8` | `<thead>` de tablas |
| Fondo hover row | `#FEF0EA` | `hover:bg-[#FEF0EA]` en filas |
| Texto principal | `#18181B` | Valores importantes (montos) |
| Texto secundario | `#6B6762` | Texto de celdas |
| Texto muted | `#A8A49D` | Headers de columnas, placeholders |
| Verde estado OK | bg `#E8F7EF` text `#1A5C38` dot `#4EBB7F` | Badge "activo/pagado" |
| Rojo estado error | bg `#FEE8E8` text `#7F1D1D` | Badge "anulado/error" |

### Componentes compartidos clave

- `Topbar` — barra superior con breadcrumb y acciones
- `ListHeader` — búsqueda + paginación sobre las tablas
- `FieldWrapper` + `inputCls` / `inputSmCls` — inputs de formularios
- `FormErrorBanner` — banner de error inline en formularios
- `FormErrorModal` — modal de error para errores de submit

### Tipografía en tablas

- Headers de columna: `font-mono text-[9.5px] tracking-[0.12em] uppercase text-[#A8A49D]`
- Códigos / fechas: `font-mono text-[11px] text-[#6B6762]`
- Texto normal: `text-[12px] text-[#6B6762]`
- Montos: `font-mono text-[12px] font-bold text-[#18181B]`

### Botón primario

```tsx
<Link href="/entidad/nuevo" className="flex items-center gap-1.5 text-[12.5px] font-semibold px-3.5 py-2 rounded-[9px] bg-[#F2682E] text-white shadow-[0_3px_12px_rgba(242,104,46,0.30)] hover:bg-[#C94E18] transition-colors">
  <Plus size={13} strokeWidth={2.2} /> Nueva Entidad
</Link>
```

### Botón de acción en fila (icono)

```tsx
<button className="w-7 h-7 rounded-[6px] border border-[#E5E4E0] bg-white flex items-center justify-center text-[#6B6762] hover:border-[#2B445A] hover:text-[#2B445A] transition-colors">
  <Eye size={13} strokeWidth={2} />
</button>
```

Envolver en `<div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">` y agregar `group` al `<tr>`.

## Formateo de montos

```ts
import { formatMonto } from '@/lib/gastos'
// Devuelve: "$1.234,56" con formato es-AR ARS
```
