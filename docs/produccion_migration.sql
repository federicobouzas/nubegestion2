-- Módulo de Producción - Supabase migration
-- Ejecutar en el SQL editor de Supabase

CREATE TABLE IF NOT EXISTS talleres (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id uuid NOT NULL,
  nombre varchar(255) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- NOTA: si ya existe una tabla "insumos" con otra estructura,
-- revisar sus columnas antes de ejecutar esto.
CREATE TABLE IF NOT EXISTS insumos_produccion (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id uuid NOT NULL,
  nombre varchar(255) NOT NULL,
  precio_compra decimal(10,2) NOT NULL DEFAULT 0,
  unidad_medida varchar(100) NOT NULL DEFAULT 'Unidad',
  proveedor_id uuid REFERENCES proveedores(id),
  stock decimal(10,2) NOT NULL DEFAULT 0,
  iva decimal(4,2) NOT NULL DEFAULT 0,
  estado varchar(50) NOT NULL DEFAULT 'activo',
  observaciones text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS insumos_movimientos (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id uuid NOT NULL,
  insumo_id uuid NOT NULL REFERENCES insumos_produccion(id) ON DELETE CASCADE,
  fecha_movimiento timestamptz NOT NULL DEFAULT now(),
  descripcion varchar(255) NOT NULL,
  entrada decimal(10,2) NOT NULL DEFAULT 0,
  salida decimal(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS insumos_productos (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id uuid NOT NULL,
  insumo_id uuid NOT NULL REFERENCES insumos_produccion(id) ON DELETE CASCADE,
  producto_id uuid NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  cantidad decimal(10,2) NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, insumo_id, producto_id)
);

CREATE TABLE IF NOT EXISTS fabricaciones (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id uuid NOT NULL,
  codigo varchar(50) NOT NULL,
  fecha_fabricacion date NOT NULL,
  fecha_estimada_finalizacion date,
  fecha_finalizacion date,
  estado varchar(50) NOT NULL DEFAULT 'en_proceso',
  taller_id uuid NOT NULL REFERENCES talleres(id),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fabricaciones_productos (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  tenant_id uuid NOT NULL,
  fabricacion_id uuid NOT NULL REFERENCES fabricaciones(id) ON DELETE CASCADE,
  producto_id uuid NOT NULL REFERENCES productos(id),
  cantidad integer NOT NULL,
  costo_insumos decimal(10,2) NOT NULL DEFAULT 0,
  costo_fabricacion decimal(10,2) NOT NULL DEFAULT 0,
  costo_total decimal(10,2) NOT NULL DEFAULT 0,
  observaciones text,
  created_at timestamptz DEFAULT now()
);

-- RPC: costo de insumos de un producto (suma precio_compra * cantidad de la receta)
CREATE OR REPLACE FUNCTION get_costo_insumos_producto(p_tenant_id uuid, p_producto_id uuid)
RETURNS decimal LANGUAGE sql AS $$
  SELECT COALESCE(SUM(i.precio_compra * ip.cantidad), 0)
  FROM insumos_productos ip
  JOIN insumos_produccion i ON i.id = ip.insumo_id
  WHERE ip.tenant_id = p_tenant_id AND ip.producto_id = p_producto_id;
$$;

-- RPC: verifica si hay stock suficiente para fabricar N unidades de un producto
CREATE OR REPLACE FUNCTION check_stock_fabricacion(p_tenant_id uuid, p_producto_id uuid, p_cantidad integer)
RETURNS json LANGUAGE plpgsql AS $$
DECLARE
  v_max integer := p_cantidad;
  v_rec record;
BEGIN
  FOR v_rec IN
    SELECT ip.cantidad as cant_receta, i.stock, i.nombre
    FROM insumos_productos ip
    JOIN insumos_produccion i ON i.id = ip.insumo_id
    WHERE ip.tenant_id = p_tenant_id AND ip.producto_id = p_producto_id
  LOOP
    IF v_rec.cant_receta > 0 THEN
      v_max := LEAST(v_max, FLOOR(v_rec.stock / v_rec.cant_receta)::integer);
    END IF;
  END LOOP;
  IF v_max < p_cantidad THEN
    RETURN json_build_object('status', 'ERROR', 'maximo', v_max);
  END IF;
  RETURN json_build_object('status', 'OK', 'maximo', v_max);
END;
$$;
