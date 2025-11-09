from django.db import models
from django.contrib.auth.models import AbstractUser

# =============================
# Modelos requeridos por el profesor
# =============================

# Modelo para Usuario
class Usuario(AbstractUser):
    rol = models.CharField(max_length=20, choices=[('admin', 'Admin'), ('cajero', 'Cajero')], default='cajero')
    creado_en = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.username

# Modelo para Categoria
class Categoria(models.Model):
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True)

    def __str__(self):
        return self.nombre

# Modelo para Proveedor
class Proveedor(models.Model):
    nombre = models.CharField(max_length=100)
    contacto = models.CharField(max_length=100, blank=True)
    telefono = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    direccion = models.TextField(blank=True)

    def __str__(self):
        return self.nombre

# Modelo para Producto
class Producto(models.Model):
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True)
    categoria = models.ForeignKey(Categoria, on_delete=models.CASCADE)
    precio_compra = models.DecimalField(max_digits=10, decimal_places=2)
    precio_venta = models.DecimalField(max_digits=10, decimal_places=2)
    stock_actual = models.IntegerField()
    stock_minimo = models.IntegerField()
    unidad_medida = models.CharField(max_length=20)
    creado_en = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.nombre

# Modelo para Venta
class Venta(models.Model):
    fecha_venta = models.DateTimeField()
    total_venta = models.DecimalField(max_digits=12, decimal_places=2)
    metodo_pago = models.CharField(max_length=30)
    usuario = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True)
    creado_en = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Venta {self.id} - {self.total_venta}"

# =============================
# Modelos extra para el proyecto
# =============================

# Modelo para CategoriaGasto (EXTRA)
class CategoriaGasto(models.Model):
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True)

    def __str__(self):
        return self.nombre

# Modelo para DetalleVenta (EXTRA)
class DetalleVenta(models.Model):
    venta = models.ForeignKey(Venta, on_delete=models.CASCADE, related_name='detalles')
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE)
    cantidad_vendida = models.IntegerField()
    precio_unitario_venta = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2)

    def __str__(self):
        return f"Venta {self.venta.id} - Producto {self.producto.nombre}"

# Modelo para Gasto (EXTRA)
class Gasto(models.Model):
    fecha = models.DateField()
    categoria = models.ForeignKey(CategoriaGasto, on_delete=models.SET_NULL, null=True)
    monto = models.DecimalField(max_digits=12, decimal_places=2)
    metodo_pago = models.CharField(max_length=30)
    descripcion = models.TextField(blank=True)
    usuario = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True)
    comprobante_url = models.URLField(blank=True, null=True)
    creado_en = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Gasto {self.id} - {self.monto}"

# Modelo para Compra (EXTRA)
class Compra(models.Model):
    fecha_compra = models.DateField()
    proveedor = models.ForeignKey(Proveedor, on_delete=models.SET_NULL, null=True)
    total_compra = models.DecimalField(max_digits=12, decimal_places=2)
    usuario = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True)

    def __str__(self):
        return f"Compra {self.id} - {self.total_compra}"

# Modelo para DetalleCompra (EXTRA)
class DetalleCompra(models.Model):
    compra = models.ForeignKey(Compra, on_delete=models.CASCADE, related_name='detalles')
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE)
    cantidad = models.IntegerField()
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2)

    def __str__(self):
        return f"Compra {self.compra.id} - Producto {self.producto.nombre}"

