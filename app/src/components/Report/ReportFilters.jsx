import React from 'react';

const ReportFilters = ({ activeTab, filters, onChange, onApply }) => {
  if (activeTab === 'daily') {
    // Solo muestra la fecha de hoy, no editable, sin botón de aplicar filtros
    return (
      <div className="mb-6 flex flex-wrap gap-4">
        <div className="w-full md:w-auto">
          <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
          <input
            type="date"
            className="border rounded py-1 px-2 text-sm bg-gray-100 cursor-not-allowed"
            name="dateFrom"
            value={filters.dateFrom}
            readOnly
            disabled
          />
        </div>
      </div>
    );
  }

  return (
    <form
      className="mb-6 flex flex-wrap gap-4"
      onSubmit={e => {
        e.preventDefault();
        onApply();
      }}
    >
      {activeTab === 'weekly' && (
        <div className="w-full md:w-auto">
          <label className="block text-sm font-medium text-gray-700 mb-1">Semana</label>
          <input
            type="week"
            className="border rounded py-1 px-2 text-sm"
            name="week"
            value={filters.week || ''}
            onChange={onChange}
          />
        </div>
      )}
      {/* Filtros avanzados para todos los tabs excepto daily */}
      {activeTab !== 'daily' && (
        <>
          <div className="w-full md:w-auto">
            <label className="block text-sm font-medium text-gray-700 mb-1">Método de Pago</label>
            <select
              className="border rounded py-1 px-2 text-sm w-full"
              name="payment"
              value={filters.payment}
              onChange={onChange}
            >
              <option value="">Todos</option>
              <option value="Efectivo">Efectivo</option>
              <option value="Transferencia">Transferencia</option>
              <option value="terminal">Terminal</option>
              <option value="Tarjeta">Tarjeta</option>
            </select>
          </div>
          <div className="w-full md:w-auto">
            <label className="block text-sm font-medium text-gray-700 mb-1">Usuario/Cajero</label>
            <input
              type="text"
              className="border rounded py-1 px-2 text-sm"
              name="usuario"
              value={filters.usuario || ''}
              onChange={onChange}
              placeholder="ID o nombre de usuario"
            />
          </div>
          <div className="w-full md:w-auto">
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado Terminal</label>
            <select
              className="border rounded py-1 px-2 text-sm w-full"
              name="terminal_status"
              value={filters.terminal_status || ''}
              onChange={onChange}
            >
              <option value="">Todos</option>
              <option value="approved">Aprobado</option>
              <option value="rejected">Rechazado</option>
              <option value="pending">Pendiente</option>
            </select>
          </div>
        </>
      )}
      {/* Filtros específicos para products tab */}
      {activeTab === 'products' && (
        <>
          <div className="w-full md:w-auto">
            <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
            <input
              type="date"
              className="border rounded py-1 px-2 text-sm"
              name="dateFrom"
              value={filters.dateFrom}
              onChange={onChange}
            />
          </div>
          <div className="w-full md:w-auto">
            <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
            <input
              type="date"
              className="border rounded py-1 px-2 text-sm"
              name="dateTo"
              value={filters.dateTo}
              onChange={onChange}
            />
          </div>
          <div className="w-full md:w-auto">
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
            <select
              className="border rounded py-1 px-2 text-sm w-full"
              name="category"
              value={filters.category}
              onChange={onChange}
            >
              <option value="">Todas las categorías</option>
              <option value="category1">Categoría 1</option>
              <option value="category2">Categoría 2</option>
              <option value="category3">Categoría 3</option>
            </select>
          </div>
          <div className="w-full md:w-auto">
            <label className="block text-sm font-medium text-gray-700 mb-1">Top N</label>
            <select
              className="border rounded py-1 px-2 text-sm w-full"
              name="topN"
              value={filters.topN}
              onChange={onChange}
            >
              <option value="5">Top 5</option>
              <option value="10">Top 10</option>
              <option value="15">Top 15</option>
              <option value="20">Top 20</option>
            </select>
          </div>
        </>
      )}
      {activeTab !== 'monthly' && (
        <div className="w-full md:w-auto ml-auto flex items-end">
          <button
            type="submit"
            className="py-1 px-4 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition flex items-center gap-2"
          >
            <i className="bi bi-funnel"></i>Aplicar Filtros
          </button>
        </div>
      )}
    </form>
  );
};

export default ReportFilters;