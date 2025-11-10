/**
 * PaymentStatus.jsx - Componente para mostrar estado del pago
 * 
 * Muestra el progreso y estado actual de los pagos en proceso
 * Incluye mensajes, barras de progreso y iconos de estado
 */

import React from 'react';

const PaymentStatus = ({ 
  status, 
  message, 
  currentTransaction = null,
  showProgress = true,
  onCancel = null,
  className = ''
}) => {
  // Determinar el tipo de estado
  const getStatusType = () => {
    if (!status) return 'idle';
    
    const lowerStatus = status.toLowerCase();
    if (lowerStatus.includes('error') || lowerStatus.includes('fail') || lowerStatus.includes('declin')) {
      return 'error';
    }
    if (lowerStatus.includes('success') || lowerStatus.includes('exitoso') || lowerStatus.includes('complet')) {
      return 'success';
    }
    if (lowerStatus.includes('cancel')) {
      return 'cancelled';
    }
    if (lowerStatus.includes('process') || lowerStatus.includes('enviand') || lowerStatus.includes('conectand')) {
      return 'processing';
    }
    return 'info';
  };

  const statusType = getStatusType();

  // Estilos según el tipo de estado
  const getStatusStyles = () => {
    switch (statusType) {
      case 'success':
        return 'bg-green-50 border border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border border-red-200 text-red-800';
      case 'cancelled':
        return 'bg-yellow-50 border border-yellow-200 text-yellow-800';
      case 'processing':
        return 'bg-blue-50 border border-blue-200 text-blue-800';
      case 'info':
        return 'bg-gray-50 border border-gray-200 text-gray-800';
      default:
        return 'bg-gray-50 border border-gray-200 text-gray-600';
    }
  };

  // Icono según el estado
  const getStatusIcon = () => {
    switch (statusType) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'cancelled':
        return '⚠️';
      case 'processing':
        return '🔄';
      case 'info':
        return 'ℹ️';
      default:
        return '📝';
    }
  };

  // Componente de barra de progreso
  const ProgressBar = ({ animated = false, progress = 60 }) => (
    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
      <div 
        className={`h-2 rounded-full transition-all duration-300 ${
          statusType === 'processing' 
            ? 'bg-blue-600' 
            : statusType === 'success' 
              ? 'bg-green-600' 
              : 'bg-gray-400'
        } ${animated ? 'animate-pulse' : ''}`}
        style={{ width: `${progress}%` }}
      ></div>
    </div>
  );

  // Si no hay estado, no mostrar nada
  if (!status && !message && !currentTransaction) {
    return null;
  }

  return (
    <div className={`rounded-lg p-4 ${getStatusStyles()} ${className}`}>
      {/* Encabezado del estado */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{getStatusIcon()}</span>
          <div>
            {/* Mensaje principal */}
            <div className="font-medium">
              {message || status || 'Procesando...'}
            </div>
            
            {/* Información de la transacción */}
            {currentTransaction && (
              <div className="text-sm opacity-75 mt-1">
                {currentTransaction.id && (
                  <div>ID: {currentTransaction.id}</div>
                )}
                {currentTransaction.amount && (
                  <div>
                    Monto: {new Intl.NumberFormat('es-CL', {
                      style: 'currency',
                      currency: 'CLP',
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    }).format(currentTransaction.amount)}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Botón de cancelar */}
        {onCancel && statusType === 'processing' && (
          <button
            onClick={onCancel}
            className="text-red-600 hover:text-red-800 font-medium text-sm px-2 py-1 hover:bg-white hover:bg-opacity-50 rounded transition-colors"
          >
            Cancelar
          </button>
        )}
      </div>

      {/* Barra de progreso para estados en proceso */}
      {showProgress && statusType === 'processing' && (
        <>
          <ProgressBar animated={true} progress={70} />
          <div className="text-xs mt-1 opacity-60">
            {currentTransaction?.status === 'processing' 
              ? 'El cliente puede proceder con el pago en el terminal...'
              : 'Procesando operación...'
            }
          </div>
        </>
      )}

      {/* Información adicional según el estado */}
      {statusType === 'success' && currentTransaction?.result && (
        <div className="mt-3 text-xs space-y-1 opacity-75">
          {currentTransaction.result.authorizationCode && (
            <div>Código autorización: {currentTransaction.result.authorizationCode}</div>
          )}
          {currentTransaction.result.cardType && (
            <div>Tarjeta: {currentTransaction.result.cardType}</div>
          )}
          {currentTransaction.result.last4Digits && (
            <div>Últimos 4 dígitos: ****{currentTransaction.result.last4Digits}</div>
          )}
        </div>
      )}

      {/* Detalles del error */}
      {statusType === 'error' && currentTransaction?.error && (
        <div className="mt-2 text-xs bg-red-100 bg-opacity-50 p-2 rounded">
          <strong>Error:</strong> {currentTransaction.error}
        </div>
      )}
    </div>
  );
};

export default PaymentStatus;