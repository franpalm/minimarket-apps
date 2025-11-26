INSERT INTO api_producto (
    id,
    nombre,
    descripcion,
    precio_compra,
    precio_venta,
    stock_actual,
    stock_minimo,
    unidad_medida,
    creado_en,
    categoria_id,
    codigo_barra,
    fecha_vencimiento,
    proveedor_id
  )
VALUES (
    'id:bigint',
    'nombre:varchar',
    'descripcion:longtext',
    'precio_compra:decimal',
    'precio_venta:decimal',
    stock_actual:int,
    stock_minimo:int,
    'unidad_medida:varchar',
    'creado_en:datetime',
    'categoria_id:bigint',
    'codigo_barra:varchar',
    'fecha_vencimiento:date',
    'proveedor_id:bigint'
  );-- ver tabla productos

SELECT * FROM api_producto;

SHOW TABLES;

