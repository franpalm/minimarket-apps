
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from .models import Caja, Venta, Gasto, Maquina
from django.utils import timezone

class CajaSummaryTestCase(TestCase):
	def setUp(self):
		User = get_user_model()
		self.user = User.objects.create_user(username='testuser', password='testpass')
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
