# --- Endpoint protegido de ejemplo ---
from rest_framework.views import APIView
from rest_framework.response import Response
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
    if request.method != 'GET':
        return HttpResponseNotAllowed(['GET'])
    try:
        month = request.GET.get('month')
        year = request.GET.get('year')
        date_from = request.GET.get('dateFrom')
        date_to = request.GET.get('dateTo')
        from datetime import datetime
        from .models import Producto, DetalleVenta, Categoria
        if date_from and date_to:
            from_date = date_from
            to_date = date_to
        else:
            now = datetime.now()
            month = int(month) if month else now.month
            year = int(year) if year else now.year
            from_date = f"{year}-{str(month).zfill(2)}-01"
            if month == 12:
                to_date = f"{year+1}-01-01"
            else:
                to_date = f"{year}-{str(month+1).zfill(2)}-01"

        # 1. Obtener todos los productos con stock, costo y precio
        productos = Producto.objects.select_related('categoria').all()
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
        from datetime import datetime
        if not from_date:
            from_date = datetime.now().date()
        if not to_date:
            to_date = from_date

        ventas = Venta.objects.filter(fecha_venta__date__gte=from_date, fecha_venta__date__lte=to_date)
        if payment:
            ventas = ventas.filter(metodo_pago__iexact=('Efectivo' if payment == 'cash' else 'Transferencia'))

        total_sales = ventas.aggregate(total=Sum('total_venta'))['total'] or 0
        sales_count = ventas.count()
        avg_ticket = ventas.aggregate(avg=Avg('total_venta'))['avg'] or 0

        # Ventas por hora (8 a 19)
        sales_by_hour = [0] * 12
        ventas_por_hora = ventas.extra({'hora': "strftime('%%H', fecha_venta)"}).values_list('hora').annotate(total=Sum('total_venta'))
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

        return JsonResponse({
            'totalSales': float(total_sales),
            'salesCount': sales_count,
            'avgTicket': float(avg_ticket),
            'salesByHour': sales_by_hour,
            'topProducts': top_products,
            'breakdownByPayment': breakdown_by_payment
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

        ventas = Venta.objects.filter(fecha_venta__date__gte=from_date, fecha_venta__date__lte=to_date)
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

        return JsonResponse({
            'totalSales': float(total_sales),
            'salesCount': sales_count,
            'avgTicket': float(avg_ticket),
            'salesByDay': sales_by_day,
            'topProducts': top_products,
            'breakdownByPayment': breakdown_by_payment
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

        ventas = Venta.objects.filter(fecha_venta__date__gte=from_date, fecha_venta__date__lte=to_date)
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

        return JsonResponse({
            'totalSales': float(total_sales),
            'salesCount': sales_count,
            'avgTicket': float(avg_ticket),
            'salesByDay': sales_by_day,
            'topProducts': top_products,
            'breakdownByPayment': breakdown_by_payment
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
                'nombre_proveedor': 'N/A',  # Siempre 'N/A' ya que no hay proveedor directo
                'fecha_vencimiento': '', # No hay campo en modelo
            })
        return JsonResponse(productos_list, safe=False)
    elif request.method == 'POST':
        try:
            data = get_request_data(request)
            producto = Producto.objects.create(
                nombre=data.get('nombre', ''),
                descripcion=data.get('descripcion', ''),
                categoria_id=data.get('categoria'),
                precio_compra=data.get('precio_compra', 0),
                precio_venta=data.get('precio_venta', 0),
                stock_actual=data.get('stock_actual', 0),
                stock_minimo=data.get('stock_minimo', 0),
                unidad_medida=data.get('unidad_medida', '')
            )
            return JsonResponse({'id': producto.id}, status=201)
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
            categoria = Categoria.objects.create(
                nombre=data.get('nombre', ''),
                descripcion=data.get('descripcion', '')
            )
            return JsonResponse({'id': categoria.id}, status=201)
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
            return HttpResponseBadRequest(str(e))
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
            return HttpResponseBadRequest(str(e))
    elif request.method == 'DELETE':
        gasto.delete()
        return JsonResponse({'ok': True})
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
