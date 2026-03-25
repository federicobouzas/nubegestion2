'use client'
import { useEffect, useState, useCallback } from 'react'
import ListPageShell from '@/components/shared/ListPageShell'
import ContactoTable from '@/components/shared/ContactoTable'
import { getClientes, deleteCliente } from '@/lib/clientes'
import type { Cliente } from '@/types/clientes'

export default function ClientesPage() {
  const [rows, setRows] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const load = useCallback(async () => { setLoading(true); try { setRows((await getClientes(search || undefined)) || []) } finally { setLoading(false) } }, [search])
  useEffect(() => { load() }, [load])
  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este cliente?')) return
    await deleteCliente(id); setRows(p => p.filter(r => r.id !== id))
  }
  return (
    <ListPageShell breadcrumb={[{ label: 'Negocio' }, { label: 'Clientes' }]} title="Clientes" count={rows.length} newHref="/clientes/nuevo" newLabel="Nuevo Cliente" search={search} onSearch={setSearch} loading={loading}>
      <ContactoTable rows={rows} basePath="/clientes" emptyMessage="No hay clientes todavía." onDelete={handleDelete} />
    </ListPageShell>
  )
}
