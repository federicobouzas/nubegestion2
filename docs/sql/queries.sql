sql-- Borrar todos los tenants y sus datos
SELECT public.delete_tenant(id) FROM public.tenants;

-- Borrar todos los usuarios de auth.users
DELETE FROM auth.users;

----------


SELECT 
  schemaname,
  relname AS table_name,
  n_live_tup AS filas
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY filas DESC;