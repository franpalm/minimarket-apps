import React, { useState } from 'react';

function formatThousands(value) {
  if (value === '' || value === null || value === undefined) return '';
  value = parseInt(value, 10) || 0;
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function parseThousands(value) {
  return parseInt(value.replace(/\./g, '').replace(/[^\d]/g, '')) || 0;
}

function ProductsTable({ products, loading, categoryFilter, setCategoryFilter, categorias, reload, onUpdateProduct, onDeleteProduct }) {
  const [editingId, setEditingId] = useState(null);
  const [editedProduct, setEditedProduct] = useState({});
  // Filtro de productos por categoría
  // Normaliza el campo de categoría en cada producto para que siempre tenga 'id_categoria'
  const normalizedProducts = products.map(p => ({
    ...p,
    id_categoria: p.id_categoria !== undefined ? p.id_categoria : p.categoria_id
  }));

  const filteredProducts = categoryFilter === 'all'
    ? normalizedProducts
    : normalizedProducts.filter(p => p.id_categoria && String(p.id_categoria) === String(categoryFilter));

  // Función para iniciar edición de producto
  const handleEditClick = (product) => {
    setEditingId(product.id);
    setEditedProduct({ ...product });
  };

  // Función para cancelar edición
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditedProduct({});
  };

  // Función para guardar cambios
  const handleSaveClick = async () => {
    if (!editedProduct.nombre || !editedProduct.codigo_barra) {
      alert('Nombre y Código Producto son obligatorios');
      return;
    }
    // Normaliza el campo de categoría para el backend (espera 'categoria')
    const categoriaId = editedProduct.id_categoria !== undefined
      ? editedProduct.id_categoria
      : (editedProduct.categoria_id !== undefined ? editedProduct.categoria_id : undefined);
    const productToSave = {
      ...editedProduct,
      categoria: categoriaId,
    };
    // Elimina los campos auxiliares para evitar conflictos
    delete productToSave.id_categoria;
    delete productToSave.categoria_id;
    await onUpdateProduct(productToSave);
    setEditingId(null);
    setEditedProduct({});
  };

  // Función para manejar cambios en los inputs
  const handleChangeEdit = (e) => {
    const { name, value } = e.target;
    setEditedProduct(prev => ({ ...prev, [name]: value }));
  };

    const formatPrice = (price) => {
      return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(price);
    };
    return (
      <div className="rounded-lg shadow mb-6 bg-white mt-4">
        <div className="bg-gray-100 border-b border-gray-200 font-semibold px-4 py-2 flex flex-col md:flex-row md:justify-between md:items-center gap-2">
          <h5 className="mb-0 flex items-center gap-2">
            <i className="bi bi-box-seam text-blue-600"></i>
            Lista de Productos
          </h5>
          <div className="flex flex-col md:flex-row md:items-center gap-2">
            <label htmlFor="categoryFilter" className="mr-2">Filtrar por Categoría:</label>
            <select
              id="categoryFilter"
              className="border rounded px-2 py-1 text-sm"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">Todos</option>
              {categorias && categorias.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.codigo_categoria} - {cat.nombre_categoria}
                </option>
              ))}
            </select>
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white rounded px-3 py-1 text-sm transition flex items-center gap-1"
              onClick={reload}
              disabled={loading}
            >
              <i className="bi bi-arrow-clockwise"></i>
              {loading ? 'Cargando...' : 'Recargar Productos'}
            </button>
          </div>
        </div>
        <div className="p-4">
          {loading && <div className="text-center flex items-center justify-center gap-2"><i className="bi bi-arrow-repeat animate-spin"></i> Cargando productos...</div>}
          {!loading && filteredProducts.length === 0 && (
            <div className="bg-blue-100 text-blue-700 rounded px-4 py-2 text-center flex items-center justify-center gap-2">
              <i className="bi bi-emoji-frown"></i>
              No hay productos para mostrar.
            </div>
          )}
          {!loading && filteredProducts.length > 0 && (
            <div className="overflow-x-auto w-full">
              <table className="min-w-full text-sm border">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="px-2 py-1 font-semibold border">Código Producto</th>
                    <th className="px-2 py-1 font-semibold border">Nombre</th>
                    <th className="px-2 py-1 font-semibold border">Descripción</th>
                    <th className="px-2 py-1 font-semibold border">Precio Compra</th>
                    <th className="px-2 py-1 font-semibold border">Precio Venta</th>
                    <th className="px-2 py-1 font-semibold border">Stock Actual</th>
                    <th className="px-2 py-1 font-semibold border">Stock Mínimo</th>
                    <th className="px-2 py-1 font-semibold border">Unidad Medida</th>
                    <th className="px-2 py-1 font-semibold border">Nombre Categoría</th>
                    <th className="px-2 py-1 font-semibold border">Nombre Proveedor</th>
                    <th className="px-2 py-1 font-semibold border">Fecha Vencimiento</th>
                    <th className="px-2 py-1 font-semibold border">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map(product => (
                    <tr key={product.id} className="hover:bg-blue-50 even:bg-gray-50 border-b border-gray-200">
                      {editingId === product.id ? (
                        <>
                          <td><input type="text" name="codigo_barra" value={editedProduct.codigo_barra || ''} onChange={handleChangeEdit} className="border rounded px-2 py-1 w-full" required /></td>
                          <td><input type="text" name="nombre" value={editedProduct.nombre || ''} onChange={handleChangeEdit} className="border rounded px-2 py-1 w-full" required /></td>
                          <td><textarea name="descripcion" value={editedProduct.descripcion || ''} onChange={handleChangeEdit} className="border rounded px-2 py-1 w-full" rows="1"></textarea></td>
                          <td><input type="number" name="precio_compra" value={editedProduct.precio_compra || ''} onChange={handleChangeEdit} className="border rounded px-2 py-1 w-full" required /></td>
                          <td><input type="number" name="precio_venta" value={editedProduct.precio_venta || ''} onChange={handleChangeEdit} className="border rounded px-2 py-1 w-full" required /></td>
                          <td>
                            <input
                              type="text"
                              name="stock_actual"
                              value={formatThousands(editedProduct.stock_actual)}
                              onChange={handleChangeEdit}
                              className="border rounded px-2 py-1 w-full"
                              required
                              inputMode="numeric"
                              pattern="[0-9.]*"
                              autoComplete="off"
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              name="stock_minimo"
                              value={formatThousands(editedProduct.stock_minimo)}
                              onChange={handleChangeEdit}
                              className="border rounded px-2 py-1 w-full"
                              required
                              inputMode="numeric"
                              pattern="[0-9.]*"
                              autoComplete="off"
                            />
                          </td>
                          <td>
                            <select name="unidad_medida" value={editedProduct.unidad_medida || ''} onChange={handleChangeEdit} className="border rounded px-2 py-1 w-full">
                              <option value="">Selecciona una opción</option>
                              <option value="unidad">Unidad</option>
                              <option value="kg">Kilogramo (kg)</option>
                              <option value="g">Gramo (g)</option>
                              <option value="l">Litro (l)</option>
                              <option value="ml">Mililitro (ml)</option>
                              <option value="paquete">Paquete</option>
                              <option value="caja">Caja</option>
                            </select>
                          </td>
                          <td>
                            <select
                              name="id_categoria"
                              value={
                                editedProduct.id_categoria !== undefined
                                  ? editedProduct.id_categoria
                                  : (editedProduct.categoria_id !== undefined ? editedProduct.categoria_id : '')
                              }
                              onChange={handleChangeEdit}
                              className="border rounded px-2 py-1 w-full"
                              required
                            >
                              <option value="">Selecciona</option>
                              {categorias && categorias.map(cat => (
                                <option key={cat.id} value={cat.id}>
                                  {cat.nombre_categoria}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="text-center">
                            {editedProduct.proveedor?.nombre || editedProduct.nombre_proveedor || 'N/A'}
                          </td>
                          <td><input type="date" name="fecha_vencimiento" value={editedProduct.fecha_vencimiento ? new Date(editedProduct.fecha_vencimiento).toISOString().split('T')[0] : ''} onChange={handleChangeEdit} className="border rounded px-2 py-1 w-full" /></td>
                          <td className="flex gap-1 justify-center">
                            <button className="bg-green-600 hover:bg-green-700 text-white rounded px-2 py-1 text-xs flex items-center gap-1" onClick={handleSaveClick} title="Guardar">
                              <i className="bi bi-check-lg"></i> Guardar
                            </button>
                            <button className="bg-gray-400 hover:bg-gray-500 text-white rounded px-2 py-1 text-xs flex items-center gap-1" onClick={handleCancelEdit} title="Cancelar">
                              <i className="bi bi-x-lg"></i> Cancelar
                            </button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td>{product.codigo_barra ? product.codigo_barra : (product.codigo_producto ? product.codigo_producto : 'N/A')}</td>
                          <td>{product.nombre}</td>
                          <td>{product.descripcion || 'N/A'}</td>
                          <td>{formatPrice(product.precio_compra)}</td>
                          <td>{formatPrice(product.precio_venta)}</td>
                          <td>{formatThousands(parseInt(product.stock_actual, 10))}</td>
                          <td>{formatThousands(parseInt(product.stock_minimo, 10))}</td>
                          <td>{product.unidad_medida || 'N/A'}</td>
                          <td>{categorias && categorias.find(cat => String(cat.id) === String(product.id_categoria))?.nombre_categoria || 'N/A'}</td>
                          <td className="text-center">{product.nombre_proveedor || (product.proveedor && product.proveedor.nombre) || 'N/A'}</td>
                          <td>{product.fecha_vencimiento ? new Date(product.fecha_vencimiento).toLocaleDateString() : 'N/A'}</td>
                          <td className="flex gap-1 justify-center">
                            <button className="bg-blue-600 hover:bg-blue-700 text-white rounded px-2 py-1 text-xs flex items-center gap-1" onClick={() => handleEditClick(product)} title="Editar">
                              <i className="bi bi-pencil-square"></i> Editar
                            </button>
                            <button className="bg-red-600 hover:bg-red-700 text-white rounded px-2 py-1 text-xs flex items-center gap-1" onClick={() => onDeleteProduct(product.id)} title="Eliminar">
                              <i className="bi bi-trash"></i> Eliminar
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  export default ProductsTable;