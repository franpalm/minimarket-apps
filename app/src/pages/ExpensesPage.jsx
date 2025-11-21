import React, { useState, useEffect, useRef } from "react";
import Chart from 'chart.js/auto';
import { getGastos, createGasto, updateGasto, deleteGasto } from "../services/GastoService";

const defaultCategories = ["arriendo", "servicios", "insumos", "sueldos", "imprevistos"];

function ExpensesPage() {
  const [theme, setTheme] = useState('light');
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState(defaultCategories);
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    category: "",
    amount: "",
    description: ""
  });
  const [showForm, setShowForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [editingExpense, setEditingExpense] = useState(null);

  const monthlyChartRef = useRef(null);
  const monthlyChartInstance = useRef(null);
  const categoryChartRef = useRef(null);
  const categoryChartInstance = useRef(null);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Cargar gastos desde el backend al montar el componente
  useEffect(() => {
    setLoading(true);
    getGastos()
      .then(data => setExpenses(data))
      .finally(() => setLoading(false));
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
    setLoading(true);
    if (editingExpense) {
      await updateGasto(editingExpense.id, form);
      setEditingExpense(null);
    } else {
      await createGasto(form);
    }
    getGastos().then(data => setExpenses(data));
    setForm({
      date: new Date().toISOString().split('T')[0],
      category: "",
      amount: "",
      description: ""
    });
    setShowForm(false);
    setLoading(false);
  };

  const handleEditExpense = (expense) => {
    setForm({
      date: expense.fecha || expense.date,
      category: expense.categoria || expense.category,
      amount: expense.monto?.toString() || expense.amount?.toString(),
      description: expense.descripcion || expense.description
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
      date: new Date().toISOString().split('T')[0],
      category: "",
      amount: "",
      description: ""
    });
  };

  const handleAddCategory = (e) => {
    e.preventDefault();
    if (newCategory.trim() && !categories.includes(newCategory.toLowerCase().trim())) {
      const updatedCategories = [...categories, newCategory.toLowerCase().trim()];
      setCategories(updatedCategories);
      setNewCategory("");
      setShowCategoryForm(false);
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
                <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full p-3 bg-slate-100 dark:bg-slate-700 border-transparent rounded-lg text-slate-800 dark:text-slate-200" required/>
                <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full p-3 bg-slate-100 dark:bg-slate-700 border-transparent rounded-lg text-slate-800 dark:text-slate-200" required>
                  <option value="">Categoría</option>
                  {categories.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                </select>
                <textarea 
                  value={form.description} 
                  onChange={e => setForm({...form, description: e.target.value})} 
                  placeholder="Descripción del gasto..." 
                  className="w-full p-3 bg-slate-100 dark:bg-slate-700 border-transparent rounded-lg text-slate-800 dark:text-slate-200 resize-none h-20"
                  required
                />
                <input type="number" value={form.amount} placeholder="Monto" onChange={e => setForm({...form, amount: e.target.value})} className="w-full p-3 bg-slate-100 dark:bg-slate-700 border-transparent rounded-lg text-slate-800 dark:text-slate-200" required/>
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