import React, { useState, useMemo } from 'react';
import CajaHistoryModal from './CajaHistoryModal';
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

  // Usa breakdown real si viene del backend; si falta, lo recalcula desde las ventas
  const breakdown = useMemo(() => {
    if (reportData?.breakdownByPayment && Object.keys(reportData.breakdownByPayment).length > 0) {
      return reportData.breakdownByPayment;
    }
    if (!reportData?.ventas) {
      return {};
    }
    return reportData.ventas.reduce((acc, venta) => {
      const key = (venta.metodo_pago || 'desconocido').toLowerCase();
      if (!acc[key]) {
        acc[key] = { cantidad: 0, total: 0 };
      }
      acc[key].cantidad += 1;
      acc[key].total += Number(venta.total_venta) || 0;
      return acc;
    }, {});
  }, [reportData]);


  // Resumen de caja y movimientos
  const resumenCaja = reportData?.resumenCaja;
  const caja = resumenCaja?.caja;

  // Modal historial de caja
  const [historyOpen, setHistoryOpen] = useState(false);
  const [cajaHistory, setCajaHistory] = useState([]);

  // Handler para mostrar historial de caja
  const handleShowHistory = async () => {
    // Siempre hace fetch al backend usando la fecha del reporte diario
    try {
      // Usar la fecha del reporte diario (from_date) si está disponible
      let date = null;
      if (reportData?.resumenCaja?.caja?.fecha_inicio) {
        date = reportData.resumenCaja.caja.fecha_inicio.substring(0, 10);
      } else if (reportData?.ventas?.length > 0 && reportData.ventas[0].fecha_venta) {
        date = reportData.ventas[0].fecha_venta.substring(0, 10);
      } else {
        // fallback: hoy
        date = new Date().toISOString().substring(0, 10);
      }
      const resp = await fetch(`/api/cajas/?fecha=${date}`);
      if (resp.ok) {
        const data = await resp.json();
        setCajaHistory(data);
        setHistoryOpen(true);
      } else {
        setCajaHistory([]);
        setHistoryOpen(true);
      }
    } catch {
      setCajaHistory([]);
      setHistoryOpen(true);
    }
  };

  return (
    <>

      {/* Bloque resumen de caja */}
      <div className="mb-6">
        <div className="bg-white rounded-lg shadow p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <i className={`bi ${caja?.estado === 'abierta' ? 'bi-unlock' : 'bi-lock'} text-indigo-600 text-xl`}></i>
              <span className="font-semibold text-lg">Caja {caja ? (caja.estado === 'abierta' ? 'Abierta' : 'Cerrada') : 'No abierta'}</span>
              {caja && (
                <span className={`ml-2 px-2 py-1 rounded text-xs ${caja.estado === 'abierta' ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'}`}>{caja.estado}</span>
              )}
              {/* Botón historial */}
              <button className="ml-4 px-2 py-1 rounded text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition flex items-center gap-1" onClick={handleShowHistory}>
                <i className="bi bi-clock-history"></i> Ver historial
              </button>
            </div>
            <div className="text-sm text-gray-600">
              Usuario: <span className="font-medium">{caja?.usuario || '-'}</span>
              {caja?.fecha_inicio && (
                <span className="ml-4">Inicio: {new Date(caja.fecha_inicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              )}
              {caja?.fecha_cierre && (
                <span className="ml-4">Cierre: {new Date(caja.fecha_cierre).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-4 mt-4 md:mt-0">
            <div className="text-center">
              <div className="text-xs text-gray-500">Saldo Inicial</div>
              <div className="font-bold text-lg">{formatCLP(resumenCaja?.saldo_inicial || 0)}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500">Ingresos</div>
              <div className="font-bold text-lg text-green-700">{formatCLP(resumenCaja?.ingresos || 0)}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500">Egresos</div>
              <div className="font-bold text-lg text-red-700">{formatCLP(resumenCaja?.egresos || 0)}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500">Saldo Final</div>
              <div className="font-bold text-lg">{resumenCaja?.saldo_final !== null && resumenCaja?.saldo_final !== undefined ? formatCLP(resumenCaja.saldo_final) : '-'}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Ventas Totales</h3>
            <button className="text-xs px-2 py-1 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100" onClick={() => setModalOpen(true)}>Detalle</button>
          </div>
          <div className="mt-3">
            <div className="text-sm text-gray-500">Total del día</div>
            <div className="text-2xl font-bold text-indigo-700">{reportData ? formatCLP(reportData.totalSales) : '$--,---'}</div>
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded border border-gray-200 p-3">
              <div className="text-xs text-gray-500">Efectivo</div>
              <div className="font-bold text-green-700">{formatCLP((breakdown.efectivo && breakdown.efectivo.total) || 0)}</div>
              <div className="text-xs text-gray-500">{(breakdown.efectivo && breakdown.efectivo.cantidad) || 0} ventas</div>
            </div>
            <div className="rounded border border-gray-200 p-3">
              <div className="text-xs text-gray-500">Débito/Terminal</div>
              <div className="font-bold text-blue-700">{formatCLP((breakdown.terminal && breakdown.terminal.total) || 0)}</div>
              <div className="text-xs text-gray-500">{(breakdown.terminal && breakdown.terminal.cantidad) || 0} ventas</div>
            </div>
          </div>
        </div>
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
      <CajaHistoryModal open={historyOpen} onClose={() => setHistoryOpen(false)} history={cajaHistory} />
    </>
  );
};

export default PulsoDelDia;