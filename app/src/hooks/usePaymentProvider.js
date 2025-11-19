import { useState } from 'react';

// Abstracción para registrar/cancelar ventas con distintos proveedores
const usePaymentProvider = (provider = 'compraqui_manual') => {
  const [loading, setLoading] = useState(false);

  // Confirmar venta: envía a backend
  const confirmarVenta = async (payload) => {
    setLoading(true);
    try {
      // Aquí iría la llamada real al backend
      // Por ejemplo: await fetch('/api/ventas/', { method: 'POST', body: JSON.stringify(payload) })
      const res = await fetch('http://localhost:8000/api/ventas/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      setLoading(false);
      return res.ok;
    } catch (e) {
      setLoading(false);
      return false;
    }
  };

  // Cancelar venta (solo frontend, para modo manual)
  const cancelarVenta = () => {
    setLoading(false);
  };

  return {
    confirmarVenta,
    cancelarVenta,
    loading,
    provider,
  };
};

export default usePaymentProvider;
