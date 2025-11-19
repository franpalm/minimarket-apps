import React from 'react';

export default function RegistryPanel({
  cartItems,
  products,
  formatPrice,
  updateQuantity,
  removeFromCart,
  cartTotal,
  cartCount,
  isProcessingSale,
  handleOpenPaymentModal,
  handleCancelSale,
  paymentMethod,
  setPaymentMethod
}) {
  return (
    <div className="bg-white rounded-xl shadow p-6 mb-6 flex flex-col h-[calc(100vh-4rem)]">
      <h3 className="mb-3 font-bold text-lg">Registro de Venta</h3>
      <div className="flex-grow border border-gray-200 rounded-lg p-4 mb-4 overflow-y-auto">
        {cartItems.length === 0 ? (
          <div className="text-center text-gray-400 py-3">No hay productos registrados</div>
        ) : (
          <React.Fragment>
            {cartItems.map(item => (
              <div key={item.id} className="flex justify-between items-center py-3 border-b border-dashed border-gray-200 last:border-b-0 fade-out">
                <div className="flex-1">
                  <div className="font-bold">{item.nombre}</div>
                  <span>{formatPrice(item.precio_venta)} x {item.quantity}</span>
                  <div className="mt-1 font-semibold">{formatPrice(item.precio_venta * item.quantity)}</div>
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    className="border border-gray-300 rounded px-2 py-1 text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                    onClick={() => updateQuantity(item.id, -1)}
                    disabled={item.quantity <= 1}
                    title="Quitar uno"
                  >
                    <i className="bi bi-dash"></i>
                  </button>
                  <button
                    className="border border-gray-300 rounded px-2 py-1 text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                    onClick={() => updateQuantity(item.id, 1)}
                    disabled={item.quantity >= (products.find(p => p.id === item.id)?.stock_actual || Infinity)}
                    title="Agregar uno"
                  >
                    <i className="bi bi-plus"></i>
                  </button>
                  <button
                    className="border border-red-400 text-red-600 rounded px-2 py-1 hover:bg-red-50"
                    onClick={() => removeFromCart(item.id)}
                    title="Eliminar"
                  >
                    <i className="bi bi-trash"></i>
                  </button>
                </div>
              </div>
            ))}
          </React.Fragment>
        )}
      </div>
      <div className="shadow rounded-lg p-4 bg-gray-50">
        <div className="flex justify-between items-center text-xl font-bold mb-2">
          <span>Total:</span>
          <span>{formatPrice(cartTotal)}</span>
        </div>
        <div className="mb-3 text-gray-600">
          <span>{cartCount}</span> productos
        </div>
        <div className="mb-3">
          <label className="font-semibold mb-1 block">Método de Pago:</label>
          <div className="flex gap-2">
            <button
              type="button"
              className={`flex-1 border rounded px-4 py-2 font-semibold transition ${
                paymentMethod === 'Efectivo'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-blue-600 border-blue-600 hover:bg-blue-50'
              }`}
              onClick={() => setPaymentMethod('Efectivo')}
            >
              Efectivo
            </button>
            <button
              type="button"
              className={`flex-1 border rounded px-4 py-2 font-semibold transition ${
                paymentMethod === 'Tarjeta'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-blue-600 border-blue-600 hover:bg-blue-50'
              }`}
              onClick={() => setPaymentMethod('Tarjeta')}
            >
              Tarjeta
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-2 mt-2">
          <button
            className="bg-green-600 hover:bg-green-700 text-white rounded px-4 py-2 font-bold flex items-center justify-center disabled:opacity-60"
            onClick={handleOpenPaymentModal}
            disabled={cartItems.length === 0 || isProcessingSale}
          >
            {isProcessingSale ? (
              'Procesando...'
            ) : (
              <>
                <i className="bi bi-check-circle mr-2"></i>Completar Venta
              </>
            )}
          </button>
          <button
            className="bg-red-600 hover:bg-red-700 text-white rounded px-4 py-2 font-bold flex items-center justify-center disabled:opacity-60"
            onClick={handleCancelSale}
            disabled={cartItems.length === 0 || isProcessingSale}
          >
            <i className="bi bi-x-circle mr-2"></i>Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}