import React, { useEffect, useState } from 'react';
import { useNotification } from '../components/Notification';
import AddProductForm from '../components/Invetory/AddProductForm';
import ProductsTable from '../components/Invetory/ProductsTable';
import Notification from '../components/Notification';
import CategoryCollapse from '../components/Invetory/CategoryCollapse';

function InventoryPage() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [loading, setLoading] = useState(false);
    const { showNotification } = useNotification();
    const [showCategory, setShowCategory] = useState(false);

    useEffect(() => {
        loadProducts();
        loadCategories();
    }, []);

    const loadProducts = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:8000/api/productos/');
            const data = await res.json();
            setProducts(data);
        } catch (err) {
            console.error("Error al cargar productos en frontend:", err);
            showNotification('Error al cargar productos', 'danger');
        } finally {
            setLoading(false);
        }
    };

    const loadCategories = async () => {
        try {
            const res = await fetch('http://localhost:8000/api/categorias/');
            const data = await res.json();
            const mappedCategories = data.map(cat => ({
                id: cat.id,
                codigo_categoria: cat.codigo_categoria,
                nombre_categoria: cat.nombre_categoria
            }));
            setCategories(mappedCategories);
        } catch (err) {
            console.error("Error al cargar categorías en frontend:", err);
            showNotification('Error al cargar categorías', 'danger');
        }
    };


    const handleUpdateProduct = async (updatedProduct) => {
        setLoading(true);
        try {
            const res = await fetch(`http://localhost:8000/api/productos/${updatedProduct.id}/`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedProduct)
            });
            if (res.ok) {
                showNotification('Se han guardado los cambios', 'success');
                loadProducts();
            } else {
                const result = await res.json();
                showNotification(result.message || 'Error al actualizar producto', 'danger');
            }
        } catch (err) {
            console.error("Error al actualizar producto en frontend:", err);
            showNotification('Error de comunicación al actualizar producto', 'danger');
        } finally {
            setLoading(false);
        }
    };

    const handleAddCategory = async (cat) => {
        if (!cat.name) {
            showNotification('El nombre de la categoría es obligatorio.', 'danger');
            return;
        }
        setLoading(true);
        try {
            const res = await fetch('http://localhost:8000/api/categorias/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nombre_categoria: cat.name,
                    codigo_categoria: cat.code || null
                })
            });
            if (res.ok) {
                showNotification('Se han guardado los cambios', 'success');
                loadCategories();
            } else {
                const result = await res.json();
                showNotification(result.message || 'Error desconocido al agregar categoría', 'danger');
            }
        } catch (error) {
            console.error("Error agregando categoría en frontend:", error);
            showNotification('Error de comunicación al agregar categoría', 'danger');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCategory = async (categoryId) => {
        setLoading(true);
        try {
            const res = await fetch(`http://localhost:8000/api/categorias/${categoryId}/`, {
                method: 'DELETE'
            });
            if (res.ok) {
                showNotification('Se han guardado los cambios', 'success');
                loadCategories();
                loadProducts();
            } else {
                const result = await res.json();
                showNotification(result.message || 'Error al eliminar categoría', 'danger');
            }
        } catch (error) {
            console.error("Error al eliminar categoría en frontend:", error);
            showNotification('Error de comunicación al eliminar categoría', 'danger');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteProduct = async (productId) => {
        if (window.confirm(`¿Estás seguro de que quieres eliminar el producto con ID ${productId}?`)) {
            setLoading(true);
            try {
                const res = await fetch(`http://localhost:8000/api/productos/${productId}/`, {
                    method: 'DELETE'
                });
                if (res.ok) {
                    showNotification('Se han guardado los cambios', 'success');
                    loadProducts();
                } else {
                    const result = await res.json();
                    showNotification(result.message || 'Error al eliminar producto', 'danger');
                }
            } catch (err) {
                console.error("Error al eliminar producto en frontend:", err);
                showNotification('Error de comunicación al eliminar producto', 'danger');
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <div className="max-w-7xl mx-auto py-6 px-4">
            <h1 className="text-center mb-6 text-2xl font-bold text-gray-700">Módulo de Gestión de Inventario</h1>
            <div className="rounded-lg shadow mb-6 bg-white">
                <div className="bg-gray-100 border-b border-gray-200 font-semibold px-4 py-2 flex justify-between items-center">
                    <h5 className="mb-0">Agregar Nuevo Producto</h5>
                    <button
                        type="button"
                        id="toggleCategoryButton"
                        className="border border-blue-600 text-blue-600 bg-white hover:bg-blue-50 rounded px-3 py-1 text-sm flex items-center gap-1"
                        onClick={() => setShowCategory(!showCategory)}
                    >
                        <i className="bi bi-plus-lg"></i>
                        <span>Gestionar Categorías</span>
                        <i className={`bi ${showCategory ? 'bi-chevron-up' : 'bi-chevron-down'}`}></i>
                    </button>
                </div>
                <div className="p-4">
                    <CategoryCollapse
                        show={showCategory}
                        categories={categories}
                        onAddCategory={handleAddCategory}
                        onDeleteCategory={handleDeleteCategory}
                        onClose={() => setShowCategory(false)}
                    />
                    <AddProductForm
                        categories={categories}
                        onProductAdded={() => {
                            showNotification('Producto agregado con éxito', 'success');
                            loadProducts();
                        }}
                    />
                </div>
            </div>

            <ProductsTable
                products={products}
                loading={loading}
                categoryFilter={categoryFilter}
                setCategoryFilter={setCategoryFilter}
                categorias={categories}
                reload={loadProducts}
                onUpdateProduct={handleUpdateProduct}
                onDeleteProduct={handleDeleteProduct}
            />
        </div>
    );
}

export default InventoryPage;