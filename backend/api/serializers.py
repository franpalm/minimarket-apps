from rest_framework import serializers
from .models import Presupuesto

# Presupuesto global
class PresupuestoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Presupuesto
        fields = ['id', 'valor', 'actualizado_en']
# --- Caja Serializer ---
from .models import Caja

from rest_framework import serializers

class CajaSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.CharField(source='usuario.username', read_only=True)
    maquina_nombre = serializers.CharField(source='maquina.nombre', read_only=True)

    class Meta:
        model = Caja
        fields = [
            'id', 'usuario', 'usuario_nombre', 'maquina', 'maquina_nombre',
            'fecha_inicio', 'monto_inicial', 'fecha_cierre', 'monto_final', 'estado', 'observaciones'
        ]
from rest_framework import serializers
from .models import CategoriaGasto

class CategoriaGastoSerializer(serializers.ModelSerializer):
    class Meta:
        model = CategoriaGasto
        fields = '__all__'
from rest_framework import serializers
from .models import Producto, Categoria, Proveedor, Compra, DetalleCompra, Venta, DetalleVenta, CategoriaGasto, Gasto, Usuario

class ProductoSerializer(serializers.ModelSerializer):
    nombre_categoria = serializers.CharField(source='categoria.nombre', read_only=True)
    nombre_proveedor = serializers.CharField(source='proveedor.nombre', read_only=True)
    def validate_codigo_barra(self, value):
        # Normaliza: quita espacios y minúsculas
        value = value.strip().lower()
        # Al crear
        if self.instance is None:
            if Producto.objects.filter(codigo_barra__iexact=value).exists():
                raise serializers.ValidationError("El código de barras ya existe. Debe ser único.")
        # Al actualizar
        else:
            if Producto.objects.filter(codigo_barra__iexact=value).exclude(pk=self.instance.pk).exists():
                raise serializers.ValidationError("El código de barras ya existe en otro producto.")
        return value

    def to_internal_value(self, data):
        # Normaliza el código antes de validarlo
        if 'codigo_barra' in data and isinstance(data['codigo_barra'], str):
            data['codigo_barra'] = data['codigo_barra'].strip().lower()
        return super().to_internal_value(data)

    class Meta:
        model = Producto
        fields = '__all__'

class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = '__all__'

class ProveedorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Proveedor
        fields = '__all__'

class CompraSerializer(serializers.ModelSerializer):
    class Meta:
        model = Compra
        fields = '__all__'

class DetalleCompraSerializer(serializers.ModelSerializer):
    class Meta:
        model = DetalleCompra
        fields = '__all__'

class VentaSerializer(serializers.ModelSerializer):
    maquina_nombre = serializers.CharField(source='maquina.nombre', read_only=True)
    class Meta:
        model = Venta
        fields = '__all__'
        read_only_fields = ('folio',)

class DetalleVentaSerializer(serializers.ModelSerializer):
    class Meta:
        model = DetalleVenta
        fields = '__all__'

class CategoriaGastoSerializer(serializers.ModelSerializer):
    class Meta:
        model = CategoriaGasto
        fields = '__all__'

class GastoSerializer(serializers.ModelSerializer):
    categoria_nombre = serializers.SerializerMethodField()
    categoria_id = serializers.SerializerMethodField()
    monto = serializers.DecimalField(max_digits=12, decimal_places=2, coerce_to_string=False)

    class Meta:
        model = Gasto
        fields = [
            'id',
            'fecha',
            'categoria',
            'categoria_id',
            'categoria_nombre',
            'monto',
            'metodo_pago',
            'descripcion',
            'usuario',
            'comprobante_url',
            'creado_en',
        ]
        read_only_fields = ('creado_en',)
        extra_kwargs = {
            'categoria': {'required': True, 'allow_null': False},
            'usuario': {'required': False, 'allow_null': True},
        }

    def get_categoria_nombre(self, obj):
        return obj.categoria.nombre if obj.categoria else None

    def get_categoria_id(self, obj):
        return obj.categoria_id

    def validate(self, attrs):
        categoria = attrs.get('categoria')
        if self.instance is None and categoria is None:
            raise serializers.ValidationError({'categoria': 'La categoría es obligatoria.'})
        if categoria is None and self.instance is not None and 'categoria' in attrs:
            raise serializers.ValidationError({'categoria': 'No puedes dejar la categoría vacía.'})
        return super().validate(attrs)

class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = '__all__'
