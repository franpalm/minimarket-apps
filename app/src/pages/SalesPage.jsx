import React, { useState, useEffect, useCallback } from 'react';
import ProductList from '../components/sales/ProductList';
import RegistryPanel from '../components/sales/RegistryPanel';
import PaymentModal from '../components/sales/PaymentModal';
import ToastContainer from '../components/sales/ToastContainer';
import Modal from '../components/sales/Modal';

export default function SalesPage() {
  const [products, setProducts] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingSale, setIsProcessingSale] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');

  const formatPrice = useCallback((price) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  }, []);

  const showToast = useCallback((title, message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, title, message, type }]);
  }, []);

  // Cargar productos desde la API REST
  const loadProducts = useCallback(() => {
    setIsLoading(true);
  fetch('http://localhost:8000/api/productos/')
      .then(res => res.json())
      .then(data => {
        setProducts(data);
        setIsLoading(false);
      })
      .catch(() => {
        showToast('Error', 'No se pudieron cargar los productos del inventario.', 'error');
        setIsLoading(false);
      });
  }, [showToast]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Carrito
  const addToCart = useCallback((productId) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === productId);
      if (existing) {
        if (existing.quantity < product.stock_actual) {
          return prev.map((item) =>
            item.id === productId ? { ...item, quantity: item.quantity + 1 } : item
          );
        } else {
          showToast('Stock insuficiente', `No hay suficiente stock para ${product.nombre}`, 'error');
          return prev;
        }
      } else {
        if (product.stock_actual > 0) {
          return [...prev, { id: product.id, nombre: product.nombre, precio_venta: product.precio_venta, quantity: 1 }];
        } else {
          showToast('Sin stock', `${product.nombre} está agotado`, 'error');
          return prev;
        }
      }
    });
  }, [products, showToast]);

  const updateQuantity = useCallback((productId, change) => {
    setCartItems((prev) => {
      return prev.map(item =>
        item.id === productId
          ? { ...item, quantity: Math.max(1, item.quantity + change) }
          : item
      );
    });
  }, []);

  const removeFromCart = useCallback((productId) => {
    setCartItems((prev) => prev.filter((item) => item.id !== productId));
  }, []);

  // Modal handlers
  const handleOpenPaymentModal = useCallback(() => {
    setIsProcessingSale(false);
    if (cartItems.length === 0) {
      showToast('Error', 'No hay productos en el carrito', 'error');
      return;
    }
    setShowPaymentModal(true);
  }, [cartItems, showToast]);

  const handleCancelSale = useCallback(() => {
    setShowCancelModal(true);
  }, []);

  const confirmCancelSale = useCallback(() => {
    setCartItems([]);
    setShowCancelModal(false);
    showToast('Venta Cancelada', 'Se ha vaciado el carrito', 'success');
  }, [showToast]);

  // Función para cerrar el modal de pago
  const handleClosePaymentModal = useCallback(() => {
    setShowPaymentModal(false);
  }, []);

  // Usar API REST para registrar la venta
  const handleConfirmPayment = useCallback(async (cashReceived, changeDue, paymentMethodUsed = null, terminalResult = null) => {
    setIsProcessingSale(true);
    try {
      if (!cartItems || cartItems.length === 0) {
        showToast('Error', 'No hay productos en el carrito.', 'error');
        setIsProcessingSale(false);
        return;
      }

      // Determinar método de pago utilizado
      const finalPaymentMethod = paymentMethodUsed || paymentMethod;
      
      // Validaciones específicas por método de pago
      if (finalPaymentMethod === 'efectivo') {
        if (!cashReceived || cashReceived < cartTotal) {
          showToast('Error', 'Ingresa un monto recibido válido.', 'error');
          setIsProcessingSale(false);
          return;
        }
      } else if (finalPaymentMethod === 'tarjeta') {
        if (!terminalResult || !terminalResult.success) {
          showToast('Error', 'El pago con terminal no fue completado exitosamente.', 'error');
          setIsProcessingSale(false);
          return;
        }
      }

      // Transformar cartItems a detalles para el backend
      const detalles = cartItems.map(item => ({
        producto: item.id,
        cantidad_vendida: item.quantity,
        precio_unitario_venta: item.precio_venta
      }));

      // Preparar payload base
      const payload = {
        detalles,
        fecha_venta: new Date().toISOString(),
        metodo_pago: finalPaymentMethod === 'efectivo' ? 'Efectivo' : 'Tarjeta',
        usuario_id: 1, // Usuario fijo para pruebas
        monto_total: cartTotal,
        monto_recibido: cashReceived || cartTotal,
        vuelto: changeDue || 0
      };

      // Agregar información específica de terminal si es pago con tarjeta
      if (finalPaymentMethod === 'tarjeta' && terminalResult) {
        payload.informacion_terminal = {
          terminal_type: terminalResult.connector || 'unknown',
          transaction_id: terminalResult.transactionId,
          authorization_code: terminalResult.authorizationCode,
          card_type: terminalResult.cardType,
          last_4_digits: terminalResult.last4Digits,
          receipt_number: terminalResult.receiptNumber,
          processing_time: terminalResult.processingTime
        };
      }

      const response = await fetch('http://localhost:8000/api/ventas/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();

      if (response.ok) {
        if (result?.id) {
          // Mensaje personalizado según método de pago
          let successMessage = 'Pago realizado con éxito';
          if (finalPaymentMethod === 'tarjeta' && terminalResult) {
            successMessage = `Pago con ${terminalResult.cardType || 'tarjeta'} procesado exitosamente`;
            if (terminalResult.authorizationCode) {
              successMessage += ` (Auth: ${terminalResult.authorizationCode})`;
            }
          } else if (finalPaymentMethod === 'efectivo') {
            successMessage = `Pago en efectivo completado. Vuelto: $${changeDue?.toLocaleString('es-CL') || 0}`;
          }

          showToast('Venta Completada', successMessage, 'success');

          // Usar setTimeout para diferir las actualizaciones y evitar conflictos de DOM
          setTimeout(() => {
            setCartItems([]);
            handleClosePaymentModal();
            loadProducts();
          }, 100);
        } else {
          showToast('Venta registrada', 'La venta fue procesada pero no se recibió confirmación completa.', 'warning');
        }
      } else {
        showToast('Error', result?.error || result?.message || 'Error al completar la venta.', 'error');
      }
      } catch (error) {
        showToast('Error', error.message || 'Error inesperado al completar la venta.', 'error');
      } finally {
        setIsProcessingSale(false);
      }
      }, [cartItems, showToast, paymentMethod, loadProducts]);

      const cartTotal = cartItems.reduce((sum, item) => sum + item.precio_venta * item.quantity, 0);
      const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);


  return (
    <>
      <header className="w-full bg-white shadow mb-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center h-20 px-4">
          <div className="flex items-center">
            <img
              src="/logo192.png"
              alt="MiniMarket Pro Logo"
              className="w-12 h-12 object-contain"
            />
            <span className="ml-3 font-bold text-2xl text-gray-700">MiniMarket Pro</span>
          </div>
          <h1 className="text-lg font-bold text-gray-600">POS Ventas</h1>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-2/3">
            <ProductList
              products={products.filter(p =>
                p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.codigo_producto?.toLowerCase().includes(searchTerm.toLowerCase())
              )}
              isLoading={isLoading}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              addToCart={addToCart}
              formatPrice={formatPrice}
            />
            {!isLoading && products.length === 0 && (
              <div className="bg-yellow-100 text-yellow-800 rounded px-4 py-3 mt-4">
                No hay productos disponibles para la venta.<br />
                <b>Revisa la consola del backend para ver el log de productos.</b>
              </div>
            )}
          </div>
          <div className="w-full md:w-1/3">
            <RegistryPanel
              cartItems={cartItems}
              products={products}
              formatPrice={formatPrice}
              updateQuantity={updateQuantity}
              removeFromCart={removeFromCart}
              cartTotal={cartTotal}
              cartCount={cartCount}
              isProcessingSale={isProcessingSale}
              handleOpenPaymentModal={handleOpenPaymentModal}
              handleCancelSale={handleCancelSale}
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
            />
          </div>
        </div>
      </div>

      <ToastContainer toasts={toasts} setToasts={setToasts} />

      {/* Solo un modal puede estar abierto a la vez */}
      {showCancelModal && !showPaymentModal && (
        <Modal
          key="cancel-modal"
          show={true}
          title="Cancelar Venta"
          message="¿Está seguro que desea cancelar la venta y vaciar el carrito?"
          onConfirm={confirmCancelSale}
          onCancel={() => setShowCancelModal(false)}
        />
      )}
      {showPaymentModal && !showCancelModal && (
        <PaymentModal
          key="payment-modal"
          show={true}
          cartTotal={cartTotal}
          onConfirm={handleConfirmPayment}
          onCancel={handleClosePaymentModal}
          showToast={showToast}
          isProcessingSale={isProcessingSale}
          paymentMethod={paymentMethod}
        />
      )}
    </>
  );
}

