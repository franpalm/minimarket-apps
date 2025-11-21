from django.contrib import admin
from .models import Usuario, UserActionLog

@admin.register(Usuario)
class UsuarioAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'rol', 'is_active', 'activo', 'fecha_creacion', 'ultimo_acceso')
    list_filter = ('rol', 'activo', 'is_active', 'fecha_creacion')
    search_fields = ('username', 'email', 'rol')
    ordering = ('-fecha_creacion',)

@admin.register(UserActionLog)
class UserActionLogAdmin(admin.ModelAdmin):
    list_display = ('usuario', 'accion', 'fecha', 'detalles')
    list_filter = ('accion', 'fecha', 'usuario')
    search_fields = ('usuario__username', 'accion', 'detalles')
    ordering = ('-fecha',)
