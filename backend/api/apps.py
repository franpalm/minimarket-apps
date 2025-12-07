

from django.apps import AppConfig
from cryptography.fernet import Fernet


class ApiConfig(AppConfig):
    def ready(self):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        # --- ADMINISTRADOR ---
        key = b'FzMp9ewVy_w03Uno5esolyQOlhLAzxhzcSen_e2KoXQ='  # Clave Fernet generada
        encrypted_pass = b'gAAAAABpNIdPSTKGLxaywo3ensBlVxAW3uI3cSpBqKuionC1B3ysAFTjY1HBXE3WO9U-yFA67DEFWsGB3eMcw9FlsGF2tCSOfA=='  # Contraseña cifrada
        try:
            fernet = Fernet(key)
            admin_pass = fernet.decrypt(encrypted_pass).decode()
        except Exception as e:
            import warnings
            warnings.warn(f'No se pudo descifrar la contraseña admin: {e}')
            admin_pass = 'admin1234'  # fallback
        if not User.objects.filter(username='administrador').exists():
            User.objects.create_superuser(
                username='administrador',
                password=admin_pass,
                email='admin@'
            )
        # --- CAJERO ---
        if not User.objects.filter(username='cajero').exists():
            cajero = User.objects.create_user(
                username='cajero',
                password='cajero1234',
                email='cajero@',
                is_staff=False,
                is_superuser=False
            )
        # --- DUEÑO ---
        if not User.objects.filter(username='dueno').exists():
            dueno = User.objects.create_user(
                username='dueno',
                password='dueno1234',
                email='dueno@',
                is_staff=True,
                is_superuser=False
            )
        from django.contrib.auth.models import Group, Permission
        from django.contrib.contenttypes.models import ContentType
        from .models import Venta

        # --- GRUPOS Y PERMISOS ---
        cajero_group, _ = Group.objects.get_or_create(name='Cajeros')
        dueno_group, _ = Group.objects.get_or_create(name='Dueños')
        venta_ct = ContentType.objects.get_for_model(Venta)
        perms_cajero = Permission.objects.filter(content_type=venta_ct, codename__in=['add_venta', 'view_venta'])
        cajero_group.permissions.set(perms_cajero)
        perms_dueno = Permission.objects.filter(content_type=venta_ct).exclude(codename__in=['change_venta', 'delete_venta'])
        dueno_group.permissions.set(perms_dueno)
        if User.objects.filter(username='cajero').exists():
            cajero = User.objects.get(username='cajero')
            cajero.groups.set([cajero_group])
        if User.objects.filter(username='dueno').exists():
            dueno = User.objects.get(username='dueno')
            dueno.groups.set([dueno_group])
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'
