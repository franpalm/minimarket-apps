import logging
from django.utils.deprecation import MiddlewareMixin
from django.utils.timezone import now

logger = logging.getLogger("user_actions")

class UserActionLoggingMiddleware(MiddlewareMixin):
    def process_view(self, request, view_func, view_args, view_kwargs):
        user = getattr(request, 'user', None)
        if user and user.is_authenticated:
            username = getattr(user, 'username', str(user))
            role = getattr(user, 'rol', 'unknown')
            method = request.method
            path = request.path
            logger.info(f"[{now()}] User: {username} | Role: {role} | Method: {method} | Path: {path}")
        return None
