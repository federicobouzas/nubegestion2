import { createClient } from './supabase'

export async function signIn(email: string, password: string) {
  const supabase = createClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signUp(email: string, password: string, nombre: string, empresa: string) {
  const supabase = createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { nombre, empresa }
    }
  })
  if (error) throw error
  return data
}

export async function signOut() {
  const supabase = createClient()
  await supabase.auth.signOut()
}

export async function getUser() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getTenantId() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from('usuarios')
    .select('tenant_id')
    .eq('id', user.id)
    .single()
  return data?.tenant_id || null
}
