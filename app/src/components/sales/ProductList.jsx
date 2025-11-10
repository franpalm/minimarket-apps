import React from 'react';

export default function ProductList({
  products,
  isLoading,
  searchTerm,
  setSearchTerm,
  addToCart,
  formatPrice
}) {
  return (
    <div>
      <div className="mb-4">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <i className="bi bi-search"></i>
          </span>
          <input
            type="text"
            className="border rounded pl-10 pr-3 py-2 w-full focus:outline-none focus:ring focus:ring-blue-200"
            placeholder="Buscar producto..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      <h2 className="mb-3 text-lg font-bold flex items-center gap-2">
        <i className="bi bi-box-seam text-blue-600"></i>
        Productos
      </h2>
      <div className="flex flex-col gap-3 w-full">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mb-3"></div>
            <p className="mt-3 text-gray-600 flex items-center gap-2">
              <i className="bi bi-arrow-repeat animate-spin"></i>
              Cargando productos...
            </p>
          </div>
        ) : products.length === 0 ? (
          <div className="bg-blue-100 text-blue-700 rounded px-4 py-3 text-center flex items-center justify-center gap-2">
            <i className="bi bi-emoji-frown"></i>
            No se encontraron productos que coincidan con la búsqueda.
          </div>
        ) : (
          products.map(product => (
            <button
              key={product.id}
              className="bg-gray-50 border border-gray-300 rounded-lg px-6 py-4 flex justify-between items-center shadow-sm hover:bg-blue-50 transition cursor-pointer group"
              onClick={() => addToCart(product.id)}
              title="Agregar al carrito"
            >
              <div>
                <div className="font-semibold text-base flex items-center gap-2">
                  <i className="bi bi-cube text-blue-500"></i>
                  {product.nombre}
                </div>
                <div className="text-gray-500 text-sm">
                  <i className="bi bi-upc-scan mr-1"></i>
                  Código: {product.codigo_producto} | 
                  <i className="bi bi-boxes ml-2 mr-1"></i>
                  Stock: {parseInt(product.stock_actual, 10)}
                </div>
              </div>
              <div className="text-blue-600 font-bold text-lg ml-8 flex items-center gap-2">
                <i className="bi bi-currency-dollar"></i>
                {formatPrice(product.precio_venta)}
                <i className="bi bi-cart-plus group-hover:text-green-600 text-gray-400 ml-3 text-xl"></i>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}