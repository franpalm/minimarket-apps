/**
 * usePaymentTerminal.js - Hook principal para manejo de terminales
 * 
 * Proporciona una interfaz React para el sistema de pagos
 * Maneja estados, conectores y comunicación con terminales
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import PaymentService from '../services/payments/PaymentService.js';

// Importar conectores disponibles
import SimulatorConnector from '../services/payments/connectors/SimulatorConnector.js';
import TransbankConnector from '../services/payments/connectors/TransbankConnector.js';
import MercadoPagoConnector from '../services/payments/connectors/MercadoPagoConnector.js';
// TODO: Importar otros conectores cuando estén listos
// import PointConnector from '../services/payments/connectors/PointConnector.js';
// import SerialConnector from '../services/payments/connectors/SerialConnector.js';

/**
 * Hook personalizado para manejo de terminales de pago
 * @param {object} config - Configuración inicial
 * @returns {object} API del hook
 */
export const usePaymentTerminal = (config = {}) => {
  // Referencias persistentes
  const paymentServiceRef = useRef(null);
  const statusPollingRef = useRef(null);
  const mountedRef = useRef(true); // Agregar ref para controlar si el componente está montado
  
  // Estados del hook
  const [connectionStatus, setConnectionStatus] = useState({
    connected: false,
    terminalType: null,
    lastPing: null,
    error: null
  });
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('');
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [availableTerminals, setAvailableTerminals] = useState([]);
  const [currentTransaction, setCurrentTransaction] = useState(null);

  // Inicializar servicio de pagos
  useEffect(() => {
    if (!paymentServiceRef.current) {
      const service = new PaymentService();
      
      // Registrar conectores disponibles
      service.registerTerminal('simulator', SimulatorConnector);
      service.registerTerminal('transbank', TransbankConnector);
      service.registerTerminal('point', MercadoPagoConnector); // Usando MercadoPago para point
      // TODO: Registrar otros conectores
      // service.registerTerminal('getnet', GetnetConnector);
      // service.registerTerminal('point', PointConnector);
      // service.registerTerminal('serial', SerialConnector);
      
      paymentServiceRef.current = service;
      setAvailableTerminals(service.getAvailableTerminals());
    }
    
    // Cleanup al desmontar
    return () => {
      mountedRef.current = false; // Marcar como desmontado
      if (paymentServiceRef.current) {
        paymentServiceRef.current.destroy();
        paymentServiceRef.current = null;
      }
      if (statusPollingRef.current) {
        clearInterval(statusPollingRef.current);
        statusPollingRef.current = null;
      }
    };
  }, []);

  // Polling del estado de conexión
  useEffect(() => {
    const startStatusPolling = () => {
      if (statusPollingRef.current) {
        clearInterval(statusPollingRef.current);
      }
      
      statusPollingRef.current = setInterval(() => {
        if (paymentServiceRef.current && mountedRef.current) {
          try {
            const status = paymentServiceRef.current.getConnectionStatus();
            if (mountedRef.current) {
              setConnectionStatus(prevStatus => {
                // Solo actualizar si hay cambios y el componente sigue montado
                if (mountedRef.current && JSON.stringify(prevStatus) !== JSON.stringify(status)) {
                  return status;
                }
                return prevStatus;
              });
            }
          } catch (error) {
            if (mountedRef.current) {
              console.error('Error updating connection status:', error);
            }
          }
        }
      }, 2000); // Cada 2 segundos
    };

    if (mountedRef.current) {
      startStatusPolling();
    }
    
    return () => {
      if (statusPollingRef.current) {
        clearInterval(statusPollingRef.current);
      }
    };
  }, []);

  /**
   * Conecta con un terminal específico
   * @param {string} terminalType - Tipo de terminal
   * @param {object} terminalConfig - Configuración del terminal
   * @returns {Promise<boolean>}
   */
  const connectTerminal = useCallback(async (terminalType, terminalConfig = {}) => {
    if (!paymentServiceRef.current || !mountedRef.current) {
      throw new Error('Payment service not initialized or component unmounted');
    }
    
    try {
      if (mountedRef.current) {
        setPaymentStatus('Conectando terminal...');
        setIsProcessing(true);
      }
      
      const connected = await paymentServiceRef.current.connectToTerminal(
        terminalType, 
        { ...config, ...terminalConfig }
      );
      
      // Verificar si el componente sigue montado después del async
      if (!mountedRef.current) return false;
      
      if (connected) {
        setPaymentStatus(`Terminal ${terminalType} conectado exitosamente`);
        setConnectionStatus(paymentServiceRef.current.getConnectionStatus());
        
        // Limpiar mensaje después de 3 segundos con protección
        const timeoutId = setTimeout(() => {
          // Verificar si el componente sigue montado
          if (mountedRef.current && paymentServiceRef.current) {
            setPaymentStatus('');
          }
        }, 3000);
        
        // Cleanup function ya no es necesaria aquí
        return connected;
      } else {
        if (mountedRef.current) {
          setPaymentStatus(`Error al conectar terminal ${terminalType}`);
          const timeoutId = setTimeout(() => {
            if (mountedRef.current && paymentServiceRef.current) {
              setPaymentStatus('');
            }
          }, 5000);
        }
      }
      
      return connected;
    } catch (error) {
      console.error('Connect terminal error:', error);
      if (mountedRef.current) {
        setPaymentStatus(`Error de conexión: ${error.message}`);
        const timeoutId = setTimeout(() => {
          if (mountedRef.current && paymentServiceRef.current) {
            setPaymentStatus('');
          }
        }, 5000);
      }
      return false;
    } finally {
      if (mountedRef.current && paymentServiceRef.current) {
        setIsProcessing(false);
      }
    }
  }, [config]);

  /**
   * Procesa un pago en el terminal conectado
   * @param {number} amount - Monto del pago
   * @param {object} options - Opciones adicionales
   * @returns {Promise<object>}
   */
  const processPayment = useCallback(async (amount, options = {}) => {
    if (!paymentServiceRef.current || !mountedRef.current) {
      throw new Error('Payment service not initialized or component unmounted');
    }

    if (!connectionStatus.connected) {
      throw new Error('No hay terminal conectado');
    }

    try {
      if (mountedRef.current) {
        setIsProcessing(true);
        setPaymentStatus('Enviando monto a terminal...');
        setCurrentTransaction({ id: null, amount, status: 'processing' });
      }

      // Procesar pago
      const result = await paymentServiceRef.current.processPayment(amount, options);
      
      // Verificar si el componente sigue montado después del async
      if (!mountedRef.current) return result;
      
      if (result.success) {
        setPaymentStatus('¡Pago completado exitosamente!');
        setCurrentTransaction(prev => ({ ...prev, status: 'completed', result }));
        
        // Actualizar historial
        const history = paymentServiceRef.current.getTransactionHistory(10);
        setTransactionHistory(history);
        
        // Limpiar mensaje después de 3 segundos
        const timeoutId = setTimeout(() => {
          if (mountedRef.current && paymentServiceRef.current) {
            setPaymentStatus('');
            setCurrentTransaction(null);
          }
        }, 3000);
        
      } else {
        if (mountedRef.current) {
          setPaymentStatus(`Error en el pago: ${result.error || 'Error desconocido'}`);
          setCurrentTransaction(prev => ({ ...prev, status: 'failed', result }));
          
          const timeoutId = setTimeout(() => {
            if (mountedRef.current && paymentServiceRef.current) {
              setPaymentStatus('');
              setCurrentTransaction(null);
            }
          }, 5000);
        }
      }
      
      return result;
    } catch (error) {
      console.error('Process payment error:', error);
      if (mountedRef.current) {
        const errorMessage = `Error al procesar pago: ${error.message}`;
        setPaymentStatus(errorMessage);
        setCurrentTransaction(prev => ({ ...prev, status: 'error', error: error.message }));
        
        const timeoutId = setTimeout(() => {
          if (mountedRef.current && paymentServiceRef.current) {
            setPaymentStatus('');
            setCurrentTransaction(null);
          }
        }, 5000);
      }
      
      return { success: false, error: error.message };
    } finally {
      // Solo actualizar estado si el componente sigue montado
      if (mountedRef.current && paymentServiceRef.current) {
        setIsProcessing(false);
      }
    }
  }, [connectionStatus.connected]);

  /**
   * Cancela un pago en progreso
   * @param {string} transactionId - ID de la transacción (opcional)
   * @returns {Promise<object>}
   */
  const cancelPayment = useCallback(async (transactionId = null) => {
    if (!paymentServiceRef.current || !mountedRef.current) {
      throw new Error('Payment service not initialized or component unmounted');
    }

    try {
      if (mountedRef.current) {
        setPaymentStatus('Cancelando pago...');
      }
      
      const result = await paymentServiceRef.current.cancelPayment(transactionId);
      
      // Verificar si el componente sigue montado después del async
      if (!mountedRef.current) return result;
      
      if (result.success) {
        setPaymentStatus('Pago cancelado exitosamente');
        setCurrentTransaction(null);
        setIsProcessing(false);
        
        setTimeout(() => {
          if (mountedRef.current) {
            setPaymentStatus('');
          }
        }, 3000);
      } else {
        if (mountedRef.current) {
          setPaymentStatus(`Error al cancelar: ${result.error || 'Error desconocido'}`);
        }
      }
      
      return result;
    } catch (error) {
      console.error('Cancel payment error:', error);
      if (mountedRef.current) {
        setPaymentStatus(`Error al cancelar: ${error.message}`);
      }
      return { success: false, error: error.message };
    }
  }, []);

  /**
   * Desconecta del terminal actual
   * @returns {Promise<void>}
   */
  const disconnect = useCallback(async () => {
    if (!paymentServiceRef.current || !mountedRef.current) {
      return;
    }

    try {
      if (mountedRef.current) {
        setPaymentStatus('Desconectando terminal...');
      }
      
      await paymentServiceRef.current.disconnect();
      
      if (mountedRef.current) {
        setConnectionStatus({
          connected: false,
          terminalType: null,
          lastPing: null,
          error: null
        });
        
        setPaymentStatus('Terminal desconectado');
        setCurrentTransaction(null);
        setIsProcessing(false);
        
        setTimeout(() => {
          if (mountedRef.current) {
            setPaymentStatus('');
          }
        }, 2000);
      }
    } catch (error) {
      console.error('Disconnect error:', error);
      if (mountedRef.current) {
        setPaymentStatus(`Error al desconectar: ${error.message}`);
      }
    }
  }, []);

  /**
   * Refresca el estado de conexión manualmente
   * @returns {Promise<boolean>}
   */
  const refreshConnection = useCallback(async () => {
    if (!paymentServiceRef.current) {
      return false;
    }

    try {
      const isHealthy = await paymentServiceRef.current.checkHealth();
      setConnectionStatus(paymentServiceRef.current.getConnectionStatus());
      return isHealthy;
    } catch (error) {
      console.error('Refresh connection error:', error);
      return false;
    }
  }, []);

  /**
   * Obtiene información detallada del terminal
   * @returns {Promise<object|null>}
   */
  const getTerminalInfo = useCallback(async () => {
    if (!paymentServiceRef.current?.currentConnector) {
      return null;
    }

    try {
      return await paymentServiceRef.current.currentConnector.getTerminalInfo();
    } catch (error) {
      console.error('Get terminal info error:', error);
      return null;
    }
  }, [connectionStatus.connected]);

  /**
   * Actualiza el historial de transacciones
   */
  const updateTransactionHistory = useCallback(() => {
    if (paymentServiceRef.current) {
      const history = paymentServiceRef.current.getTransactionHistory(20);
      setTransactionHistory(history);
    }
  }, []);

  /**
   * Obtiene estadísticas del conector actual
   * @returns {object|null}
   */
  const getConnectorStats = useCallback(() => {
    if (!paymentServiceRef.current?.currentConnector) {
      return null;
    }

    return paymentServiceRef.current.currentConnector.getStats();
  }, [connectionStatus.connected]);

  // API pública del hook
  return {
    // Estados
    connectionStatus,
    isProcessing,
    paymentStatus,
    currentTransaction,
    transactionHistory,
    availableTerminals,
    
    // Acciones principales
    connectTerminal,
    processPayment,
    cancelPayment,
    disconnect,
    
    // Utilidades
    refreshConnection,
    getTerminalInfo,
    updateTransactionHistory,
    getConnectorStats,
    
    // Información de estado
    isConnected: connectionStatus.connected,
    terminalType: connectionStatus.terminalType,
    hasError: !!connectionStatus.error,
    
    // Servicio interno (para casos avanzados)
    paymentService: paymentServiceRef.current
  };
};

export default usePaymentTerminal;