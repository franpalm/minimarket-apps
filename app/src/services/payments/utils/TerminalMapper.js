/**
 * TerminalMapper.js - Mapea configuraciones de terminales con nombres de UI
 * 
 * Proporciona una interfaz para convertir entre IDs de terminales y nombres amigables
 */

import { TERMINAL_CONFIGS, getAvailableTerminals } from '../utils/PaymentConfig.js';

/**
 * Mapeo de terminales para la UI
 */
export const TERMINAL_UI_MAP = {
  simulator: {
    id: 'simulator',
    name: 'Simulador (Testing)',
    icon: '🧪',
    description: 'Terminal simulado para pruebas y desarrollo',
    color: '#28a745',
    enabled: true
  },
  transbank: {
    id: 'transbank', 
    name: 'Transbank WebPay',
    icon: '🏦',
    description: 'Terminal Transbank para Chile',
    color: '#dc3545',
    enabled: true
  },
  point: {
    id: 'point',
    name: 'MercadoPago Point', 
    icon: '💳',
    description: 'Terminal MercadoPago Point',
    color: '#007bff',
    enabled: true
  },
  getnet: {
    id: 'getnet',
    name: 'GetNet POS',
    icon: '📱', 
    description: 'Terminal GetNet para Brasil',
    color: '#6f42c1',
    enabled: false
  },
  sumup: {
    id: 'sumup',
    name: 'SumUp Terminal',
    icon: '⚡',
    description: 'Terminal SumUp',
    color: '#fd7e14',
    enabled: false
  }
};

/**
 * Obtiene terminales disponibles con información de UI
 * @param {boolean} includeSimulator - Incluir simulador
 * @returns {Array} Lista de terminales con info de UI
 */
export const getTerminalsForUI = (includeSimulator = true) => {
  const availableIds = getAvailableTerminals(includeSimulator);
  
  return availableIds
    .filter(terminalId => TERMINAL_UI_MAP[terminalId]?.enabled)
    .map(terminalId => {
      const uiInfo = TERMINAL_UI_MAP[terminalId];
      const config = TERMINAL_CONFIGS[terminalId];
      
      return {
        ...uiInfo,
        config: {
          timeout: config.timeout,
          minAmount: config.minAmount,
          maxAmount: config.maxAmount,
          retries: config.retries
        }
      };
    });
};

/**
 * Obtiene información de UI para un terminal específico
 * @param {string} terminalId - ID del terminal
 * @returns {object|null} Información de UI del terminal
 */
export const getTerminalUI = (terminalId) => {
  return TERMINAL_UI_MAP[terminalId] || null;
};

/**
 * Valida si un terminal está habilitado para UI
 * @param {string} terminalId - ID del terminal
 * @returns {boolean} True si está habilitado
 */
export const isTerminalUIEnabled = (terminalId) => {
  const uiInfo = TERMINAL_UI_MAP[terminalId];
  return uiInfo?.enabled === true;
};

/**
 * Obtiene el nombre amigable de un terminal
 * @param {string} terminalId - ID del terminal
 * @returns {string} Nombre amigable
 */
export const getTerminalName = (terminalId) => {
  const uiInfo = TERMINAL_UI_MAP[terminalId];
  return uiInfo?.name || terminalId;
};

/**
 * Obtiene terminales agrupados por categoría
 * @returns {object} Terminales agrupados
 */
export const getTerminalsByCategory = () => {
  const terminals = getTerminalsForUI(true);
  
  return {
    testing: terminals.filter(t => t.id === 'simulator'),
    production: terminals.filter(t => t.id !== 'simulator'),
    all: terminals
  };
};

export default {
  TERMINAL_UI_MAP,
  getTerminalsForUI,
  getTerminalUI,
  isTerminalUIEnabled,
  getTerminalName,
  getTerminalsByCategory
};