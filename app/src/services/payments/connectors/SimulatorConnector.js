/**
 * SimulatorConnector.js - Conector simulado para testing
 * 
 * Simula el comportamiento de un terminal de pago real
 * Útil para desarrollo y testing sin hardware físico
 */

import BaseConnector from './BaseConnector.js';

class SimulatorConnector extends BaseConnector {
  constructor(config = {}) {
    super({
      // Configuración por defecto para simulador
      timeout: 5000,
      retries: 2,
      successRate: 0.9, // 90% de pagos exitosos
      processingDelay: 3000, // 3 segundos de "procesamiento"
      ...config
    });
    
    this.type = 'simulator';
    this.terminalId = config.terminalId || 'SIM_001';
    this.version = '1.0.0';
    
    // Estado interno del simulador
    this.isProcessingPayment = false;
    this.simulatedFailures = config.simulatedFailures || [];
    this.paymentHistory = [];
  }

  /**
   * Simula la conexión con un terminal
   * @returns {Promise<boolean>}
   */
  async connect() {
    this.log('info', 'Attempting to connect to simulated terminal', {
      terminalId: this.terminalId
    });
    
    this.connectionAttempts++;
    
    try {
      // Validar configuración
      this.validateConfig();
      
      // Simular delay de conexión
      await this.wait(1000 + Math.random() * 1000);
      
      // Simular falla de conexión ocasional (5% de probabilidad)
      if (Math.random() < 0.05 && this.connectionAttempts === 1) {
        throw new Error('Simulated connection failure');
      }
      
      this.connected = true;
      this.lastPing = new Date();
      
      this.log('info', 'Successfully connected to simulated terminal', {
        terminalId: this.terminalId,
        version: this.version
      });
      
      return true;
    } catch (error) {
      this.log('error', 'Failed to connect to simulated terminal', {
        error: error.message,
        attempt: this.connectionAttempts
      });
      
      // Reintentar si no hemos excedido el límite
      if (this.connectionAttempts < this.maxConnectionAttempts) {
        await this.wait(this.config.retryDelay);
        return this.connect();
      }
      
      return false;
    }
  }

  /**
   * Simula el procesamiento de un pago
   * @param {number} amount - Monto del pago
   * @param {object} options - Opciones adicionales
   * @returns {Promise<object>} Resultado del pago
   */
  async processPayment(amount, options = {}) {
    if (!this.connected) {
      throw new Error('Terminal not connected');
    }
    
    if (this.isProcessingPayment) {
      throw new Error('Another payment is already in progress');
    }
    
    // Validar monto
    this.validateAmount(amount);
    
    const transactionId = options.transactionId || this.generateTransactionId();
    const formattedAmount = this.formatAmount(amount);
    
    this.log('info', 'Starting payment simulation', {
      transactionId,
      amount,
      formattedAmount
    });
    
    // Crear transacción actual
    this.currentTransaction = {
      id: transactionId,
      amount,
      startTime: new Date(),
      status: 'processing'
    };
    
    this.isProcessingPayment = true;
    
    try {
      // Simular el proceso de pago con diferentes fases
      await this._simulatePaymentProcess(transactionId, amount);
      
      // Determinar el resultado del pago
      const result = await this._determinePaymentResult(transactionId, amount, options);
      
      // Agregar al historial
      this.paymentHistory.unshift({
        ...this.currentTransaction,
        result,
        completedAt: new Date()
      });
      
      // Mantener solo últimas 50 transacciones
      if (this.paymentHistory.length > 50) {
        this.paymentHistory = this.paymentHistory.slice(0, 50);
      }
      
      this.log('info', 'Payment simulation completed', {
        transactionId,
        success: result.success,
        duration: Date.now() - this.currentTransaction.startTime.getTime()
      });
      
      return result;
      
    } catch (error) {
      this.log('error', 'Payment simulation failed', {
        transactionId,
        error: error.message
      });
      
      return this.handleError(error, 'processPayment');
    } finally {
      this.isProcessingPayment = false;
      this.currentTransaction = null;
    }
  }

  /**
   * Simula la cancelación de un pago
   * @param {string} transactionId - ID de la transacción
   * @returns {Promise<object>}
   */
  async cancelPayment(transactionId = null) {
    this.log('info', 'Cancelling payment simulation', { transactionId });
    
    if (this.isProcessingPayment && this.currentTransaction) {
      // Simular delay de cancelación
      await this.wait(500);
      
      this.isProcessingPayment = false;
      const cancelledTransaction = { ...this.currentTransaction };
      this.currentTransaction = null;
      
      return this.createSuccessResponse({
        cancelled: true,
        transactionId: cancelledTransaction.id,
        message: 'Payment cancelled successfully',
        refundAmount: cancelledTransaction.amount
      });
    }
    
    return this.createSuccessResponse({
      cancelled: false,
      message: 'No payment in progress to cancel'
    });
  }

