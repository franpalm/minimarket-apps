/**
 * ConnectionIndicator.jsx - Indicador de conexión con terminal
 * 
 * Muestra el estado actual de la conexión con el terminal
 * Incluye información visual y textual del estado
 */

import React from 'react';

const ConnectionIndicator = ({ 
  connectionStatus, 
  terminalType = null, 
  showDetails = true,
  size = 'md',
  className = '' 
}) => {
  const { connected, lastPing, error } = connectionStatus;

  // Estilos según el tamaño
  const sizeClasses = {
    sm: 'text-sm px-2 py-1',
    md: 'text-base px-3 py-2', 
    lg: 'text-lg px-4 py-3'
  };

  // Clases de estado
  const getStatusClasses = () => {
    if (connected) {
      return 'bg-green-100 text-green-800 border border-green-200';
    } else if (error) {
      return 'bg-red-100 text-red-800 border border-red-200';
    } else {
      return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  // Icono según el estado
  const getStatusIcon = () => {
    if (connected) return '✅';
    if (error) return '❌';
    return '⚪';
  };

  // Texto del estado
  const getStatusText = () => {
    if (connected) return 'Conectado';
    if (error) return 'Error de conexión';
    return 'Desconectado';
  };

  // Formatear tiempo del último ping
  const formatLastPing = (timestamp) => {
    if (!timestamp) return null;
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  return (
    <div className={`rounded-lg ${sizeClasses[size]} ${getStatusClasses()} ${className}`}>
      {/* Indicador básico */}
      <div className="flex items-center gap-2">
        <span className="text-lg">{getStatusIcon()}</span>
        <span className="font-medium">{getStatusText()}</span>
        
        {/* Tipo de terminal */}
        {connected && terminalType && (
          <span className="text-xs bg-white bg-opacity-50 px-2 py-1 rounded-full">
            {terminalType}
          </span>
        )}
      </div>

      {/* Detalles adicionales */}
      {showDetails && (
        <div className="mt-2 space-y-1 text-xs opacity-75">
          {/* Terminal info */}
          {terminalType && (
            <div>
              Terminal: {terminalType.charAt(0).toUpperCase() + terminalType.slice(1)}
            </div>
          )}
          
          {/* Último ping */}
          {connected && lastPing && (
            <div>
              Último ping: {formatLastPing(lastPing)}
            </div>
          )}
          
          {/* Error message */}
          {error && (
            <div className="text-red-700 font-medium">
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ConnectionIndicator;