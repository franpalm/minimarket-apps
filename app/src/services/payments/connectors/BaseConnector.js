/**
 * BaseConnector.js - Clase base para todos los conectores de terminales
 * 
 * Define la interfaz común que deben implementar todos los conectores específicos
 * Proporciona métodos utilitarios comunes y validaciones básicas
 */

class BaseConnector {
  constructor(config = {}) {
    this.config = {
      timeout: 30000, // 30 segundos por defecto
      retries: 3,
      retryDelay: 1000,
      ...config
    };
    
    this.type = 'base';
    this.connected = false;
    this.lastPing = null;
    this.connectionAttempts = 0;
    this.maxConnectionAttempts = 3;
    
    // Estado de la transacción actual
    this.currentTransaction = null;
    
    // Configuración específica por tipo de terminal
    this.terminalConfig = config;
  }

  // === MÉTODOS ABSTRACTOS (DEBEN SER IMPLEMENTADOS POR SUBCLASES) ===

  /**
   * Conecta con el terminal específico
   * @returns {Promise<boolean>} true si la conexión fue exitosa
   */
  async connect() {
    throw new Error('connect() method must be implemented by subclass');
  }

  /**
   * Procesa un pago en el terminal
   * @param {number} amount - Monto del pago
   * @param {object} options - Opciones adicionales
   * @returns {Promise<object>} Resultado del pago
   */
  async processPayment(amount, options = {}) {
    throw new Error('processPayment() method must be implemented by subclass');
  }

  /**
   * Desconecta del terminal
   * @returns {Promise<void>}
   */
  async disconnect() {
    this.connected = false;
    this.lastPing = null;
    this.currentTransaction = null;
    this.connectionAttempts = 0;
  }

  // === MÉTODOS OPCIONALES (PUEDEN SER SOBRESCRITOS) ===

  /**
   * Cancela un pago en progreso
   * @param {string} transactionId - ID de la transacción a cancelar
   * @returns {Promise<object>} Resultado de la cancelación
   */
  async cancelPayment(transactionId = null) {
    // Implementación por defecto - puede ser sobrescrita
    return {
      success: true,
      message: 'Payment cancelled (default implementation)',
      transactionId: transactionId || this.currentTransaction?.id
    };
  }

  /**
   * Verifica la conexión con el terminal (ping)
   * @returns {Promise<boolean>} Estado de la conexión
   */
  async ping() {
    try {
      this.lastPing = new Date();
      return this.connected;
    } catch (error) {
      console.error(`Ping error for ${this.type}:`, error);
      return false;
    }
  }

  /**
   * Obtiene información del terminal
   * @returns {Promise<object>} Información del terminal
   */
  async getTerminalInfo() {
    return {
      type: this.type,
      connected: this.connected,
      lastPing: this.lastPing,
      config: this.config,
      currentTransaction: this.currentTransaction
    };
  }

  // === MÉTODOS UTILITARIOS COMUNES ===

  /**
   * Valida el monto del pago
   * @param {number} amount - Monto a validar
   * @returns {boolean} true si el monto es válido
   */
  validateAmount(amount) {
    if (!amount) {
      throw new Error('Amount is required');
    }
    
    if (typeof amount !== 'number') {
      throw new Error('Amount must be a number');
    }
    
    if (amount <= 0) {
      throw new Error('Amount must be greater than zero');
    }
    
    if (!Number.isFinite(amount)) {
      throw new Error('Amount must be a finite number');
    }
    
    // Validar límites (puede ser configurado por terminal)
    const minAmount = this.config.minAmount || 1;
    const maxAmount = this.config.maxAmount || 999999;
    
    if (amount < minAmount) {
      throw new Error(`Amount must be at least ${minAmount}`);
    }
    
    if (amount > maxAmount) {
      throw new Error(`Amount cannot exceed ${maxAmount}`);
    }
    
    return true;
  }

