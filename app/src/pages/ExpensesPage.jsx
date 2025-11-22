import React, { useState, useEffect, useRef } from "react";
import { useNotification } from "../components/Notification";
import Chart from 'chart.js/auto';
import { getGastos, createGasto, updateGasto, deleteGasto } from "../services/GastoService";
import { getCategories, createCategory } from "../services/CategoryService";



function ExpensesPage() {
  const [theme, setTheme] = useState('light');
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    fecha: new Date().toISOString().split('T')[0],
    categoria: "",
    monto: "",
    metodo_pago: "Efectivo",
    descripcion: ""
  });
  const [showForm, setShowForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [editingExpense, setEditingExpense] = useState(null);
  const [loading, setLoading] = useState(false);
  const monthlyChartRef = useRef(null);
  const categoryChartRef = useRef(null);
  const monthlyChartInstance = useRef(null);
  const categoryChartInstance = useRef(null);
  const { showNotification } = useNotification();

  useEffect(() => {
    setLoading(true);
    getGastos()
      .then(data => setExpenses(data))
      .finally(() => setLoading(false));
    // Cargar categorías desde backend
    getCategories().then(data => {
      // Log para depuración
      console.log('Categorías recibidas:', data);
      let cats = [];
      if (Array.isArray(data)) {
        cats = data;
      } else if (data && data.results) {
        cats = data.results;
      }
      // Filtrar solo categorías con id y nombre válidos
      cats = cats.filter(c => c && (c.id || c.pk) && (c.nombre || c.name));
      setCategories(cats);
    });
  }, []);

  useEffect(() => {
    const textColor = theme === 'dark' ? '#cbd5e1' : '#475569';
    const gridColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

    // Gráfico Mensual (Barras)
    if (monthlyChartInstance.current) monthlyChartInstance.current.destroy();
    const monthlyData = {
      labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
      datasets: [{ label: 'Gastos', data: [650000, 590000, 800000, 810000, 560000, 550000], backgroundColor: '#6366f1' }]
    };
    if (monthlyChartRef.current) {
      monthlyChartInstance.current = new Chart(monthlyChartRef.current, {
        type: 'bar', data: monthlyData,
        options: {
          plugins: { legend: { labels: { color: textColor } } },
          scales: {
            x: { ticks: { color: textColor }, grid: { color: gridColor } },
            y: { ticks: { color: textColor }, grid: { color: gridColor } }
          }
        }
      });
    }

    // Gráfico de Categorías (Dona)
    if (categoryChartInstance.current) categoryChartInstance.current.destroy();
    const categoryData = {
      labels: ['Arriendo', 'Servicios', 'Insumos', 'Sueldos'],
      datasets: [{ data: [1200000, 150000, 300000, 900000], backgroundColor: ['#8b5cf6', '#3b82f6', '#14b8a6', '#f59e0b'] }]
    };
    if (categoryChartRef.current) {
      categoryChartInstance.current = new Chart(categoryChartRef.current, {
        type: 'doughnut', data: categoryData,
        options: {
          plugins: { legend: { position: 'bottom', labels: { color: textColor } } }
        }
      });
    }
  }, [expenses, theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.fecha || !form.categoria || !form.monto || !form.metodo_pago || !form.descripcion) {
      showNotification("Todos los campos son obligatorios.", "error");
      return;
    }
    setLoading(true);
    const payload = {
      fecha: form.fecha,
      categoria_id: form.categoria, // Enviar como categoria_id para el backend
      monto: form.monto,
      metodo_pago: form.metodo_pago,
      descripcion: form.descripcion
    };
    try {
      let resp;
      if (editingExpense) {
        resp = await updateGasto(editingExpense.id, payload);
        setEditingExpense(null);
      } else {
        resp = await createGasto(payload);
      }
      if (resp && resp.id) {
        getGastos().then(data => setExpenses(data));
        setForm({
          fecha: new Date().toISOString().split('T')[0],
          categoria: "",
          monto: "",
          metodo_pago: "Efectivo",
          descripcion: ""
        });
        setShowForm(false);
        showNotification(editingExpense ? "Gasto actualizado correctamente." : "Gasto registrado correctamente.", "success");
      } else if (resp && resp.error) {
        showNotification(resp.error, "error");
      } else {
        showNotification("Error al guardar el gasto. Verifica los datos.", "error");
      }
    } catch (err) {
      showNotification("Error de red o del servidor.", "error");
    }
    setLoading(false);
  };

  const handleEditExpense = (expense) => {
    setForm({
      fecha: expense.fecha || new Date().toISOString().split('T')[0],
      categoria: expense.categoria || "",
      monto: expense.monto?.toString() || "",
      metodo_pago: expense.metodo_pago || "Efectivo",
      descripcion: expense.descripcion || ""
    });
    setEditingExpense(expense);
  };

  const handleDeleteExpense = async (id) => {
    setLoading(true);
    await deleteGasto(id);
    getGastos().then(data => setExpenses(data));
    setLoading(false);
  };

  const handleCancelEdit = () => {
    setEditingExpense(null);
    setForm({
      fecha: new Date().toISOString().split('T')[0],
      categoria: "",
      monto: "",
      metodo_pago: "Efectivo",
      descripcion: ""
    });
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    const nombre = newCategory.trim();
    if (!nombre) return;
    try {
      const resp = await createCategory({ nombre });
      if (resp && (resp.id || resp.pk)) {
        showNotification("Categoría agregada correctamente.", "success");
        setNewCategory("");
        setShowCategoryForm(false);
        // Refrescar categorías desde backend
        getCategories().then(data => {
          let cats = [];
          if (Array.isArray(data)) {
            cats = data;
          } else if (data && data.results) {
            cats = data.results;
          }
          cats = cats.filter(c => c && (c.id || c.pk) && (c.nombre || c.name));
          setCategories(cats);
        });
      } else {
        showNotification("No se pudo agregar la categoría.", "error");
      }
    } catch (err) {
      showNotification("Error al agregar la categoría.", "error");
    }
  };

  return (
    <div className="bg-slate-100 dark:bg-slate-900 min-h-screen font-sans transition-colors duration-300">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
            Panel de Control
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
              {theme === 'light' ? 'Modo Claro' : 'Modo Oscuro'}
            </span>
            <button onClick={toggleTheme} className={`w-12 h-6 rounded-full p-1 flex items-center transition-colors ${theme === 'dark' ? 'bg-indigo-600' : 'bg-slate-300'}`}>
              <div className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform ${theme === 'dark' ? 'translate-x-6' : ''}`}></div>
            </button>
          </div>
        </header>
        <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2 flex flex-col gap-6">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
              <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-4">Evolución Mensual</h2>
              <canvas ref={monthlyChartRef}></canvas>
            </div>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
              <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-4">Distribución por Categoría</h2>
              <canvas ref={categoryChartRef} style={{maxHeight: '300px', margin: 'auto'}}></canvas>
            </div>
          </section>
          <aside className="space-y-6">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200">
                  {editingExpense ? "Editar Gasto" : "Registrar Gasto"}
                </h2>
                <div className="flex items-center gap-2">
                  {editingExpense && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="bg-slate-600 hover:bg-slate-700 text-white text-sm font-medium px-3 py-2 rounded-lg shadow transition-colors"
                    >
                      Cancelar
                    </button>
                  )}
                  <button
                    onClick={() => setShowCategoryForm(!showCategoryForm)}
                    className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-3 py-2 rounded-lg shadow transition-colors"
                  >
                    + Categoría
                  </button>
                </div>
              </div>
              {showCategoryForm && (
                <form onSubmit={handleAddCategory} className="mb-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      placeholder="Nueva categoría..."
                      className="flex-1 p-2 bg-slate-100 dark:bg-slate-600 border-transparent rounded text-slate-800 dark:text-slate-200"
                      required
                    />
                    <button
                      type="submit"
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-medium"
                    >
                      Agregar
                    </button>
                    <button
                      type="button"
                      onClick={() => {setShowCategoryForm(false); setNewCategory("");}}
                      className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded"
                    >
                      ×
                    </button>
                  </div>
                </form>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <input type="date" value={form.fecha} onChange={e => setForm({...form, fecha: e.target.value})} className="w-full p-3 bg-slate-100 dark:bg-slate-700 border-transparent rounded-lg text-slate-800 dark:text-slate-200" required/>
                <select value={form.categoria} onChange={e => setForm({...form, categoria: e.target.value})} className="w-full p-3 bg-slate-100 dark:bg-slate-700 border-transparent rounded-lg text-slate-800 dark:text-slate-200" required>
                  <option value="">Categoría</option>
                  {categories.length === 0 && <option disabled value="">No hay categorías</option>}
                  {categories.map((c) => {
                    const id = c.id || c.pk;
                    const nombre = c.nombre || c.name;
                    if (!id || !nombre) return null;
                    return (
                      <option key={`cat-${id}`} value={id}>{nombre}</option>
                    );
                  })}
                </select>
                <input type="text" value={form.metodo_pago} onChange={e => setForm({...form, metodo_pago: e.target.value})} placeholder="Método de pago" className="w-full p-3 bg-slate-100 dark:bg-slate-700 border-transparent rounded-lg text-slate-800 dark:text-slate-200" required/>
                <textarea 
                  value={form.descripcion} 
                  onChange={e => setForm({...form, descripcion: e.target.value})} 
                  placeholder="Descripción del gasto..." 
                  className="w-full p-3 bg-slate-100 dark:bg-slate-700 border-transparent rounded-lg text-slate-800 dark:text-slate-200 resize-none h-20"
                  required
                />
                <input type="number" value={form.monto} placeholder="Monto" onChange={e => setForm({...form, monto: e.target.value})} className="w-full p-3 bg-slate-100 dark:bg-slate-700 border-transparent rounded-lg text-slate-800 dark:text-slate-200" required/>
                <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg shadow-lg">
                  {editingExpense ? "Actualizar Gasto" : "Añadir"}
                </button>
              </form>
            </div>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
              <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-4">Últimos Gastos</h2>
              <ul className="space-y-3">
                {expenses.slice(0, 5).map((g, idx) => (
                  <li 
                    key={g.id ? `expense-${g.id}` : `expense-idx-${idx}`} 
                    onClick={() => handleEditExpense(g)}
                    className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-600/70 transition-colors"
                  >
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 capitalize">{g.categoria || g.category}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{g.descripcion || g.description}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">{g.fecha || g.date}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-800 dark:text-white">${Number(g.monto || g.amount).toLocaleString('es-CL')}</p>
                      <i className="bi bi-pencil-square text-sm text-slate-400 dark:text-slate-500" title="Editar"></i>
                      <button onClick={e => {e.stopPropagation(); handleDeleteExpense(g.id);}} className="ml-2 text-red-500" title="Eliminar">
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
}

export default ExpensesPage;