from django.core.management.base import BaseCommand
from api.models import Producto, Categoria

class Command(BaseCommand):
    help = 'Elimina todos los productos y categorías.'

    def handle(self, *args, **options):
        Producto.objects.all().delete()
        Categoria.objects.all().delete()
        self.stdout.write(self.style.SUCCESS('Productos y categorías eliminados.'))
