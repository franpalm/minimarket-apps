// hooks/usePaymentTerminal.js
import { useState, useRef } from 'react';

// URL de tu backend de DJANGO
// (El puerto 8000 es el estándar de 'manage.py runserver')
const BACKEND_URL = 'http://localhost:8000/api'; 

// Estados posibles del terminal
export const PAYMENT_STATUS = {
  IDLE: 'idle', // Esperando
  PENDING: 'pending', // Esperando pago en la máquina
  SUCCESS: 'success', // Aprobado
  ERROR: 'error', // Rechazado o error de red
};

export const usePaymentTerminal = () => {
  const [status, setStatus] = useState(PAYMENT_STATUS.IDLE);
  const [paymentResult, setPaymentResult] = useState(null);
  const [error, setError] = useState(null);

  // Usamos useRef para guardar el ID del intervalo y poder limpiarlo
  const pollingInterval = useRef(null);

  // --- Limpiar el intervalo ---
  const stopPolling = () => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
      pollingInterval.current = null;
    }
  };

  // --- Función principal para iniciar el cobro ---
  const startPayment = async ({ amount, deviceId }) => {
    setStatus(PAYMENT_STATUS.PENDING);
    setPaymentResult(null);
    setError(null);
    stopPolling(); // Limpia cualquier polling anterior

    try {
      // 1. Llama a la NUEVA ruta del backend de Django
      const response = await fetch(`${BACKEND_URL}/mercadopago/create-intent/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // NOTA: Si protegiste tus vistas de Django con [IsAuthenticated],
          // deberás añadir tu token JWT aquí:
          // 'Authorization': `Bearer ${tuTokenJWT}`
        },
        body: JSON.stringify({ amount, deviceId }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Error al iniciar el pago en el backend');
      }

      const data = await response.json();
      const { intentId } = data;

      // 2. Empezamos el Polling para verificar el estado
      // (Aquí es donde la máquina Point Smart debe mostrar el monto)
      startPolling(intentId);

    } catch (err) {
      console.error(err);
      setError(err.message);
      setStatus(PAYMENT_STATUS.ERROR);
    }
  };

  // --- Función de Polling (Consultar estado) ---
  const startPolling = (intentId) => {
    pollingInterval.current = setInterval(async () => {
      try {
        console.log(`[React] Verificando estado de ${intentId}...`);
        
        // 2. Llama a la NUEVA ruta de verificación
        const response = await fetch(`${BACKEND_URL}/mercadopago/check-status/${intentId}/`, {
           headers: {
             // 'Authorization': `Bearer ${tuTokenJWT}` // Añadir si es necesario
           }
        });
        
        if (!response.ok) {
          // Si el servidor falla, seguimos intentando
          console.warn('Error temporal en polling, reintentando...');
          return; 
        }

        const data = await response.json();

        // 3. Verificamos la respuesta del backend
        if (data.status === 'approved') {
          setStatus(PAYMENT_STATUS.SUCCESS);
          setPaymentResult(data.paymentData);
          stopPolling(); // ¡Pago exitoso!
        } else if (data.status === 'rejected' || data.status === 'cancelled') {
          setStatus(PAYMENT_STATUS.ERROR);
          setError(`Pago ${data.status}`);
          stopPolling(); // Pago fallido.
        }
        // Si sigue 'pending', el intervalo continúa...

      } catch (err) {
        setError('Error de conexión al verificar el pago');
        setStatus(PAYMENT_STATUS.ERROR);
        stopPolling();
      }
    }, 3000); // Preguntamos cada 3 segundos
  };

  // --- Función para resetear el estado ---
  const resetPayment = () => {
    stopPolling();
    setStatus(PAYMENT_STATUS.IDLE);
    setPaymentResult(null);
    setError(null);
  };

  // API pública del hook
  return {
    // Estados
    status,
    paymentResult,
    error,
    
    // Acciones
    startPayment,
    resetPayment,
    
    // Valores de estado convenientes
    isProcessing: status === PAYMENT_STATUS.PENDING,
    isConnected: true, // En este modelo, siempre estamos "conectados" a la nube
    isIdle: status === PAYMENT_STATUS.IDLE
  };
};

export default usePaymentTerminal;