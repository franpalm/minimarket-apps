/**
 * PaymentConfig.js - Configuraciones y constantes del sistema de pagos
 * 
 * Centraliza todas las configuraciones para diferentes terminales
 * y constantes utilizadas en el sistema de pagos
 */

// === CONFIGURACIONES POR TERMINAL ===

export const TERMINAL_CONFIGS = {
  simulator: {
    name: 'Simulador de Testing',
    timeout: 10000,
    retries: 2,
    successRate: 0.9, // 90% de pagos exitosos
    processingDelay: 3000, // 3 segundos de procesamiento
    minAmount: 1,
    maxAmount: 1000000,
    amountInCents: false,
    amountAsString: false,
    transactionPrefix: 'SIM',
    // Fallas simuladas para testing
    simulatedFailures: [
      {
        type: 'INSUFFICIENT_FUNDS',
        probability: 0.05, // 5% probabilidad
        condition: { amountGreaterThan: 100000 } // Solo para montos > $100,000
      },
      {
        type: 'CARD_DECLINED',
        probability: 0.03, // 3% probabilidad
      }
    ]
  },

  transbank: {
    name: 'Transbank',
    timeout: 60000, // 60 segundos
    retries: 3,
    minAmount: 50, // Monto mínimo $50
    maxAmount: 500000, // Monto máximo $500,000
    amountInCents: false,
    amountAsString: true,
    transactionPrefix: 'TB',
    endpoint: 'http://localhost:8080/transbank',
    // Configuración específica Transbank - CREDENCIALES DE INTEGRACIÓN
    commerceCode: '597055555532', // Commerce code de integración
    apiKey: '579B532A7440BB0C9079DED94D31EA1615BACEB56610332264630D42D0A36B1C', // API Key de integración
    terminalId: 'T001',
    certificatePath: null, // Ruta al certificado en producción
    environment: 'integration', // 'integration' o 'production'
    returnUrl: 'http://localhost:3000/payment/return',
    enabled: true // HABILITADO PARA USAR
  },

  getnet: {
    name: 'Getnet',
    timeout: 45000,
    retries: 3,
    minAmount: 1,
    maxAmount: 999999,
    amountInCents: true, // Getnet requiere montos en centavos
    amountAsString: false,
    transactionPrefix: 'GN',
    endpoint: 'https://api.getnet.com.br/payment',
    // Configuración específica Getnet
    sellerId: null, // Debe ser configurado
    clientId: null, // Debe ser configurado
    clientSecret: null // Debe ser configurado
  },

  point: {
    name: 'Point (Mercado Pago)',
    timeout: 90000, // 90 segundos (Point puede tardar más)
    retries: 2,
    minAmount: 1,
    maxAmount: 300000,
    amountInCents: false,
    amountAsString: false,
    transactionPrefix: 'MP',
    endpoint: 'https://api.mercadopago.com/point/integration-api',
    // Configuración específica Point - CREDENCIALES DE PRUEBA
    accessToken: 'TEST-7916655951353023-092613-c43ec063fd9c02b3c7de8a088bb2063c-1460631651', // Token de prueba
    deviceId: null, // ID del dispositivo Point
    storeId: null, // ID de la tienda
    posId: null, // ID del POS
    environment: 'sandbox', // 'sandbox' o 'production'
    enabled: true // HABILITADO PARA USAR
  },

  sumup: {
    name: 'SumUp',
    timeout: 30000,
    retries: 3,
    minAmount: 1,
    maxAmount: 500000,
    amountInCents: false,
    amountAsString: false,
    transactionPrefix: 'SU',
    endpoint: 'https://api.sumup.com/v0.1',
    // Configuración específica SumUp
    accessToken: null, // Debe ser configurado
    merchantCode: null, // Código del comerciante
    cardReader: null // ID del lector de tarjetas
  },

  serial: {
    name: 'Terminal Serial/USB',
    timeout: 45000,
    retries: 3,
    minAmount: 1,
    maxAmount: 999999,
    amountInCents: false,
    amountAsString: true,
    transactionPrefix: 'USB',
    // Configuración específica Serial
    baudRate: 9600,
    dataBits: 8,
    stopBits: 1,
    parity: 'none',
    portName: null, // Se detecta automáticamente
    protocol: 'ISO8583' // Protocolo de comunicación
  }
};

// === CONSTANTES GLOBALES ===

export const PAYMENT_STATES = {
  IDLE: 'idle',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  DISCONNECTED: 'disconnected',
  ERROR: 'error'
};

export const ERROR_CODES = {
  // Errores de conexión
  CONNECTION_FAILED: 'CONNECTION_FAILED',
  CONNECTION_TIMEOUT: 'CONNECTION_TIMEOUT',
  TERMINAL_NOT_FOUND: 'TERMINAL_NOT_FOUND',
  ALREADY_CONNECTED: 'ALREADY_CONNECTED',
  
  // Errores de pago
  PAYMENT_DECLINED: 'PAYMENT_DECLINED',
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
  EXPIRED_CARD: 'EXPIRED_CARD',
  INVALID_CARD: 'INVALID_CARD',
  PAYMENT_TIMEOUT: 'PAYMENT_TIMEOUT',
  PAYMENT_CANCELLED: 'PAYMENT_CANCELLED',
  
  // Errores de validación
  INVALID_AMOUNT: 'INVALID_AMOUNT',
  AMOUNT_TOO_LOW: 'AMOUNT_TOO_LOW',
  AMOUNT_TOO_HIGH: 'AMOUNT_TOO_HIGH',
  INVALID_CONFIG: 'INVALID_CONFIG',
  
  // Errores del sistema
  TERMINAL_ERROR: 'TERMINAL_ERROR',
  COMMUNICATION_ERROR: 'COMMUNICATION_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
};

