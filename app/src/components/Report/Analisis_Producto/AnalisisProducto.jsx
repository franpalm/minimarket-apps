import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, Legend, LabelList } from 'recharts';
import InventorySummary from './InventorySummary';

// Utilidad para formatear CLP
const formatCLP = value =>
  value != null ? '$' + value.toLocaleString('es-CL') : 'N/A';

const AnalisisProducto = ({ reportData = {}, resumen = {} }) => {
  // Estados para filtros y selección
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [compareProduct, setCompareProduct] = useState('');

  // Datos del reporte
  const {
    topProducts = [],
    lowRotation = [],
    productHistory = {},
    categories = [],
    products = [],
  } = reportData;

  // Derivados
  const filteredProducts = selectedCategory
    ? products.filter(p => p.category === selectedCategory)
    : products;

  const selectedProd = products.find(p => p.id === selectedProduct);
  const compareProd = products.find(p => p.id === compareProduct);

  const totalStock = resumen.totalStock || 0;
  const totalSoldMonth = resumen.totalSold || 0;
  const totalIncome = resumen.totalIncome || 0;
  const avgMargin = resumen.avgMargin != null ? resumen.avgMargin + '%' : 'N/A';
  const inventoryStatus = {
    ok: products.filter(p => p.stock > 10).length,
    low: products.filter(p => p.stock > 0 && p.stock <= 10).length,
    critical: products.filter(p => (p.stock || 0) === 0).length,
  };

  // Totales para porcentajes
  const totalSold = topProducts.reduce((a, b) => a + (b.sold || 0), 0);
  const totalMonto = topProducts.reduce((a, b) => a + (b.total || 0), 0);

  // Filtro de fechas (puedes adaptarlo a tu lógica)
  const handleFilter = e => {
    e.preventDefault();
    // Aquí deberías llamar a la función que actualiza el reporte con los nuevos filtros
    // Por ejemplo: fetchReport({ dateFrom, dateTo, selectedCategory, ... })
  };

  return (
    <div>
      {/* Filtros */}
      <form className="flex flex-wrap gap-4 items-center mb-4" onSubmit={handleFilter}>
        <div>
          <label className="font-semibold mr-2">Desde</label>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="border rounded px-2 py-1" />
        </div>
        <div>
          <label className="font-semibold mr-2">Hasta</label>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="border rounded px-2 py-1" />
        </div>
        <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">Aplicar Filtros</button>
      </form>

      <div className="space-y-8">
        {/* Resumen general */}
        <InventorySummary
          totalStock={totalStock}
          totalSold={totalSoldMonth}
          totalIncome={formatCLP(totalIncome)}
          avgMargin={avgMargin}
          inventoryStatus={inventoryStatus}
        />

        {/* Filtros de categoría/producto/comparar */}
        <div className="flex flex-wrap gap-4 items-center mb-4 bg-indigo-50 rounded p-3">
          <div>
            <label className="font-semibold mr-2">Categoría:</label>
            <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="border rounded px-2 py-1">
              <option value="">Todas</option>
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <div>
            <label className="font-semibold mr-2">Producto:</label>
            <select value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)} className="border rounded px-2 py-1">
              <option value="">Seleccione</option>
              {filteredProducts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="font-semibold mr-2">Comparar con:</label>
            <select value={compareProduct} onChange={e => setCompareProduct(e.target.value)} className="border rounded px-2 py-1">
              <option value="">Ninguno</option>
              {filteredProducts.filter(p => p.id !== selectedProduct).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="text-xs text-gray-500 ml-4">Seleccione un producto para ver detalles y comparar fácilmente.</div>
        </div>

        {/* Top productos más vendidos */}
        <div className="bg-white rounded-lg shadow p-6 mb-4">
          <h3 className="font-semibold mb-2 text-indigo-700">Top productos más vendidos (unidades)</h3>
          <div className="text-xs text-gray-500 mb-2">Muestra los productos con más ventas en el periodo seleccionado.</div>
          {topProducts.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topProducts} margin={{ left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value} unds`, 'Unidades vendidas']} />
                <Bar dataKey="sold" fill="#6366f1">
                  <LabelList dataKey="sold" position="top" formatter={v => `${v} unds`} />
                  <LabelList
                    dataKey="sold"
                    position="insideBottom"
                    formatter={(_, i) => {
                      const p = Array.isArray(topProducts) && i >= 0 && i < topProducts.length ? topProducts[i] : undefined;
                      return (p && typeof p.sold === 'number' && totalSold)
                        ? `${Math.round((p.sold / totalSold) * 100)}%`
                        : '';
                    }}
                    style={{ fill: '#fff', fontSize: 10 }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (<div className="text-gray-400">No hay datos.</div>)}
          {topProducts.length > 0 && (
            <div className="text-xs text-gray-500 mt-2">El porcentaje indica la proporción de ventas de cada producto respecto al total.</div>
          )}
        </div>

        {/* Top productos por monto vendido */}
        <div className="bg-white rounded-lg shadow p-6 mb-4">
          <h3 className="font-semibold mb-2 text-indigo-700">Top productos por monto vendido</h3>
          <div className="text-xs text-gray-500 mb-2">Muestra los productos que generaron más ingresos.</div>
          {topProducts.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topProducts} margin={{ left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={formatCLP} />
                <Tooltip formatter={formatCLP} labelFormatter={name => `Producto: ${name}`} />
                <Bar dataKey="total" fill="#10b981">
                  <LabelList dataKey="total" position="top" formatter={formatCLP} />
                  <LabelList
                    dataKey="total"
                    position="insideBottom"
                    formatter={(_, i) => {
                      const p = Array.isArray(topProducts) && i >= 0 && i < topProducts.length ? topProducts[i] : undefined;
                      return (p && typeof p.total === 'number' && totalMonto)
                        ? `${Math.round((p.total / totalMonto) * 100)}%`
                        : '';
                    }}
                    style={{ fill: '#fff', fontSize: 10 }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="text-gray-400">No hay datos.</div>}
          {topProducts.length > 0 && (
            <div className="text-xs text-gray-500 mt-2">El porcentaje indica la proporción de ingresos de cada producto respecto al total.</div>
          )}
        </div>

        {/* Productos con baja rotación */}
        <div className="bg-white rounded-lg shadow p-6 mb-4">
          <h3 className="font-semibold mb-2 text-indigo-700">Productos con baja rotación</h3>
          <div className="text-xs text-gray-500 mb-2">Estos productos tienen stock pero no se han vendido este mes.</div>
          {lowRotation.length > 0 ? (
            <ul className="list-disc list-inside space-y-1">
              {lowRotation.map(p => (
                <li key={p.id} className="text-red-600 font-semibold">
                  {p.name} <span className="text-gray-500">(Stock: {p.stock})</span>
                </li>
              ))}
            </ul>
          ) : <div className="text-gray-400">No hay datos.</div>}
        </div>

        {/* Margen de ganancia */}
        {selectedProd && selectedProd.name && (
          <div className="bg-white rounded-lg shadow p-6 mb-4">
            <h3 className="font-semibold mb-2 text-indigo-700">Margen de ganancia</h3>
            <div className="text-xs text-gray-500 mb-2">Diferencia entre el precio de venta y el costo del producto seleccionado.</div>
            <div className="text-lg">
              <span className="font-bold">{selectedProd.name}:</span> {selectedProd.cost != null && selectedProd.price != null ? `${formatCLP(selectedProd.price - selectedProd.cost)} (${Math.round(((selectedProd.price - selectedProd.cost) / selectedProd.price) * 100)}%)` : <span className="text-red-500">Sin datos de costo/precio</span>}
            </div>
          </div>
        )}

        {/* Evolución de ventas de un producto */}
        {selectedProd && selectedProd.name && productHistory[selectedProd.id] && (
          <div className="bg-white rounded-lg shadow p-6 mb-4">
            <h3 className="font-semibold mb-2 text-indigo-700">Evolución de ventas: {selectedProd.name}</h3>
            <div className="text-xs text-gray-500 mb-2">Vea cómo han cambiado las ventas y el ingreso de este producto en el tiempo.</div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={productHistory[selectedProd.id]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="fecha" />
                <YAxis />
                <Tooltip formatter={(value, name) => name === 'total' ? [formatCLP(value), 'Monto vendido'] : [`${value} unds`, 'Unidades vendidas']} />
                <Legend formatter={v => v === 'sold' ? 'Unidades vendidas' : 'Monto vendido'} />
                <Line type="monotone" dataKey="sold" stroke="#6366f1" name="Unidades vendidas" />
                <Line type="monotone" dataKey="total" stroke="#10b981" name="Monto vendido" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Comparativa entre productos */}
        {selectedProd && compareProd && compareProd.name && productHistory[selectedProd.id] && productHistory[compareProd.id] && (
          <div className="bg-white rounded-lg shadow p-6 mb-4">
            <h3 className="font-semibold mb-2 text-indigo-700">Comparativa: {selectedProd.name} vs {compareProd.name}</h3>
            <div className="text-xs text-gray-500 mb-2">Compare las ventas de dos productos para tomar mejores decisiones.</div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="fecha" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value} unds`, 'Unidades vendidas']} />
                <Legend formatter={v => v === selectedProd.name ? `${selectedProd.name} (azul)` : `${compareProd.name} (rojo)`} />
                <Line type="monotone" dataKey="sold" data={productHistory[selectedProd.id]} stroke="#6366f1" name={selectedProd.name} />
                <Line type="monotone" dataKey="sold" data={productHistory[compareProd.id]} stroke="#ef4444" name={compareProd.name} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Ayuda para el usuario */}
        <div className="bg-indigo-100 rounded-lg p-4 mt-8 text-sm text-indigo-900">
          <b>¿Cómo usar este análisis?</b>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Seleccione una <b>categoría</b> para ver solo los productos de ese tipo.</li>
            <li>Elija un <b>producto</b> para ver su margen y evolución de ventas.</li>
            <li>Use <b>Comparar con</b> para ver la diferencia de ventas entre dos productos.</li>
            <li>Los gráficos muestran cantidades, montos y porcentajes para facilitar la interpretación.</li>
          </ul>
          <div className="mt-2 text-xs text-gray-600">Si tiene dudas, consulte con el administrador o pida ayuda.</div>
        </div>
      </div>
    </div>
  );
};

export default AnalisisProducto;