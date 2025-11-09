-- Relaciona ventas recientes con productos de tu inventario
INSERT INTO DetalleVentas (id_venta, id_producto, cantidad_vendida, precio_unitario_venta, subtotal) VALUES
(50, 22, 2, 1200.00, 2400.00),  -- Leche Entera 1L
(51, 23, 1, 1800.00, 1800.00),  -- Arroz Grano Largo 1kg
(52, 38, 3, 2200.00, 6600.00),  -- Aceite Vegetal 900ml
(53, 39, 2, 1100.00, 2200.00),  -- Azúcar 1kg
(54, 40, 1, 900.00, 900.00),    -- Fideos Spaghetti 400g
(55, 41, 1, 1800.00, 1800.00),  -- Jabón Líquido 1L
(56, 42, 1, 2500.00, 2500.00),  -- Detergente en Polvo 800g
(57, 43, 2, 1400.00, 2800.00),  -- Bebida Cola 1.5L
(58, 44, 3, 700.00, 2100.00),   -- Galletas de Chocolate 140g
(59, 66, 1, 2200.00, 2200.00),  -- Aceite Vegetal 900ml
(60, 67, 2, 1100.00, 2200.00),  -- Azúcar 1kg
(61, 68, 1, 900.00, 900.00),    -- Fideos Spaghetti 400g
(62, 69, 1, 1800.00, 1800.00),  -- Jabón Líquido 1L
(63, 70, 1, 2500.00, 2500.00),  -- Detergente en Polvo 800g
(64, 71, 2, 1400.00, 2800.00),  -- Bebida Cola 1.5L
(65, 72, 3, 700.00, 2100.00),   -- Galletas de Chocolate 140g
(66, 22, 1, 1200.00, 1200.00),  -- Leche Entera 1L
(67, 22, 2, 1200.00, 2400.00),  -- Leche Entera 1L
(68, 23, 1, 1800.00, 1800.00),  -- Arroz Grano Largo 1kg
(69, 38, 3, 2200.00, 6600.00);  -- Aceite Vegetal 900ml

-- Actualiza el stock de productos para que algunos tengan stock
UPDATE Productos SET stock_actual = 10 WHERE id IN (22, 23, 38, 39, 40, 41, 42, 43, 44);

-- Inserta ventas y detalles de ventas en septiembre 2025
INSERT INTO Ventas (fecha_venta, total_venta, metodo_pago) VALUES
('2025-09-01', 2400, 'efectivo'),
('2025-09-02', 1800, 'tarjeta'),
('2025-09-03', 6600, 'efectivo');

-- Obtén los IDs de las ventas recién insertadas (ajusta si es necesario)
-- Supongamos que los IDs son 67, 68, 69
INSERT INTO DetalleVentas (id_venta, id_producto, cantidad_vendida, precio_unitario_venta, subtotal) VALUES
(67, 22, 2, 1200.00, 2400.00),  -- Leche Entera 1L
(68, 23, 1, 1800.00, 1800.00),  -- Arroz Grano Largo 1kg
(69, 38, 3, 2200.00, 6600.00);  -- Aceite Vegetal 900ml