export const CARD_TYPES = {
  VISA: 'Visa',
  MASTERCARD: 'Mastercard',
  AMERICAN_EXPRESS: 'American Express',
  DINERS: 'Diners Club',
  DISCOVER: 'Discover',
  UNKNOWN: 'Desconocida'
};

export const CURRENCY_CODES = {
  CLP: 'CLP', // Peso chileno
  USD: 'USD', // Dólar estadounidense
  EUR: 'EUR', // Euro
  BRL: 'BRL', // Real brasileño
  ARS: 'ARS', // Peso argentino
  PEN: 'PEN', // Sol peruano
  COP: 'COP', // Peso colombiano
  MXN: 'MXN'  // Peso mexicano
};

// === CONFIGURACIÓN GLOBAL ===

export const GLOBAL_CONFIG = {
  // Configuración de logs
  logging: {
    enabled: true,
    level: 'info', // 'debug', 'info', 'warn', 'error'
    maxHistorySize: 100, // Máximo número de logs a mantener
    includeStackTrace: false // Solo en desarrollo
  },

  // Configuración de transacciones
  transactions: {
    maxHistorySize: 50, // Máximo número de transacciones a mantener en memoria
    autoCleanupInterval: 300000, // 5 minutos en ms
    defaultTimeout: 30000, // Timeout por defecto para transacciones
    maxRetries: 3 // Número máximo de reintentos por defecto
  },

  // Configuración de conexión
  connection: {
    healthCheckInterval: 10000, // Cada 10 segundos
    maxReconnectAttempts: 3,
    reconnectDelay: 2000, // 2 segundos entre intentos
    connectionTimeout: 15000 // 15 segundos para establecer conexión
  },

  // Configuración de UI
  ui: {
    showDetailedErrors: true, // Mostrar errores detallados al usuario
    autoHideSuccessMessage: 3000, // Ocultar mensajes de éxito después de 3 segundos
    autoHideErrorMessage: 5000, // Ocultar mensajes de error después de 5 segundos
    confirmCancelation: true, // Confirmar antes de cancelar pagos
    showTransactionHistory: true // Mostrar historial de transacciones
  },

  // Configuración de seguridad
  security: {
    logSensitiveData: false, // NUNCA loggar datos sensibles de tarjetas
    encryptLogs: false, // Encriptar logs (implementar si es necesario)
    maxSessionTime: 3600000, // 1 hora máxima de sesión
    requireReauth: false // Requerir reautenticación para operaciones sensibles
  },

  // Configuración de desarrollo
  development: {
    mockTerminals: true, // Permitir terminales simulados
    debugMode: false, // Modo debug activado
    verboseLogging: false, // Logs detallados
    skipValidation: false // Saltar validaciones (SOLO DESARROLLO)
  }
};

// === UTILIDADES DE CONFIGURACIÓN ===

/**
 * Obtiene la configuración de un terminal específico
 * @param {string} terminalType - Tipo de terminal
 * @returns {object} Configuración del terminal
 */
export const getTerminalConfig = (terminalType) => {
  const config = TERMINAL_CONFIGS[terminalType];
  if (!config) {
    throw new Error(`Terminal configuration not found for: ${terminalType}`);
  }
  return { ...config }; // Retornar copia para evitar mutaciones
};

/**
 * Valida si un tipo de terminal es soportado
 * @param {string} terminalType - Tipo de terminal
 * @returns {boolean} True si es soportado
 */
export const isTerminalSupported = (terminalType) => {
  return terminalType in TERMINAL_CONFIGS;
};

/**
 * Obtiene la lista de terminales disponibles y habilitados
 * @param {boolean} includeSimulator - Incluir simulador en la lista
 * @returns {Array} Lista de terminales disponibles
 */
export const getAvailableTerminals = (includeSimulator = true) => {
  const allTerminals = Object.keys(TERMINAL_CONFIGS);
  
  // Filtrar solo terminales habilitados
  const enabledTerminals = allTerminals.filter(terminal => {
    const config = TERMINAL_CONFIGS[terminal];
    // Si no tiene propiedad enabled, se considera habilitado por defecto
    // Solo simulador está habilitado por defecto
    if (terminal === 'simulator') return true;
    return config.enabled === true;
  });
  
  if (!includeSimulator) {
    return enabledTerminals.filter(terminal => terminal !== 'simulator');
  }
  
  return enabledTerminals;
};

/**
 * Valida una configuración personalizada de terminal
 * @param {object} config - Configuración a validar
 * @returns {boolean} True si la configuración es válida
 */
export const validateTerminalConfig = (config) => {
  const required = ['name', 'timeout', 'minAmount', 'maxAmount'];
  return required.every(field => config && config.hasOwnProperty(field));
};

/**
 * Mezcla configuración por defecto con configuración personalizada
 * @param {string} terminalType - Tipo de terminal
 * @param {object} customConfig - Configuración personalizada
 * @returns {object} Configuración mezclada
 */
export const mergeTerminalConfig = (terminalType, customConfig = {}) => {
  const defaultConfig = getTerminalConfig(terminalType);
  return {
    ...defaultConfig,
    ...customConfig,
    // Asegurar que ciertos campos críticos no se sobrescriban accidentalmente
    name: defaultConfig.name,
    transactionPrefix: defaultConfig.transactionPrefix
  };
};

export default {
  TERMINAL_CONFIGS,
  PAYMENT_STATES,
  ERROR_CODES,
  CARD_TYPES,
  CURRENCY_CODES,
  GLOBAL_CONFIG,
  getTerminalConfig,
  isTerminalSupported,
  getAvailableTerminals,
  validateTerminalConfig,
  mergeTerminalConfig
};