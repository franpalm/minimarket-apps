import React, { useState, useEffect, useRef, useMemo } from "react";
import Chart from 'chart.js/auto';

// --- PALETA DE COLORES VIBRANTE Y MODERNA ---
const CHART_PALETTE = [
  '#4f46e5', // Indigo
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#84cc16', // Lime
  '#f97316', // Orange
  '#6366f1'  // Indigo Light
];

// --- SIMULACIÓN DE DATOS (BACKEND) ---
const useNotification = () => {
    const showNotification = (message, type = 'info') => {
        console.log(`[${type.toUpperCase()}] ${message}`);
    };
    return { showNotification };
};

// Datos simulados
let mockExpensesData = [
    { id: 1001, fecha: '2025-01-20', categoria_id: 1, monto: 500000, metodo_pago: 'Transferencia', descripcion: 'Arriendo Enero' },
    { id: 1002, fecha: '2025-02-25', categoria_id: 2, monto: 45000, metodo_pago: 'Efectivo', descripcion: 'Luz Febrero' },
    { id: 1005, fecha: '2025-03-02', categoria_id: 4, monto: 180000, metodo_pago: 'Transferencia', descripcion: 'Bebidas Marzo' },
    { id: 1006, fecha: '2025-04-05', categoria_id: 3, monto: 350000, metodo_pago: 'Efectivo', descripcion: 'Sueldo Abril' },
    { id: 1007, fecha: '2025-11-10', categoria_id: 5, monto: 20000, metodo_pago: 'Efectivo', descripcion: 'Flete Nov' },
    { id: 1008, fecha: '2025-12-12', categoria_id: 4, monto: 85000, metodo_pago: 'Débito', descripcion: 'Abarrotes Dic' },
    { id: 1009, fecha: new Date().toISOString().split('T')[0], categoria_id: 2, monto: 15000, metodo_pago: 'Efectivo', descripcion: 'Servicios Hoy' },
    { id: 1010, fecha: new Date().toISOString().split('T')[0], categoria_id: 1, monto: 10000, metodo_pago: 'Efectivo', descripcion: 'Arriendo Hoy (Extra)' }
];

