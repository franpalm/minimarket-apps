# Categoría de Gasto
from django.db import models

class CategoriaGasto(models.Model):
    nombre = models.CharField(max_length=100, unique=True)
    descripcion = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.nombre
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.utils import timezone

class Usuario(AbstractUser):
    ROLES = (
        ('admin', 'Administrador'),
        ('usuario', 'Usuario'),
        ('cajero', 'Cajero'),
    )
    rol = models.CharField(max_length=20, choices=ROLES, default='usuario')
    activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    ultimo_acceso = models.DateTimeField(null=True, blank=True)
    recovery_token = models.CharField(max_length=64, blank=True, null=True)
    recovery_token_expiry = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.username} ({self.rol})"

class UserActionLog(models.Model):
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE)
    accion = models.CharField(max_length=255)
    fecha = models.DateTimeField(auto_now_add=True)
    detalles = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.usuario.username}: {self.accion} ({self.fecha})"

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
    proveedor = models.ForeignKey(Proveedor, on_delete=models.SET_NULL, null=True, blank=True)
    precio_compra = models.DecimalField(max_digits=10, decimal_places=2)
    precio_venta = models.DecimalField(max_digits=10, decimal_places=2)
    stock_actual = models.IntegerField()
    stock_minimo = models.IntegerField()
    unidad_medida = models.CharField(max_length=20)
    fecha_vencimiento = models.DateField(null=True, blank=True)
    creado_en = models.DateTimeField(auto_now_add=True)
    codigo_barra = models.CharField(max_length=64, unique=True, null=False, blank=False)


    def __str__(self):
        return self.nombre

# Modelo para Venta
class Venta(models.Model):
    fecha_venta = models.DateTimeField()
    total_venta = models.DecimalField(max_digits=12, decimal_places=2)
    metodo_pago = models.CharField(max_length=30)
    usuario = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True)
    creado_en = models.DateTimeField(auto_now_add=True)
    terminal_transaction_id = models.CharField(max_length=100, blank=True, null=True)
    terminal_response = models.JSONField(blank=True, null=True)

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


@receiver(post_save, sender=Usuario)
def log_usuario_save(sender, instance, created, **kwargs):
    accion = "Creación" if created else "Edición"
    detalles = f"Usuario {instance.username} ({instance.rol}) {'creado' if created else 'editado'}."
    UserActionLog.objects.create(usuario=instance, accion=accion, detalles=detalles)

@receiver(post_delete, sender=Usuario)
def log_usuario_delete(sender, instance, **kwargs):
    detalles = f"Usuario {instance.username} ({instance.rol}) eliminado."
    UserActionLog.objects.create(usuario=instance, accion="Eliminación", detalles=detalles)

