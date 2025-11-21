import React, { useState } from 'react';
import useScanDetection from '../../hooks/useScanDetection';

// Sonidos (puedes cambiar los archivos por los que prefieras)
const beepUrl = '/sounds/beep.mp3'; // Coloca el archivo en public/sounds/
const errorUrl = '/sounds/error.mp3';

function playSound(url) {
  const audio = new window.Audio(url);
  audio.play();
}

function PantallaVenta() {
  const [carrito, setCarrito] = useState([]);
  const [notificacion, setNotificacion] = useState(null);

  // Lógica de escaneo
  useScanDetection(async (codigo) => {
    try {
      const res = await fetch(`/api/productos/?codigo_barra=${codigo}`);
      if (res.ok) {
        const producto = await res.json();
        setCarrito(prev => {
          const idx = prev.findIndex(p => p.id === producto.id);
          if (idx !== -1) {
            // Si ya está, aumenta cantidad
            const nuevo = [...prev];
            nuevo[idx].cantidad = (nuevo[idx].cantidad || 1) + 1;
            return nuevo;
          }
          // Si no está, agrégalo con cantidad 1
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
    // Oculta la notificación después de 2s
    setTimeout(() => setNotificacion(null), 2000);
  });

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
      {/* ...otros controles de venta... */}
    </div>
  );
}

export default PantallaVenta;
