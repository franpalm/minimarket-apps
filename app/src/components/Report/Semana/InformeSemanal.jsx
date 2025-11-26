import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const InformeSemanal = ({ reportData, formatCLP, selectedWeek, onWeekChange }) => {
  // Selector de semana (input type="week")
  const handleWeekChange = (e) => {
    if (onWeekChange) {
      onWeekChange(e.target.value);
    }
  };
    // Exportar ventas a CSV (incluye efectivo, terminal, etc.)
    const handleDownload = () => {
      if (!reportData || !reportData.ventas) return;
      const ventas = reportData.ventas;
      const headers = [
        'ID', 'Fecha', 'Total', 'Método de Pago', 'Usuario', 'Terminal Transaction ID', 'Terminal Response'
      ];
      const rows = ventas.map(v => [
        v.id,
        v.fecha_venta,
        v.total_venta,
        v.metodo_pago,
        v.usuario_id,
        v.terminal_transaction_id || '',
        v.terminal_response || ''
      ]);
      let csvContent = headers.join(',') + '\n';
      csvContent += rows.map(r => r.map(x => `"${x}"`).join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', 'reporte_ventas_semanal.csv');
      document.body.appendChild(link);
      link.click();
      if (link.parentNode) {
        link.parentNode.removeChild(link);
      }
    };
  if (!reportData || Object.keys(reportData).length === 0 || reportData.error) {
    return (
      <div className="text-gray-400 py-12 text-center">
        No hay datos para la semana seleccionada o hubo un error.
      </div>
    );
  }

  // Datos para el gráfico
  const chartData = daysOfWeek.map((day, idx) => ({
    name: day,
    ventas: reportData && reportData.salesByDay ? reportData.salesByDay[idx] : 0,
  }));

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mt-2">
        <div className="flex items-center gap-2">
          <label htmlFor="weekPicker" className="font-semibold text-indigo-700">Semana:</label>
          <input
            id="weekPicker"
            type="week"
            className="border rounded px-2 py-1"
            value={selectedWeek || ''}
            onChange={handleWeekChange}
          />
        </div>
        <div className="text-right">
          <button className="py-2 px-4 border border-indigo-600 text-indigo-600 rounded hover:bg-indigo-50 transition flex items-center gap-2" onClick={handleDownload}>
            <i className="bi bi-download"></i> Descargar Reporte
          </button>
        </div>
      </div>
      {/* Resumen visual amigable */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-2 text-center">
        <span className="text-lg md:text-xl font-semibold text-indigo-800">
          Esta semana vendiste <span className="font-bold">{formatCLP(reportData.totalSales)}</span> en <span className="font-bold">{reportData.salesCount}</span> ventas.<br />
          El cliente promedio gastó <span className="font-bold">{formatCLP(reportData.avgTicket)}</span> por compra.
        </span>
      </div>
      {/* Resumen con iconos y descripciones */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
          <span className="text-3xl mb-2">💰</span>
          <span className="text-gray-500 text-sm font-semibold">Total ventas</span>
          <span className="text-2xl font-bold text-indigo-700">{formatCLP(reportData.totalSales)}</span>
          <span className="text-xs text-gray-400 mt-1">Monto total vendido en la semana.</span>
        </div>
        <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
          <span className="text-3xl mb-2">🛒</span>
          <span className="text-gray-500 text-sm font-semibold">N° de ventas</span>
          <span className="text-2xl font-bold text-indigo-700">{reportData.salesCount}</span>
          <span className="text-xs text-gray-400 mt-1">Cantidad de compras realizadas.</span>
        </div>
        <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
          <span className="text-3xl mb-2">🧾</span>
          <span className="text-gray-500 text-sm font-semibold">Ticket promedio</span>
          <span className="text-2xl font-bold text-indigo-700">{formatCLP(reportData.avgTicket)}</span>
          <span className="text-xs text-gray-400 mt-1">Promedio gastado por cada cliente en una compra.</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h3 className="font-semibold mb-2 text-indigo-700">Métodos de pago</h3>
          <ul className="space-y-1">
            {Object.entries(reportData.breakdownByPayment || {}).map(([metodo, val]) => (
              <li key={metodo} className="flex justify-between">
                <span className="capitalize">{metodo}:</span>
                <span>
                  {val.cantidad} ventas ({formatCLP(val.total)})
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-semibold mb-2 text-indigo-700">Top productos vendidos</h3>
          {reportData.topProducts && reportData.topProducts.length > 0 ? (
            <ol className="list-decimal list-inside space-y-1">
              {reportData.topProducts.map((prod, idx) => (
                <li key={prod.name || idx}>
                  <span className="font-medium">{prod.name}</span>
                  <span className="text-gray-500"> ({prod.sold} unds)</span>
                </li>
              ))}
            </ol>
          ) : (
            <div className="text-gray-400">No hay productos vendidos esta semana.</div>
          )}
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-2 text-indigo-700">Ventas por día</h3>
        <div className="overflow-x-auto mb-4">
          <table className="min-w-full text-sm border rounded">
            <thead>
              <tr className="bg-gray-100">
                {daysOfWeek.map(day => (
                  <th key={day} className="px-2 py-1 font-semibold">{day}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {(reportData.salesByDay || Array(7).fill(0)).map((val, idx) => (
                  <td key={idx} className="px-2 py-1 text-center border-t">{formatCLP(val)}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
        {/* Gráfico de barras */}
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis tickFormatter={formatCLP} />
            <Tooltip formatter={formatCLP} />
            <Bar dataKey="ventas" fill="#6366f1" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default InformeSemanal;