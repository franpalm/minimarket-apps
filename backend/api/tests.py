
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from .models import Caja, Venta, Gasto, Maquina, CategoriaGasto
from django.utils import timezone

class CajaSummaryTestCase(TestCase):
	def setUp(self):
		User = get_user_model()
		self.user = User.objects.create_user(username='testuser', password='testpass', is_active=True)
		self.maquina = Maquina.objects.create(nombre='tuu')
		self.client = APIClient()
		self.client.force_authenticate(user=self.user)

	def test_cerrar_caja_summary(self):
		# Abrir caja
		response = self.client.post('/api/cajas/abrir/', {
			'maquina': self.maquina.id,
			'monto_inicial': 10000
		})
		self.assertEqual(response.status_code, 200)
		caja_id = response.data['id']
		caja = Caja.objects.get(id=caja_id)

		# Crear ventas y gastos en el rango de la caja
		Venta.objects.create(
			fecha_venta=timezone.now(),
			total_venta=5000,
			metodo_pago='efectivo',
			usuario=self.user,
			maquina=self.maquina
		)
		Venta.objects.create(
			fecha_venta=timezone.now(),
			total_venta=3000,
			metodo_pago='terminal',
			usuario=self.user,
			maquina=self.maquina
		)
		Gasto.objects.create(
			fecha=timezone.now().date(),
			monto=2000,
			metodo_pago='efectivo',
			usuario=self.user,
			creado_en=timezone.now()
		)

		# Cerrar caja
		response = self.client.post(f'/api/cajas/{caja_id}/cerrar/', {
			'monto_final': 18000,
			'observaciones': 'Cierre de prueba'
		})
		self.assertEqual(response.status_code, 200)
		resumen = response.data['resumen']
		self.assertEqual(resumen['ventas_total'], 8000.0)
		self.assertEqual(resumen['ventas_efectivo'], 5000.0)
		self.assertEqual(resumen['ventas_terminal'], 3000.0)
		self.assertEqual(resumen['gastos'], 2000.0)
		self.assertEqual(resumen['diferencia'], 6000.0)


class GastoAPITestCase(TestCase):
	def setUp(self):
		User = get_user_model()
		self.user = User.objects.create_user(username='gastouser', password='gastopass', is_active=True)
		self.client = APIClient()
		self.categoria, _ = CategoriaGasto.objects.get_or_create(nombre='Servicios')

	def test_list_includes_categoria_metadata(self):
		Gasto.objects.create(
			fecha=timezone.now().date(),
			categoria=self.categoria,
			monto=5000,
			metodo_pago='Efectivo',
			descripcion='Cuenta de luz',
			usuario=self.user
		)
		response = self.client.get('/api/gastos/')
		self.assertEqual(response.status_code, 200)
		payload = response.json()
		self.assertEqual(len(payload), 1)
		self.assertEqual(payload[0]['categoria'], self.categoria.id)
		self.assertEqual(payload[0]['categoria_id'], self.categoria.id)
		self.assertEqual(payload[0]['categoria_nombre'], self.categoria.nombre)

	def test_create_requires_categoria(self):
		response = self.client.post(
			'/api/gastos/',
			{
				'fecha': timezone.now().date().isoformat(),
				'monto': 7500,
				'metodo_pago': 'Efectivo',
				'descripcion': 'Sin categoria'
			},
			format='json'
		)
		self.assertEqual(response.status_code, 400)
		self.assertIn('categoria', response.json())

	def test_create_returns_categoria_metadata(self):
		response = self.client.post(
			'/api/gastos/',
			{
				'fecha': timezone.now().date().isoformat(),
				'categoria': self.categoria.id,
				'monto': 12345,
				'metodo_pago': 'Transferencia',
				'descripcion': 'Pago de servicios',
				'usuario': self.user.id
			},
			format='json'
		)
		self.assertEqual(response.status_code, 201)
		body = response.json()
		self.assertEqual(body['categoria'], self.categoria.id)
		self.assertEqual(body['categoria_nombre'], self.categoria.nombre)
		self.assertEqual(body['categoria_id'], self.categoria.id)

	def test_create_accepts_categoria_nombre(self):
		response = self.client.post(
			'/api/gastos/',
			{
				'fecha': timezone.now().date().isoformat(),
				'monto': 8800,
				'metodo_pago': 'Efectivo',
				'descripcion': 'Con nombre de categoria',
				'categoria_nombre': 'Servicios'
			},
			format='json'
		)
		self.assertEqual(response.status_code, 201)
		body = response.json()
		self.assertEqual(body['categoria'], self.categoria.id)
		self.assertEqual(body['categoria_nombre'], self.categoria.nombre)

	def test_create_creates_categoria_when_name_missing(self):
		response = self.client.post(
			'/api/gastos/',
			{
				'fecha': timezone.now().date().isoformat(),
				'monto': 6400,
				'metodo_pago': 'Transferencia',
				'descripcion': 'Nueva categoria por nombre',
				'categoria_nombre': 'Publicidad'
			},
			format='json'
		)
		self.assertEqual(response.status_code, 201)
		body = response.json()
		self.assertEqual(body['categoria_nombre'], 'Publicidad')
		self.assertTrue(CategoriaGasto.objects.filter(nombre='Publicidad').exists())
