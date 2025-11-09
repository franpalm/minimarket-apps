import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';

const months = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const COLORS = ['#6366f1', '#10b981', '#f59e42', '#ef4444', '#a855f7', '#fbbf24', '#3b82f6'];

const InformeMensual = ({ reportData, formatCLP, onMonthChange, monthComparison, month, year }) => {
  // El mes seleccionado viene de props (1-based)
  const selectedMonth = typeof month === 'number' && month > 0 ? month - 1 : new Date().getMonth();

  // Cuando cambia el mes, notifica al padre
  const handleMonthChange = (e) => {
    const newMonth = Number(e.target.value);
    if (onMonthChange) onMonthChange(newMonth);
  };

  // Datos para el mes seleccionado
  const data = reportData && reportData[selectedMonth] ? reportData[selectedMonth] : reportData;
  if (!data || Object.keys(data).length === 0 || data.error) {
    return (
      <div className="text-gray-400 py-12 text-center">
        No hay datos para el mes seleccionado o hubo un error.
      </div>
    );
  }


  // Prepara datos para el gráfico (ventas por día del mes)
  const chartData = (data.salesByDay || []).map((val, idx) => ({
    dia: idx + 1,
    ventas: val,
  }));
  // Día con más ventas
  const maxVentas = Math.max(...chartData.map(d => d.ventas), 0);
  const promedioVentas = chartData.length > 0 ? chartData.reduce((a, b) => a + b.ventas, 0) / chartData.length : 0;


  // Prepara datos para gráfico de pastel (métodos de pago) y cálculo de totales
  const breakdownEntries = Object.entries(data.breakdownByPayment || {});
  const totalPagos = breakdownEntries.reduce((acc, [_, val]) => acc + (val.total || 0), 0);
  const totalVentas = breakdownEntries.reduce((acc, [_, val]) => acc + (val.cantidad || 0), 0);
  const pieData = breakdownEntries.map(([metodo, val]) => ({
    name: metodo.charAt(0).toUpperCase() + metodo.slice(1),
    value: val.total,
    cantidad: val.cantidad,
    porcentaje: totalPagos > 0 ? ((val.total / totalPagos) * 100) : 0
  }));

  // Comparativa con mes anterior (si se provee)
  const comp = monthComparison && monthComparison[selectedMonth] ? monthComparison[selectedMonth] : null;

  // Función para mostrar flecha y color según variación
  const renderDelta = (delta) => {
    if (delta == null) return null;
    const color = delta > 0 ? 'text-green-600' : delta < 0 ? 'text-red-600' : 'text-gray-500';
    const icon = delta > 0 ? '▲' : delta < 0 ? '▼' : '●';
    return <span className={`ml-2 font-bold ${color}`}>{icon} {Math.abs(delta)}%</span>;
  };

  // Acceso rápido a productos más vendidos
  const handleProductClick = (prod) => {
    alert(`Detalles de producto: ${prod.name}\nVendidos: ${prod.sold}`);
  };

  return (
    <div className="space-y-8">
      {/* Selector de mes y descripción */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-2">
        <div>
          <h2 className="text-xl font-bold text-indigo-700 mb-1">Informe mensual</h2>
          <p className="text-gray-500 text-sm max-w-xl">Este informe muestra el resumen de ventas, productos destacados y métodos de pago del mes seleccionado. Usa los gráficos y comparativas para analizar el desempeño y detectar tendencias.</p>
        </div>
        <div>
          <label className="font-semibold mr-2" htmlFor="mes">Mes:</label>
          <select id="mes" value={selectedMonth} onChange={handleMonthChange} className="border rounded px-2 py-1">
            {months.map((m, idx) => (
              <option key={m} value={idx}>{m}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow p-6 mb-4">
        <h2 className="text-lg font-bold text-indigo-700 mb-2">Resumen mensual</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <span className="text-gray-500 text-sm">💰 Total ventas</span>
            <div className="text-2xl font-bold text-indigo-700 flex items-center">
              {formatCLP(data.totalSales)}
              {comp && renderDelta(comp.totalSalesDelta)}
            </div>
            <div className="text-xs text-gray-400">Monto total vendido en el mes.</div>
          </div>
          <div>
            <span className="text-gray-500 text-sm">🛒 N° de ventas</span>
            <div className="text-2xl font-bold text-indigo-700 flex items-center">
              {data.salesCount}
              {comp && renderDelta(comp.salesCountDelta)}
            </div>
            <div className="text-xs text-gray-400">Cantidad de compras realizadas.</div>
          </div>
          <div>
            <span className="text-gray-500 text-sm">🧾 Ticket promedio</span>
            <div className="text-2xl font-bold text-indigo-700 flex items-center">
              {formatCLP(data.avgTicket)}
              {comp && renderDelta(comp.avgTicketDelta)}
            </div>
            <div className="text-xs text-gray-400">Promedio gastado por cada cliente en una compra.</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-4">
        <h3 className="font-semibold mb-2 text-indigo-700">Métodos de pago</h3>
        <div className="flex flex-col md:flex-row gap-6 items-center">
          <ul className="space-y-1 flex-1">
            {pieData.map((item, idx) => (
              <li key={item.name} className="flex justify-between items-center">
                <span className="capitalize flex items-center gap-2">
                  <span style={{display:'inline-block',width:12,height:12,background:COLORS[idx%COLORS.length],borderRadius:2}}></span>
                  {item.name}:
                </span>
                <span>
                  {item.cantidad} ventas ({formatCLP(item.value)})
                  <span className="ml-2 text-xs text-gray-500">{item.porcentaje.toFixed(1)}%</span>
                </span>
              </li>
            ))}
            <li className="flex justify-between font-semibold border-t pt-2 mt-2">
              <span>Total:</span>
              <span>{totalVentas} ventas ({formatCLP(totalPagos)})</span>
            </li>
          </ul>
          {/* Gráfico de pastel con tooltip personalizado */}
          {pieData.length > 0 && (
            <ResponsiveContainer width={220} height={180}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60}
                  label={({ name, porcentaje }) => `${name}: ${porcentaje.toFixed(1)}%`}>
                  {pieData.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name, props) => [formatCLP(value), props.payload.name + ` (${props.payload.cantidad} ventas, ${props.payload.porcentaje.toFixed(1)}%)`]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-4">
        <h3 className="font-semibold mb-2 text-indigo-700">Top productos vendidos</h3>
        {data.topProducts && data.topProducts.length > 0 ? (
          <ol className="list-decimal list-inside space-y-1">
            {data.topProducts.map((prod, idx) => (
              <li key={prod.name || idx}>
                <button className="font-medium text-indigo-700 hover:underline" onClick={() => handleProductClick(prod)}>
                  {prod.name}
                </button>
                <span className="text-gray-500"> ({prod.sold} unds)</span>
              </li>
            ))}
          </ol>
        ) : (
          <div className="text-gray-400">No hay productos vendidos este mes.</div>
        )}
        <div className="text-xs text-gray-400 mt-2">Haz clic en un producto para ver detalles rápidos.</div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="font-semibold mb-2 text-indigo-700">Ventas por día del mes</h3>
        <div className="mb-2 text-sm text-gray-500">
          Total del mes: <span className="font-semibold text-indigo-700">{formatCLP(data.totalSales)}</span> &nbsp;|&nbsp; Promedio diario: <span className="font-semibold text-indigo-700">{formatCLP(promedioVentas)}</span>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="dia" />
            <YAxis tickFormatter={formatCLP} />
            <Tooltip formatter={formatCLP} labelFormatter={d => `Día ${d}`} />
            {/* Línea de promedio */}
            <Bar dataKey="ventas" 
              label={({ x, y, width, value }) => value > 0 ? (
                <text x={x + width / 2} y={y - 5} textAnchor="middle" fontSize="11" fill="#6366f1">{formatCLP(value)}</text>
              ) : null}
              fill="#6366f1"
              >
              {chartData.map((entry, idx) => (
                <Cell key={`cell-bar-${idx}`} fill={entry.ventas === maxVentas && maxVentas > 0 ? '#10b981' : '#6366f1'} />
              ))}
            </Bar>
            {/* Línea de promedio diario */}
            <CartesianGrid strokeDasharray="3 3" />
            <Bar dataKey="dummy" fill="transparent" />
            <YAxis />
            <XAxis />
            <Tooltip />
            <Legend />
            <line x1="0" x2="100%" y1={promedioVentas} y2={promedioVentas} stroke="#f59e42" strokeDasharray="4 2" />
          </BarChart>
        </ResponsiveContainer>
        <div className="text-xs text-gray-400 mt-2">Pasa el mouse sobre las barras para ver el detalle de ventas por día. <span className="text-green-600 font-semibold">Verde</span>: día con más ventas.</div>
      </div>
    </div>
  );
};

export default InformeMensual;