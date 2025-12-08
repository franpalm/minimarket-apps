

from django.apps import AppConfig
from cryptography.fernet import Fernet


class ApiConfig(AppConfig):
    def ready(self):
        # Inicialización de usuarios y grupos deshabilitada para evitar errores de arranque.
        pass
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'
