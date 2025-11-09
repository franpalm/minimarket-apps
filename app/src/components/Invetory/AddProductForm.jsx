import React, { useState } from 'react';
import { useNotification } from '../../components/Notification';

function formatCLP(value) {
  if (value === '' || value === null || value === undefined) return '';
  value = value.toString().replace(/\D/g, '');
  return value.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function parseCLP(value) {
  return parseInt(value.replace(/\./g, '').replace(/[^\d]/g, '')) || 0;
}

function AddProductForm({ onProductAdded, categories }) {
  const { showNotification } = useNotification();
  const [form, setForm] = useState({
    codigo_producto: '',
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
  // Eliminado message local, usar notificación global
  const [loading, setLoading] = useState(false);

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
    if (!form.nombre || !form.precio_compra || !form.precio_venta || !form.stock_actual || !form.stock_minimo || !form.unidad_medida || !form.id_categoria) {
      showNotification('Por favor, completa todos los campos obligatorios.', 'danger');
      return;
    }
    setLoading(true);
    try {
      const newProduct = {
        ...form,
        precio_compra: parseCLP(form.precio_compra),
        precio_venta: parseCLP(form.precio_venta),
        stock_actual: parseCLP(form.stock_actual),
        stock_minimo: parseCLP(form.stock_minimo),
        categoria: parseInt(form.id_categoria), // Cambiado para coincidir con backend
        id_proveedor: form.id_proveedor ? parseInt(form.id_proveedor) : null,
        fecha_vencimiento: form.fecha_vencimiento || null
      };
      const res = await fetch('http://localhost:8000/api/productos/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct)
      });
      if (res.ok) {
        showNotification('Producto agregado exitosamente!', 'success');
        setForm({
          codigo_producto: '',
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
      } else {
        const result = await res.json();
        showNotification(result.message || 'Error al agregar producto', 'danger');
      }
    } catch {
      showNotification('Error de comunicación con el backend al agregar producto.', 'danger');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block font-medium mb-1">Código Producto</label>
          <input type="text" className="border rounded px-3 py-2 w-full" name="codigo_producto" value={form.codigo_producto} onChange={handleChange} />
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
}

export default AddProductForm;