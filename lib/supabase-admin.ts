import { createClient } from '@supabase/supabase-js'

/**
 * Cliente Supabase con service role key.
 * Solo usar server-side (cron jobs, rutas de API privilegiadas).
 * Nunca exponer al cliente.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Faltan credenciales de Supabase admin (SUPABASE_SERVICE_ROLE_KEY)')
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
