

from django.apps import AppConfig
from cryptography.fernet import Fernet


class ApiConfig(AppConfig):
    def ready(self):
        from django.contrib.auth import get_user_model
        # --- CONTRASEÑA CIFRADA Y CLAVE SECRETA ---
        encrypted_pass = b'gAAAAABlZ...REEMPLAZA_AQUI...=='  # Pega aquí la contraseña cifrada
        key = b'REEMPLAZA_AQUI_TU_CLAVE_SECRETA'  # Pega aquí tu clave secreta
        try:
            fernet = Fernet(key)
            admin_pass = fernet.decrypt(encrypted_pass).decode()
        except Exception as e:
            import warnings
            warnings.warn(f'No se pudo descifrar la contraseña admin: {e}')
            return
        User = get_user_model()
        # Solo crea el admin si no existe ningún usuario con username 'administrador'
        if not User.objects.filter(username='administrador').exists():
            User.objects.create_superuser(
                username='administrador',
                password=admin_pass,
                email='admin@'
            )
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'
