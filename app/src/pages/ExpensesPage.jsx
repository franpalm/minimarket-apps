import React, { useState, useEffect, useRef } from "react";
import Chart from 'chart.js/auto';

// --- DATOS INICIALES Y CONSTANTES (Sin cambios) ---
const initialExpenses = [
  { id: 1, date: "2023-08-10", category: "arriendo", amount: 1200000, description: "Arriendo oficina central" },
  { id: 2, date: "2023-08-05", category: "servicios", amount: 150000, description: "Pago de servicios básicos" },
];
const defaultCategories = ["arriendo", "servicios", "insumos", "sueldos", "imprevistos"];


function ExpensesPage() {
  // --- ESTADO PARA GESTIONAR EL TEMA (NUEVO) ---
  const [theme, setTheme] = useState('light'); // 'light' o 'dark'
  
  // --- OTROS ESTADOS (Sin cambios) ---
  const [expenses, setExpenses] = useState(() => JSON.parse(localStorage.getItem("expenses") || JSON.stringify(initialExpenses)));
  const [categories, setCategories] = useState(() => JSON.parse(localStorage.getItem("expenseCategories") || JSON.stringify(defaultCategories)));
  const [form, setForm] = useState({ 
    date: new Date().toISOString().split('T')[0], // Fecha actual por defecto
    category: "", 
    amount: "", 
    description: "" 
  });
  const [showForm, setShowForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [editingExpense, setEditingExpense] = useState(null); // Para saber si estamos editando

  const monthlyChartRef = useRef(null);
  const monthlyChartInstance = useRef(null);
  const categoryChartRef = useRef(null);
  const categoryChartInstance = useRef(null);
  

  // --- useEffect PARA APLICAR LA CLASE DEL TEMA AL HTML ---
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);


  // --- useEffect PARA ACTUALIZAR GRÁFICOS (Ahora depende del tema) ---
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

  }, [expenses, theme]); // Se vuelve a ejecutar si el tema cambia

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (editingExpense) {
      // Editar gasto existente
      setExpenses(expenses.map(exp => 
        exp.id === editingExpense.id ? { ...form, id: editingExpense.id } : exp
      ));
      setEditingExpense(null);
    } else {
      // Agregar nuevo gasto
      setExpenses([...expenses, { ...form, id: Date.now() }]);
    }
    
    // Resetear formulario
    setForm({ 
      date: new Date().toISOString().split('T')[0],
      category: "", 
      amount: "", 
      description: "" 
    });
    setShowForm(false);
  };

  const handleEditExpense = (expense) => {
    // Cargar datos del gasto en el formulario
    setForm({
      date: expense.date,
      category: expense.category,
      amount: expense.amount.toString(),
      description: expense.description
    });
    setEditingExpense(expense);
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
      localStorage.setItem("expenseCategories", JSON.stringify(updatedCategories));
      setNewCategory("");
      setShowCategoryForm(false);
    }
  };

  // --- RENDERIZADO DEL DISEÑO DARK MODE ---
  return (
    <div className="bg-slate-100 dark:bg-slate-900 min-h-screen font-sans transition-colors duration-300">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">

        {/* --- CABECERA CON TÍTULO Y TOGGLE DE TEMA --- */}
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

        {/* --- SECCIÓN PRINCIPAL DE WIDGETS --- */}
        <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Columna de Gráficos */}
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

          {/* Columna de Acciones y Listado */}
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
                  {/* Inputs con estilos para modo oscuro */}
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
                {expenses.slice(0, 5).map(g => (
                  <li 
                    key={g.id} 
                    onClick={() => handleEditExpense(g)}
                    className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-600/70 transition-colors"
                  >
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 capitalize">{g.category}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{g.description}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">{g.date}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-800 dark:text-white">${Number(g.amount).toLocaleString('es-CL')}</p>
                      <i className="bi bi-pencil-square text-sm text-slate-400 dark:text-slate-500"></i>
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