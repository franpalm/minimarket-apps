import React from 'react';

const InventorySummary = ({ totalStock, totalSold, totalIncome, avgMargin, inventoryStatus }) => {
  // inventoryStatus: { ok: n, low: n, critical: n }
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-white rounded-lg shadow p-4 flex flex-col items-center">
        <span className="text-2xl font-bold text-indigo-700">{totalStock}</span>
        <span className="text-gray-600 text-sm">Productos en stock</span>
      </div>
      <div className="bg-white rounded-lg shadow p-4 flex flex-col items-center">
        <span className="text-2xl font-bold text-green-600">{totalSold}</span>
        <span className="text-gray-600 text-sm">Vendidos este mes</span>
      </div>
      <div className="bg-white rounded-lg shadow p-4 flex flex-col items-center">
        <span className="text-2xl font-bold text-emerald-600">{totalIncome}</span>
        <span className="text-gray-600 text-sm">Ingresos totales</span>
      </div>
      <div className="bg-white rounded-lg shadow p-4 flex flex-col items-center">
        <span className="text-2xl font-bold text-yellow-600">{avgMargin}</span>
        <span className="text-gray-600 text-sm">Margen promedio</span>
      </div>
      {/* Semáforo de inventario */}
      <div className="col-span-1 md:col-span-4 flex justify-center items-center mt-2">
        <div className="flex gap-6">
          <div className="flex flex-col items-center">
            <span className="w-4 h-4 rounded-full bg-green-500 inline-block mb-1"></span>
            <span className="text-xs text-gray-600">Bien: {inventoryStatus.ok}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="w-4 h-4 rounded-full bg-yellow-400 inline-block mb-1"></span>
            <span className="text-xs text-gray-600">Bajo: {inventoryStatus.low}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="w-4 h-4 rounded-full bg-red-500 inline-block mb-1"></span>
            <span className="text-xs text-gray-600">Crítico: {inventoryStatus.critical}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventorySummary;
