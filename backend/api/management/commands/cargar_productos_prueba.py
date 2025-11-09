from django.core.management.base import BaseCommand
from api.models import Producto, Categoria

class Command(BaseCommand):
    help = 'Crea productos y categorías de prueba para el inventario.'

    def handle(self, *args, **options):
        # Crear categorías si no existen
        cat1, _ = Categoria.objects.get_or_create(nombre='Bebidas', defaults={'descripcion': 'Bebidas y refrescos'})
        cat2, _ = Categoria.objects.get_or_create(nombre='Snacks', defaults={'descripcion': 'Snacks y golosinas'})
        cat3, _ = Categoria.objects.get_or_create(nombre='Limpieza', defaults={'descripcion': 'Productos de limpieza'})

        # Crear productos de prueba
        productos = [
            {'nombre': 'Coca Cola 1.5L', 'descripcion': 'Botella de bebida', 'categoria': cat1, 'precio_compra': 900, 'precio_venta': 1500, 'stock_actual': 20, 'stock_minimo': 5, 'unidad_medida': 'botella'},
            {'nombre': 'Pepsi 1.5L', 'descripcion': 'Botella de bebida', 'categoria': cat1, 'precio_compra': 850, 'precio_venta': 1400, 'stock_actual': 15, 'stock_minimo': 5, 'unidad_medida': 'botella'},
            {'nombre': 'Doritos 140g', 'descripcion': 'Bolsa de snack', 'categoria': cat2, 'precio_compra': 700, 'precio_venta': 1200, 'stock_actual': 30, 'stock_minimo': 10, 'unidad_medida': 'bolsa'},
            {'nombre': 'Lays 140g', 'descripcion': 'Bolsa de snack', 'categoria': cat2, 'precio_compra': 650, 'precio_venta': 1100, 'stock_actual': 25, 'stock_minimo': 10, 'unidad_medida': 'bolsa'},
            {'nombre': 'Cloro 1L', 'descripcion': 'Botella de cloro', 'categoria': cat3, 'precio_compra': 500, 'precio_venta': 900, 'stock_actual': 40, 'stock_minimo': 10, 'unidad_medida': 'botella'},
        ]
        count = 0
        for prod in productos:
            obj, created = Producto.objects.get_or_create(
                nombre=prod['nombre'],
                defaults=prod
            )
            if created:
                count += 1
        self.stdout.write(self.style.SUCCESS(f'{count} productos de prueba creados.'))