  /**
   * Genera un ID único para transacciones
   * @returns {string} ID de transacción
   */
  generateTransactionId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 6).toUpperCase();
    const prefix = this.config.transactionPrefix || 'TXN';
    return `${prefix}_${timestamp}_${random}`;
  }

  /**
   * Formatea el monto según la configuración del terminal
   * @param {number} amount - Monto a formatear
   * @returns {string|number} Monto formateado
   */
  formatAmount(amount) {
    // Algunos terminales requieren el monto en centavos
    if (this.config.amountInCents) {
      return Math.round(amount * 100);
    }
    
    // Otros requieren formato string con decimales
    if (this.config.amountAsString) {
      return amount.toFixed(2);
    }
    
    return amount;
  }

  /**
   * Espera un tiempo determinado (utilidad para delays)
   * @param {number} ms - Milisegundos a esperar
   * @returns {Promise<void>}
   */
  async wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Ejecuta una función con reintentos automáticos
   * @param {Function} fn - Función a ejecutar
   * @param {number} maxRetries - Número máximo de reintentos
   * @param {number} delay - Delay entre reintentos en ms
   * @returns {Promise<any>} Resultado de la función
   */
  async withRetry(fn, maxRetries = this.config.retries, delay = this.config.retryDelay) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      try {
        const result = await fn();
        return result;
      } catch (error) {
        lastError = error;
        console.warn(`Attempt ${attempt} failed for ${this.type}:`, error.message);
        
        if (attempt <= maxRetries) {
          await this.wait(delay * attempt); // Backoff exponencial
        }
      }
    }
    
    throw new Error(`Failed after ${maxRetries + 1} attempts: ${lastError.message}`);
  }

  /**
   * Ejecuta una función con timeout
   * @param {Function} fn - Función a ejecutar
   * @param {number} timeoutMs - Timeout en milisegundos
   * @returns {Promise<any>} Resultado de la función
   */
  async withTimeout(fn, timeoutMs = this.config.timeout) {
    return Promise.race([
      fn(),
      new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Operation timed out after ${timeoutMs}ms`));
        }, timeoutMs);
      })
    ]);
  }

  /**
   * Valida la configuración del conector
   * @returns {boolean} true si la configuración es válida
   */
  validateConfig() {
    // Validaciones básicas - pueden ser extendidas por subclases
    if (this.config.timeout && this.config.timeout < 1000) {
      throw new Error('Timeout must be at least 1000ms');
    }
    
    if (this.config.retries && this.config.retries < 0) {
      throw new Error('Retries must be non-negative');
    }
    
    return true;
  }

  /**
   * Registra eventos/logs del conector
   * @param {string} level - Nivel del log (info, warn, error)
   * @param {string} message - Mensaje
   * @param {object} data - Datos adicionales
   */
  log(level, message, data = {}) {
    const logData = {
      timestamp: new Date().toISOString(),
      connector: this.type,
      level,
      message,
      ...data
    };
    
    console[level] ? console[level](logData) : console.log(logData);
  }

  /**
   * Maneja errores de manera consistente
   * @param {Error} error - Error a manejar
   * @param {string} context - Contexto del error
   * @returns {object} Error formateado
   */
  handleError(error, context = 'unknown') {
    const formattedError = {
      success: false,
      error: error.message || 'Unknown error',
      errorCode: error.code || 'UNKNOWN_ERROR',
      context,
      timestamp: new Date().toISOString(),
      connector: this.type
    };
    
    this.log('error', `Error in ${context}`, formattedError);
    return formattedError;
  }

  /**
   * Crea una respuesta exitosa estándar
   * @param {object} data - Datos de la respuesta
   * @returns {object} Respuesta formateada
   */
  createSuccessResponse(data = {}) {
    return {
      success: true,
      timestamp: new Date().toISOString(),
      connector: this.type,
      ...data
    };
  }

  /**
   * Obtiene estadísticas del conector
   * @returns {object} Estadísticas
   */
  getStats() {
    return {
      type: this.type,
      connected: this.connected,
      connectionAttempts: this.connectionAttempts,
      lastPing: this.lastPing,
      currentTransaction: this.currentTransaction ? {
        id: this.currentTransaction.id,
        amount: this.currentTransaction.amount,
        startTime: this.currentTransaction.startTime
      } : null
    };
  }
}

export default BaseConnector;