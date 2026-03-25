'use client'
import { useEffect, useState, useCallback } from 'react'
import ListPageShell from '@/components/shared/ListPageShell'
import ContactoTable from '@/components/shared/ContactoTable'
import { getProveedores, deleteProveedor } from '@/lib/proveedores'
import type { Proveedor } from '@/types/proveedores'

export default function ProveedoresPage() {
  const [rows, setRows] = useState<Proveedor[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const load = useCallback(async () => { setLoading(true); try { setRows((await getProveedores(search || undefined)) || []) } finally { setLoading(false) } }, [search])
  useEffect(() => { load() }, [load])
  async function handleDelete(id: string) { if (!confirm('¿Eliminar este proveedor?')) return; await deleteProveedor(id); setRows(p => p.filter(r => r.id !== id)) }
  return (
    <ListPageShell breadcrumb={[{ label: 'Negocio' }, { label: 'Proveedores' }]} title="Proveedores" count={rows.length} newHref="/proveedores/nuevo" newLabel="Nuevo Proveedor" search={search} onSearch={setSearch} loading={loading}>
      <ContactoTable rows={rows} basePath="/proveedores" emptyMessage="No hay proveedores todavía." onDelete={handleDelete} />
    </ListPageShell>
  )
}