let mockCategoriesData = [
    { id: 1, nombre: 'Arriendo', icon: '🏠', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    { id: 2, nombre: 'Servicios', icon: '💡', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    { id: 3, nombre: 'Sueldos', icon: '👥', color: 'bg-purple-100 text-purple-700 border-purple-200' },
    { id: 4, nombre: 'Mercadería', icon: '🛒', color: 'bg-green-100 text-green-700 border-green-200' },
    { id: 5, nombre: 'Transporte', icon: '🚚', color: 'bg-orange-100 text-orange-700 border-orange-200' },
    { id: 6, nombre: 'Otros', icon: '📦', color: 'bg-gray-100 text-gray-700 border-gray-200' },
];

// Simuladores de API
const getGastos = async () => [...mockExpensesData];
const createGasto = async (gasto) => {
    const newGasto = { id: Date.now(), ...gasto };
    mockExpensesData.push(newGasto);
    return newGasto;
};
const updateGasto = async (id, updatedGasto) => {
    mockExpensesData = mockExpensesData.map(g => g.id === id ? { ...g, ...updatedGasto } : g);
    return { id, ...updatedGasto };
};
const deleteGasto = async (id) => {
    mockExpensesData = mockExpensesData.filter(g => g.id !== id);
    return { success: true };
};
const getCategories = async () => mockCategoriesData;

// --- UTILIDAD DE FORMATO CLP MEJORADA ---
const formatCLP = (amount) => {
    if (typeof amount !== 'number') return '$ 0';
    return amount.toLocaleString('es-CL', {
        style: 'currency',
        currency: 'CLP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
};

// Utilidades de Fechas
const checkDateInRange = (dateString, range) => {
    const date = new Date(dateString + 'T00:00:00');
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch(range) {
        case 'day': return date.getTime() === today.getTime();
        case 'week':
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - today.getDay() + 1);
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            return date >= startOfWeek && date <= endOfWeek;
        case 'month': return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
        case 'year': return date.getFullYear() === today.getFullYear();
        default: return true;
    }
};

function ExpensesPage() {
  const [theme, setTheme] = useState('light');
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  
  // Estados
  const [amountInput, setAmountInput] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [descriptionInput, setDescriptionInput] = useState("");
  const [dateInput, setDateInput] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState("Efectivo");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showDetailedStats, setShowDetailedStats] = useState(false);
  const [listFilter, setListFilter] = useState('all');
  const [budgetLimit, setBudgetLimit] = useState(1500000);
  const [timeFilter, setTimeFilter] = useState('day'); 
  const { showNotification } = useNotification();
  
  // Refs
  const mainChartRef = useRef(null);
  const chartInstance = useRef(null);
  const categoryChartRef = useRef(null);
  const categoryChartInstance = useRef(null);
  const paymentChartRef = useRef(null);
  const paymentChartInstance = useRef(null);

  const totalVentasMes = 3500000; 

  // --- CARGA ---
  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const [gastos, cats] = await Promise.all([getGastos(), getCategories()]);
    setExpenses(gastos);
    setCategories(cats);
    setLoading(false);
  };

  // --- CÁLCULOS ---
  const expensesInTimeRange = useMemo(() => expenses.filter(g => checkDateInRange(g.fecha, timeFilter)), [expenses, timeFilter]);
  const totalGastosFiltrados = useMemo(() => expensesInTimeRange.reduce((sum, g) => sum + Number(g.monto), 0), [expensesInTimeRange]);
  
  const gananciaNeta = useMemo(() => {
      let ventasEstimadas = totalVentasMes;
      if (timeFilter === 'day') ventasEstimadas = totalVentasMes / 30;
      if (timeFilter === 'week') ventasEstimadas = totalVentasMes / 4;
      if (timeFilter === 'year') ventasEstimadas = totalVentasMes * 12;
      return ventasEstimadas - totalGastosFiltrados;
  }, [timeFilter, totalGastosFiltrados]);
  
  const porcentajePresupuesto = (totalGastosFiltrados / (timeFilter === 'year' ? budgetLimit * 12 : budgetLimit)) * 100;
  let budgetColor = 'bg-emerald-500';
  if (porcentajePresupuesto > 75) budgetColor = 'bg-yellow-500';
  if (porcentajePresupuesto > 100) budgetColor = 'bg-red-500';

  const filteredListExpenses = useMemo(() => {
      if (listFilter === 'all') return expensesInTimeRange;
      return expensesInTimeRange.filter(g => g.categoria_id === listFilter);
  }, [expensesInTimeRange, listFilter]);

  // --- EXPORT ---
  const handleExportCSV = () => {
      const headers = ["ID", "Fecha", "Categoría", "Descripción", "Método Pago", "Monto"];
      const rows = expensesInTimeRange.map(g => [
          g.id, g.fecha, categories.find(c => c.id === g.categoria_id)?.nombre || 'Otros',
          `"${g.descripcion}"`, g.metodo_pago, g.monto
      ]);
      const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
      const link = document.createElement("a");
      link.setAttribute("href", encodeURI(csvContent));
      link.setAttribute("download", `gastos_${timeFilter}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  // --- GRÁFICOS ---
  useEffect(() => {
    if (chartInstance.current) chartInstance.current.destroy();
    if (mainChartRef.current) {
        let labels = [];
        let data = [];
        let chartType = 'line';
        let colors = []; // Array de colores para las barras

        // CONFIGURACIÓN DEL GRÁFICO SEGÚN EL FILTRO
        if (timeFilter === 'year') {
            labels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
            data = new Array(12).fill(0);
            expensesInTimeRange.forEach(g => {
                const month = parseInt(g.fecha.split('-')[1]) - 1;
                data[month] += Number(g.monto);
            });
            colors = CHART_PALETTE[0]; // Color único para línea de tiempo
        } else if (timeFilter === 'month') {
            const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
            labels = Array.from({length: daysInMonth}, (_, i) => (i + 1).toString());
            data = new Array(daysInMonth).fill(0);
            expensesInTimeRange.forEach(g => {
                const day = parseInt(g.fecha.split('-')[2]) - 1;
                data[day] += Number(g.monto);
            });
            colors = CHART_PALETTE[0];
        } else if (timeFilter === 'week') {
            labels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
            data = new Array(7).fill(0);
            expensesInTimeRange.forEach(g => {
                const date = new Date(g.fecha);
                let dayIndex = date.getDay() - 1;
                if (dayIndex === -1) dayIndex = 6;
                data[dayIndex] += Number(g.monto);
            });
            chartType = 'bar';
            colors = CHART_PALETTE.slice(0, 7); // Colores distintos por día
        } else {
            // GRÁFICO DIARIO (HOY): Barras por Categoría (Multicolor)
            const catMap = {};
            expensesInTimeRange.forEach(g => {
                const catName = categories.find(c => c.id === g.categoria_id)?.nombre || 'Otros';
                catMap[catName] = (catMap[catName] || 0) + Number(g.monto);
            });
            labels = Object.keys(catMap);
            data = Object.values(catMap);
            chartType = 'bar';
            // Asignar un color distinto a cada categoría
            colors = labels.map((_, i) => CHART_PALETTE[i % CHART_PALETTE.length]);
        }

        chartInstance.current = new Chart(mainChartRef.current, {
            type: chartType, 
            data: {
                labels: labels,
                datasets: [{
                    label: 'Gastos',
                    data: data,
                    // Si es gráfico de barras por día/hoy, usa array de colores. Si es línea, usa gradiente/color sólido
                    backgroundColor: chartType === 'bar' ? colors : 'rgba(79, 70, 229, 0.2)', 
                    borderColor: chartType === 'line' ? '#4f46e5' : 'transparent',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { 
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(17, 24, 39, 0.9)',
                        padding: 12,
                        callbacks: {
                            label: (context) => formatCLP(context.raw) // TOOLTIP EN CLP
                        }
                    }
                },
                scales: {
                    y: { 
                        beginAtZero: true, 
                        grid: { color: 'rgba(0,0,0,0.05)', borderDash: [5, 5] }, 
                        ticks: { 
                            callback: (value) => formatCLP(value) // EJE Y EN CLP
                        } 
                    },
                    x: { grid: { display: false } }
                }
            }
        });
    }
  }, [expensesInTimeRange, timeFilter]);

  // GRÁFICOS SECUNDARIOS (Colores mejorados)
  useEffect(() => {
    if (showDetailedStats) {
        if (categoryChartInstance.current) categoryChartInstance.current.destroy();
        if (categoryChartRef.current) {
            const catMap = {};
            expensesInTimeRange.forEach(g => {
                const catName = categories.find(c => c.id === g.categoria_id)?.nombre || 'Otros';
                catMap[catName] = (catMap[catName] || 0) + Number(g.monto);
            });
            categoryChartInstance.current = new Chart(categoryChartRef.current, {
                type: 'doughnut',
                data: {
                    labels: Object.keys(catMap),
                    datasets: [{
                        data: Object.values(catMap),
                        backgroundColor: CHART_PALETTE, // Paleta multicolor
                        borderWidth: 0,
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { 
                        legend: { position: 'right' },
                        tooltip: { callbacks: { label: (c) => ` ${c.label}: ${formatCLP(c.raw)}` } }
                    }
                }
            });
        }
        if (paymentChartInstance.current) paymentChartInstance.current.destroy();
        if (paymentChartRef.current) {
            const payMap = {};
            expensesInTimeRange.forEach(g => {
                payMap[g.metodo_pago] = (payMap[g.metodo_pago] || 0) + Number(g.monto);
            });
            paymentChartInstance.current = new Chart(paymentChartRef.current, {
                type: 'polarArea',
                data: {
                    labels: Object.keys(payMap),
                    datasets: [{
                        data: Object.values(payMap),
                        backgroundColor: CHART_PALETTE.map(c => c + 'AA'),
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { 
                        legend: { position: 'bottom' },
                        tooltip: { callbacks: { label: (c) => ` ${c.label}: ${formatCLP(c.raw)}` } }
                    },
                    scales: { r: { ticks: { display: false } } }
                }
            });
        }
    } else {
        if (categoryChartInstance.current) { categoryChartInstance.current.destroy(); categoryChartInstance.current = null; }
        if (paymentChartInstance.current) { paymentChartInstance.current.destroy(); paymentChartInstance.current = null; }
    }
  }, [showDetailedStats, expensesInTimeRange, categories]);

  // Manejadores
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amountInput || !selectedCategory) { showNotification("Datos incompletos", "error"); return; }
    setLoading(true);
    const payload = { fecha: dateInput, categoria_id: selectedCategory, monto: parseInt(amountInput), metodo_pago: paymentMethod, descripcion: descriptionInput || categories.find(c => c.id === selectedCategory)?.nombre };
    editingId ? await updateGasto(editingId, payload) : await createGasto(payload);
    await loadData(); resetForm(); setLoading(false);
  };
  const handleEdit = (g) => { setEditingId(g.id); setAmountInput(g.monto); setSelectedCategory(g.categoria_id); setDescriptionInput(g.descripcion); setDateInput(g.fecha); setPaymentMethod(g.metodo_pago); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const handleDelete = async (id) => { if(window.confirm("¿Borrar?")) { await deleteGasto(id); loadData(); } };
  const resetForm = () => { setEditingId(null); setAmountInput(""); setSelectedCategory(null); setDescriptionInput(""); setPaymentMethod("Efectivo"); setDateInput(new Date().toISOString().split('T')[0]); };
  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');
  const filterTitles = { 'day': 'Resumen de Hoy', 'week': 'Resumen de esta Semana', 'month': 'Resumen de este Mes', 'year': 'Resumen Anual' };

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${theme === 'dark' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-800'}`}>
      <div className="bg-white dark:bg-slate-800 shadow-sm p-4 flex justify-between items-center sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700">
        <div><h1 className="text-2xl font-black tracking-tight text-indigo-600 dark:text-indigo-400">Mi Minimarket</h1><p className="text-xs text-slate-500 font-medium">Gestión de Gastos</p></div>
        <div className="flex gap-3">
            <button onClick={handleExportCSV} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-full transition-colors">📥 Descargar</button>
            <button onClick={toggleTheme} className="p-2 rounded-full bg-slate-100 dark:bg-slate-700 hover:scale-105 transition">{theme === 'light' ? '🌙' : '☀️'}</button>
        </div>
      </div>

      <div className="container mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border-2 border-transparent hover:border-indigo-100 transition-colors">
                <div className="flex justify-between items-center mb-4"><h2 className="text-xl font-bold">{editingId ? '✏️ Editar Gasto' : '💸 Registrar Gasto'}</h2>{editingId && <button onClick={resetForm} className="text-xs text-red-500 font-bold uppercase hover:underline">Cancelar</button>}</div>
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-3xl font-light">$</span><input type="number" value={amountInput} onChange={e => setAmountInput(e.target.value)} placeholder="0" className="w-full pl-10 pr-4 py-4 text-4xl font-bold text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-900 rounded-xl border-none focus:ring-4 focus:ring-indigo-200 outline-none transition-all placeholder-slate-300" autoFocus/></div>
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">¿Qué pagaste?</label>
                        <div className="grid grid-cols-3 gap-2">
                            {categories.map(cat => (
                                <button key={cat.id} type="button" onClick={() => setSelectedCategory(cat.id)} className={`p-3 rounded-xl flex flex-col items-center justify-center transition-all duration-200 border-2 ${selectedCategory === cat.id ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 scale-105 shadow-md' : 'border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-indigo-300 hover:bg-slate-50'}`}>
                                    <span className="text-2xl mb-1">{cat.icon || '🔹'}</span><span className={`text-xs font-bold ${selectedCategory === cat.id ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-500'}`}>{cat.nombre}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl space-y-3">
                        <input type="text" value={descriptionInput} onChange={e => setDescriptionInput(e.target.value)} placeholder="Nota adicional (opcional)" className="w-full bg-transparent border-b border-slate-200 dark:border-slate-700 focus:border-indigo-500 outline-none py-2 text-sm"/>
                        <div className="flex gap-2">
                            {['Efectivo', 'Transferencia', 'Débito'].map(method => (
                                <button key={method} type="button" onClick={() => setPaymentMethod(method)} className={`flex-1 py-1 text-xs rounded-full font-medium transition ${paymentMethod === method ? 'bg-indigo-600 text-white shadow' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>{method}</button>
                            ))}
                        </div>
                        <input type="date" value={dateInput} onChange={e => setDateInput(e.target.value)} className="w-full bg-transparent text-xs text-slate-400 text-center outline-none"/>
                    </div>
                    <button type="submit" className={`w-full py-4 rounded-xl font-bold text-lg text-white shadow-xl transition-transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2 ${editingId ? 'bg-orange-500 hover:bg-orange-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}>{editingId ? <span>💾 Guardar Cambios</span> : <span>✅ Registrar Gasto</span>}</button>
                </form>
            </div>
        </div>

        <div className="lg:col-span-7 space-y-6">
            <div className="bg-white dark:bg-slate-800 p-2 rounded-xl shadow-sm flex justify-between items-center overflow-x-auto">
                <span className="text-xs font-bold text-slate-400 uppercase ml-2 hidden sm:block">Filtrar por:</span>
                <div className="flex space-x-1 w-full sm:w-auto">
                    {[{ id: 'day', label: 'Hoy' }, { id: 'week', label: 'Semana' }, { id: 'month', label: 'Mes' }, { id: 'year', label: 'Año' }].map(period => (
                        <button key={period.id} onClick={() => setTimeFilter(period.id)} className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all ${timeFilter === period.id ? 'bg-indigo-600 text-white shadow-md transform scale-105' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>{period.label}</button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden">
                    <div className="flex justify-between items-start"><div><p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Gastos ({filterTitles[timeFilter].split(' ')[2]})</p><p className="text-3xl font-black text-slate-800 dark:text-white mt-1">{formatCLP(totalGastosFiltrados)}</p></div></div>
                    <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 mt-3 overflow-hidden"><div className={`h-full rounded-full transition-all duration-500 ${budgetColor}`} style={{ width: `${Math.min(porcentajePresupuesto, 100)}%` }}></div></div><p className="text-xs text-slate-400 mt-2">Presupuesto ref: {formatCLP(timeFilter === 'year' ? budgetLimit * 12 : budgetLimit)}</p>
                </div>
                <div className={`p-5 rounded-2xl shadow-sm border flex flex-col justify-center ${gananciaNeta >= 0 ? 'bg-emerald-50 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800' : 'bg-red-50 border-red-100'}`}>
                    <p className={`text-xs font-bold uppercase tracking-wider ${gananciaNeta >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{gananciaNeta >= 0 ? 'Ganancia Estimada' : 'Pérdida Estimada'}</p>
                    <p className={`text-3xl font-black mt-1 ${gananciaNeta >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700'}`}>{formatCLP(gananciaNeta)}</p>
                    <p className="text-xs opacity-70 mt-2">En este periodo</p>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-4 relative">
                <div className="flex justify-between items-center mb-2"><h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{filterTitles[timeFilter]}</h3><div className="flex items-center gap-2"><button onClick={() => setShowDetailedStats(!showDetailedStats)} className={`text-xs font-bold px-3 py-1 rounded-full transition-colors ${showDetailedStats ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>{showDetailedStats ? 'Menos ▲' : 'Más Detalles ▼'}</button></div></div>
                <div className="h-48 w-full"><canvas ref={mainChartRef}></canvas></div>
                {showDetailedStats && <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in-down"><div className="h-48"><h4 className="text-center text-xs font-bold text-slate-400 mb-2">Por Categoría</h4><canvas ref={categoryChartRef}></canvas></div><div className="h-48"><h4 className="text-center text-xs font-bold text-slate-400 mb-2">Por Método de Pago</h4><canvas ref={paymentChartRef}></canvas></div></div>}
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-slate-700"><div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"><h3 className="font-bold text-slate-700 dark:text-slate-200">Listado ({expensesInTimeRange.length})</h3><div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto no-scrollbar"><button onClick={() => setListFilter('all')} className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${listFilter === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>Todos</button>{categories.slice(0, 3).map(cat => (<button key={cat.id} onClick={() => setListFilter(listFilter === cat.id ? 'all' : cat.id)} className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${listFilter === cat.id ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>{cat.nombre}</button>))}</div></div></div>
                <div className="max-h-[250px] overflow-y-auto">
                    {filteredListExpenses.length === 0 ? <p className="p-8 text-center text-slate-400 text-sm">No hay gastos en este periodo.</p> : (
                        <div className="divide-y divide-slate-50 dark:divide-slate-700">
                            {filteredListExpenses.slice().reverse().map(g => {
                                const cat = categories.find(c => c.id === g.categoria_id) || {};
                                return (
                                    <div key={g.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition cursor-default group">
                                        <div className="flex items-center gap-4"><div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${cat.color ? cat.color.split(' ')[0] : 'bg-gray-100'}`}>{cat.icon || '📄'}</div><div><p className="font-bold text-sm text-slate-800 dark:text-slate-200">{g.descripcion || cat.nombre}</p><p className="text-xs text-slate-400">{new Date(g.fecha).toLocaleDateString('es-CL')} • {g.metodo_pago}</p></div></div>
                                        <div className="flex flex-col items-end"><span className="font-bold text-slate-800 dark:text-white">{formatCLP(g.monto)}</span><div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => handleEdit(g)} className="text-xs text-indigo-500 font-medium hover:underline">Editar</button><button onClick={() => handleDelete(g.id)} className="text-xs text-red-500 font-medium hover:underline">Borrar</button></div></div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}

export default ExpensesPage;