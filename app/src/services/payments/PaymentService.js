/**
 * PaymentService.js - Servicio principal de pagos
 * 
 * Gestiona la comunicación con diferentes terminales de pago
 * Mantiene el estado de conexión y historial de transacciones
 */

class PaymentService {
  constructor() {
    this.currentConnector = null;
    this.availableTerminals = new Map();
    this.transactionHistory = [];
    this.isConnected = false;
    this.connectionStatus = {
      connected: false,
      terminalType: null,
      lastPing: null,
      error: null
    };
  }

  /**
   * Registra un terminal disponible en el sistema
   * @param {string} type - Tipo de terminal (transbank, point, serial, etc.)
   * @param {class} ConnectorClass - Clase del conector
   */
  registerTerminal(type, ConnectorClass) {
    if (!type || !ConnectorClass) {
      throw new Error('Terminal type and connector class are required');
    }
    this.availableTerminals.set(type, ConnectorClass);
    console.log(`Terminal ${type} registered successfully`);
  }

  /**
   * Obtiene la lista de terminales disponibles
   * @returns {Array} Lista de tipos de terminales
   */
  getAvailableTerminals() {
    return Array.from(this.availableTerminals.keys());
  }

  /**
   * Conecta con un terminal específico
   * @param {string} terminalType - Tipo de terminal
   * @param {object} config - Configuración del terminal
   * @returns {Promise<boolean>} Estado de conexión
   */
  async connectToTerminal(terminalType, config = {}) {
    try {
      // Verificar si el terminal está registrado
      const ConnectorClass = this.availableTerminals.get(terminalType);
      if (!ConnectorClass) {
        throw new Error(`Terminal type "${terminalType}" not found`);
      }

      // Desconectar terminal actual si existe
      if (this.currentConnector) {
        await this.disconnect();
      }

      // Crear nueva instancia del conector
      this.currentConnector = new ConnectorClass(config);
      
      // Intentar conexión
      console.log(`Connecting to ${terminalType} terminal...`);
      this.isConnected = await this.currentConnector.connect();
      
      // Actualizar estado
      this.connectionStatus = {
        connected: this.isConnected,
        terminalType: this.isConnected ? terminalType : null,
        lastPing: this.isConnected ? new Date() : null,
        error: null
      };

      if (this.isConnected) {
        console.log(`Successfully connected to ${terminalType}`);
        // Iniciar ping periódico para mantener conexión
        this._startHealthCheck();
      } else {
        console.warn(`Failed to connect to ${terminalType}`);
      }

      return this.isConnected;
    } catch (error) {
      console.error('Connection error:', error);
      this.connectionStatus = {
        connected: false,
        terminalType: null,
        lastPing: null,
        error: error.message
      };
      return false;
    }
  }

  /**
   * Procesa un pago en el terminal conectado
   * @param {number} amount - Monto del pago
   * @param {object} options - Opciones adicionales
   * @returns {Promise<object>} Resultado del pago
   */
  async processPayment(amount, options = {}) {
    if (!this.currentConnector) {
      throw new Error('No terminal connected');
    }

    if (!this.isConnected) {
      throw new Error('Terminal not connected');
    }

    // Validar monto
    if (!amount || amount <= 0) {
      throw new Error('Invalid amount');
    }

    // Crear registro de transacción
    const transaction = {
      id: this._generateTransactionId(),
      amount,
      timestamp: new Date(),
      status: 'processing',
      terminalType: this.connectionStatus.terminalType,
      options
    };

    console.log(`Processing payment: $${amount} - Transaction ID: ${transaction.id}`);

    try {
      // Procesar pago en el terminal
      const result = await this.currentConnector.processPayment(amount, {
        ...options,
        transactionId: transaction.id
      });

      // Actualizar estado de la transacción
      transaction.status = result.success ? 'completed' : 'failed';
      transaction.result = result;
      transaction.completedAt = new Date();

      // Guardar en historial
      this.transactionHistory.unshift(transaction);
      
      // Mantener solo las últimas 100 transacciones
      if (this.transactionHistory.length > 100) {
        this.transactionHistory = this.transactionHistory.slice(0, 100);
      }

      console.log(`Payment ${result.success ? 'completed' : 'failed'}: ${transaction.id}`);
      return result;

    } catch (error) {
      console.error('Payment processing error:', error);
      
      // Actualizar transacción con error
      transaction.status = 'error';
      transaction.error = error.message;
      transaction.completedAt = new Date();
      this.transactionHistory.unshift(transaction);

      throw error;
    }
  }

