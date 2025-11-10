import React, { useState } from 'react';

function CategoryCollapse({ show, categories, onAddCategory, onDeleteCategory, onClose }) {
  const [categoryCode, setCategoryCode] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    onAddCategory({ code: categoryCode, name: categoryName });
    setCategoryCode('');
    setCategoryName('');
  };

  const handleDeleteClick = (categoryId) => {
    setCategoryToDelete(categoryId);
    setShowConfirmModal(true);
  };

  const confirmDelete = () => {
    onDeleteCategory(categoryToDelete);
    setShowConfirmModal(false);
    setCategoryToDelete(null);
  };

  if (!show) return null;

  return (
    <div id="categorySectionCollapse" className="mb-3 p-4 border rounded bg-gray-50">
      {/* Modal de Confirmación */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full text-center">
            <h5 className="font-bold mb-2">Confirmar Eliminación</h5>
            <p className="mb-4">¿Estás seguro de que quieres eliminar esta categoría? Si la categoría está asociada a productos, la eliminación fallará.</p>
            <div className="flex justify-center gap-4 mt-4">
              <button
                type="button"
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 rounded px-4 py-2"
                onClick={() => setShowConfirmModal(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="bg-red-600 hover:bg-red-700 text-white rounded px-4 py-2"
                onClick={confirmDelete}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      <h6 className="font-semibold mb-2">Gestionar Categorías</h6>
      {/* Formulario para agregar */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label htmlFor="newCategoryName" className="block font-medium mb-1">Nombre de Categoría</label>
          <input
            type="text"
            className="border rounded px-3 py-2 w-full"
            id="newCategoryName"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="newCategoryCode" className="block font-medium mb-1">Código (opcional)</label>
          <input
            type="text"
            className="border rounded px-3 py-2 w-full"
            id="newCategoryCode"
            value={categoryCode}
            onChange={(e) => setCategoryCode(e.target.value)}
          />
        </div>
        <div className="flex items-end">
          <button type="submit" className="bg-green-600 hover:bg-green-700 text-white rounded px-4 py-2 w-full text-sm">Guardar</button>
        </div>
      </form>

      {/* Lista de categorías con botón de eliminar */}
      <h6 className="font-semibold mt-4 mb-2">Categorías Existentes</h6>
      <ul className="divide-y divide-gray-200">
        {categories.length > 0 ? (
          categories.map((cat) => (
            <li key={cat.id} className="flex justify-between items-center py-2">
              {cat.nombre_categoria}
              <button
                type="button"
                className="bg-red-600 hover:bg-red-700 text-white rounded px-3 py-1 text-sm"
                onClick={() => handleDeleteClick(cat.id)}
                title="Eliminar categoría"
              >
                Eliminar
              </button>
            </li>
          ))
        ) : (
          <li className="py-2 text-gray-500">No hay categorías para mostrar.</li>
        )}
      </ul>
      <div className="mt-3 text-right">
        <button
          type="button"
          className="bg-gray-300 hover:bg-gray-400 text-gray-800 rounded px-4 py-2 text-sm"
          onClick={onClose}
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}

export default CategoryCollapse;