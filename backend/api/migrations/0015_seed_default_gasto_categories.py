from django.db import migrations

DEFAULT_CATEGORIES = [
    ("Arriendo", "Pagos de arriendo del local"),
    ("Servicios", "Cuentas de luz, agua, internet y otros servicios"),
    ("Sueldos", "Pago de remuneraciones"),
    ("Mercadería", "Abastecimiento de productos"),
    ("Transporte", "Costos de traslado y logística"),
    ("Otros", "Gastos misceláneos")
]


def seed_categories(apps, schema_editor):
    CategoriaGasto = apps.get_model('api', 'CategoriaGasto')
    existing = set(
        CategoriaGasto.objects.filter(nombre__in=[name for name, _ in DEFAULT_CATEGORIES])
        .values_list('nombre', flat=True)
    )
    to_create = [
        CategoriaGasto(nombre=name, descripcion=desc)
        for name, desc in DEFAULT_CATEGORIES
        if name not in existing
    ]
    if to_create:
        CategoriaGasto.objects.bulk_create(to_create)


def unseed_categories(apps, schema_editor):
    CategoriaGasto = apps.get_model('api', 'CategoriaGasto')
    CategoriaGasto.objects.filter(nombre__in=[name for name, _ in DEFAULT_CATEGORIES]).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0014_alter_producto_precio_compra"),
    ]

    operations = [
        migrations.RunPython(seed_categories, unseed_categories),
    ]
