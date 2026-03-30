import { createClient } from './supabase'
import { getTenantId } from '@/lib/tenant'
import type { TicketForm } from '@/types/soporte'

export async function getTickets({ search, ...filters }: Record<string, any> = {}) {
  const supabase = createClient()
  const tenantId = await getTenantId()
  let q = supabase.from('tickets').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false })
  if (filters.estado) q = q.eq('estado', filters.estado)
  if (filters.tipo) q = q.eq('tipo', filters.tipo)
  if (search) q = q.ilike('titulo', `%${search}%`)
  const { data, error } = await q
  if (error) throw error
  return data
}

export async function getTicket(id: string) {
  const supabase = createClient()
  const tenantId = await getTenantId()
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single()
  if (error) throw error
  return data
}

export async function createTicket(form: TicketForm) {
  const supabase = createClient()
  const tenantId = await getTenantId()
  const { data: codigo, error: codigoError } = await supabase
    .rpc('generar_codigo', { p_tenant_id: tenantId, p_tipo: 'TK' })
  if (codigoError) throw codigoError
  const { data, error } = await supabase
    .from('tickets')
    .insert({ ...form, tenant_id: tenantId, codigo })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateTicket(id: string, form: Partial<TicketForm>) {
  const supabase = createClient()
  const tenantId = await getTenantId()
  const { data, error } = await supabase
    .from('tickets')
    .update({ ...form, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteTicket(id: string) {
  const supabase = createClient()
  const tenantId = await getTenantId()
  const { error } = await supabase
    .from('tickets')
    .delete()
    .eq('id', id)
    .eq('tenant_id', tenantId)
  if (error) throw error
}
