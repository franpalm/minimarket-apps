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
    class Meta:
        model = Venta
        fields = '__all__'

class DetalleVentaSerializer(serializers.ModelSerializer):
    class Meta:
        model = DetalleVenta
        fields = '__all__'

class CategoriaGastoSerializer(serializers.ModelSerializer):
    class Meta:
        model = CategoriaGasto
        fields = '__all__'

class GastoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Gasto
        fields = '__all__'

class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = '__all__'
