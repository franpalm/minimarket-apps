from django.core.management.base import BaseCommand
from api.models import Producto
from decimal import Decimal, InvalidOperation

class Command(BaseCommand):
    help = 'Limpia productos con valores inválidos en precio_compra o precio_venta.'

    def handle(self, *args, **options):
        productos = Producto.objects.all()
        count_invalid = 0
        for p in productos:
            try:
                Decimal(p.precio_compra)
                Decimal(p.precio_venta)
            except (InvalidOperation, TypeError, ValueError):
                self.stdout.write(self.style.ERROR(f'Eliminando producto inválido: {p.id} - {p.nombre}'))
                p.delete()
                count_invalid += 1
        self.stdout.write(self.style.SUCCESS(f'Productos inválidos eliminados: {count_invalid}'))
