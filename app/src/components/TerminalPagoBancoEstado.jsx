import React, { useState } from 'react';
import usePaymentProvider from '../hooks/usePaymentProvider';

const TerminalPagoBancoEstado = ({ monto, onVentaConfirmada, onCancel }) => {
  const [numeroOperacion, setNumeroOperacion] = useState('');
  const { confirmarVenta, cancelarVenta, loading } = usePaymentProvider('compraqui_manual');

  const puedeConfirmar = monto > 0 && !loading;

  const handleConfirmar = async () => {
    const payload = {
      metodo_pago: 'compraqui_manual',
      monto,
      terminal_transaction_id: numeroOperacion || undefined,
    };
    const ok = await confirmarVenta(payload);
    if (ok && onVentaConfirmada) onVentaConfirmada();
  };

  const handleCancelar = () => {
    cancelarVenta();
    if (onCancel) onCancel();
  };

  return (
    <div className="flex flex-col items-center justify-center p-6">
      <div className="mb-6 text-center">
        <div className="text-2xl font-bold text-indigo-700 mb-2">MONTO A COBRAR:</div>
        <div className="text-4xl font-extrabold text-green-600 mb-4">{monto?.toLocaleString('es-CL')}</div>
        <div className="text-lg text-gray-700 mb-4">Digite este monto en su terminal <span className="font-bold">Compraquí BancoEstado</span>.</div>
      </div>
      <div className="mb-4 w-full max-w-xs">
        <label className="block text-sm font-medium text-gray-700 mb-1">Número de Operación (opcional)</label>
        <input
          type="number"
          className="border rounded py-2 px-3 w-full text-lg"
          value={numeroOperacion}
          onChange={e => setNumeroOperacion(e.target.value)}
          placeholder="Código del voucher"
        />
      </div>
      <div className="flex gap-4 mt-6">
        <button
          className={`py-3 px-6 text-lg font-bold rounded bg-green-600 text-white hover:bg-green-700 transition flex-1`}
          disabled={!puedeConfirmar}
          onClick={handleConfirmar}
        >
          Confirmar pago
        </button>
        <button
          className="py-3 px-6 text-lg font-bold rounded bg-red-600 text-white hover:bg-red-700 transition flex-1"
          onClick={handleCancelar}
        >
          Cancelar
        </button>
      </div>
      {loading && <div className="mt-4 text-indigo-600">Procesando venta...</div>}
    </div>
  );
}

export default TerminalPagoBancoEstado;
