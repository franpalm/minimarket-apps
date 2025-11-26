import React, { useEffect, useState, useRef } from 'react';
import authFetch from '../utils/authFetch';
import useScanDetection from '../hooks/useScanDetection';
import { useNotification } from '../components/Notification';
import AddProductForm from '../components/Invetory/AddProductForm';
import ProductsTable from '../components/Invetory/ProductsTable';
import Notification from '../components/Notification';
import CategoryCollapse from '../components/Invetory/CategoryCollapse';

function InventoryPage() {
        const [inversionResumen, setInversionResumen] = useState({ resumen: [], total_general: 0 });

        const loadInversionResumen = async () => {
            try {
                const res = await authFetch('http://localhost:8000/api/resumen-inversion/');
                const data = await res.json();
                setInversionResumen(data);
            } catch (err) {
                setInversionResumen({ resumen: [], total_general: 0 });
            }
        };
    const addProductFormRef = useRef(null);
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [loading, setLoading] = useState(false);
    const { showNotification } = useNotification();
    const [showCategory, setShowCategory] = useState(false);
    const [showAddProductForm, setShowAddProductForm] = useState(false);

        // Handler for barcode scan
        const handleBarcodeScan = (barcode) => {
            // Only auto-fill if the product code input is NOT focused
            const activeEl = document.activeElement;
            if (activeEl && activeEl.name === 'codigo_producto') return;
            // Set the value in AddProductForm
            if (addProductFormRef.current && addProductFormRef.current.setCodigoProducto) {
                addProductFormRef.current.setCodigoProducto(barcode);
                showNotification(`Código escaneado: ${barcode}`, 'info');
            }
        };

        useScanDetection(handleBarcodeScan);

    useEffect(() => {
        loadProducts();
        loadCategories();
        loadInversionResumen();
    }, []);

    const loadProducts = async () => {
        setLoading(true);
        try {
            const res = await authFetch('http://localhost:8000/api/productos-rest/', {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            const data = await res.json();
            // Normaliza el campo de categoría para todos los productos
            const normalized = data.map(p => ({
                ...p,
                id_categoria: p.id_categoria !== undefined ? p.id_categoria : (p.categoria_id !== undefined ? p.categoria_id : (p.categoria !== undefined ? p.categoria : undefined))
            }));
            setProducts(normalized);
        } catch (err) {
            console.error("Error al cargar productos en frontend:", err);
            showNotification('Error al cargar productos', 'danger');
        } finally {
            setLoading(false);
        }
    };

    const loadCategories = async () => {
        try {
            const res = await authFetch('http://localhost:8000/api/categorias/');
            const data = await res.json();
            const mappedCategories = data.map(cat => ({
                id: cat.id,
                codigo_categoria: cat.codigo_categoria || cat.id,
                nombre_categoria: cat.nombre_categoria || cat.nombre || ''
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
            const res = await authFetch(`http://localhost:8000/api/productos-rest/${updatedProduct.id}/`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedProduct)
            });
            if (res.ok) {
                showNotification('Se han guardado los cambios', 'success');
                // Recargar productos desde el endpoint REST para reflejar el cambio
                const productosRes = await authFetch('http://localhost:8000/api/productos-rest/', {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                const productosData = await productosRes.json();
                setProducts(productosData);
            } else {
                const result = await res.json();
                showNotification(result.message || 'Error al actualizar producto', 'danger');
            }
            loadInversionResumen();
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
            const res = await authFetch('http://localhost:8000/api/categorias/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nombre: cat.name,
                    descripcion: cat.description || ''
                })
            });
            if (res.ok) {
                showNotification('Se han guardado los cambios', 'success');
                loadCategories();
                loadInversionResumen();
            } else {
                const result = await res.json();
                showNotification(result.message || result.error || 'Error desconocido al agregar categoría', 'danger');
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
            const res = await authFetch(`http://localhost:8000/api/categorias/${categoryId}/`, {
                method: 'DELETE'
            });
            if (res.ok) {
                showNotification('Se han guardado los cambios', 'success');
                loadCategories();
                loadProducts();
                loadInversionResumen();
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
                const res = await authFetch(`http://localhost:8000/api/productos/${productId}/`, {
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

            {/* Resumen de inversión */}

            <div className="mb-6 bg-blue-50 border border-blue-200 rounded p-4">
                <h2 className="text-lg font-semibold mb-2 text-blue-700">Inversión en Inventario</h2>
                <div className="flex flex-wrap gap-4 items-center">
                    {inversionResumen.resumen.map(cat => (
                        <div key={cat.categoria_id} className="bg-white rounded shadow px-4 py-2">
                            <span className="font-medium text-gray-700">{cat.categoria}:</span> <span className="text-blue-800 font-bold">{new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(cat.total_inversion)}</span>
                        </div>
                    ))}
                    <div className="bg-blue-700 text-white rounded shadow px-4 py-2 font-bold">
                        Total estimado: {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(inversionResumen.total_general)}
                    </div>
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

            <div className="flex gap-4 mt-8 mb-4">
                <button
                    type="button"
                    className="border border-green-600 text-green-600 bg-white hover:bg-green-50 rounded px-4 py-2 text-sm font-semibold flex items-center gap-2"
                    onClick={() => setShowAddProductForm((v) => !v)}
                >
                    <i className="bi bi-plus-circle"></i>
                    {showAddProductForm ? 'Ocultar Formulario' : 'Agregar Nuevo Producto'}
                </button>
                <button
                    type="button"
                    id="toggleCategoryButton"
                    className="border border-blue-600 text-blue-600 bg-white hover:bg-blue-50 rounded px-4 py-2 text-sm font-semibold flex items-center gap-2"
                    onClick={() => setShowCategory(!showCategory)}
                >
                    <i className="bi bi-tags"></i>
                    Gestionar Categorías
                </button>
            </div>

            {showCategory && (
                <div className="rounded-lg shadow bg-white mb-6">
                    <div className="p-4">
                        <CategoryCollapse
                            show={showCategory}
                            categories={categories}
                            onAddCategory={handleAddCategory}
                            onDeleteCategory={handleDeleteCategory}
                            onClose={() => setShowCategory(false)}
                        />
                    </div>
                </div>
            )}

            {showAddProductForm && (
                <div className="rounded-lg shadow bg-white mb-6">
                    <div className="p-4">
                        <AddProductForm
                            ref={addProductFormRef}
                            categories={categories}
                            onProductAdded={() => {
                                showNotification('Producto agregado con éxito', 'success');
                                loadProducts();
                                loadInversionResumen();
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

export default InventoryPage;