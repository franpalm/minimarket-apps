

from django.apps import AppConfig
from cryptography.fernet import Fernet


class ApiConfig(AppConfig):
    def ready(self):
        from django.contrib.auth import get_user_model
        # --- CONTRASEÑA CIFRADA Y CLAVE SECRETA ---
        # Genera una clave Fernet válida con: 
        # from cryptography.fernet import Fernet; print(Fernet.generate_key())
        # Ejemplo:
        key = b'FzMp9ewVy_w03Uno5esolyQOlhLAzxhzcSen_e2KoXQ='  # Clave Fernet generada
        encrypted_pass = b'gAAAAABpNIdPSTKGLxaywo3ensBlVxAW3uI3cSpBqKuionC1B3ysAFTjY1HBXE3WO9U-yFA67DEFWsGB3eMcw9FlsGF2tCSOfA=='  # Contraseña cifrada
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
