from django.core.management.base import BaseCommand
from api.models import Producto

class Command(BaseCommand):
    help = 'Elimina todos los productos para limpiar la base de datos.'

    def handle(self, *args, **options):
        count = Producto.objects.count()
        Producto.objects.all().delete()
        self.stdout.write(self.style.SUCCESS(f'Todos los productos eliminados ({count}).'))
