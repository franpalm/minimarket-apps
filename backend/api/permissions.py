from rest_framework.permissions import BasePermission, SAFE_METHODS

import logging
class IsAdmin(BasePermission):
    message = 'No tienes permisos de administrador para realizar esta acción.'
    def has_permission(self, request, view):
        # Logging temporal para depuración
        logger = logging.getLogger('django')
        logger.warning(f"[IsAdmin] user: {getattr(request.user, 'username', None)}, rol: {getattr(request.user, 'rol', None)}, is_authenticated: {request.user.is_authenticated}")
        if not request.user.is_authenticated or getattr(request.user, 'rol', None) != 'admin':
            self.message = 'No tienes permisos de administrador para realizar esta acción.'
            return False
        return True

class IsDueno(BasePermission):
    message = 'No tienes permisos de dueño para realizar esta acción.'
    def has_permission(self, request, view):
        if not request.user.is_authenticated or getattr(request.user, 'rol', None) != 'dueno':
            self.message = 'No tienes permisos de dueño para realizar esta acción.'
            return False
        return True
        if not request.user.is_authenticated or getattr(request.user, 'rol', None) != 'dueno':
            return False
        # Si es endpoint de reporte de ventas y método DELETE, denegar
        if hasattr(view, 'basename') and view.basename == 'reportes-ventas' and request.method == 'DELETE':
            return False
        return True

class IsCajero(BasePermission):
    message = 'No tienes permisos de cajero para realizar esta acción.'
    def has_permission(self, request, view):
        if not request.user.is_authenticated or getattr(request.user, 'rol', None) != 'cajero':
            self.message = 'No tienes permisos de cajero para realizar esta acción.'
            return False
        if hasattr(view, 'basename'):
            if view.basename == 'ventas':
                return True
            if view.basename in ['productos-rest', 'productos'] and request.method in SAFE_METHODS:
                return True
        self.message = 'No tienes permisos de cajero para realizar esta acción.'
        return False
