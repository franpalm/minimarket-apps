import React from 'react';

function KPICard({ title, value, unit, badge, badgeColor = 'bg-green-100 text-green-800', updated, onClick }) {
  return (
    <div
      className={`bg-white rounded-lg shadow p-6 card-kpi transition-all hover:-translate-y-1 hover:shadow-lg ${onClick ? 'cursor-pointer ring-2 ring-indigo-200' : ''}`}
      onClick={onClick}
      tabIndex={onClick ? 0 : undefined}
      role={onClick ? 'button' : undefined}
      aria-pressed={onClick ? 'false' : undefined}
      style={onClick ? { userSelect: 'none' } : {}}
    >
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        {badge && (
          <span className={`text-xs px-2 py-1 rounded-full ${badgeColor}`}>{badge}</span>
        )}
      </div>
      <div className="flex items-baseline">
        <span className="text-2xl font-bold text-gray-900">{value}</span>
        {unit && <span className="ml-1 text-sm text-gray-500">{unit}</span>}
      </div>
      <div className="mt-2 text-xs text-gray-500">{updated || 'Actualizado a las --:-- AM'}</div>
    </div>
  );
}

export default KPICard;