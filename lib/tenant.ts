import { createClient } from './supabase'

export async function getTenantId(): Promise<string> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')
  
  const { data } = await supabase
    .from('usuarios')
    .select('tenant_id')
    .eq('id', user.id)
    .single()
  
  if (!data?.tenant_id) throw new Error('Sin tenant')
  return data.tenant_id
}