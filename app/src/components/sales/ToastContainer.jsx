

import React, { useEffect, useRef } from 'react';

const Toast = ({ toast, onStartClose }) => {
  useEffect(() => {
    if (toast.closing) return;
    const timeout = setTimeout(() => {
      onStartClose(toast.id);
    }, 3000);
    return () => clearTimeout(timeout);
  }, [toast, onStartClose]);

  return (
    <div
      className={`flex items-start min-w-[250px] max-w-[350px] px-4 py-3 rounded shadow-lg bg-white border-l-4 transition-opacity duration-300 ${
        toast.type === 'success'
          ? 'border-green-500'
          : toast.type === 'error'
          ? 'border-red-500'
          : 'border-yellow-400'
      } ${toast.closing ? 'opacity-0' : 'opacity-100'}`}
    >
      <div className={`flex items-center justify-center w-6 h-6 rounded-full mr-3 ${
        toast.type === 'success'
          ? 'bg-green-500 text-white'
          : toast.type === 'error'
          ? 'bg-red-500 text-white'
          : 'bg-yellow-400 text-white'
      }`}>
        <i className={`bi ${toast.type === 'success' ? 'bi-check-lg' : toast.type === 'error' ? 'bi-x-lg' : 'bi-exclamation-lg'}`}></i>
      </div>
      <div className="flex-1">
        <div className="font-bold">{toast.title}</div>
        <div className="text-sm">{toast.message}</div>
      </div>
      <button
        className="ml-4 text-gray-500 hover:text-gray-800 text-xl font-bold focus:outline-none"
        onClick={() => onStartClose(toast.id)}
      >
        ×
      </button>
    </div>
  );
};

const ToastContainer = ({ toasts, setToasts }) => {
  const timeoutRefs = useRef({});

  // Efecto para limpiar todos los timeouts al desmontar el contenedor
  useEffect(() => {
    return () => {
      for (const id in timeoutRefs.current) {
        clearTimeout(timeoutRefs.current[id]);
      }
    };
  }, []);

  // Marca el toast como cerrando, y lo elimina tras la animación
  const startClose = (id) => {
    // Evitar doble cierre
    const isAlreadyClosing = toasts.find(t => t.id === id)?.closing;
    if (isAlreadyClosing) return;

    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, closing: true } : t))
    );

    // Guardar y manejar el timeout para la eliminación final
    timeoutRefs.current[id] = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      delete timeoutRefs.current[id]; // Limpiar la referencia
    }, 300); // Coincide con la duración de la animación de opacidad
  };

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onStartClose={startClose} />
      ))}
    </div>
  );
};

export default ToastContainer;