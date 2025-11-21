import React, { useState } from 'react';
import KPICard from '../KPICard';
import SalesByHourChart from '../SalesByHourChart';
import SalesBreakdownModal from '../SalesBreakdownModal';

const PulsoDelDia = ({ reportData, formatCLP }) => {
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
      link.setAttribute('download', 'reporte_ventas_dia.csv');
      document.body.appendChild(link);
      link.click();
      if (link.parentNode) {
        link.parentNode.removeChild(link);
      }
    };
  const [modalOpen, setModalOpen] = useState(false);

  // Usa breakdown real si viene del backend, si no, simula
  const breakdown = reportData?.breakdownByPayment || {};

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <KPICard
          title="Ventas Totales"
          value={reportData ? formatCLP(reportData.totalSales) : '$--,---'}
          unit="CLP"
          badge="+5.2% vs día anterior"
          badgeColor="bg-green-100 text-green-800"
          updated="Actualizado a las --:-- AM"
          onClick={() => setModalOpen(true)}
        />
        <KPICard
          title="Número de Ventas"
          value={reportData ? reportData.salesCount : '--'}
          unit="transacciones"
          badge="+3.8% vs día anterior"
          badgeColor="bg-green-100 text-green-800"
          updated="Actualizado a las --:-- AM"
        />
        <KPICard
          title="Ticket Promedio"
          value={reportData ? formatCLP(reportData.avgTicket) : '$---'}
          unit="CLP"
          badge="+1.4% vs día anterior"
          badgeColor="bg-green-100 text-green-800"
          updated="Actualizado a las --:-- AM"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6 relative">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <i className="bi bi-clock-history text-indigo-600"></i>
            Ventas por Hora
          </h3>
          <div className="h-64">
            {reportData && reportData.salesByHour
              ? <SalesByHourChart data={reportData.salesByHour} />
              : '[Gráfico de Ventas por Hora]'}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 relative">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <i className="bi bi-star-fill text-yellow-500"></i>
            Top Productos del Día
          </h3>
          <div className="h-64 flex flex-col justify-center gap-2 text-gray-700">
            {reportData && reportData.topProducts
              ? (
                <ul>
                  {reportData.topProducts.map((prod, idx) => (
                    <li key={prod.name} className="flex justify-between">
                      <span>{idx + 1}. {prod.name}</span>
                      <span className="font-bold">{parseInt(prod.sold, 10)} vendidos</span>
                    </li>
                  ))}
                </ul>
              )
              : '[Gráfico Top Productos]'
            }
          </div>
        </div>
      </div>
      <div className="mt-6 text-right">
        <button className="py-2 px-4 border border-indigo-600 text-indigo-600 rounded hover:bg-indigo-50 transition flex items-center gap-2" onClick={handleDownload}>
          <i className="bi bi-download"></i> Descargar Reporte
        </button>
      </div>
      <SalesBreakdownModal open={modalOpen} onClose={() => setModalOpen(false)} breakdown={breakdown} />
    </>
  );
};

export default PulsoDelDia;