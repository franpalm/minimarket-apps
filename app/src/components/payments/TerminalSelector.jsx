/**
 * TerminalSelector.jsx - Componente para seleccionar terminal
 * 
 * Permite seleccionar y configurar diferentes tipos de terminales
 * Muestra información de cada terminal disponible
 */

import React from 'react';
import { getTerminalsForUI, getTerminalUI } from '../../services/payments/utils/TerminalMapper.js';

const TerminalSelector = ({
  availableTerminals = [],
  selectedTerminal,
  onTerminalSelect,
  connectionStatus,
  disabled = false,
  showDescription = true,
  className = ''
}) => {
  // Obtener terminales con información de UI actualizada
  const terminalsForUI = getTerminalsForUI(true);

  // Filtrar solo los terminales disponibles
  const availableTerminalsUI = terminalsForUI.filter(terminal => 
    availableTerminals.includes(terminal.id)
  );

  // Obtener información del terminal (compatibilidad con código existente)
  const getTerminalInfo = (terminalType) => {
    const terminalUI = getTerminalUI(terminalType);
    if (terminalUI) {
      return {
        name: terminalUI.name,
        icon: terminalUI.icon,
        description: terminalUI.description,
        color: terminalUI.color || 'gray'
      };
    }

    // Fallback para terminales no definidos
    return {
      name: terminalType.charAt(0).toUpperCase() + terminalType.slice(1),
      icon: '💳',
      description: 'Terminal de pago',
      color: 'gray'
    };
  };

  // Clases de color para cada terminal
  const getColorClasses = (color, isSelected) => {
    // Mapear colores hex a nombres
    const hexToName = {
      '#28a745': 'green',  // Verde
      '#dc3545': 'red',    // Rojo
      '#007bff': 'blue',   // Azul
      '#6f42c1': 'purple', // Púrpura
      '#fd7e14': 'orange'  // Naranja
    };

    const colorName = hexToName[color] || color || 'gray';
    
    const colors = {
      blue: isSelected ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-blue-200 hover:border-blue-300',
      green: isSelected ? 'border-green-500 bg-green-50 text-green-700' : 'border-green-200 hover:border-green-300',
      red: isSelected ? 'border-red-500 bg-red-50 text-red-700' : 'border-red-200 hover:border-red-300',
      purple: isSelected ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-purple-200 hover:border-purple-300',
      cyan: isSelected ? 'border-cyan-500 bg-cyan-50 text-cyan-700' : 'border-cyan-200 hover:border-cyan-300',
      orange: isSelected ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-orange-200 hover:border-orange-300',
      gray: isSelected ? 'border-gray-500 bg-gray-50 text-gray-700' : 'border-gray-200 hover:border-gray-300'
    };
    return colors[colorName] || colors.gray;
  };

  if (!availableTerminals.length) {
    return (
      <div className={`text-center py-8 text-gray-500 ${className}`}>
        <div className="text-4xl mb-2">🔍</div>
        <div className="font-medium">No hay terminales disponibles</div>
        <div className="text-sm">Configure al menos un terminal para continuar</div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Seleccionar Terminal de Pago
        </label>
        <div className="text-xs text-gray-500">
          Elija el terminal que desea utilizar para procesar pagos
        </div>
      </div>

      <div className="space-y-3">
        {availableTerminals.map((terminalType) => {
          const info = getTerminalInfo(terminalType);
          const isSelected = selectedTerminal === terminalType;
          const isConnected = connectionStatus?.connected && connectionStatus?.terminalType === terminalType;

          return (
            <div key={terminalType} className="relative">
              <button
                onClick={() => !disabled && onTerminalSelect(terminalType)}
                disabled={disabled}
                className={`
                  w-full p-4 rounded-lg border-2 transition-all duration-200 text-left
                  ${getColorClasses(info.color, isSelected)}
                  ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  ${!disabled && !isSelected ? 'hover:shadow-md' : ''}
                `}
              >
                {/* Encabezado del terminal */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{info.icon}</span>
                    <div>
                      <div className="font-medium text-base">{info.name}</div>
                      {showDescription && (
                        <div className="text-sm opacity-75">{info.description}</div>
                      )}
                    </div>
                  </div>

                  {/* Indicadores de estado */}
                  <div className="flex items-center gap-2">
                    {/* Estado de selección */}
                    {isSelected && (
                      <span className="w-6 h-6 bg-current rounded-full flex items-center justify-center text-white text-xs">
                        ✓
                      </span>
                    )}

                    {/* Estado de conexión */}
                    {isConnected && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                        Conectado
                      </span>
                    )}
                  </div>
                </div>

                {/* Información adicional */}
                {isSelected && connectionStatus && (
                  <div className="mt-3 pt-3 border-t border-current border-opacity-20">
                    <div className="text-xs space-y-1 opacity-75">
                      <div className="flex justify-between">
                        <span>Estado:</span>
                        <span className={`font-medium ${
                          isConnected ? 'text-green-600' : 'text-gray-600'
                        }`}>
                          {isConnected ? 'Conectado' : 'Desconectado'}
                        </span>
                      </div>
                      
                      {connectionStatus.lastPing && (
                        <div className="flex justify-between">
                          <span>Último ping:</span>
                          <span>{new Date(connectionStatus.lastPing).toLocaleTimeString()}</span>
                        </div>
                      )}
                      
                      {connectionStatus.error && (
                        <div className="text-red-600 font-medium mt-2">
                          Error: {connectionStatus.error}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Información adicional */}
      <div className="mt-4 text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
        <div className="font-medium mb-1">💡 Consejos:</div>
        <ul className="space-y-1 ml-4">
          <li>• Use el <strong>Simulador</strong> para pruebas sin hardware real</li>
          <li>• Los terminales reales requieren configuración adicional</li>
          <li>• Mantenga solo un terminal conectado a la vez</li>
        </ul>
      </div>
    </div>
  );
};

export default TerminalSelector;