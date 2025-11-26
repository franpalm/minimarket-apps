import React from 'react';

const CajaHistoryModal = ({ open, onClose, history }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl relative">
        <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-700" onClick={onClose}>
          <i className="bi bi-x-lg"></i>
        </button>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <i className="bi bi-clock-history text-indigo-600"></i>
          Historial de Caja
        </h2>
        {history && history.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-2 text-left">Fecha</th>
                <th className="py-2 text-left">Usuario</th>
                <th className="py-2 text-left">Estado</th>
                <th className="py-2 text-right">Saldo Inicial</th>
                <th className="py-2 text-right">Saldo Final</th>
              </tr>
            </thead>
            <tbody>
              {history.map((caja) => (
                <tr key={caja.id} className="border-b hover:bg-gray-50">
                  <td>{new Date(caja.fecha_inicio).toLocaleString()}</td>
                  <td>{caja.usuario_nombre || caja.usuario || '-'}</td>
                  <td>{caja.estado}</td>
                  <td className="text-right">{caja.monto_inicial?.toLocaleString('es-CL')}</td>
                  <td className="text-right">{caja.monto_final !== null ? caja.monto_final.toLocaleString('es-CL') : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-gray-500">No hay historial de caja para este día.</div>
        )}
      </div>
    </div>
  );
};

export default CajaHistoryModal;
