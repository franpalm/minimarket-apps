
import React, { useState } from 'react';
import useScanDetection from '../../hooks/useScanDetection';
import authFetch from '../../utils/authFetch';

const beepUrl = '/sounds/beep.mp3';
const errorUrl = '/sounds/error.mp3';

function playSound(url) {
  const audio = new window.Audio(url);
  audio.play();
}

function PantallaVenta({ maquinaId = 1 }) { // Por defecto máquina 1, puedes pasarla como prop
  const [carrito, setCarrito] = useState([]);
  const [notificacion, setNotificacion] = useState(null);

  // Lógica de escaneo
  useScanDetection(async (codigo) => {
    try {
      const res = await authFetch(`/api/productos/?codigo_barra=${codigo}`);
      if (res.ok) {
        const producto = await res.json();
        setCarrito(prev => {
          const idx = prev.findIndex(p => p.id === producto.id);
          if (idx !== -1) {
            const nuevo = [...prev];
            nuevo[idx].cantidad = (nuevo[idx].cantidad || 1) + 1;
            return nuevo;
          }
          return [...prev, { ...producto, cantidad: 1 }];
        });
        playSound(beepUrl);
        setNotificacion({ tipo: 'success', mensaje: `Producto agregado: ${producto.nombre}` });
      } else {
        playSound(errorUrl);
        setNotificacion({ tipo: 'error', mensaje: 'Producto no encontrado' });
      }
    } catch (err) {
      playSound(errorUrl);
      setNotificacion({ tipo: 'error', mensaje: 'Error de conexión' });
    }
    setTimeout(() => setNotificacion(null), 2000);
  });

  // NUEVO: Completar venta y registrar en backend
  const handleCompletarVenta = async () => {
    if (carrito.length === 0) {
      setNotificacion({ tipo: 'error', mensaje: 'El carrito está vacío.' });
      setTimeout(() => setNotificacion(null), 2000);
      return;
    }
    try {
      const ventaPayload = {
        detalles: carrito.map(p => ({
          producto: p.id,
          cantidad_vendida: p.cantidad,
          precio_unitario_venta: p.precio
        })),
        metodo_pago: 'efectivo',
        maquina: maquinaId, // <-- INTEGRADO: id de la máquina activa
      };
      const res = await authFetch('/api/ventas/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ventaPayload),
      });
      if (res.ok) {
        setNotificacion({ tipo: 'success', mensaje: 'Venta registrada correctamente.' });
        setCarrito([]);
      } else {
        const data = await res.json();
        setNotificacion({ tipo: 'error', mensaje: data.message || 'Error al registrar venta.' });
      }
    } catch (err) {
      setNotificacion({ tipo: 'error', mensaje: 'Error de conexión al registrar venta.' });
    }
    setTimeout(() => setNotificacion(null), 2000);
  };

  return (
    <div className="pantalla-venta">
      <h2>Pantalla de Venta</h2>
      {notificacion && (
        <div className={`toast toast-${notificacion.tipo}`}>{notificacion.mensaje}</div>
      )}
      <ul className="carrito-lista">
        {carrito.map(p => (
          <li key={p.id}>
            {p.nombre} x{p.cantidad} <span>${p.precio}</span>
          </li>
        ))}
      </ul>
      <button className="btn btn-success" onClick={handleCompletarVenta} style={{marginTop: 16}}>
        Completar venta
      </button>
    </div>
  );
}

export default PantallaVenta;
