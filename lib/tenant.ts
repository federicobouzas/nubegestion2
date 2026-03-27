import { createClient } from './supabase'

const cache: Record<string, string> = {}

export async function getTenantId(): Promise<string> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')
  
  if (cache[user.id]) return cache[user.id]
  
  const { data } = await supabase
    .from('usuarios')
    .select('tenant_id')
    .eq('id', user.id)
    .single()
  
  if (!data?.tenant_id) throw new Error('Sin tenant')
  cache[user.id] = data.tenant_id
  return cache[user.id]
}

export function clearTenantCache() {
  Object.keys(cache).forEach(k => delete cache[k])
}