  /**
   * Simula ping al terminal
   * @returns {Promise<boolean>}
   */
  async ping() {
    if (!this.connected) {
      return false;
    }
    
    try {
      // Simular latencia de ping
      await this.wait(100 + Math.random() * 200);
      
      // Simular pérdida ocasional de conexión (1% probabilidad)
      if (Math.random() < 0.01) {
        this.connected = false;
        this.log('warn', 'Simulated connection loss');
        return false;
      }
      
      this.lastPing = new Date();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Obtiene información del terminal simulado
   * @returns {Promise<object>}
   */
  async getTerminalInfo() {
    const baseInfo = await super.getTerminalInfo();
    
    return {
      ...baseInfo,
      terminalId: this.terminalId,
      version: this.version,
      isSimulator: true,
      simulationSettings: {
        successRate: this.config.successRate,
        processingDelay: this.config.processingDelay,
        failureScenarios: this.simulatedFailures
      },
      paymentHistory: this.paymentHistory.slice(0, 10) // Últimas 10
    };
  }

  /**
   * Desconecta del terminal simulado
   * @returns {Promise<void>}
   */
  async disconnect() {
    this.log('info', 'Disconnecting from simulated terminal');
    
    // Cancelar pago en progreso si existe
    if (this.isProcessingPayment) {
      await this.cancelPayment();
    }
    
    await super.disconnect();
    this.isProcessingPayment = false;
  }

  // === MÉTODOS PRIVADOS DE SIMULACIÓN ===

  /**
   * Simula las diferentes fases del procesamiento de pago
   * @param {string} transactionId - ID de la transacción
   * @param {number} amount - Monto del pago
   */
  async _simulatePaymentProcess(transactionId, amount) {
    const phases = [
      { name: 'Validating card', duration: 800 },
      { name: 'Contacting bank', duration: 1200 },
      { name: 'Processing authorization', duration: 1000 },
      { name: 'Completing transaction', duration: 500 }
    ];
    
    for (const phase of phases) {
      this.log('info', `Payment phase: ${phase.name}`, { transactionId });
      await this.wait(phase.duration + Math.random() * 300);
      
      // Verificar si el pago fue cancelado durante el proceso
      if (!this.isProcessingPayment) {
        throw new Error('Payment was cancelled');
      }
    }
  }

  /**
   * Determina el resultado del pago basado en la configuración
   * @param {string} transactionId - ID de la transacción
   * @param {number} amount - Monto del pago
   * @param {object} options - Opciones del pago
   * @returns {object} Resultado del pago
   */
  async _determinePaymentResult(transactionId, amount, options) {
    // Verificar fallas simuladas específicas
    for (const failure of this.simulatedFailures) {
      if (this._shouldSimulateFailure(failure, amount, options)) {
        return this._createFailureResponse(failure.type, transactionId);
      }
    }
    
    // Usar tasa de éxito general
    const isSuccessful = Math.random() < this.config.successRate;
    
    if (isSuccessful) {
      return this._createSuccessPaymentResponse(transactionId, amount);
    } else {
      return this._createRandomFailureResponse(transactionId);
    }
  }

  /**
   * Verifica si debe simular una falla específica
   * @param {object} failure - Configuración de falla
   * @param {number} amount - Monto del pago
   * @param {object} options - Opciones del pago
   * @returns {boolean}
   */
  _shouldSimulateFailure(failure, amount, options) {
    if (failure.condition) {
      // Evaluar condiciones personalizadas
      if (failure.condition.amountGreaterThan && amount <= failure.condition.amountGreaterThan) {
        return false;
      }
      if (failure.condition.amountLessThan && amount >= failure.condition.amountLessThan) {
        return false;
      }
    }
    
    return Math.random() < (failure.probability || 0.1);
  }

  /**
   * Crea respuesta de pago exitoso
   * @param {string} transactionId - ID de la transacción
   * @param {number} amount - Monto del pago
   * @returns {object}
   */
  _createSuccessPaymentResponse(transactionId, amount) {
    const cardTypes = ['Visa', 'Mastercard', 'American Express'];
    const cardType = cardTypes[Math.floor(Math.random() * cardTypes.length)];
    const last4Digits = Math.floor(1000 + Math.random() * 9000).toString();
    const authCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    return this.createSuccessResponse({
      transactionId,
      authorizationCode: authCode,
      amount,
      cardType,
      last4Digits,
      receiptNumber: `REC${Date.now()}`,
      merchantId: this.terminalId,
      terminalId: this.terminalId,
      responseCode: '00',
      responseMessage: 'APPROVED',
      processingTime: Date.now() - this.currentTransaction.startTime.getTime()
    });
  }

  /**
   * Crea respuesta de falla específica
   * @param {string} failureType - Tipo de falla
   * @param {string} transactionId - ID de la transacción
   * @returns {object}
   */
  _createFailureResponse(failureType, transactionId) {
    const failures = {
      'INSUFFICIENT_FUNDS': { code: '51', message: 'Insufficient funds' },
      'CARD_DECLINED': { code: '05', message: 'Card declined' },
      'EXPIRED_CARD': { code: '54', message: 'Expired card' },
      'INVALID_CARD': { code: '14', message: 'Invalid card number' },
      'CONNECTION_ERROR': { code: '91', message: 'Connection error' },
      'TIMEOUT': { code: '68', message: 'Transaction timeout' }
    };
    
    const failure = failures[failureType] || failures['CARD_DECLINED'];
    
    return {
      success: false,
      transactionId,
      error: failure.message,
      errorCode: failure.code,
      responseCode: failure.code,
      responseMessage: failure.message,
      timestamp: new Date().toISOString(),
      connector: this.type
    };
  }

  /**
   * Crea respuesta de falla aleatoria
   * @param {string} transactionId - ID de la transacción
   * @returns {object}
   */
  _createRandomFailureResponse(transactionId) {
    const failureTypes = [
      'INSUFFICIENT_FUNDS',
      'CARD_DECLINED', 
      'EXPIRED_CARD',
      'CONNECTION_ERROR'
    ];
    
    const randomFailure = failureTypes[Math.floor(Math.random() * failureTypes.length)];
    return this._createFailureResponse(randomFailure, transactionId);
  }
}

export default SimulatorConnector;