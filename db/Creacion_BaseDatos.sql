-- Este script crea la base de datos 'minimarket_db' y sus tablas
-- Necesitas ejecutarlo en tu servidor MariaDB (XAMPP).

-- Eliminar la base de datos si ya existe (para un inicio limpio)
DROP DATABASE IF EXISTS minimarket_db;

-- Creación de la base de datos
CREATE DATABASE minimarket_db;
USE minimarket_db;

-- Creación de la tabla de Usuarios 
CREATE TABLE Usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre_usuario VARCHAR(50) NOT NULL UNIQUE,
    contrasena VARCHAR(255) NOT NULL, -- Usaremos un hash en el futuro, no texto plano [cite: 151]
    rol ENUM('Desarrollador', 'Usuario', 'Personalizado') NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Creación de la tabla de Categorías de productos 
CREATE TABLE Categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE
);

-- Creación de la tabla de Proveedores 
CREATE TABLE Proveedores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    telefono VARCHAR(20),
    email VARCHAR(100)
);

-- Creación de la tabla de Productos (el corazón del inventario) 
CREATE TABLE Productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo_producto VARCHAR(50) UNIQUE, -- Puede ser un código de barras o uno interno [cite: 170]
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    precio_compra DECIMAL(10, 2) NOT NULL,
    precio_venta DECIMAL(10, 2) NOT NULL,
    stock_actual DECIMAL(10, 2) NOT NULL, -- Usamos DECIMAL por si vendes por peso (kg) [cite: 175]
    stock_minimo DECIMAL(10, 2) NOT NULL,
    unidad_medida VARCHAR(20) NOT NULL, -- ej: 'unidad', 'kg', 'litro' [cite: 177]
    fecha_vencimiento DATE,
    id_categoria INT,
    id_proveedor INT,
    FOREIGN KEY (id_categoria) REFERENCES Categorias(id),
    FOREIGN KEY (id_proveedor) REFERENCES Proveedores(id)
);

-- Creación de la tabla de Ventas 
CREATE TABLE Ventas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fecha_venta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_venta DECIMAL(10, 2) NOT NULL,
    metodo_pago VARCHAR(50) NOT NULL, -- 'Efectivo', 'Tarjeta', 'Transferencia' [cite: 189]
    id_usuario INT,
    FOREIGN KEY (id_usuario) REFERENCES Usuarios(id)
);

-- Creación de la tabla de Detalle de Ventas (qué productos se vendieron en cada venta) 
CREATE TABLE Detalle_Ventas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_venta INT NOT NULL,
    id_producto INT NOT NULL,
    cantidad_vendida DECIMAL(10, 2) NOT NULL,
    precio_unitario_venta DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (id_venta) REFERENCES Ventas(id) ON DELETE CASCADE, -- Si se borra una venta, se borra el detalle [cite: 201]
    FOREIGN KEY (id_producto) REFERENCES Productos(id)
);

-- Creación de la tabla de Gastos 
CREATE TABLE Gastos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fecha_gasto DATE NOT NULL,
    descripcion VARCHAR(255) NOT NULL,
    monto DECIMAL(10, 2) NOT NULL,
    categoria_gasto VARCHAR(100) -- ej: 'Arriendo', 'Sueldos', 'Servicios' [cite: 210]
);

-- Insertar los usuarios predeterminados 
-- En un entorno de producción, las contraseñas deberían ser hasheadas
INSERT INTO Usuarios (nombre_usuario, contrasena, rol) VALUES
('desarrollador', 'cambiar_esta_clave', 'Desarrollador'),
('dueño', 'cambiar_esta_clave', 'Usuario'),
('empleado', 'cambiar_esta_clave', 'Personalizado');

-- Insertar datos iniciales para Categorías y Proveedores
-- (Necesarios para pruebas de productos)
INSERT INTO Categorias (nombre) VALUES
('Abarrotes'),
('Lácteos'),
('Bebidas'),
('Panadería'),
('Congelados'),
('Frutas y Verduras');

INSERT INTO Proveedores (nombre, telefono, email) VALUES
('Distribuidora A', '987654321', 'contacto@distribuidoraa.com'),
('Proveedor B & C', '123456789', 'ventas@proveedorbc.com'),
('Empresa de Lácteos Ltda.', '555111222', 'info@lacteos.com');

-- Insertar algunos productos de ejemplo para poblar el inventario inicial
INSERT INTO Productos (codigo_producto, nombre, descripcion, precio_compra, precio_venta, stock_actual, stock_minimo, unidad_medida, fecha_vencimiento, id_categoria, id_proveedor) VALUES
('P001', 'Leche Entera 1L', 'Leche pasteurizada descremada', 800.00, 1200.00, 20.00, 5.00, 'unidad', '2025-08-15', 2, 3),
('P002', 'Arroz Grano Largo 1kg', 'Arroz blanco de grano largo', 1200.00, 1800.00, 30.00, 10.00, 'unidad', NULL, 1, 1),
('P003', 'Bebida Cola 2.5L', 'Bebida gaseosa sabor cola', 1500.00, 2200.00, 15.00, 5.00, 'unidad', NULL, 3, 2),
('P004', 'Pan de Molde Blanco', 'Pan para sandwich', 1000.00, 1500.00, 10.00, 3.00, 'unidad', '2025-07-30', 4, 1),
('P005', 'Helado Vainilla 1L', 'Helado cremoso sabor vainilla', 2500.00, 3800.00, 8.00, 2.00, 'unidad', '2026-06-01', 5, 3),
('P006', 'Manzana Roja 1kg', 'Manzanas frescas', 1800.00, 2500.00, 5.00, 2.00, 'kg', NULL, 6, 2);



-- Usa esta consulta para renombrar la tabla "Detalle_Ventas"
-- por "DetalleVentas".

ALTER TABLE Detalle_Ventas
RENAME TO DetalleVentas;

-- Asegúrate de usar el nombre exacto de la tabla actual.