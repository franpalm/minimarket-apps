import React, { useState, useEffect, useCallback } from 'react';
import useScanDetection from '../hooks/useScanDetection';

// Sonidos
const beepUrl = '/sounds/beep.mp3';
const errorUrl = '/sounds/error.mp3';

function playSound(url) {
  // Envuelto en try-catch para evitar errores si falta el archivo
  try {
    const audio = new window.Audio(url);
    audio.play().catch(e => console.warn("Audio play prevented:", e));
  } catch (e) {
    console.warn("Audio error:", e);
  }
}

import ErrorBoundary from '../components/ErrorBoundary';
import ProductList from '../components/sales/ProductList';
import RegistryPanel from '../components/sales/RegistryPanel';
import PaymentModal from '../components/sales/PaymentModal';
import ToastContainer from '../components/sales/ToastContainer';
import Modal from '../components/sales/Modal';

export default function SalesPage() {
  // Lógica de escáner
  useScanDetection(async (codigo) => {
    try {
      // Buscar producto por código de barras en el array local (instantáneo)
      let producto = products.find(p => p.codigo_barra === codigo);
      // Si no está en el array local, intentar buscar en la API
      if (!producto) {
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:8000/api/productos-rest/?codigo_barra=${codigo}`, {
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json'
          }
        });
        if (res.ok) {
          const data = await res.json();
          // Si la API retorna una lista, tomar el primero
          if (Array.isArray(data) && data.length > 0) {
            producto = data[0];
          } else if (data && data.id) {
            producto = data;
          }
        }
      }
      // Validar existencia y stock
      if (producto && producto.id) {
        if (producto.stock_actual > 0) {
          addToCart(producto.id);
          playSound(beepUrl);
          showToast('Escaneo exitoso', `Producto agregado: ${producto.nombre}`, 'success');
        } else {
          playSound(errorUrl);
          showToast('Sin stock', `${producto.nombre} está agotado`, 'error');
        }
      } else {
        playSound(errorUrl);
        showToast('Producto no encontrado', `Código: ${codigo}`, 'error');
      }
    } catch (err) {
      playSound(errorUrl);
      showToast('Error de conexión', 'No se pudo buscar el producto', 'error');
    }
  });

  const [pendingClearCart, setPendingClearCart] = useState(false);
  const [products, setProducts] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingSale, setIsProcessingSale] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');
  const [paymentModalKey, setPaymentModalKey] = useState(0);

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

  const loadProducts = useCallback(() => {
    setIsLoading(true);
    const token = localStorage.getItem('token');
    fetch('http://localhost:8000/api/productos-rest/', {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json'
      }
    })
      .then(res => res.json())
      .then(data => {
        setProducts(data);
        setIsLoading(false);
      })
      .catch(() => {
        showToast('Error', 'No se pudieron cargar los productos.', 'error');
        setIsLoading(false);
      });
  }, [showToast]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const addToCart = useCallback((productId) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    
    // Usamos setTimeout para desacoplar la actualización del evento actual
    setTimeout(() => {
      setCartItems((prev) => {
        const existing = prev.find((item) => item.id === productId);
        if (existing) {
          if (existing.quantity < product.stock_actual) {
            return prev.map((item) =>
              item.id === productId ? { ...item, quantity: item.quantity + 1 } : item
            );
          } else {
            showToast('Stock insuficiente', `No hay suficiente stock`, 'error');
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
    }, 0);
  }, [products, showToast]);

  // --- CORRECCIÓN CRÍTICA: setTimeout en updateQuantity ---
  const updateQuantity = useCallback((productId, change) => {
    setTimeout(() => {
      setCartItems((prev) => {
        return prev.map(item =>
          item.id === productId
            ? { ...item, quantity: Math.max(1, item.quantity + change) }
            : item
        );
      });
    }, 0);
  }, []);

  // --- CORRECCIÓN CRÍTICA: setTimeout en removeFromCart ---
  const removeFromCart = useCallback((productId) => {
    setTimeout(() => {
      setCartItems((prev) => prev.filter((item) => item.id !== productId));
    }, 0);
  }, []);

  const handleOpenPaymentModal = useCallback(() => {
    setIsProcessingSale(false);
    if (cartItems.length === 0) {
      showToast('Error', 'El carrito está vacío', 'error');
      return;
    }
    setPaymentModalKey(prev => prev + 1);
    setShowPaymentModal(true);
  }, [cartItems, showToast]);

  const handleCancelSale = useCallback(() => {
    setShowCancelModal(true);
  }, []);

  const confirmCancelSale = useCallback(() => {
    setCartItems([]);
    setShowCancelModal(false);
    showToast('Venta Cancelada', 'Carrito vaciado', 'success');
  }, [showToast]);

  const handleClosePaymentModal = useCallback(() => {
    setShowPaymentModal(false);
  }, []);

  const handleConfirmPayment = useCallback(async (cashReceived, changeDue, paymentMethodUsed = null, terminalResult = null) => {
    setIsProcessingSale(true);
    try {
      const finalPaymentMethod = paymentMethodUsed || paymentMethod;
      let intentId = null;
      let metodoPago = finalPaymentMethod;

      if (finalPaymentMethod === 'efectivo' && (!cashReceived || cashReceived < cartTotal)) {
         showToast('Error', 'Monto inválido.', 'error');
         setIsProcessingSale(false);
         return;
      }

      // Solo efectivo y débito
      if (finalPaymentMethod === 'Tarjeta') {
        metodoPago = 'Tarjeta';
      } else {
        metodoPago = 'efectivo';
      }

      const detalles = cartItems.map(item => ({
        producto: item.id,
        cantidad_vendida: item.quantity,
        precio_unitario_venta: item.precio_venta
      }));

      const payload = {
        detalles,
        fecha_venta: new Date().toISOString(),
        metodo_pago: metodoPago,
        usuario_id: 1,
        monto_total: cartTotal,
        monto_recibido: cashReceived || cartTotal,
        vuelto: changeDue || 0,
        intent_id: intentId
      };

      if (terminalResult) {
         payload.informacion_terminal = { ...terminalResult };
      }

      const response = await fetch('http://localhost:8000/api/ventas/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();

      if (response.ok && result.id) {
        showToast('Venta Completada', 'Pago realizado con éxito', 'success');
        handleClosePaymentModal();
        setPendingClearCart(true);
      } else {
        showToast('Error', result?.error || 'Error al completar venta.', 'error');
      }
    } catch (error) {
      showToast('Error', 'Error de conexión.', 'error');
    } finally {
      setIsProcessingSale(false);
    }
  }, [cartItems, showToast, paymentMethod, loadProducts]); // eslint-disable-line

  const cartTotal = cartItems.reduce((sum, item) => sum + item.precio_venta * item.quantity, 0);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    if (pendingClearCart && !showPaymentModal) {
      const timer = setTimeout(() => {
        setCartItems([]);
        loadProducts();
        setPendingClearCart(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [pendingClearCart, showPaymentModal, loadProducts]);

  return (
    <>
      <ErrorBoundary>
        <header className="w-full bg-white shadow mb-6">
          <div className="max-w-7xl mx-auto flex justify-between items-center h-20 px-4">
            <div className="flex items-center">
              <img src="/logo192.png" alt="Logo" className="w-12 h-12 object-contain" />
              <span className="ml-3 font-bold text-2xl text-gray-700">MiniMarket Pro</span>
            </div>
            <h1 className="text-lg font-bold text-gray-600">POS Ventas</h1>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-2/3">
              <ErrorBoundary>
                <ProductList
                  products={products.filter(p =>
                    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (p.codigo_producto && p.codigo_producto.toLowerCase().includes(searchTerm.toLowerCase())) ||
                    (p.codigo_barra && p.codigo_barra.toLowerCase().includes(searchTerm.toLowerCase()))
                  )}
                  isLoading={isLoading}
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  addToCart={addToCart}
                  formatPrice={formatPrice}
                />
              </ErrorBoundary>
            </div>
            <div className="w-full md:w-1/3">
              <ErrorBoundary>
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
              </ErrorBoundary>
            </div>
          </div>
        </div>

        <ToastContainer toasts={toasts} setToasts={setToasts} />

        {showCancelModal && !showPaymentModal && (
          <ErrorBoundary>
            <Modal
              key="cancel-modal"
              show={true}
              title="Cancelar Venta"
              message="¿Está seguro que desea cancelar la venta?"
              onConfirm={confirmCancelSale}
              onCancel={() => setShowCancelModal(false)}
            />
          </ErrorBoundary>
        )}
        {showPaymentModal && !showCancelModal && (
          <ErrorBoundary>
            <PaymentModal
              key={paymentModalKey}
              show={true}
              cartTotal={cartTotal}
              onConfirm={handleConfirmPayment}
              onCancel={handleClosePaymentModal}
              showToast={showToast}
              isProcessingSale={isProcessingSale}
              paymentMethod={paymentMethod}
            />
          </ErrorBoundary>
        )}
      </ErrorBoundary>
    </>
  );
}