import React, { useState, useImperativeHandle, forwardRef } from 'react';
import { useNotification } from '../../components/Notification';
import authFetch from '../../utils/authFetch';

function formatCLP(value) {
  if (value === '' || value === null || value === undefined) return '';
  value = value.toString().replace(/\D/g, '');
  return value.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

const AddProductForm = forwardRef(({ onProductAdded, categories }, ref) => {
  const { showNotification } = useNotification();
  const [form, setForm] = useState({
    codigo_barra: '',
    nombre: '',
    descripcion: '',
    precio_compra: '',
    precio_venta: '',
    stock_actual: '',
    stock_minimo: '',
    unidad_medida: '',
    fecha_vencimiento: '',
    id_categoria: '',
    id_proveedor: ''
  });
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  // Cargar productos para validar unicidad (y refrescar tras agregar)
  const fetchProducts = () => {
    authFetch('http://localhost:8000/api/productos-rest/')
      .then(res => {
        if (!res.ok) throw new Error('No autorizado');
        return res.json();
      })
      .then(data => setProducts(data))
      .catch(() => setProducts([]));
  };
  React.useEffect(() => {
    fetchProducts();
  }, []);

      useImperativeHandle(ref, () => ({
        setCodigoProducto: (codigo) => {
          setForm(f => ({ ...f, codigo_barra: codigo }));
        }
      }));

      const handleChange = e => {
        let { name, value } = e.target;
        if (name === 'precio_compra' || name === 'precio_venta') {
          value = formatCLP(value.replace(/\./g, ''));
        } else if (name === 'stock_actual' || name === 'stock_minimo') {
          value = formatCLP(value.replace(/\./g, '').replace(/[^\d]/g, ''));
        }
        setForm({ ...form, [name]: value });
      };

      const handleSubmit = async e => {
        e.preventDefault();
        if (!form.codigo_barra || !form.nombre || !form.precio_compra || !form.precio_venta || !form.stock_actual || !form.stock_minimo || !form.unidad_medida || !form.id_categoria) {
          showNotification('Por favor, completa todos los campos obligatorios.', 'danger');
          return;
        }
        // Validar unicidad en frontend (case-insensitive)
        const productsArray = Array.isArray(products) ? products : [];
        if (productsArray.some(p => (p.codigo_barra || '').trim().toLowerCase() === form.codigo_barra.trim().toLowerCase())) {
          showNotification('El código de barras ya existe. Debe ser único.', 'danger');
          return;
        }
        setLoading(true);
        try {
          const parseCLP = (val) => {
            if (typeof val === 'string') {
              return Number(val.replace(/\./g, ''));
            }
            return Number(val);
          };
          const newProduct = {
            codigo_barra: form.codigo_barra,
            nombre: form.nombre,
            descripcion: form.descripcion,
            categoria: parseInt(form.id_categoria), // El backend espera 'categoria'
            proveedor: form.id_proveedor ? parseInt(form.id_proveedor) : null,
            precio_compra: parseCLP(form.precio_compra),
            precio_venta: parseCLP(form.precio_venta),
            stock_actual: parseCLP(form.stock_actual),
            stock_minimo: parseCLP(form.stock_minimo),
            unidad_medida: form.unidad_medida,
            fecha_vencimiento: form.fecha_vencimiento || null
          };
          const token = localStorage.getItem('token');
          const res = await authFetch('http://localhost:8000/api/productos-rest/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(newProduct)
          });
          if (res.ok) {
            showNotification('Producto agregado exitosamente!', 'success');
            setForm({
              codigo_barra: '',
              nombre: '',
              descripcion: '',
              precio_compra: '',
              precio_venta: '',
              stock_actual: '',
              stock_minimo: '',
              unidad_medida: '',
              fecha_vencimiento: '',
              id_categoria: '',
              id_proveedor: ''
            });
            if (onProductAdded) onProductAdded();
            fetchProducts();
          } else {
            let errorMsg = 'Error al agregar producto';
            let bodyText = await res.text();
            try {
              const result = JSON.parse(bodyText);
              // Mensaje específico para duplicados y errores del backend
              if (result.error && result.error.toLowerCase().includes('código de barras')) {
                errorMsg = result.error;
              } else if (result.message && result.message.toLowerCase().includes('código de barras')) {
                errorMsg = result.message;
              } else {
                errorMsg = result.error || result.message || bodyText;
              }
            } catch (err) {
              errorMsg = bodyText;
            }
            showNotification(errorMsg, 'danger');
            fetchProducts();
          }
        } catch (err) {
          showNotification(err?.message || 'Error de comunicación con el backend al agregar producto.', 'danger');
        }
        setLoading(false);
      };

      return (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1">Código Producto <span className="text-red-500">*</span></label>
              <input type="text" className="border rounded px-3 py-2 w-full" name="codigo_barra" value={form.codigo_barra} onChange={handleChange} required />
            </div>
            <div>
              <label className="block font-medium mb-1">Nombre <span className="text-red-500">*</span></label>
              <input type="text" className="border rounded px-3 py-2 w-full" name="nombre" value={form.nombre} onChange={handleChange} required />
            </div>
            <div className="md:col-span-2">
              <label className="block font-medium mb-1">Descripción</label>
              <textarea className="border rounded px-3 py-2 w-full" name="descripcion" value={form.descripcion} onChange={handleChange} rows={2}></textarea>
            </div>
            <div>
              <label className="block font-medium mb-1">Precio Compra <span className="text-red-500">*</span></label>
              <div className="flex">
                <span className="inline-flex items-center px-2 bg-gray-100 border border-r-0 border-gray-300 rounded-l">CLP$</span>
                <input type="text" className="border rounded-r px-3 py-2 w-full" name="precio_compra" value={form.precio_compra} onChange={handleChange} required />
              </div>
            </div>
            <div>
              <label className="block font-medium mb-1">Precio Venta <span className="text-red-500">*</span></label>
              <div className="flex">
                <span className="inline-flex items-center px-2 bg-gray-100 border border-r-0 border-gray-300 rounded-l">CLP$</span>
                <input type="text" className="border rounded-r px-3 py-2 w-full" name="precio_venta" value={form.precio_venta} onChange={handleChange} required />
              </div>
            </div>
            <div>
              <label className="block font-medium mb-1">Stock Actual <span className="text-red-500">*</span></label>
              <input
                type="text"
                className="border rounded px-3 py-2 w-full"
                name="stock_actual"
                value={form.stock_actual}
                onChange={handleChange}
                required
                inputMode="numeric"
                pattern="[0-9.]*"
                autoComplete="off"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Stock Mínimo <span className="text-red-500">*</span></label>
              <input
                type="text"
                className="border rounded px-3 py-2 w-full"
                name="stock_minimo"
                value={form.stock_minimo}
                onChange={handleChange}
                required
                inputMode="numeric"
                pattern="[0-9.]*"
                autoComplete="off"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Unidad de Medida <span className="text-red-500">*</span></label>
              <select className="border rounded px-3 py-2 w-full" name="unidad_medida" value={form.unidad_medida} onChange={handleChange} required>
                <option value="">Seleccionar...</option>
                <option value="unidad">Unidad</option>
                <option value="kg">Kilogramo</option>
                <option value="g">Gramo</option>
                <option value="l">Litro</option>
                <option value="ml">Mililitro</option>
                <option value="paquete">Paquete</option>
                <option value="caja">Caja</option>
              </select>
            </div>
            <div>
              <label className="block font-medium mb-1">Fecha Vencimiento</label>
              <input type="date" className="border rounded px-3 py-2 w-full" name="fecha_vencimiento" value={form.fecha_vencimiento} onChange={handleChange} />
            </div>
            <div>
              <label className="block font-medium mb-1">Categoría <span className="text-red-500">*</span></label>
              <select className="border rounded px-3 py-2 w-full" name="id_categoria" value={form.id_categoria} onChange={handleChange} required>
                <option value="">Seleccionar...</option>
                {categories && categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.codigo_categoria} - {cat.nombre_categoria}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-medium mb-1">ID Proveedor</label>
              <input type="number" className="border rounded px-3 py-2 w-full" name="id_proveedor" value={form.id_proveedor} onChange={handleChange} />
            </div>
          </div>
          <div className="mt-6 text-center">
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white rounded px-6 py-2 font-semibold transition" disabled={loading}>
              {loading ? 'Guardando...' : 'Agregar Producto'}
            </button>
          </div>
          {/* Notificación global, no local */}
        </form>
      );
    });

    export default AddProductForm;