  /**
   * Cancela un pago en progreso
   * @param {string} transactionId - ID de la transacción
   * @returns {Promise<object>} Resultado de la cancelación
   */
  async cancelPayment(transactionId = null) {
    if (!this.currentConnector) {
      throw new Error('No terminal connected');
    }

    try {
      const result = await this.currentConnector.cancelPayment(transactionId);
      
      // Actualizar historial si se proporciona ID
      if (transactionId) {
        const transaction = this.transactionHistory.find(t => t.id === transactionId);
        if (transaction && transaction.status === 'processing') {
          transaction.status = 'cancelled';
          transaction.completedAt = new Date();
          transaction.cancelResult = result;
        }
      }

      console.log(`Payment cancelled: ${transactionId || 'current'}`);
      return result;
    } catch (error) {
      console.error('Cancel payment error:', error);
      throw error;
    }
  }

  /**
   * Obtiene el estado actual de la conexión
   * @returns {object} Estado de conexión
   */
  getConnectionStatus() {
    return { ...this.connectionStatus };
  }

  /**
   * Obtiene el historial de transacciones
   * @param {number} limit - Límite de transacciones
   * @returns {Array} Historial de transacciones
   */
  getTransactionHistory(limit = 20) {
    return this.transactionHistory.slice(0, limit);
  }

  /**
   * Busca una transacción por ID
   * @param {string} transactionId - ID de la transacción
   * @returns {object|null} Transacción encontrada
   */
  getTransaction(transactionId) {
    return this.transactionHistory.find(t => t.id === transactionId) || null;
  }

  /**
   * Desconecta del terminal actual
   * @returns {Promise<void>}
   */
  async disconnect() {
    try {
      if (this.currentConnector) {
        await this.currentConnector.disconnect();
        console.log(`Disconnected from ${this.connectionStatus.terminalType}`);
      }
    } catch (error) {
      console.error('Disconnect error:', error);
    } finally {
      this.currentConnector = null;
      this.isConnected = false;
      this.connectionStatus = {
        connected: false,
        terminalType: null,
        lastPing: null,
        error: null
      };
      this._stopHealthCheck();
    }
  }

  /**
   * Verifica la salud de la conexión
   * @returns {Promise<boolean>} Estado de la conexión
   */
  async checkHealth() {
    if (!this.currentConnector || !this.isConnected) {
      return false;
    }

    try {
      const isHealthy = await this.currentConnector.ping();
      this.connectionStatus.lastPing = new Date();
      
      if (!isHealthy && this.isConnected) {
        console.warn('Terminal connection lost');
        this.isConnected = false;
        this.connectionStatus.connected = false;
        this.connectionStatus.error = 'Connection lost';
      }

      return isHealthy;
    } catch (error) {
      console.error('Health check error:', error);
      this.isConnected = false;
      this.connectionStatus.connected = false;
      this.connectionStatus.error = error.message;
      return false;
    }
  }

  // === MÉTODOS PRIVADOS ===

  /**
   * Genera un ID único para transacciones
   * @returns {string} ID de transacción
   */
  _generateTransactionId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `TXN_${timestamp}_${random}`;
  }

  /**
   * Inicia el chequeo periódico de salud
   */
  _startHealthCheck() {
    this._stopHealthCheck(); // Limpiar cualquier intervalo existente
    
    this.healthCheckInterval = setInterval(async () => {
      await this.checkHealth();
    }, 10000); // Cada 10 segundos
  }

  /**
   * Detiene el chequeo periódico de salud
   */
  _stopHealthCheck() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  /**
   * Limpia recursos al destruir la instancia
   */
  destroy() {
    this._stopHealthCheck();
    this.disconnect();
    this.availableTerminals.clear();
    this.transactionHistory = [];
  }
}

export default PaymentService;