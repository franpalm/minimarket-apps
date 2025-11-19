
# URLs para la API
from django.urls import path
from . import views
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    # URLs pedidos por el profesor 
    path('productos/', views.productos_list, name='productos_list'),
    path('productos/<int:pk>/', views.producto_detail, name='producto_detail'),

    path('categorias/', views.categorias_list, name='categorias_list'),
    path('categorias/<int:pk>/', views.categoria_detail, name='categoria_detail'),

    path('proveedores/', views.proveedores_list, name='proveedores_list'),
    path('proveedores/<int:pk>/', views.proveedor_detail, name='proveedor_detail'),

    path('ventas/', views.ventas_list, name='ventas_list'),
    path('ventas/<int:pk>/', views.venta_detail, name='venta_detail'),
    #-------------------------------------------------------------------------------
    # Endpoints de usuario
    path('usuarios/', views.usuarios_list, name='usuarios_list'),
    path('usuarios/<int:pk>/', views.usuario_detail, name='usuario_detail'),
    
    # URLs extras para el proyecto de punto de venta
    path('categorias-gasto/', views.categorias_gasto_list, name='categorias_gasto_list'),
    path('categorias-gasto/<int:pk>/', views.categoria_gasto_detail, name='categoria_gasto_detail'),

    path('gastos/', views.gastos_list, name='gastos_list'),
    path('gastos/<int:pk>/', views.gasto_detail, name='gasto_detail'),

    path('compras/', views.compras_list, name='compras_list'),
    path('compras/<int:pk>/', views.compra_detail, name='compra_detail'),

    path('detalle-compras/', views.detalle_compras_list, name='detalle_compras_list'),
    path('detalle-compras/<int:pk>/', views.detalle_compra_detail, name='detalle_compra_detail'),
    path('venta-simple/', views.crear_venta_simple, name='venta_simple'),
    # Endpoint de reportes
    path('reportes/mensual/', views.reporte_mensual, name='reporte_mensual'),
    path('reportes/semanal/', views.reporte_semanal, name='reporte_semanal'),
    path('reportes/diario/', views.reporte_diario, name='reporte_diario'),
    path('terminal-payment/', views.TerminalPaymentView.as_view(), name='terminal-payment'),
    # Endpoints Mercado Pago
    path('mp/create-intent/', views.create_payment_intent, name='create_payment_intent'),
    path('mp/check-intent/<str:intent_id>/', views.check_payment_status, name='check_payment_status'),

    # JWT Auth endpoints
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Ejemplo de endpoint protegido
    path('protected/', views.ProtectedExampleView.as_view(), name='protected_example'),
]