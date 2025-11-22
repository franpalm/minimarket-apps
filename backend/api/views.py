from rest_framework import viewsets
from .models import CategoriaGasto
from .serializers import CategoriaGastoSerializer

class CategoriaGastoViewSet(viewsets.ModelViewSet):
    queryset = CategoriaGasto.objects.all()
    serializer_class = CategoriaGastoSerializer
    from rest_framework.permissions import AllowAny
    permission_classes = [AllowAny]
# Endpoint: inversión total en inventario por categoría
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Sum, F

@csrf_exempt
def resumen_inversion_inventario(request):
    if request.method != 'GET':
        return HttpResponseNotAllowed(['GET'])
    try:
        # Agrupa por categoría y suma (precio_compra * stock_actual)
        from .models import Producto, Categoria
        categorias = Categoria.objects.all()
        resumen = []
        total_general = 0
        for cat in categorias:
            total_cat = Producto.objects.filter(categoria=cat, stock_actual__gt=0).aggregate(
                inversion=Sum(F('precio_compra') * F('stock_actual'))
            )["inversion"] or 0
            resumen.append({
                "categoria_id": cat.id,
                "categoria": cat.nombre,
                "total_inversion": float(total_cat)
            })
            total_general += float(total_cat)
        return JsonResponse({
            "resumen": resumen,
            "total_general": total_general
        })
    except Exception as e:
        return HttpResponseBadRequest(str(e))
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
import uuid

# --- TUU Terminal ---
@api_view(['POST'])
@permission_classes([AllowAny])
def create_tuu_intent(request):
    """
    Simula la creación de un intento de pago en TUU.
    Devuelve un intentId ficticio.
    """
    intent_id = f"TUU-{uuid.uuid4()}"
    return Response({"intentId": intent_id, "status": "success"})

# --- CompraAquí Terminal ---
@api_view(['POST'])
@permission_classes([AllowAny])
def create_compraaqui_intent(request):
    """
    Simula la creación de un intento de pago en CompraAquí.
    Devuelve éxito inmediato.
    """
    intent_id = f"COMPRAAQUI-{uuid.uuid4()}"
    return Response({"intentId": intent_id, "status": "success"})
from rest_framework import viewsets
from .models import Producto
from .serializers import ProductoSerializer

# ViewSet REST para productos
class ProductoViewSet(viewsets.ModelViewSet):
    queryset = Producto.objects.all()
    serializer_class = ProductoSerializer
from rest_framework.permissions import BasePermission

class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and getattr(request.user, 'rol', None) == 'admin'

from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status

# --- Endpoint para forzar recuperación de contraseña ---
@api_view(['POST'])
@permission_classes([IsAdmin])
def forzar_recuperacion(request, pk):
    """
    Permite al admin forzar el envío de email de recuperación de contraseña a un usuario.
    """
    try:
        usuario = Usuario.objects.get(pk=pk)
        # Generar token de recuperación (simple, para demo; en producción usar JWT o similar)
        token = get_random_string(32)
        usuario.recovery_token = token
        usuario.recovery_token_expiry = timezone.now() + timezone.timedelta(hours=1)
        usuario.save()
        # Enviar email
        send_mail(
            'Recuperación de contraseña',
            f'Hola {usuario.username},\n\nPara recuperar tu contraseña, haz clic en el siguiente enlace:\n\nhttps://tusitio.com/recuperar?token={token}\n\nEste enlace expirará en 1 hora.',
            'no-reply@tusitio.com',
            [usuario.email],
            fail_silently=False,
        )
        # Registrar acción en el log
        UserActionLog.objects.create(
            usuario=request.user,
            accion='Forzar recuperación',
            detalles=f'Admin {request.user.username} forzó recuperación para usuario {usuario.username}.'
        )
        return Response({'ok': True, 'message': 'Email de recuperación enviado.'})
    except Usuario.DoesNotExist:
        return Response({'error': 'Usuario no encontrado.'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=500)
from rest_framework.permissions import BasePermission

class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and getattr(request.user, 'rol', None) == 'admin'
# [INICIO] Código de Mercado Pago
# ========================================
# Imports para las nuevas vistas de Mercado Pago
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny # Usamos AllowAny para estos endpoints
from rest_framework.response import Response
from rest_framework import status
import mercadopago
from django.core.mail import send_mail
from django.utils.crypto import get_random_string
from django.utils import timezone
from .models import UserActionLog, Usuario
from django.conf import settings # Para leer el token desde settings.py

@api_view(['POST'])
@permission_classes([AllowAny]) # O usa [IsAuthenticated] si prefieres
def create_payment_intent(request):
    """
    Crea un intento de pago en la terminal Point Smart.
    Recibe: { "amount": 1500, "deviceId": "YOUR_DEVICE_ID" }
    """
    try:
        # 1. Obtener datos del request
        amount = request.data.get("amount")
        device_id = request.data.get("deviceId")

        if not amount or not device_id:
            return Response({"error": "Faltan datos: amount y deviceId"}, status=status.HTTP_400_BAD_REQUEST)

        # 2. Configurar el SDK de Mercado Pago
        sdk = mercadopago.SDK(settings.MP_ACCESS_TOKEN)

        # 3. Datos para el intento de pago
        payment_intent = {
            "amount": float(amount),
            "description": "Cobro desde App Django",
            "payment_mode": "card_present",
            "device_id": device_id,
        }
        
        # 4. Crear el intento de pago en la API de MP
        result = sdk.point().create_payment_intent(payment_intent)

        if "status_code" in result and result["status_code"] >= 400:
             print(f"[Backend] Error MP: {result['response']}")
             return Response({"error": result["response"]["message"]}, status=status.HTTP_400_BAD_REQUEST)

        # 5. Devolver el ID del intento a React
        intent_id = result["response"]["id"]
        return Response({"intentId": intent_id}, status=status.HTTP_201_CREATED)

    except Exception as e:
        print(f"[Backend] Error interno: {str(e)}")
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny]) # O usa [IsAuthenticated] si prefieres
def check_payment_status(request, intent_id):
    """
    Consulta el estado de un intento de pago.
    Recibe el intent_id en la URL.
    """
    try:
        # 1. Configurar el SDK
        sdk = mercadopago.SDK(settings.MP_ACCESS_TOKEN)

        # 2. Consultar el estado del intento
        result = sdk.point().get_payment_intent(intent_id)

        if "status_code" in result and result["status_code"] >= 400:
             return Response({"error": result["response"]["message"]}, status=status.HTTP_404_NOT_FOUND)

        # 3. Devolver el estado a React
        response_data = result["response"]
        status_str = response_data.get("status") # Ej: 'approved', 'rejected', 'pending'
        
        return Response({
            "status": status_str,
            "paymentData": response_data if status_str == "approved" else None
        }, status=status.HTTP_200_OK)

    except Exception as e:
        print(f"[Backend] Error interno consulta: {str(e)}")
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# --- Endpoint para iniciar pagos con terminal ---
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

