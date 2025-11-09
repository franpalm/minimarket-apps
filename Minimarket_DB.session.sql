SELECT metodo_pago, COUNT(*) AS cantidad, SUM(total_venta) AS total
FROM Ventas
WHERE DATE(fecha_venta) = CURDATE()
GROUP BY metodo_pago;


INSERT INTO Productos 
(codigo_producto, nombre, descripcion, precio_compra, precio_venta, stock_actual, stock_minimo, unidad_medida, fecha_vencimiento, id_categoria, id_proveedor) VALUES
('P007', 'Aceite Vegetal 900ml', 'Aceite vegetal para cocinar', 1500.00, 2200.00, 15.00, 5.00, 'unidad', NULL, 1, 1),
('P008', 'Azúcar 1kg', 'Azúcar blanca refinada', 700.00, 1100.00, 18.00, 5.00, 'unidad', NULL, 1, 1),
('P009', 'Fideos Spaghetti 400g', 'Fideos tipo spaghetti', 600.00, 900.00, 22.00, 5.00, 'unidad', NULL, 1, 1),
('P010', 'Jabón Líquido 1L', 'Jabón líquido para manos', 1200.00, 1800.00, 10.00, 3.00, 'unidad', NULL, 1, 1),
('P011', 'Detergente en Polvo 800g', 'Detergente para ropa', 1800.00, 2500.00, 12.00, 3.00, 'unidad', NULL, 1, 1),
('P012', 'Bebida Cola 1.5L', 'Bebida gaseosa sabor cola', 900.00, 1400.00, 16.00, 5.00, 'unidad', NULL, 3, 2),
('P013', 'Galletas de Chocolate 140g', 'Galletas sabor chocolate', 400.00, 700.00, 28.00, 8.00, 'unidad', NULL, 1, 1);



DELETE FROM Productos WHERE codigo_producto IN ('P007','P008','P009','P010','P011','P012','P013');

-- Emula ventas en diferentes días y con distintos métodos de pago
-- Emula ventas de hoy (2025-08-28) con distintos métodos de pago
INSERT INTO Ventas (fecha_venta, total_venta, metodo_pago)
VALUES
('2025-08-28', 2200, 'efectivo'),
('2025-08-28', 1400, 'tarjeta'),
('2025-08-28', 1100, 'efectivo'),
('2025-08-28', 900, 'efectivo'),
('2025-08-28', 2500, 'tarjeta'),
('2025-08-28', 700, 'efectivo'),
('2025-08-28', 1800, 'tarjeta'),
('2025-08-28', 1500, 'efectivo');