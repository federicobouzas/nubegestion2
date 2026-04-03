CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id uuid;
  v_nombre    text;
  v_empresa   text;
BEGIN
  v_nombre  := COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'nombre'), ''), split_part(NEW.email, '@', 1));
  v_empresa := COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'empresa'), ''), 'Mi Empresa');

  -- 1. Crear tenant
 INSERT INTO public.tenants (nombre, email, activo, plan)
  VALUES (v_empresa, NEW.email, true, 'free')
  RETURNING id INTO v_tenant_id;

  -- 2. Crear registro en usuarios
  INSERT INTO public.usuarios (id, nombre, email, tenant_id, rol, activo)
  VALUES (NEW.id, v_nombre, NEW.email, v_tenant_id, 'admin', true);

  -- 3. Relación usuario ↔ tenant
  INSERT INTO public.usuario_tenant (user_id, tenant_id, rol, activo)
  VALUES (NEW.id, v_tenant_id, 'admin', true);

  -- 4. Configuración vacía
  INSERT INTO public.configuracion (tenant_id)
  VALUES (v_tenant_id);

  -- 5. Contadores
  INSERT INTO public.contadores (tenant_id, tipo, ultimo_numero) VALUES
    (v_tenant_id, 'GA', 0),
    (v_tenant_id, 'OI', 0),
    (v_tenant_id, 'FV', 0),
    (v_tenant_id, 'FC', 0),
    (v_tenant_id, 'RP', 0),
    (v_tenant_id, 'RC', 0),
    (v_tenant_id, 'FA', 0),
    (v_tenant_id, 'TK', 0);

  -- 6. Categorías de gastos por defecto
  INSERT INTO public.categorias_gastos (tenant_id, tipo, descripcion, estado) VALUES
    (v_tenant_id, 'Personal',               'Empleados',               'activo'),
    (v_tenant_id, 'Personal',               'Aguinaldo',               'activo'),
    (v_tenant_id, 'Personal',               'Cargas Sociales F931',    'activo'),
    (v_tenant_id, 'Personal',               'Sueldos',                 'activo'),
    (v_tenant_id, 'Impuestos',              'Autónomos',               'activo'),
    (v_tenant_id, 'Impuestos',              'IVA',                     'activo'),
    (v_tenant_id, 'Impuestos',              'Impuesto a las Ganancias', 'activo'),
    (v_tenant_id, 'Impuestos',              'Ingresos Brutos',         'activo'),
    (v_tenant_id, 'Impuestos',              'Monotributo',             'activo'),
    (v_tenant_id, 'Marketing',              'Publicidad Digital',      'activo'),
    (v_tenant_id, 'Marketing',              'Material de Promoción',   'activo'),
    (v_tenant_id, 'Oficina',                'Alquiler',                'activo'),
    (v_tenant_id, 'Oficina',                'Expensas',                'activo'),
    (v_tenant_id, 'Oficina',                'Gas',                     'activo'),
    (v_tenant_id, 'Oficina',                'Internet',                'activo'),
    (v_tenant_id, 'Oficina',                'Luz',                     'activo'),
    (v_tenant_id, 'Oficina',                'Supermercado',            'activo'),
    (v_tenant_id, 'Oficina',                'Telefonía',               'activo'),
    (v_tenant_id, 'Servicios Profesionales','Abogado',                 'activo'),
    (v_tenant_id, 'Servicios Profesionales','Contador',                'activo'),
    (v_tenant_id, 'Servicios Profesionales','Escribanía',              'activo'),
    (v_tenant_id, 'Servicios Profesionales','Otros Servicios',         'activo'),
    (v_tenant_id, 'Otro',                   'Comisión Mercado Pago',   'activo'),
    (v_tenant_id, 'Otro',                   'Gastos Bancarios',        'activo'),
    (v_tenant_id, 'Otro',                   'Seguros',                 'activo'),
    (v_tenant_id, 'Otro',                   'Otros Gastos',            'activo');

  -- 7. Cuentas de tesorería por defecto
  INSERT INTO public.cuentas (tenant_id, nombre, tipo, estado) VALUES
    (v_tenant_id, 'Caja del Local',     'efectivo', 'activo'),
    (v_tenant_id, 'Caja General',       'efectivo', 'activo'),
    (v_tenant_id, 'Mercado Pago',       'banco',    'activo'),
    (v_tenant_id, 'Banco Santander',    'banco',    'activo'),
    (v_tenant_id, 'Cheque de Terceros', 'a_cobrar', 'activo'),
    (v_tenant_id, 'Cheque Propio',      'a_pagar',  'activo'),
    (v_tenant_id, 'Tarjeta VISA',       'a_pagar',  'activo');

  -- 8. Listas de precios por defecto
  INSERT INTO public.listas_precios (tenant_id, nombre, descripcion, moneda, estado) VALUES
    (v_tenant_id, 'Minorista', 'Lista de precios minorista', 'ARS', 'activo'),
    (v_tenant_id, 'Mayorista', 'Lista de precios mayorista', 'ARS', 'activo');

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();