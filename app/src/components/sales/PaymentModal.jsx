import React, { useState, useEffect, useRef } from 'react';
import { usePaymentTerminal } from '../../hooks/usePaymentTerminal';

const PaymentModal = ({ show, cartTotal, onConfirm, onCancel, showToast, paymentMethod }) => {
  // Estados originales para efectivo
  const [cashReceived, setCashReceived] = useState('');
  const [changeDue, setChangeDue] = useState(0);
  
  // Estados para el nuevo sistema de terminales
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('efectivo');
  const [selectedTerminal, setSelectedTerminal] = useState('simulator');
  
  // Hook del sistema de pagos
  const {
    connectionStatus,
    isProcessing,
    paymentStatus,
    currentTransaction,
    availableTerminals,
    connectTerminal,
    processPayment,
    cancelPayment,
    disconnect,
    isConnected,
    terminalType
  } = usePaymentTerminal();

  const formatPrice = (price) =>
    new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);

  // Reset estados cuando se abre/cierra el modal
  useEffect(() => {
    if (show) {
      setCashReceived('');
      setChangeDue(0);
      setSelectedPaymentMethod('efectivo');
    }
  }, [show]);

  // Calcular cambio para efectivo
  useEffect(() => {
    const received = parseInt(cashReceived, 10) || 0;
    setChangeDue(received >= cartTotal ? received - cartTotal : 0);
  }, [cashReceived, cartTotal]);

  const handleInput = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setCashReceived(value);
  };

  const handleAutoComplete = () => {
    setCashReceived(cartTotal.toString());
  };

  // Conectar terminal seleccionado
  const handleConnectTerminal = async () => {
    if (!selectedTerminal) {
      if (showToast) showToast('Error', 'Selecciona un terminal', 'error');
      return;
    }

    try {
      const connected = await connectTerminal(selectedTerminal, {
        timeout: 10000,
        successRate: 0.95 // Para simulador
      });
      
      if (connected) {
        if (showToast) showToast('Éxito', `Terminal ${selectedTerminal} conectado`, 'success');
      } else {
        if (showToast) showToast('Error', 'No se pudo conectar al terminal', 'error');
      }
    } catch (error) {
      if (showToast) {
        showToast('Error', `Error de conexión: ${error.message}`, 'error');
      }
    }
  };

  // Procesar pago según método seleccionado
  const handleConfirm = async () => {
    if (selectedPaymentMethod === 'efectivo') {
      // Lógica original para efectivo
      const received = parseInt(cashReceived, 10) || 0;
      if (received < cartTotal) {
        if (showToast) {
          showToast('Monto Insuficiente', 'El monto recibido es menor que el total de la venta.', 'error');
        }
        return;
      }
      
      // Llamar directamente sin verificaciones extra
      if (onConfirm) {
        onConfirm(received, changeDue, 'efectivo');
      }
    } 
    else if (selectedPaymentMethod === 'terminal') {
      // Nueva lógica para terminal
      if (!isConnected) {
        if (showToast) showToast('Error', 'Debe conectar el terminal primero', 'error');
        return;
      }

      try {
        const result = await processPayment(cartTotal, {
          description: `Venta POS - ${new Date().toISOString().split('T')[0]}`,
          currency: 'CLP'
        });

        if (result.success) {
          // Pago exitoso - pasar resultado al parent
          if (onConfirm) {
            onConfirm(cartTotal, 0, 'tarjeta', result);
          }
          if (showToast) showToast('Éxito', '¡Pago procesado exitosamente!', 'success');
        } else {
          // Pago falló
          if (showToast) showToast('Error', result.error || 'Error en el pago', 'error');
        }
      } catch (error) {
        if (showToast) {
          showToast('Error', `Error al procesar pago: ${error.message}`, 'error');
        }
      }
    }
  };

  // Cancelar pago en progreso
  const handleCancelPayment = async () => {
    try {
      await cancelPayment();
      if (showToast) {
        showToast('Cancelado', 'Pago cancelado', 'info');
      }
    } catch (error) {
      if (showToast) {
        showToast('Error', `Error al cancelar: ${error.message}`, 'error');
      }
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-lg w-full mx-4">
        <h5 className="font-bold mb-4 text-xl">Confirmar Venta</h5>
        
        <p className="mb-4 text-lg">
          Total a pagar: <strong>{formatPrice(cartTotal)}</strong>
        </p>

        {/* Selector de método de pago */}
        <div className="mb-4">
          <label className="block font-medium mb-2">Método de pago:</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              className={`p-3 rounded-lg border-2 transition-all ${
                selectedPaymentMethod === 'efectivo' 
                  ? 'border-blue-500 bg-blue-50 text-blue-700' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onClick={() => setSelectedPaymentMethod('efectivo')}
              disabled={isProcessing}
            >
              <div className="text-center">
                <div className="text-2xl mb-1">💵</div>
                <div className="font-medium">Efectivo</div>
              </div>
            </button>
            
            <button
              className={`p-3 rounded-lg border-2 transition-all ${
                selectedPaymentMethod === 'terminal' 
                  ? 'border-green-500 bg-green-50 text-green-700' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onClick={() => setSelectedPaymentMethod('terminal')}
              disabled={isProcessing}
            >
              <div className="text-center">
                <div className="text-2xl mb-1">💳</div>
                <div className="font-medium">Terminal</div>
              </div>
            </button>
          </div>
        </div>

        {/* Configuración para efectivo */}
        {selectedPaymentMethod === 'efectivo' && (
          <div className="space-y-4">
            <div>
              <label htmlFor="cashReceivedInput" className="block font-medium mb-1">
                Monto recibido:
              </label>
              <div className="flex gap-2">
                <input
                  id="cashReceivedInput"
                  type="number"
                  className="border border-gray-300 rounded-lg px-3 py-2 flex-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={cashReceived}
                  onChange={handleInput}
                  placeholder="Ingrese el monto..."
                  min="0"
                  autoFocus
                  disabled={isProcessing}
                />
                <button
                  type="button"
                  className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-4 py-2 font-medium transition-colors disabled:bg-gray-400"
                  onClick={handleAutoComplete}
                  title="Autocompletar monto exacto"
                  disabled={isProcessing}
                >
                  Exacto
                </button>
              </div>
            </div>
            
            <div className="flex justify-between py-2 border-t font-bold text-lg">
              <span>Vuelto:</span>
              <span className="text-green-600">{formatPrice(changeDue)}</span>
            </div>
          </div>
        )}

        {/* Configuración para terminal */}
        {selectedPaymentMethod === 'terminal' && (
          <div className="space-y-4">
            {/* Selector de terminal */}
            <div>
              <label className="block font-medium mb-1">Terminal:</label>
              <select
                value={selectedTerminal}
                onChange={(e) => setSelectedTerminal(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                disabled={isProcessing || isConnected}
              >
                {availableTerminals.map(terminal => (
                  <option key={terminal} value={terminal}>
                    {terminal === 'simulator' ? '🧪 Simulador (Testing)' : 
                     terminal.charAt(0).toUpperCase() + terminal.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Estado de conexión */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Estado de conexión:</span>
                <span className={`px-2 py-1 rounded-full text-sm font-medium ${
                  isConnected 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {isConnected ? '✅ Conectado' : '❌ Desconectado'}
                </span>
              </div>
              
              {terminalType && (
                <div className="text-sm text-gray-600 mb-2">
                  Terminal: {terminalType}
                </div>
              )}
              
              {connectionStatus.lastPing && (
                <div className="text-xs text-gray-500">
                  Último ping: {new Date(connectionStatus.lastPing).toLocaleTimeString()}
                </div>
              )}
            </div>

            {/* Botón de conexión */}
            {!isConnected && (
              <button
                onClick={handleConnectTerminal}
                disabled={isProcessing || !selectedTerminal}
                className="w-full bg-green-600 hover:bg-green-700 text-white rounded-lg px-4 py-3 font-medium transition-colors disabled:bg-gray-400"
              >
                {isProcessing ? 'Conectando...' : 'Conectar Terminal'}
              </button>
            )}

            {/* Estado del pago */}
            {paymentStatus && (
              <div className={`p-3 rounded-lg text-sm ${
                paymentStatus.includes('Error') || paymentStatus.includes('error')
                  ? 'bg-red-100 text-red-800 border border-red-200'
                  : paymentStatus.includes('exitoso') || paymentStatus.includes('Éxito')
                    ? 'bg-green-100 text-green-800 border border-green-200'
                    : 'bg-blue-100 text-blue-800 border border-blue-200'
              }`}>
                <div className="font-medium">{paymentStatus}</div>
                
                {currentTransaction && currentTransaction.status === 'processing' && (
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{width: '60%'}}></div>
                    </div>
                    <div className="text-xs mt-1 text-gray-600">
                      Procesando pago de {formatPrice(currentTransaction.amount)}...
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          {/* Botón cancelar pago en progreso */}
          {isProcessing && selectedPaymentMethod === 'terminal' && (
            <button
              className="bg-red-600 hover:bg-red-700 text-white rounded-lg px-4 py-2 font-medium transition-colors"
              onClick={handleCancelPayment}
            >
              Cancelar Pago
            </button>
          )}
          
          {/* Botón cancelar modal */}
          {!isProcessing && (
            <button 
              className="bg-gray-500 hover:bg-gray-600 text-white rounded-lg px-4 py-2 font-medium transition-colors" 
              onClick={onCancel}
            >
              Cancelar
            </button>
          )}
          
          {/* Botón confirmar */}
          <button
            className={`rounded-lg px-6 py-2 font-medium transition-colors ${
              selectedPaymentMethod === 'efectivo'
                ? 'bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-400'
                : 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400'
            }`}
            onClick={handleConfirm}
            disabled={
              isProcessing || 
              (selectedPaymentMethod === 'efectivo' && (parseInt(cashReceived, 10) < cartTotal || !cashReceived)) ||
              (selectedPaymentMethod === 'terminal' && !isConnected)
            }
          >
            {isProcessing ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Procesando...
              </div>
            ) : (
              selectedPaymentMethod === 'efectivo' 
                ? 'Pagar en Efectivo' 
                : '🚀 Procesar con Terminal'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;