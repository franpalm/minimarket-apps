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
        <div className="flex flex-col w-full h-full">
          
          {cartItems.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              <span>No hay productos registrados</span>
            </div>
          ) : (
            cartItems.map((item) => (
              <div
                // Usamos ID como key estable para la fila
                key={item.id}
                className="flex justify-between items-center py-3 border-b border-dashed border-gray-200 last:border-b-0"
              >
                <div className="flex-1">
                  <div className="font-bold">
                    {/* BLINDAJE 1: Texto estático en span */}
                    <span>{item.nombre}</span>
                  </div>
                  
                  <div className="text-sm text-gray-600 mt-1">
                    {/* BLINDAJE 2: Keys dinámicas para forzar repintado limpio de números */}
                    <span>{formatPrice(item.precio_venta)}</span>
                    <span className="mx-1"> x </span>
                    <span key={`qty-${item.id}-${item.quantity}`} className="font-medium">
                      {item.quantity}
                    </span>
                  </div>

                  <div className="mt-1 font-semibold text-blue-600">
                    {/* BLINDAJE 3: Key basada en el valor para evitar error de actualización de texto */}
                    <span key={`subtotal-${item.id}-${item.quantity}`}>
                      {formatPrice(item.precio_venta * item.quantity)}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <button
                    type="button"
                    className="border border-gray-300 rounded px-2 py-1 text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                    onClick={(e) => {
                      e.stopPropagation(); // Detiene propagación del evento
                      updateQuantity(item.id, -1);
                    }}
                    disabled={item.quantity <= 1}
                    title="Quitar uno"
                  >
                    <i className="bi bi-dash pointer-events-none"></i>
                  </button>

                  <button
                    type="button"
                    className="border border-gray-300 rounded px-2 py-1 text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                    onClick={(e) => {
                      e.stopPropagation(); // Detiene propagación del evento
                      updateQuantity(item.id, 1);
                    }}
                    disabled={item.quantity >= (products.find(p => p.id === item.id)?.stock_actual || Infinity)}
                    title="Agregar uno"
                  >
                    <i className="bi bi-plus pointer-events-none"></i>
                  </button>

                  <button
                    type="button"
                    className="border border-red-400 text-red-600 rounded px-2 py-1 hover:bg-red-50"
                    onClick={(e) => {
                      e.stopPropagation(); // CRÍTICO: Detiene propagación antes de borrar
                      removeFromCart(item.id);
                    }}
                    title="Eliminar"
                  >
                    <i className="bi bi-trash pointer-events-none"></i>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Sección Inferior (Totales) */}
      <div className="shadow rounded-lg p-4 bg-gray-50">
        <div className="flex justify-between items-center text-xl font-bold mb-2">
          <span>Total:</span>
          {/* BLINDAJE 4: Key en el total global */}
          <span key={`cart-total-${cartTotal}`}>
            {formatPrice(cartTotal)}
          </span>
        </div>
        
        <div className="mb-3 text-gray-600">
          {/* BLINDAJE 5: Key en el contador */}
          <span key={`cart-count-${cartCount}`}>{cartCount}</span>
          <span className="ml-1">productos</span>
        </div>
        
        <div className="mb-3">
          <label className="font-semibold mb-1 block">Método de Pago:</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              className={`border rounded px-4 py-2 font-semibold transition ${
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
              className={`border rounded px-4 py-2 font-semibold transition ${
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
            type="button"
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
            type="button"
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