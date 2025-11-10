import React from 'react';

const SalesBreakdownModal = ({ open, onClose, breakdown }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 min-w-[320px]">
        <h2 className="text-lg font-bold mb-4">Ventas por Método de Pago</h2>
        <ul className="mb-4">
          {Object.entries(breakdown).map(([method, data]) => (
            <li key={method} className="flex justify-between">
              <span>
                {method.charAt(0).toUpperCase() + method.slice(1)}
                <span className="ml-2 text-xs text-gray-500">
                  ({data.cantidad} venta{data.cantidad === 1 ? '' : 's'})
                </span>
              </span>
              <span className="font-bold">
                ${data.total.toLocaleString('es-CL')}
              </span>
            </li>
          ))}
        </ul>
        <div className="border-t pt-2 flex justify-between font-bold">
          <span>Total</span>
          <span>
            ${Object.values(breakdown).reduce((a, b) => a + b.total, 0).toLocaleString('es-CL')}
          </span>
        </div>
        <button
          className="mt-6 py-1 px-4 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
          onClick={onClose}
        >
          Cerrar
        </button>
      </div>
    </div>
  );
};

export default SalesBreakdownModal;