# Simulación de SDK (reemplaza por el real)
class TerminalSDK:
    def connect(self):
        # Lógica real de conexión
        return True
    def pay(self, amount):
        # Lógica real de pago
        # Simula respuesta del terminal
        return {"success": True, "message": "Pago aprobado"}
    def disconnect(self):
        # Lógica real de desconexión
        return True

class TerminalPaymentView(APIView):
    def post(self, request):
        amount = request.data.get("amount")
        if not amount:
            return Response({"error": "Falta el monto"}, status=status.HTTP_400_BAD_REQUEST)
        sdk = TerminalSDK()
        if not sdk.connect():
            return Response({"error": "No se pudo conectar al terminal"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        result = sdk.pay(amount)
        sdk.disconnect()
        return Response(result, status=status.HTTP_200_OK if result["success"] else status.HTTP_402_PAYMENT_REQUIRED)

# --- Endpoint protegido de ejemplo ---
from rest_framework.permissions import IsAuthenticated

class ProtectedExampleView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        return Response({"message": "Acceso autorizado, usuario autenticado."})
# IMPORTS NECESARIOS PARA DJANGO
from django.http import JsonResponse, HttpResponseNotAllowed, HttpResponseBadRequest
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Sum, F, Max, Avg, Count
# --- Análisis de Productos ---
@csrf_exempt
def analisis_productos(request):
    if request.method != 'POST':
        return HttpResponseNotAllowed(['POST'])
    try:
        data = json.loads(request.body)
        usuario_id = data.get('usuario_id')
        detalles = data.get('detalles')
        total_venta = data.get('total_venta')
        metodo_pago = data.get('metodo_pago')
        fecha_venta = data.get('fecha_venta')
        terminal_transaction_id = data.get('terminal_transaction_id')
        terminal_response = data.get('terminal_response')
        # ...existing code...
        venta = Venta.objects.create(
            fecha_venta=fecha_venta,
            total_venta=total_venta,
            metodo_pago=metodo_pago,
            usuario_id=usuario_id,
            terminal_transaction_id=terminal_transaction_id if metodo_pago == 'terminal' else None,
            terminal_response=terminal_response if metodo_pago == 'terminal' else None
        )
        # ...existing code...
        return JsonResponse({'venta_id': venta.id}, status=201)
    except Exception as e:
        return HttpResponseBadRequest(str(e))

        # 1. Obtener todos los productos con stock, costo y precio
        productos = Producto.objects.select_related('categoria', 'proveedor').all()
        productos_data = []
        for p in productos:
            productos_data.append({
                'id': p.id,
                'name': p.nombre,
                'stock': p.stock_actual,
                'cost': float(p.precio_compra),
                'price': float(p.precio_venta),
                'category': p.categoria.nombre if p.categoria else None
            })

        # 2. Ventas, ingresos y última venta por producto en el rango
        ventas = (
            DetalleVenta.objects
            .filter(venta__fecha_venta__date__gte=from_date, venta__fecha_venta__date__lt=to_date)
            .values('producto_id')
            .annotate(
                soldMonth=Sum('cantidad_vendida'),
                incomeMonth=Sum(F('cantidad_vendida') * F('precio_unitario_venta')),
                lastSale=Max('venta__fecha_venta')
            )
        )
        ventas_map = {v['producto_id']: v for v in ventas}

        # 3. Productos con baja rotación: stock > 0 y sin ventas en el rango
        low_rotation = [p for p in productos_data if p['stock'] > 0 and (p['id'] not in ventas_map or not ventas_map[p['id']]['soldMonth'])]

        # 4. Margen por producto y redondeo de cantidades
        for p in productos_data:
            v = ventas_map.get(p['id'], {})
            p['soldMonth'] = int(v.get('soldMonth') or 0)
            p['incomeMonth'] = int(v.get('incomeMonth') or 0)
            p['lastSale'] = v.get('lastSale')
            p['margin'] = int(round(((p['price'] - p['cost']) / p['price']) * 100)) if p['price'] else None
            p['marginTotal'] = int(round((p['price'] - p['cost']) * p['soldMonth'])) if p['price'] and p['soldMonth'] else None

        # 5. Productos más vendidos (top 10)
        top_products = sorted(productos_data, key=lambda x: x['soldMonth'], reverse=True)[:10]

        # 6. Productos con mayor ganancia
        top_margin = [p for p in productos_data if p['marginTotal'] is not None]
        top_margin = sorted(top_margin, key=lambda x: x['marginTotal'], reverse=True)[:10]

        # 7. Resumen general
        total_stock = sum(p['stock'] for p in productos_data)
        total_sold = sum(p['soldMonth'] for p in productos_data)
        total_income = sum(p['incomeMonth'] for p in productos_data)
        avg_margin = int(round(sum(p['margin'] or 0 for p in productos_data) / len(productos_data))) if productos_data else None

        return JsonResponse({
            'products': productos_data,
            'topProducts': top_products,
            'topMargin': top_margin,
            'lowRotation': low_rotation,
            'resumen': {
                'totalStock': total_stock,
                'totalSold': total_sold,
                'totalIncome': total_income,
                'avgMargin': avg_margin
            }
        })
    except Exception as e:
        return HttpResponseBadRequest(str(e))
# --- Reporte Diario ---
@csrf_exempt
def reporte_diario(request):
    if request.method != 'GET':
        return HttpResponseNotAllowed(['GET'])
    try:
        from_date = request.GET.get('dateFrom')
        to_date = request.GET.get('dateTo')
        category = request.GET.get('category')
        top_n = int(request.GET.get('topN', 5))
        payment = request.GET.get('payment')
        usuario_id = request.GET.get('usuario')
        from datetime import datetime
        if not from_date:
            from_date = datetime.now().date()
        if not to_date:
            to_date = from_date

        ventas = Venta.objects.filter(fecha_venta__date__gte=from_date, fecha_venta__date__lte=to_date)
        if payment:
            ventas = ventas.filter(metodo_pago__iexact=payment)
        if usuario_id:
            ventas = ventas.filter(usuario_id=usuario_id)

        total_sales = ventas.aggregate(total=Sum('total_venta'))['total'] or 0
        sales_count = ventas.count()
        avg_ticket = ventas.aggregate(avg=Avg('total_venta'))['avg'] or 0

        # Ventas por hora (8 a 19)
        sales_by_hour = [0] * 12
        ventas_por_hora = ventas.extra({'hora': "HOUR(fecha_venta)"}).values_list('hora').annotate(total=Sum('total_venta'))
        for hora, total in ventas_por_hora:
            idx = int(hora) - 8
            if 0 <= idx < 12:
                sales_by_hour[idx] = float(total)

        # Top productos
        from .models import DetalleVenta, Producto
        detalles = DetalleVenta.objects.filter(venta__fecha_venta__date__gte=from_date, venta__fecha_venta__date__lte=to_date)
        if category:
            detalles = detalles.filter(producto__categoria_id=category)
        top_products = (
            detalles
            .values(name=F('producto__nombre'))
            .annotate(sold=Sum('cantidad_vendida'))
            .order_by('-sold')[:top_n]
        )
        top_products = list(top_products)

        # Breakdown por método de pago
        breakdown = (
            ventas.values('metodo_pago')
            .annotate(cantidad=Count('id'), total=Sum('total_venta'))
        )
        breakdown_by_payment = {row['metodo_pago'].lower(): {'cantidad': row['cantidad'], 'total': float(row['total'])} for row in breakdown}

        ventas_list = list(ventas.values('id', 'fecha_venta', 'total_venta', 'metodo_pago', 'usuario_id', 'terminal_transaction_id', 'terminal_response'))
        return JsonResponse({
            'totalSales': float(total_sales),
            'salesCount': sales_count,
            'avgTicket': float(avg_ticket),
            'salesByHour': sales_by_hour,
            'topProducts': top_products,
            'breakdownByPayment': breakdown_by_payment,
            'ventas': ventas_list
        })
    except Exception as e:
        return HttpResponseBadRequest(str(e))
# --- Reporte Semanal ---
@csrf_exempt
def reporte_semanal(request):
    if request.method != 'GET':
        return HttpResponseNotAllowed(['GET'])
    try:
        week = request.GET.get('week')
        if not week:
            return HttpResponseBadRequest('Semana no especificada (formato: 2025-W35)')
        year, week_num = week.split('-W')
        year = int(year)
        week_num = int(week_num)
        from datetime import datetime, timedelta
        # Primer día del año
        first_day = datetime(year, 1, 1) + timedelta(days=(week_num - 1) * 7)
        # Ajustar al lunes de la semana
        day_of_week = first_day.weekday()
        monday = first_day - timedelta(days=day_of_week)
        days = [monday + timedelta(days=i) for i in range(7)]
        from_date = days[0]
        to_date = days[6]

        payment = request.GET.get('payment')
        usuario_id = request.GET.get('usuario')
        ventas = Venta.objects.filter(fecha_venta__date__gte=from_date, fecha_venta__date__lte=to_date)
        if payment:
            ventas = ventas.filter(metodo_pago__iexact=payment)
        if usuario_id:
            ventas = ventas.filter(usuario_id=usuario_id)
        total_sales = ventas.aggregate(total=Sum('total_venta'))['total'] or 0
        sales_count = ventas.count()
        avg_ticket = ventas.aggregate(avg=Avg('total_venta'))['avg'] or 0

        # Ventas por día (lunes a domingo)
        sales_by_day = [0] * 7
        ventas_por_dia = ventas.values_list('fecha_venta__week_day').annotate(total=Sum('total_venta'))
        for dow, total in ventas_por_dia:
            # Django: 1=Domingo, 2=Lunes, ..., 7=Sábado
            idx = 6 if dow == 1 else dow - 2
            if 0 <= idx < 7:
                sales_by_day[idx] = float(total)

        # Top productos
        from .models import DetalleVenta, Producto
        top_products = (
            DetalleVenta.objects
            .filter(venta__fecha_venta__date__gte=from_date, venta__fecha_venta__date__lte=to_date)
            .values(name=F('producto__nombre'))
            .annotate(sold=Sum('cantidad_vendida'))
            .order_by('-sold')[:5]
        )
        top_products = list(top_products)

        # Breakdown por método de pago
        breakdown = (
            ventas.values('metodo_pago')
            .annotate(cantidad=Count('id'), total=Sum('total_venta'))
        )
        breakdown_by_payment = {row['metodo_pago'].lower(): {'cantidad': row['cantidad'], 'total': float(row['total'])} for row in breakdown}

        ventas_list = list(ventas.values('id', 'fecha_venta', 'total_venta', 'metodo_pago', 'usuario_id', 'terminal_transaction_id', 'terminal_response'))
        return JsonResponse({
            'totalSales': float(total_sales),
            'salesCount': sales_count,
            'avgTicket': float(avg_ticket),
            'salesByDay': sales_by_day,
            'topProducts': top_products,
            'breakdownByPayment': breakdown_by_payment,
            'ventas': ventas_list
        })
    except Exception as e:
        return HttpResponseBadRequest(str(e))
# --- Reporte Mensual ---
from django.db.models import Sum, Avg, Count, F, Max
from datetime import datetime, timedelta

@csrf_exempt
def reporte_mensual(request):
    if request.method != 'GET':
        return HttpResponseNotAllowed(['GET'])
    try:
        month = int(request.GET.get('month', datetime.now().month))
        year = int(request.GET.get('year', datetime.now().year))
        from_date = datetime(year, month, 1)
        # último día del mes
        if month == 12:
            to_date = datetime(year + 1, 1, 1) - timedelta(days=1)
        else:
            to_date = datetime(year, month + 1, 1) - timedelta(days=1)

        payment = request.GET.get('payment')
        usuario_id = request.GET.get('usuario')
        ventas = Venta.objects.filter(fecha_venta__date__gte=from_date, fecha_venta__date__lte=to_date)
        if payment:
            ventas = ventas.filter(metodo_pago__iexact=payment)
        if usuario_id:
            ventas = ventas.filter(usuario_id=usuario_id)
        total_sales = ventas.aggregate(total=Sum('total_venta'))['total'] or 0
        sales_count = ventas.count()
        avg_ticket = ventas.aggregate(avg=Avg('total_venta'))['avg'] or 0

        # Ventas por día
        sales_by_day = [0] * to_date.day
        ventas_por_dia = ventas.values_list('fecha_venta__day').annotate(total=Sum('total_venta'))
        for dia, total in ventas_por_dia:
            if 1 <= dia <= to_date.day:
                sales_by_day[dia - 1] = float(total)

        # Top productos
        from .models import DetalleVenta, Producto
        top_products = (
            DetalleVenta.objects
            .filter(venta__fecha_venta__date__gte=from_date, venta__fecha_venta__date__lte=to_date)
            .values(name=F('producto__nombre'))
            .annotate(sold=Sum('cantidad_vendida'))
            .order_by('-sold')[:5]
        )
        top_products = list(top_products)

        # Breakdown por método de pago
        breakdown = (
            ventas.values('metodo_pago')
            .annotate(cantidad=Count('id'), total=Sum('total_venta'))
        )
        breakdown_by_payment = {row['metodo_pago'].lower(): {'cantidad': row['cantidad'], 'total': float(row['total'])} for row in breakdown}

        ventas_list = list(ventas.values('id', 'fecha_venta', 'total_venta', 'metodo_pago', 'usuario_id', 'terminal_transaction_id', 'terminal_response'))
        return JsonResponse({
            'totalSales': float(total_sales),
            'salesCount': sales_count,
            'avgTicket': float(avg_ticket),
            'salesByDay': sales_by_day,
            'topProducts': top_products,
            'breakdownByPayment': breakdown_by_payment,
            'ventas': ventas_list
        })
    except Exception as e:
        return HttpResponseBadRequest(str(e))
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import Venta, DetalleVenta, Producto, Usuario
import json
from django.utils.dateparse import parse_datetime

@csrf_exempt
def crear_venta_simple(request):
    if request.method == 'POST':
        try:
            # Obtener datos del POST
            fecha_venta = request.POST.get('fecha_venta')
            total_venta = request.POST.get('total_venta')
            metodo_pago = request.POST.get('metodo_pago')
            usuario_id = request.POST.get('usuario_id')
            producto_id = request.POST.get('producto_id')
            cantidad = request.POST.get('cantidad')
            precio_unitario = request.POST.get('precio_unitario')

            # Validaciones básicas
            if not all([fecha_venta, total_venta, metodo_pago, usuario_id, producto_id, cantidad, precio_unitario]):
                return JsonResponse({'error': 'Faltan datos obligatorios.'}, status=400)

            usuario = Usuario.objects.get(id=usuario_id)
            producto = Producto.objects.get(id=producto_id)

            # Crear la venta
            venta = Venta.objects.create(
                fecha_venta=parse_datetime(fecha_venta),
                total_venta=total_venta,
                metodo_pago=metodo_pago,
                usuario=usuario
            )

            # Crear el detalle de venta
            detalle = DetalleVenta.objects.create(
                venta=venta,
                producto=producto,
                cantidad_vendida=cantidad,
                precio_unitario_venta=precio_unitario,
                subtotal=float(precio_unitario) * float(cantidad)
            )

            # Actualizar stock
            producto.stock_actual = producto.stock_actual - int(cantidad)
            producto.save()

            # Respuesta anidada
            return JsonResponse({
                'id': venta.id,
                'fecha_venta': venta.fecha_venta,
                'total_venta': venta.total_venta,
                'metodo_pago': venta.metodo_pago,
                'usuario': venta.usuario.username,
                'detalles': [{
                    'id': detalle.id,
                    'producto': {
                        'id': producto.id,
                        'nombre': producto.nombre,
                        'descripcion': producto.descripcion,
                        'precio_venta': producto.precio_venta,
                        'stock_actual': producto.stock_actual
                    },
                    'cantidad_vendida': detalle.cantidad_vendida,
                    'precio_unitario_venta': detalle.precio_unitario_venta,
                    'subtotal': detalle.subtotal
                }]
            })
        except Usuario.DoesNotExist:
            return JsonResponse({'error': 'Usuario no encontrado.'}, status=404)
        except Producto.DoesNotExist:
            return JsonResponse({'error': 'Producto no encontrado.'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    else:
        return JsonResponse({'error': 'Método no permitido.'}, status=405)
from django.http import JsonResponse, HttpResponseNotAllowed, HttpResponseBadRequest
from django.views.decorators.csrf import csrf_exempt
from .models import Producto, Categoria, Proveedor, Venta, DetalleVenta
from .models import CategoriaGasto, Gasto, Compra, DetalleCompra
import json

def get_request_data(request):
    if request.content_type == 'application/json':
        try:
            return json.loads(request.body)
        except Exception:
            return {}
    else:
        return request.POST.dict()

# ---- Producto ----
# Endpoint CRUD para Productos
@csrf_exempt
def productos_list(request):
    if request.method == 'GET':
        productos = Producto.objects.select_related('categoria').all()
        productos_list = []
        for p in productos:
            productos_list.append({
                'id': p.id,
                'codigo_producto': p.id,  # No existe campo, se usa id como código
                'codigo_barra': p.codigo_barra,
                'nombre': p.nombre,
                'descripcion': p.descripcion,
                'precio_compra': float(p.precio_compra),
                'precio_venta': float(p.precio_venta),
                'stock_actual': p.stock_actual,
                'stock_minimo': p.stock_minimo,
                'unidad_medida': p.unidad_medida,
                'id_categoria': p.categoria.id if p.categoria else None,
                'codigo_categoria': p.categoria.id if p.categoria else '',
                'nombre_categoria': p.categoria.nombre if p.categoria else '',
                'nombre_proveedor': p.proveedor.nombre if getattr(p, 'proveedor', None) else '',
                'fecha_vencimiento': p.fecha_vencimiento.isoformat() if getattr(p, 'fecha_vencimiento', None) else '',
            })
        return JsonResponse(productos_list, safe=False)
    elif request.method == 'POST':
        try:
            data = get_request_data(request)
            serializer = ProductoSerializer(data=data)
            if serializer.is_valid():
                producto = serializer.save()
                return JsonResponse({
                    'id': producto.id,
                    'codigo_barra': producto.codigo_barra
                }, status=201)
            else:
                return HttpResponseBadRequest(serializer.errors)
        except Exception as e:
            return HttpResponseBadRequest(str(e))
    else:
        return HttpResponseNotAllowed(['GET', 'POST'])

# Endpoint CRUD para detalle de Producto
@csrf_exempt
def producto_detail(request, pk):
    try:
        producto = Producto.objects.get(pk=pk)
    except Producto.DoesNotExist:
        return JsonResponse({'error': 'Producto no encontrado'}, status=404)

    if request.method == 'GET':
        return JsonResponse({
            'id': producto.id,
            'nombre': producto.nombre,
            'descripcion': producto.descripcion,
            'categoria': producto.categoria_id,
            'precio_compra': float(producto.precio_compra),
            'precio_venta': float(producto.precio_venta),
            'stock_actual': producto.stock_actual,
            'stock_minimo': producto.stock_minimo,
            'unidad_medida': producto.unidad_medida,
            'creado_en': producto.creado_en,
        })
    elif request.method == 'PUT':
        try:
            data = get_request_data(request)
            producto.nombre = data.get('nombre', producto.nombre)
            producto.descripcion = data.get('descripcion', producto.descripcion)
            producto.categoria_id = data.get('categoria', producto.categoria_id)
            producto.precio_compra = data.get('precio_compra', producto.precio_compra)
            producto.precio_venta = data.get('precio_venta', producto.precio_venta)
            producto.stock_actual = data.get('stock_actual', producto.stock_actual)
            producto.stock_minimo = data.get('stock_minimo', producto.stock_minimo)
            producto.unidad_medida = data.get('unidad_medida', producto.unidad_medida)
            # Normaliza y valida codigo_barra si viene en el request
            if 'codigo_barra' in data:
                nuevo_codigo = data.get('codigo_barra', producto.codigo_barra)
                if isinstance(nuevo_codigo, str):
                    nuevo_codigo = nuevo_codigo.strip().lower()
                # Verifica unicidad excluyendo el propio producto
                if Producto.objects.filter(codigo_barra__iexact=nuevo_codigo).exclude(pk=producto.pk).exists():
                    return HttpResponseBadRequest('El código de barras ya existe en otro producto.')
                producto.codigo_barra = nuevo_codigo
            producto.save()
            return JsonResponse({'ok': True})
        except Exception as e:
            return HttpResponseBadRequest(str(e))
    elif request.method == 'DELETE':
        producto.delete()
        return JsonResponse({'ok': True})
    else:
        return HttpResponseNotAllowed(['GET', 'PUT', 'DELETE'])
# Entidad 5: Usuario
# =============================
@csrf_exempt
def usuarios_list(request):
    if request.method == 'GET':
        usuarios = Usuario.objects.all().values('id', 'username', 'rol', 'creado_en')
        return JsonResponse(list(usuarios), safe=False)
    elif request.method == 'POST':
        try:
            data = get_request_data(request)
            username = data.get('username')
            password = data.get('password')
            rol = data.get('rol', 'cajero')
            if not username or not password:
                return JsonResponse({'error': 'username y password son obligatorios.'}, status=400)
            if Usuario.objects.filter(username=username).exists():
                return JsonResponse({'error': 'El usuario ya existe.'}, status=400)
            usuario = Usuario.objects.create_user(username=username, password=password, rol=rol)
            return JsonResponse({'id': usuario.id, 'username': usuario.username, 'rol': usuario.rol}, status=201)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    return JsonResponse({'error': 'Método no permitido.'}, status=405)

@csrf_exempt
def usuario_detail(request, pk):
    if request.method == 'GET':
        try:
            usuario = Usuario.objects.values('id', 'username', 'rol', 'creado_en').get(pk=pk)
            return JsonResponse(usuario, safe=False)
        except Usuario.DoesNotExist:
            return JsonResponse({'error': 'Usuario no encontrado.'}, status=404)
    return JsonResponse({'error': 'Método no permitido.'}, status=405)
# Entidad 2: Categoría
# =============================

# ---- Categoria ----
# Endpoint CRUD para Categorías
@csrf_exempt
def categorias_list(request):
    if request.method == 'GET':
        categorias = [
            {
                "id": c.id,
                "codigo_categoria": c.id,  # o algún código si tienes
                "nombre_categoria": c.nombre
            }
            for c in Categoria.objects.all()
        ]
        return JsonResponse(categorias, safe=False)
    elif request.method == 'POST':
        try:
            data = get_request_data(request)
            nombre = data.get('nombre') or data.get('nombre_categoria') or ''
            descripcion = data.get('descripcion', '')
            categoria = Categoria.objects.create(
                nombre=nombre,
                descripcion=descripcion
            )
            return JsonResponse({
                'id': categoria.id,
                'nombre': categoria.nombre,
                'nombre_categoria': categoria.nombre,
                'descripcion': categoria.descripcion
            }, status=201)
        except Exception as e:
            return HttpResponseBadRequest(str(e))
    else:
        return HttpResponseNotAllowed(['GET', 'POST'])

# Endpoint CRUD para detalle de Categoría
@csrf_exempt
def categoria_detail(request, pk):
    try:
        categoria = Categoria.objects.get(pk=pk)
    except Categoria.DoesNotExist:
        return JsonResponse({'error': 'Categoria no encontrada'}, status=404)

    if request.method == 'GET':
        productos = list(Producto.objects.filter(categoria=categoria).values('id', 'nombre'))
        return JsonResponse({
            'id': categoria.id,
            'nombre': categoria.nombre,
            'descripcion': categoria.descripcion,
            'productos': productos
        })
    elif request.method == 'PUT':
        try:
            data = get_request_data(request)
            categoria.nombre = data.get('nombre', categoria.nombre)
            categoria.descripcion = data.get('descripcion', categoria.descripcion)
            categoria.save()
            return JsonResponse({'ok': True})
        except Exception as e:
            return HttpResponseBadRequest(str(e))
        except Exception as e:
            return HttpResponseBadRequest(str(e))
    elif request.method == 'DELETE':
        # Validar si la categoría tiene productos asociados
        if Producto.objects.filter(categoria=categoria).exists():
            return JsonResponse({'error': 'No se puede eliminar la categoría porque tiene productos asociados.'}, status=400)
        categoria.delete()
        return JsonResponse({'ok': True})
    else:
        return HttpResponseNotAllowed(['GET', 'PUT', 'DELETE'])

# =============================
# Entidad 3: Proveedor
# =============================

# ---- Proveedor ----
# Endpoint CRUD para Proveedores
@csrf_exempt
def proveedores_list(request):
    if request.method == 'GET':
        proveedores = list(Proveedor.objects.values())
        return JsonResponse(proveedores, safe=False)
    elif request.method == 'POST':
        try:
            data = get_request_data(request)
            proveedor = Proveedor.objects.create(
                nombre=data.get('nombre'),
                contacto=data.get('contacto'),
                telefono=data.get('telefono'),
                email=data.get('email'),
                direccion=data.get('direccion')
            )
            return JsonResponse({'id': proveedor.id}, status=201)
        except Exception as e:
            return HttpResponseBadRequest(str(e))
    else:
        return HttpResponseNotAllowed(['GET', 'POST'])

# Endpoint CRUD para detalle de Proveedor
@csrf_exempt
def proveedor_detail(request, pk):
    try:
        proveedor = Proveedor.objects.get(pk=pk)
    except Proveedor.DoesNotExist:
        return JsonResponse({'error': 'Proveedor no encontrado'}, status=404)

    if request.method == 'GET':
        return JsonResponse({
            'id': proveedor.id,
            'nombre': proveedor.nombre,
            'contacto': proveedor.contacto,
            'telefono': proveedor.telefono,
            'email': proveedor.email,
            'direccion': proveedor.direccion
        })
    elif request.method == 'PUT':
        try:
            data = get_request_data(request)
            proveedor.nombre = data.get('nombre', proveedor.nombre)
            proveedor.contacto = data.get('contacto', proveedor.contacto)
            proveedor.telefono = data.get('telefono', proveedor.telefono)
            proveedor.email = data.get('email', proveedor.email)
            proveedor.direccion = data.get('direccion', proveedor.direccion)
            proveedor.save()
            return JsonResponse({'ok': True})
        except Exception as e:
            return HttpResponseBadRequest(str(e))
    elif request.method == 'DELETE':
        proveedor.delete()
        return JsonResponse({'ok': True})
    else:
        return HttpResponseNotAllowed(['GET', 'PUT', 'DELETE'])

# =============================
# Entidad 4: Venta
# =============================

# ---- Venta ----
# Endpoint CRUD para Ventas
@csrf_exempt
def ventas_list(request):
    if request.method == 'GET':
        ventas = list(Venta.objects.values())
        return JsonResponse(ventas, safe=False)
    elif request.method == 'POST':
        from django.db import transaction
        try:
            data = get_request_data(request)
            detalles = data.get('detalles')
            if detalles and isinstance(detalles, str):
                import json as _json
                detalles = _json.loads(detalles)
            if not detalles or not isinstance(detalles, list) or len(detalles) == 0:
                return HttpResponseBadRequest('Se requiere una lista de productos para la venta.')
            with transaction.atomic():
                total_venta = 0
                venta = Venta.objects.create(
                    fecha_venta=data.get('fecha_venta'),
                    total_venta=0,  # Se actualizará después
                    metodo_pago=data.get('metodo_pago', ''),
                    usuario_id=data.get('usuario_id'),
                )
                for detalle in detalles:
                    producto_id = detalle.get('producto')
                    cantidad = int(detalle.get('cantidad_vendida', 0))
                    producto = Producto.objects.select_for_update().get(id=producto_id)
                    if producto.stock_actual < cantidad:
                        raise Exception(f'Stock insuficiente para el producto: {producto.nombre}')
                    subtotal = float(detalle.get('precio_unitario_venta', producto.precio_venta)) * cantidad
                    total_venta += subtotal
                    DetalleVenta.objects.create(
                        venta=venta,
                        producto=producto,
                        cantidad_vendida=cantidad,
                        precio_unitario_venta=detalle.get('precio_unitario_venta', producto.precio_venta),
                        subtotal=subtotal
                    )
                    producto.stock_actual = producto.stock_actual - cantidad
                    producto.save()
                venta.total_venta = total_venta
                venta.save()
            return JsonResponse({'id': venta.id}, status=201)
        except Exception as e:
            return HttpResponseBadRequest(str(e))
    else:
        return HttpResponseNotAllowed(['GET', 'POST'])

# Endpoint CRUD para detalle de Venta
@csrf_exempt
def venta_detail(request, pk):
    try:
        venta = Venta.objects.get(pk=pk)
    except Venta.DoesNotExist:
        return JsonResponse({'error': 'Venta no encontrada'}, status=404)

    if request.method == 'GET':
        detalles = list(DetalleVenta.objects.filter(venta=venta).values(
            'id', 'producto_id', 'cantidad_vendida', 'precio_unitario_venta', 'subtotal'))
        return JsonResponse({
            'id': venta.id,
            'fecha_venta': venta.fecha_venta,
            'total_venta': float(venta.total_venta),
            'metodo_pago': venta.metodo_pago,
            'usuario_id': venta.usuario_id,
            'creado_en': venta.creado_en,
            'detalles': detalles
        })
    elif request.method == 'PUT':
        try:
            data = get_request_data(request)
            venta.fecha_venta = data.get('fecha_venta', venta.fecha_venta)
            venta.total_venta = data.get('total_venta', venta.total_venta)
            venta.metodo_pago = data.get('metodo_pago', venta.metodo_pago)
            venta.usuario_id = data.get('usuario_id', venta.usuario_id)
            venta.save()
            return JsonResponse({'ok': True})
        except Exception as e:
            return HttpResponseBadRequest(str(e))
    elif request.method == 'DELETE':
        venta.delete()
        return JsonResponse({'ok': True})
    else:
        return HttpResponseNotAllowed(['GET', 'PUT', 'DELETE'])

# --- EXTRAS ---
# Endpoint CRUD para CategoriaGasto
@csrf_exempt
def categorias_gasto_list(request):
    if request.method == 'GET':
        categorias = list(CategoriaGasto.objects.values())
        return JsonResponse(categorias, safe=False)
    elif request.method == 'POST':
        try:
            data = get_request_data(request)
            categoria = CategoriaGasto.objects.create(
                nombre=data.get('nombre', ''),
                descripcion=data.get('descripcion', '')
            )
            return JsonResponse({'id': categoria.id}, status=201)
        except Exception as e:
            return HttpResponseBadRequest(str(e))
    else:
        return HttpResponseNotAllowed(['GET', 'POST'])

# Endpoint CRUD para detalle de CategoriaGasto
@csrf_exempt
def categoria_gasto_detail(request, pk):
    try:
        categoria = CategoriaGasto.objects.get(pk=pk)
    except CategoriaGasto.DoesNotExist:
        return JsonResponse({'error': 'CategoriaGasto no encontrada'}, status=404)

    if request.method == 'GET':
        return JsonResponse({'id': categoria.id, 'nombre': categoria.nombre, 'descripcion': categoria.descripcion})
    elif request.method == 'PUT':
        try:
            data = get_request_data(request)
            categoria.nombre = data.get('nombre', categoria.nombre)
            categoria.descripcion = data.get('descripcion', categoria.descripcion)
            categoria.save()
            return JsonResponse({'ok': True})
        except Exception as e:
            return HttpResponseBadRequest(str(e))
    elif request.method == 'DELETE':
        categoria.delete()
        return JsonResponse({'ok': True})
    else:
        return HttpResponseNotAllowed(['GET', 'PUT', 'DELETE'])

# Endpoint CRUD para Gastos
@csrf_exempt
def gastos_list(request):
    if request.method == 'GET':
        gastos = list(Gasto.objects.values())
        return JsonResponse(gastos, safe=False)
    elif request.method == 'POST':
        try:
            data = get_request_data(request)
            gasto = Gasto.objects.create(
                fecha=data.get('fecha'),
                categoria_id=data.get('categoria'),
                monto=data.get('monto', 0),
                metodo_pago=data.get('metodo_pago', ''),
                descripcion=data.get('descripcion', ''),
                usuario_id=data.get('usuario'),
                comprobante_url=data.get('comprobante_url', None)
            )
            return JsonResponse({'id': gasto.id}, status=201)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
    else:
        return HttpResponseNotAllowed(['GET', 'POST'])

# Endpoint CRUD para detalle de Gasto
@csrf_exempt
def gasto_detail(request, pk):
    try:
        gasto = Gasto.objects.get(pk=pk)
    except Gasto.DoesNotExist:
        return JsonResponse({'error': 'Gasto no encontrado'}, status=404)

    if request.method == 'GET':
        return JsonResponse({
            'id': gasto.id,
            'fecha': gasto.fecha,
            'categoria': gasto.categoria_id,
            'monto': float(gasto.monto),
            'metodo_pago': gasto.metodo_pago,
            'descripcion': gasto.descripcion,
            'usuario': gasto.usuario_id,
            'comprobante_url': gasto.comprobante_url,
            'creado_en': gasto.creado_en
        })
    elif request.method == 'PUT':
        try:
            data = get_request_data(request)
            gasto.fecha = data.get('fecha', gasto.fecha)
            gasto.categoria_id = data.get('categoria', gasto.categoria_id)
            gasto.monto = data.get('monto', gasto.monto)
            gasto.metodo_pago = data.get('metodo_pago', gasto.metodo_pago)
            gasto.descripcion = data.get('descripcion', gasto.descripcion)
            gasto.usuario_id = data.get('usuario', gasto.usuario_id)
            gasto.comprobante_url = data.get('comprobante_url', gasto.comprobante_url)
            gasto.save()
            return JsonResponse({'ok': True})
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
    elif request.method == 'DELETE':
        try:
            gasto.delete()
            return JsonResponse({'ok': True})
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
    else:
        return HttpResponseNotAllowed(['GET', 'PUT', 'DELETE'])

# Endpoint CRUD para Compras
@csrf_exempt
def compras_list(request):
    if request.method == 'GET':
        compras = list(Compra.objects.values())
        return JsonResponse(compras, safe=False)
    elif request.method == 'POST':
        try:
            data = get_request_data(request)
            compra = Compra.objects.create(
                fecha_compra=data.get('fecha_compra'),
                proveedor_id=data.get('proveedor'),
                total_compra=data.get('total_compra', 0),
                usuario_id=data.get('usuario')
            )
            return JsonResponse({'id': compra.id}, status=201)
        except Exception as e:
            return HttpResponseBadRequest(str(e))
    else:
        return HttpResponseNotAllowed(['GET', 'POST'])

# Endpoint CRUD para detalle de Compra
@csrf_exempt
def compra_detail(request, pk):
    try:
        compra = Compra.objects.get(pk=pk)
    except Compra.DoesNotExist:
        return JsonResponse({'error': 'Compra no encontrada'}, status=404)

    if request.method == 'GET':
        detalles = list(DetalleCompra.objects.filter(compra=compra).values(
            'id', 'producto_id', 'cantidad', 'precio_unitario', 'subtotal'))
        return JsonResponse({
            'id': compra.id,
            'fecha_compra': compra.fecha_compra,
            'proveedor': compra.proveedor_id,
            'total_compra': float(compra.total_compra),
            'usuario': compra.usuario_id,
            'detalles': detalles
        })
    elif request.method == 'PUT':
        try:
            data = get_request_data(request)
            compra.fecha_compra = data.get('fecha_compra', compra.fecha_compra)
            compra.proveedor_id = data.get('proveedor', compra.proveedor_id)
            compra.total_compra = data.get('total_compra', compra.total_compra)
            compra.usuario_id = data.get('usuario', compra.usuario_id)
            compra.save()
            return JsonResponse({'ok': True})
        except Exception as e:
            return HttpResponseBadRequest(str(e))
    elif request.method == 'DELETE':
        compra.delete()
        return JsonResponse({'ok': True})
    else:
        return HttpResponseNotAllowed(['GET', 'PUT', 'DELETE'])

# Endpoint CRUD para DetalleCompra
@csrf_exempt
def detalle_compras_list(request):
    if request.method == 'GET':
        detalles = list(DetalleCompra.objects.values())
        return JsonResponse(detalles, safe=False)
    elif request.method == 'POST':
        try:
            data = get_request_data(request)
            detalle = DetalleCompra.objects.create(
                compra_id=data.get('compra'),
                producto_id=data.get('producto'),
                cantidad=data.get('cantidad', 0),
                precio_unitario=data.get('precio_unitario', 0),
                subtotal=data.get('subtotal', 0)
            )
            return JsonResponse({'id': detalle.id}, status=201)
        except Exception as e:
            return HttpResponseBadRequest(str(e))
    else:
        return HttpResponseNotAllowed(['GET', 'POST'])

# Endpoint CRUD para detalle de DetalleCompra
@csrf_exempt
def detalle_compra_detail(request, pk):
    try:
        detalle = DetalleCompra.objects.get(pk=pk)
    except DetalleCompra.DoesNotExist:
        return JsonResponse({'error': 'DetalleCompra no encontrado'}, status=404)

    if request.method == 'GET':
        return JsonResponse({
            'id': detalle.id,
            'compra': detalle.compra_id,
            'producto': detalle.producto_id,
            'cantidad': detalle.cantidad,
            'precio_unitario': float(detalle.precio_unitario),
            'subtotal': float(detalle.subtotal)
        })
    elif request.method == 'PUT':
        try:
            data = get_request_data(request)
            detalle.compra_id = data.get('compra', detalle.compra_id)
            detalle.producto_id = data.get('producto', detalle.producto_id)
            detalle.cantidad = data.get('cantidad', detalle.cantidad)
            detalle.precio_unitario = data.get('precio_unitario', detalle.precio_unitario)
            detalle.subtotal = data.get('subtotal', detalle.subtotal)
            detalle.save()
            return JsonResponse({'ok': True})
        except Exception as e:
            return HttpResponseBadRequest(str(e))
    elif request.method == 'DELETE':
        detalle.delete()
        return JsonResponse({'ok': True})
    else:
        return HttpResponseNotAllowed(['GET', 'PUT', 'DELETE'])

# Endpoint CRUD para DetalleVenta (EXTRA)
@csrf_exempt
def detalle_ventas_list(request):
    if request.method == 'GET':
        detalles = list(DetalleVenta.objects.values())
        return JsonResponse(detalles, safe=False)
    elif request.method == 'POST':
        try:
            data = get_request_data(request)
            detalle = DetalleVenta.objects.create(
                venta_id=data.get('venta'),
                producto_id=data.get('producto'),
                cantidad_vendida=data.get('cantidad_vendida', 0),
                precio_unitario_venta=data.get('precio_unitario_venta', 0),
                subtotal=data.get('subtotal', 0)
            )
            # Restar stock al producto vendido
            producto = Producto.objects.get(id=data.get('producto'))
            producto.stock_actual = producto.stock_actual - int(data.get('cantidad_vendida', 0))
            producto.save()
            return JsonResponse({'id': detalle.id}, status=201)
        except Exception as e:
            return HttpResponseBadRequest(str(e))
    else:
        return HttpResponseNotAllowed(['GET', 'POST'])
