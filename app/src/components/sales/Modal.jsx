import React from 'react';

const Modal = ({ show, title, message, onConfirm, onCancel }) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-xs w-full text-center">
        <h5 className="font-bold mb-2">{title}</h5>
        <p className="mb-4">{message}</p>
        <div className="flex justify-end gap-2">
          <button
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 rounded px-4 py-2"
            onClick={onCancel}
          >
            Cancelar
          </button>
          <button
            className="bg-red-600 hover:bg-red-700 text-white rounded px-4 py-2"
            onClick={onConfirm}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;