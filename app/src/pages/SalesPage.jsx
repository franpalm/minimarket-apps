

import React, { useState, useEffect, useCallback } from 'react';
import authFetch from '../utils/authFetch';
import useScanDetection from '../hooks/useScanDetection';
import ErrorBoundary from '../components/ErrorBoundary';
import ProductList from '../components/sales/ProductList';
import RegistryPanel from '../components/sales/RegistryPanel';
import PaymentModal from '../components/sales/PaymentModal';
import ToastContainer from '../components/sales/ToastContainer';
import Modal from '../components/sales/Modal';

// Opciones de máquinas (puedes cargar dinámicamente si lo prefieres)
const MAQUINAS = [
  { id: 1, nombre: 'Tuu' },
  { id: 2, nombre: 'Compraqui' },
];

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

export default function SalesPage() {


  // Máquina activa (por defecto la primera)
  const [maquinaId, setMaquinaId] = useState(MAQUINAS[0].id);
  const [products, setProducts] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingSale, setIsProcessingSale] = useState(false);
  const [pendingClearCart, setPendingClearCart] = useState(false);

  // --- Estado de caja ---
  const [caja, setCaja] = useState(null);
  const [cajaResumen, setCajaResumen] = useState(null);
  const [showCajaModal, setShowCajaModal] = useState(false);
  const [montoInicial, setMontoInicial] = useState('');
  const [montoFinal, setMontoFinal] = useState('');
  const [cargandoCaja, setCargandoCaja] = useState(false);

  // Consultar si hay caja abierta al cargar
  useEffect(() => {
    async function fetchCaja() {
      setCargandoCaja(true);
      try {
        const res = await authFetch(`http://localhost:8000/api/cajas/?maquina=${maquinaId}`);
        if (res.ok) {
          const data = await res.json();
          const abierta = data.find(c => c.estado === 'abierta');
          setCaja(abierta || null);
        }
      } catch {}
      setCargandoCaja(false);
    }
    fetchCaja();
  }, [maquinaId]);

  // Iniciar caja
  const handleAbrirCaja = async () => {
    if (!montoInicial || isNaN(Number(montoInicial))) {
      showToast('Error', 'Ingrese un monto inicial válido', 'error');
      return;
    }
    setCargandoCaja(true);
    try {
      const res = await authFetch('http://localhost:8000/api/cajas/abrir/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maquina: maquinaId, monto_inicial: montoInicial })
      });
      if (res.ok) {
        const data = await res.json();
        setCaja(data);
        setShowCajaModal(false);
        showToast('Caja abierta', 'Caja iniciada correctamente', 'success');
      } else {
        const err = await res.json();
        showToast('Error', err.error || 'No se pudo abrir caja', 'error');
      }
    } catch {
      showToast('Error', 'No se pudo abrir caja', 'error');
    }
    setCargandoCaja(false);
  };

  // Cerrar caja
  const handleCerrarCaja = async () => {
    if (!montoFinal || isNaN(Number(montoFinal))) {
      showToast('Error', 'Ingrese un monto final válido', 'error');
      return;
    }
    setCargandoCaja(true);
    try {
      const res = await authFetch(`http://localhost:8000/api/cajas/${caja.id}/cerrar/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monto_final: montoFinal })
      });
      if (res.ok) {
        const data = await res.json();
        console.log('Resumen de caja recibido:', data.resumen); // <-- LOG PARA DEPURAR
        setCaja(null);
        setCajaResumen(data.resumen);
        showToast('Caja cerrada', 'Caja cerrada correctamente', 'success');
      } else {
        const err = await res.json();
        showToast('Error', err.error || 'No se pudo cerrar caja', 'error');
      }
    } catch (e) {
      showToast('Error', 'No se pudo cerrar caja', 'error');
    }
    setCargandoCaja(false);
  };
  // Lógica de escáner
  useScanDetection(async (codigo) => {
    try {
      // Buscar producto por código de barras en el array local (instantáneo)
      let producto = products.find(p => p.codigo_barra === codigo);
      // Si no está en el array local, intentar buscar en la API
      if (!producto) {
        const res = await authFetch(`http://localhost:8000/api/productos-rest/?codigo_barra=${codigo}`, {
          headers: { 'Content-Type': 'application/json' }
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
    authFetch('http://localhost:8000/api/productos-rest/', {
      headers: { 'Content-Type': 'application/json' }
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

      // Validación de efectivo: debe cubrir el total
      if (finalPaymentMethod === 'efectivo' && (!cashReceived || cashReceived < cartTotal)) {
         showToast('Error', 'Monto inválido.', 'error');
         setIsProcessingSale(false);
         return;
      }

      // Mapear correctamente el método de pago para el backend
      const normalizedMethod = (finalPaymentMethod || '').toLowerCase();
      if (normalizedMethod === 'efectivo') {
        metodoPago = 'efectivo';
      } else if (['terminal', 'tarjeta', 'débito', 'debito'].includes(normalizedMethod)) {
        metodoPago = 'terminal';
      } else {
        metodoPago = finalPaymentMethod;
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
        monto_recibido: metodoPago === 'efectivo' ? (cashReceived || cartTotal) : cartTotal,
        vuelto: metodoPago === 'efectivo' ? (changeDue || 0) : 0,
        intent_id: intentId,
        maquina: maquinaId // Enviar el id de la máquina activa
      };

      if (terminalResult) {
        payload.informacion_terminal = { ...terminalResult };
      }

      const response = await authFetch('http://localhost:8000/api/ventas/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();

      if (response.status === 400 && result?.error === 'NO_CAJA_ABIERTA') {
        showToast('Caja cerrada', result?.message || 'Debe abrir una caja para este usuario y máquina antes de registrar una venta.', 'error');
        setIsProcessingSale(false);
        return;
      }

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
            <div className="flex items-center gap-4">
              <h1 className="text-lg font-bold text-gray-600">POS Ventas</h1>
              <select
                className="ml-4 px-2 py-1 border rounded text-blue-700 font-semibold"
                value={maquinaId}
                onChange={e => setMaquinaId(Number(e.target.value))}
                style={{ minWidth: 120 }}
              >
                {MAQUINAS.map(m => (
                  <option key={m.id} value={m.id}>{m.nombre}</option>
                ))}
              </select>
              {/* Botón de caja */}
              {cargandoCaja ? (
                <span className="ml-4 text-gray-500">Cargando caja...</span>
              ) : caja ? (
                <button
                  className="ml-4 px-3 py-1 bg-red-600 text-white rounded font-semibold hover:bg-red-700"
                  onClick={() => setShowCajaModal('cerrar')}
                >
                  Cerrar Caja
                </button>
              ) : (
                <button
                  className="ml-4 px-3 py-1 bg-green-600 text-white rounded font-semibold hover:bg-green-700"
                  onClick={() => setShowCajaModal('abrir')}
                >
                  Iniciar Caja
                </button>
              )}
            </div>
          </div>
        </header>
      {/* Modal de inicio/cierre de caja */}
      {showCajaModal && (
        <Modal
          key="caja-modal"
          show={true}
          title={showCajaModal === 'abrir' ? 'Iniciar Caja' : 'Cerrar Caja'}
          message={showCajaModal === 'abrir' ? (
            <div>
              <label className="block mb-2">Monto inicial:</label>
              <input
                type="number"
                className="border rounded px-2 py-1 w-full"
                value={montoInicial}
                onChange={e => setMontoInicial(e.target.value)}
                min={0}
              />
              <div className="mt-1 text-sm text-gray-500">{montoInicial ? `CLP ${Number(montoInicial).toLocaleString('es-CL')}` : ''}</div>
            </div>
          ) : (
            <div>
              <label className="block mb-2">Monto final contado:</label>
              <input
                type="number"
                className="border rounded px-2 py-1 w-full"
                value={montoFinal}
                onChange={e => setMontoFinal(e.target.value)}
                min={0}
              />
            </div>
          )}
          onConfirm={showCajaModal === 'abrir' ? handleAbrirCaja : handleCerrarCaja}
          onCancel={() => setShowCajaModal(false)}
        />
      )}

      {/* Resumen de caja al cierre */}
      {cajaResumen && (
        <div className="max-w-2xl mx-auto my-6 p-4 border rounded bg-green-50">
          <h2 className="font-bold text-lg mb-2 text-green-800">Resumen de Caja</h2>
          <pre className="bg-gray-100 text-xs p-2 rounded mb-2 text-gray-700">{JSON.stringify(cajaResumen, null, 2)}</pre>
          <ul className="space-y-1">
            <li>Total ventas: <span className="font-semibold">{formatPrice(cajaResumen.ventas_total)}</span></li>
            <li>Ventas efectivo: <span className="font-semibold">{formatPrice(cajaResumen.ventas_efectivo)}</span></li>
            <li>Ventas terminal: <span className="font-semibold">{formatPrice(cajaResumen.ventas_terminal)}</span></li>
            <li>Gastos: <span className="font-semibold">{formatPrice(cajaResumen.gastos)}</span></li>
            <li>Diferencia: <span className="font-semibold">{formatPrice(cajaResumen.diferencia)}</span></li>
          </ul>
          {Object.values(cajaResumen).every(v => v === 0) && (
            <div className="text-red-600 mt-2 font-semibold">ADVERTENCIA: El backend devolvió todos los valores en cero. Verifica los filtros de usuario, máquina y fechas en el backend.</div>
          )}
        </div>
      )}

        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-2/3">
              <ErrorBoundary>
                <ProductList
                  products={Array.isArray(products) ? products.filter(p =>
                    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (p.codigo_producto && p.codigo_producto.toLowerCase().includes(searchTerm.toLowerCase())) ||
                    (p.codigo_barra && p.codigo_barra.toLowerCase().includes(searchTerm.toLowerCase()))
                  ) : []}
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
                  cajaAbierta={!!caja}
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