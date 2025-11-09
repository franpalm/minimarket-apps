import React, { createContext, useContext, useState, useRef, useCallback } from 'react';

// Componente visual
function Notification({ message, type = "success", onClose }) {
  if (!message) return null;
  const color =
    type === 'success'
      ? 'bg-green-100 text-green-800'
      : type === 'error'
      ? 'bg-red-100 text-red-800'
      : 'bg-blue-100 text-blue-800';

  return (
    <div className={`fixed top-5 right-5 z-50 min-w-[300px] shadow-lg px-4 py-2 rounded flex items-center ${color}`}>
      <span className="flex-1">{message}</span>
      {onClose && (
        <button
          className="ml-4 text-lg font-bold focus:outline-none"
          onClick={onClose}
        >
          ×
        </button>
      )}
    </div>
  );
}

// Contexto y provider global
const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [message, setMessage] = useState('');
  const [type, setType] = useState('success');
  const timeoutRef = useRef(null);

  const showNotification = useCallback((msg, type = 'success', duration = 2000) => {
    setMessage(msg);
    setType(type);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setMessage(''), duration);
  }, []);

  const contextValue = {
    showNotification,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      <Notification
        message={message}
        type={type}
        onClose={() => setMessage('')}
      />
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification debe usarse dentro de NotificationProvider');
  }
  return context;
}