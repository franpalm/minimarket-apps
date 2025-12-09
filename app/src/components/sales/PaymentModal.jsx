import React, { useState, useEffect, useRef } from 'react';
import TerminalPagoBancoEstado from '../TerminalPagoBancoEstado';
import ReactDOM from 'react-dom';
import { usePaymentTerminal } from '../../hooks/usePaymentTerminal';

const PaymentModal = ({ show, cartTotal, onConfirm, onCancel, showToast, paymentMethod }) => {
  // Handler para confirmar el pago
  const handleConfirm = async () => {
    if (selectedPaymentMethod === 'efectivo') {
      onConfirm(parseInt(cashReceived, 10), changeDue, 'efectivo', null);
      return;
    }
    if (selectedPaymentMethod === 'terminal') {
      if (selectedTerminal === 'CompraAqui') {
        // Modo manual CompraAquí: solo completar venta
        onConfirm(cartTotal, 0, 'terminal', null);
        return;
      }
      // Iniciar intento con el hook (MercadoPago/TUU)
      try {
        await startPayment({ amount: cartTotal, deviceId: selectedTerminal });
      } catch (e) {
        showToast && showToast('Error de Pago', e.message || 'No se pudo iniciar el pago', 'error');
      }
    }
  };
  // Formateador de precios en CLP
  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };
  // Handler para el input de efectivo
  const handleInput = (e) => {
    const value = e.target.value;
    setCashReceived(value);
    const change = Math.max(0, value - cartTotal);
    setChangeDue(change);
  };

  // Handler para autocompletar monto exacto
  const handleAutoComplete = () => {
    setCashReceived(cartTotal);
    setChangeDue(0);
  };
  // Estados originales para efectivo
  const [cashReceived, setCashReceived] = useState('');
  const [changeDue, setChangeDue] = useState(0);
  
  // Estados para el nuevo sistema de terminales
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('efectivo');
  const [selectedTerminal, setSelectedTerminal] = useState('compraqui_manual');
  
  // Hook del sistema de pagos
  const { status, paymentResult, error, startPayment, resetPayment, isProcessing } = usePaymentTerminal();

  const handleCancelPayment = () => {
    resetPayment && resetPayment();
  };

  // Cleanup: al desmontar el modal, cancelar cualquier pago en curso y desconectar terminales
  useEffect(() => {
    // Cuando el hook reporta éxito, completar venta por terminal
    if (status === 'success') {
      onConfirm(cartTotal, 0, 'terminal', paymentResult);
      resetPayment();
    } else if (status === 'error' && error) {
      showToast && showToast('Error de Pago', error, 'error');
    }
  }, [status, paymentResult, error]);

  if (!show) return null;
  return ReactDOM.createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-lg w-full mx-4">
        {/* Selector de método de pago, configuración efectivo/terminal y botones de acción */}
        <React.Fragment>
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
          {selectedPaymentMethod === 'terminal' && (
            <div className="mb-4">
              <label className="block font-medium mb-2">Elige terminal:</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4">
                <button
                  className={`p-3 rounded-lg border-2 transition-all ${selectedTerminal === 'MercadoPago' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300 hover:border-gray-400'}`}
                  onClick={() => setSelectedTerminal('MercadoPago')}
                  disabled={isProcessing}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-1">🛒</div>
                    <div className="font-medium">Mercado Pago</div>
                  </div>
                </button>
                <button
                  className={`p-3 rounded-lg border-2 transition-all ${selectedTerminal === 'Tuu' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-300 hover:border-gray-400'}`}
                  onClick={() => setSelectedTerminal('Tuu')}
                  disabled={isProcessing}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-1">🤖</div>
                    <div className="font-medium">TUU</div>
                  </div>
                </button>
                <button
                  className={`p-3 rounded-lg border-2 transition-all ${selectedTerminal === 'CompraAqui' ? 'border-yellow-500 bg-yellow-50 text-yellow-700' : 'border-gray-300 hover:border-gray-400'}`}
                  onClick={() => setSelectedTerminal('CompraAqui')}
                  disabled={isProcessing}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-1">🏦</div>
                    <div className="font-medium">CompraAquí</div>
                  </div>
                </button>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Estado de pago:</span>
                  <span className={`px-2 py-1 rounded-full text-sm font-medium ${
                    status === 'success' ? 'bg-green-100 text-green-800' :
                    status === 'error' ? 'bg-red-100 text-red-800' :
                    status === 'pending' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {status}
                  </span>
                </div>
                {status === 'pending' && (
                  <div className="text-xs text-gray-600">Esperando confirmación en el terminal...</div>
                )}
              </div>
            </div>
          )}
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            {isProcessing && selectedPaymentMethod === 'terminal' && (
              <button
                className="bg-red-600 hover:bg-red-700 text-white rounded-lg px-4 py-2 font-medium transition-colors"
                onClick={handleCancelPayment}
              >
                Cancelar Pago
              </button>
            )}
            {!isProcessing && (
              <button 
                className="bg-gray-500 hover:bg-gray-600 text-white rounded-lg px-4 py-2 font-medium transition-colors" 
                onClick={onCancel}
              >
                Cancelar
              </button>
            )}
            <button
              className={`rounded-lg px-6 py-2 font-medium transition-colors ${
                selectedPaymentMethod === 'efectivo'
                  ? 'bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-400'
                  : 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400'
              }`}
              onClick={handleConfirm}
              disabled={
                isProcessing || 
                (selectedPaymentMethod === 'efectivo' && (parseInt(cashReceived, 10) < cartTotal || !cashReceived))
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
            {selectedPaymentMethod === 'terminal' && !isProcessing && (
              <button
                className="bg-gray-700 hover:bg-gray-800 text-white rounded-lg px-6 py-2 font-medium transition-colors ml-2"
                onClick={() => {
                  onConfirm(cartTotal, 0, 'terminal', null);
                }}
              >Completar Venta Manual</button>
            )}
          </div>
        </React.Fragment>
      </div>
    </div>,
    document.getElementById('modal-root') || document.body
  );
}

export default PaymentModal;