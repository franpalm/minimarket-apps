import React, { useState, useEffect, useMemo } from "react";
import PulsoDelDia from '../components/Report/Dia/PulsoDelDia';
import { getGastos, createGasto, updateGasto, deleteGasto } from "../services/GastoService";
import { getCategories } from "../services/CategoryService";
import authFetch from "../utils/authFetch";

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

// --- NOTIFICACIONES SIMPLES ---
const useNotification = () => {
    const showNotification = (message, type = 'info') => {
        console.log(`[${type.toUpperCase()}] ${message}`);
    };
    return { showNotification };
};

const DEFAULT_CATEGORIES = [
    { id: 1, nombre: 'Arriendo', icon: '🏠', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    { id: 2, nombre: 'Servicios', icon: '💡', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    { id: 3, nombre: 'Sueldos', icon: '👥', color: 'bg-purple-100 text-purple-700 border-purple-200' },
    { id: 4, nombre: 'Mercadería', icon: '🛒', color: 'bg-green-100 text-green-700 border-green-200' },
    { id: 5, nombre: 'Transporte', icon: '🚚', color: 'bg-orange-100 text-orange-700 border-orange-200' },
    { id: 6, nombre: 'Otros', icon: '📦', color: 'bg-gray-100 text-gray-700 border-gray-200' },
];

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

// --- COMPONENTES DE GRÁFICOS SIMPLES (SIN LIBRERÍAS EXTERNAS) ---
const SimpleBarChart = ({ labels = [], data = [], colors = [] }) => {
    if (!data.length) {
        return <p className="text-center text-sm text-slate-400">Sin datos para mostrar.</p>;
    }
    const maxValue = Math.max(...data, 1);
    return (
        <div className="h-48 flex items-end gap-3">{
            labels.map((label, idx) => {
                const value = data[idx];
                const heightPct = Math.max((value / maxValue) * 100, 5);
                return (
                    <div key={`${label}-${idx}`} className="flex-1 flex flex-col items-center gap-2">
                        <div
                            className="w-full rounded-t-2xl shadow-sm transition-all"
                            style={{
                                height: `${heightPct}%`,
                                backgroundColor: colors[idx] || 'rgba(79,70,229,0.8)'
                            }}
                        ></div>
                        <span className="text-xs font-semibold text-slate-500 text-center truncate w-full">{label}</span>
                        <span className="text-[11px] text-slate-400">{formatCLP(value)}</span>
                    </div>
                );
            })
        }</div>
    );
};

const SimpleDonutChart = ({ segments = [] }) => {
    const total = segments.reduce((sum, seg) => sum + seg.value, 0);
    if (!total) {
        return <p className="text-center text-sm text-slate-400">Sin datos para mostrar.</p>;
    }
    let accumulated = 0;
    return (
        <div className="relative h-48 w-full flex flex-col items-center justify-center">
            <svg viewBox="0 0 36 36" className="w-36 h-36 -rotate-90">
                {segments.map((segment, idx) => {
                    const percentage = (segment.value / total) * 100;
                    const dashArray = `${percentage} ${100 - percentage}`;
                    const circle = (
                        <circle
                            key={`${segment.label}-${idx}`}
                            cx="18"
                            cy="18"
                            r="15.9155"
                            fill="transparent"
                            stroke={segment.color}
                            strokeWidth="4"
                            strokeDasharray={dashArray}
                            strokeDashoffset={accumulated}
                        />
                    );
                    accumulated += percentage;
                    return circle;
                })}
            </svg>
            <p className="text-lg font-black text-slate-700">{formatCLP(total)}</p>
        </div>
    );
};

const ChartLegend = ({ segments = [] }) => (
    <div className="flex flex-wrap justify-center gap-3 text-xs mt-2">
        {segments.map(segment => (
            <div key={segment.label} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: segment.color }}></span>
                <span className="font-semibold text-slate-600">{segment.label}</span>
                <span className="text-slate-400">{formatCLP(segment.value)}</span>
            </div>
        ))}
    </div>
);

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
    const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  
  // Estados
  const [amountInput, setAmountInput] = useState("");
    const [selectedCategory, setSelectedCategory] = useState(DEFAULT_CATEGORIES[0]?.id ?? null);
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
  const [monthlyReport, setMonthlyReport] = useState({
      totalVentas: 0,
      breakdownByPayment: {
          efectivo: { total: 0, cantidad: 0 },
          terminal: { total: 0, cantidad: 0 }
      }
  });
  const [monthlyReportStatus, setMonthlyReportStatus] = useState('idle');
  const [monthlyReportError, setMonthlyReportError] = useState(null);

  // --- CARGA ---
  useEffect(() => { loadData(); }, []);

  useEffect(() => {
      async function fetchMonthlyReport() {
          setMonthlyReportStatus('loading');
          setMonthlyReportError(null);
          try {
              const now = new Date();
              const month = now.getMonth() + 1;
              const year = now.getFullYear();
              const response = await authFetch(`http://localhost:8000/api/reportes/mensual/?month=${month}&year=${year}`);
              if (!response.ok) {
                  throw new Error('No se pudo obtener el reporte mensual.');
              }
              const data = await response.json();
              const efectivo = data?.breakdownByPayment?.efectivo || { total: 0, cantidad: 0 };
              const terminal = data?.breakdownByPayment?.terminal || { total: 0, cantidad: 0 };
              setMonthlyReport({
                  totalVentas: data?.totalSales ?? data?.totalVentas ?? 0,
                  breakdownByPayment: { efectivo, terminal }
              });
              setMonthlyReportStatus('success');
          } catch (error) {
              setMonthlyReport({
                  totalVentas: 0,
                  breakdownByPayment: {
                      efectivo: { total: 0, cantidad: 0 },
                      terminal: { total: 0, cantidad: 0 }
                  }
              });
              setMonthlyReportStatus('error');
              setMonthlyReportError(error.message || 'Error desconocido');
          }
      }
      fetchMonthlyReport();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
        const [gastos, cats] = await Promise.all([getGastos(), getCategories()]);
        const rawCategories = Array.isArray(cats) ? cats : (cats?.results ?? []);
        const sourceCategories = rawCategories.length ? rawCategories : DEFAULT_CATEGORIES;

        // Normalizar categorías: asegurar id numérico y nombre string
        const categoriesNormalized = (sourceCategories || []).map((c, idx) => ({
            ...c,
            id: c && c.id !== undefined && c.id !== null && !Number.isNaN(Number(c.id)) ? Number(c.id) : c.id ?? idx + 1,
            nombre: c && typeof c.nombre === 'string' ? c.nombre : String(c?.nombre ?? ''),
        }));

        // Índices auxiliares
        const idByName = Object.fromEntries(
            categoriesNormalized
                .filter(c => typeof c.nombre === 'string' && c.nombre.trim().length)
                .map(c => [c.nombre.toLowerCase(), c.id])
        );

        // Normalizar gastos: mapear categoria desde id/objeto/nombre a id numérico e incluir nombre
        const gastosNormalizados = (gastos || []).map(g => {
            let raw = g.categoria_id ?? g.categoria ?? g?.categoria_detalle ?? g?.categoria_obj;
            let catName = g.categoria_nombre || g?.categoria?.nombre || g?.categoria?.name;
            // Si viene objeto, tomar id o pk
            if (raw && typeof raw === 'object') {
                catName = catName ?? raw.nombre ?? raw.name;
                raw = raw.id ?? raw.pk ?? raw.value ?? raw.categoria_id ?? raw.categoria;
            }
            // Si es string no numérica, buscar por nombre (case-insensitive)
            let catId;
            if (raw !== undefined && raw !== null && raw !== '') {
                if (!Number.isNaN(Number(raw))) {
                    catId = Number(raw);
                } else if (typeof raw === 'string') {
                    const lookup = idByName[raw.toLowerCase()];
                    catId = lookup !== undefined ? lookup : undefined;
                    catName = catName ?? raw;
                }
            }
            if (!catName && catId !== undefined) {
                const match = categoriesNormalized.find(c => c.id === catId);
                catName = match?.nombre;
            }
            return {
                ...g,
                categoria_id: catId,
                categoria: catId,
                categoria_nombre: catName,
            };
        });

        setExpenses(gastosNormalizados);
        setCategories(categoriesNormalized);
        if (categoriesNormalized.length) {
            const exists = categoriesNormalized.some(cat => cat.id === selectedCategory);
            if (!exists) {
                setSelectedCategory(categoriesNormalized[0].id);
            }
        }
    } catch (error) {
        console.error('Error cargando datos', error);
        showNotification('No fue posible cargar gastos o categorías. Revisa tu conexión.', 'error');
        setCategories(DEFAULT_CATEGORIES);
        setSelectedCategory(DEFAULT_CATEGORIES[0]?.id ?? null);
    } finally {
        setLoading(false);
    }
  };

  // --- CÁLCULOS ---
  const expensesInTimeRange = useMemo(() => expenses.filter(g => checkDateInRange(g.fecha, timeFilter)), [expenses, timeFilter]);
  const totalGastosFiltrados = useMemo(() => expensesInTimeRange.reduce((sum, g) => sum + Number(g.monto), 0), [expensesInTimeRange]);
  
  const ventasEstimadas = useMemo(() => {
      let base = monthlyReport.totalVentas || 0;
      if (timeFilter === 'day') base = base / 30;
      if (timeFilter === 'week') base = base / 4;
      if (timeFilter === 'year') base = base * 12;
      return base;
  }, [timeFilter, monthlyReport.totalVentas]);

  const gananciaNeta = useMemo(() => {
      return ventasEstimadas - totalGastosFiltrados;
  }, [ventasEstimadas, totalGastosFiltrados]);
  
  const porcentajePresupuesto = (totalGastosFiltrados / (timeFilter === 'year' ? budgetLimit * 12 : budgetLimit)) * 100;
  let budgetColor = 'bg-emerald-500';
  if (porcentajePresupuesto > 75) budgetColor = 'bg-yellow-500';
  if (porcentajePresupuesto > 100) budgetColor = 'bg-red-500';

  const filteredListExpenses = useMemo(() => {
      if (listFilter === 'all') return expensesInTimeRange;
      return expensesInTimeRange.filter(g => Number(g.categoria_id ?? g.categoria) === listFilter);
  }, [expensesInTimeRange, listFilter]);

  const categoryColorMap = useMemo(() => {
      const map = {};
      categories.forEach((cat, idx) => {
          map[cat.nombre] = CHART_PALETTE[idx % CHART_PALETTE.length];
      });
      return map;
  }, [categories]);

  const mainChartData = useMemo(() => {
      const base = { labels: [], data: [], colors: [] };
      if (!expensesInTimeRange.length) return base;

      if (timeFilter === 'year') {
          const labels = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
          const data = new Array(12).fill(0);
          expensesInTimeRange.forEach(g => {
              const month = parseInt(g.fecha.split('-')[1], 10) - 1;
              if (month >= 0 && month < 12) data[month] += Number(g.monto);
          });
          return { labels, data, colors: labels.map(() => CHART_PALETTE[0]) };
      }

      if (timeFilter === 'month') {
          const now = new Date();
          const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
          const labels = Array.from({ length: daysInMonth }, (_, i) => `${i + 1}`);
          const data = new Array(daysInMonth).fill(0);
          expensesInTimeRange.forEach(g => {
              const day = parseInt(g.fecha.split('-')[2], 10) - 1;
              if (day >= 0 && day < daysInMonth) data[day] += Number(g.monto);
          });
          return { labels, data, colors: labels.map(() => CHART_PALETTE[1]) };
      }

      if (timeFilter === 'week') {
          const labels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
          const data = new Array(7).fill(0);
          expensesInTimeRange.forEach(g => {
              const date = new Date(g.fecha);
              let dayIndex = date.getDay() - 1;
              if (dayIndex === -1) dayIndex = 6;
              data[dayIndex] += Number(g.monto);
          });
          return { labels, data, colors: labels.map((_, idx) => CHART_PALETTE[idx % CHART_PALETTE.length]) };
      }

      // Día actual: agrupar por categoría (con fallback al nombre del gasto)
      const catMap = {};
      expensesInTimeRange.forEach(g => {
          const cat = categories.find(c => c.id === Number(g.categoria_id ?? g.categoria));
          const catName = cat?.nombre || g.categoria_nombre || 'Otros';
          catMap[catName] = (catMap[catName] || 0) + Number(g.monto);
      });
      const labels = Object.keys(catMap);
      const data = Object.values(catMap);
      const colors = labels.map(name => name === 'Otros' ? '#94a3b8' : (categoryColorMap[name] || '#6366f1'));
      return { labels, data, colors };
  }, [expensesInTimeRange, timeFilter, categories, categoryColorMap]);

  const categoryBreakdown = useMemo(() => {
      const map = {};
      expensesInTimeRange.forEach(g => {
          const cat = categories.find(c => c.id === Number(g.categoria_id ?? g.categoria));
          const label = cat?.nombre || g.categoria_nombre || 'Otros';
          map[label] = (map[label] || 0) + Number(g.monto);
      });
      return Object.entries(map).map(([label, value], idx) => ({
          label,
          value,
          color: label === 'Otros' ? '#94a3b8' : CHART_PALETTE[idx % CHART_PALETTE.length]
      }));
  }, [expensesInTimeRange, categories]);

    const getMetodoCantidad = (entry) => entry?.cantidad ?? entry?.count ?? 0;

        // Integrate PulsoDelDia breakdown if available
        const [pulsoReport, setPulsoReport] = useState(null);

        useEffect(() => {
            // Try to extract PulsoDelDia data from the DOM (if rendered elsewhere)
            const pulsoDataEl = document.getElementById('pulso-del-dia-data');
            if (pulsoDataEl) {
                try {
                    const pulsoData = JSON.parse(pulsoDataEl.textContent);
                    setPulsoReport(pulsoData);
                    return;
                } catch {}
            }
            // Fallback: use monthlyReport.pulsoDelDia if present
            setPulsoReport(monthlyReport.pulsoDelDia || null);
        }, [monthlyReport]);

        const paymentBreakdown = useMemo(() => {
            // Prefer PulsoDelDia breakdown if available
            let breakdown = null;
            if (pulsoReport && pulsoReport.breakdownByPayment) {
                breakdown = pulsoReport.breakdownByPayment;
            } else if (monthlyReport.breakdownByPayment) {
                breakdown = monthlyReport.breakdownByPayment;
            }
            const segments = [];
            if (breakdown) {
                if (breakdown.efectivo && breakdown.efectivo.total > 0) {
                    segments.push({ label: 'Efectivo', value: breakdown.efectivo.total, color: '#10b981' });
                }
                if (breakdown.terminal && breakdown.terminal.total > 0) {
                    segments.push({ label: 'Débito / Terminal', value: breakdown.terminal.total, color: '#4f46e5' });
                }
                // Add other payment methods if needed
                if (segments.length) return segments;
            }
            // Fallback: compute from expenses
            const payMap = {};
            expensesInTimeRange.forEach(g => {
                const label = g.metodo_pago || 'Sin método';
                payMap[label] = (payMap[label] || 0) + Number(g.monto);
            });
            return Object.entries(payMap).map(([label, value], idx) => ({
                label,
                value,
                color: CHART_PALETTE[(idx + 3) % CHART_PALETTE.length]
            }));
        }, [pulsoReport, monthlyReport.breakdownByPayment, expensesInTimeRange]);

    const efectivoData = monthlyReport.breakdownByPayment?.efectivo || { total: 0, cantidad: 0, count: 0 };
    const terminalData = monthlyReport.breakdownByPayment?.terminal || { total: 0, cantidad: 0, count: 0 };

  // --- EXPORT ---
  const handleExportCSV = () => {
      const headers = ["ID", "Fecha", "Categoría", "Descripción", "Método Pago", "Monto"];
      const rows = expensesInTimeRange.map(g => {
          const cat = categories.find(c => c.id === Number(g.categoria_id ?? g.categoria));
          return [
              g.id,
              g.fecha,
              cat ? cat.nombre : (g.categoria_nombre || 'Otros'),
              `"${g.descripcion}"`,
              g.metodo_pago,
              g.monto
          ];
      });
      const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
      const link = document.createElement("a");
      link.setAttribute("href", encodeURI(csvContent));
      link.setAttribute("download", `gastos_${timeFilter}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  // Los gráficos ahora se renderizan con componentes ligeros basados en div/svg.

  // Manejadores
  const handleSubmit = async (e) => {
        e.preventDefault();
        if (!amountInput || !selectedCategory) {
            showNotification("Datos incompletos", "error");
            return;
        }
        const selectedCategoryObj = categories.find(c => c.id === selectedCategory);
        if (!selectedCategoryObj) {
            showNotification("La categoría seleccionada no existe. Actualiza la página o selecciona otra.", "error");
            return;
        }
        setLoading(true);
        const payload = {
            fecha: dateInput,
            categoria: Number(selectedCategory), // Debe ser numérico para el backend
            monto: parseInt(amountInput, 10),
            metodo_pago: paymentMethod,
            descripcion: descriptionInput || selectedCategoryObj?.nombre,
            categoria_nombre: selectedCategoryObj?.nombre
        };
        if (editingId) {
            await updateGasto(editingId, payload);
        } else {
            await createGasto(payload);
        }
        await loadData();
        resetForm();
        setLoading(false);
    };
  const handleEdit = (g) => { setEditingId(g.id); setAmountInput(g.monto); setSelectedCategory(g.categoria_id); setDescriptionInput(g.descripcion); setDateInput(g.fecha); setPaymentMethod(g.metodo_pago); window.scrollTo({ top: 0, behavior: 'smooth' }); };
    const handleDelete = async (id) => {
        if (!id) return;
        if (!window.confirm("¿Borrar este gasto?")) return;
        setLoading(true);
        try {
            await deleteGasto(id);
            showNotification('Gasto eliminado correctamente', 'success');
            await loadData();
        } catch (error) {
            showNotification('Error al eliminar el gasto', 'error');
        } finally {
            setLoading(false);
        }
    };
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden">
                    <div className="flex justify-between items-start"><div><p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Gastos ({filterTitles[timeFilter].split(' ')[2]})</p><p className="text-3xl font-black text-slate-800 dark:text-white mt-1">{formatCLP(totalGastosFiltrados)}</p></div></div>
                    <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 mt-3 overflow-hidden"><div className={`h-full rounded-full transition-all duration-500 ${budgetColor}`} style={{ width: `${Math.min(porcentajePresupuesto, 100)}%` }}></div></div><p className="text-xs text-slate-400 mt-2">Presupuesto ref: {formatCLP(timeFilter === 'year' ? budgetLimit * 12 : budgetLimit)}</p>
                </div>
                <div className={`p-5 rounded-2xl shadow-sm border flex flex-col justify-center ${gananciaNeta >= 0 ? 'bg-emerald-50 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800' : 'bg-red-50 border-red-100'}`}>
                    <p className={`text-xs font-bold uppercase tracking-wider ${gananciaNeta >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{gananciaNeta >= 0 ? 'Ganancia Estimada' : 'Pérdida Estimada'}</p>
                    <p className={`text-3xl font-black mt-1 ${gananciaNeta >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700'}`}>{formatCLP(gananciaNeta)}</p>
                    <p className="text-xs opacity-70 mt-2">En este periodo</p>
                    {monthlyReportStatus === 'loading' && <p className="text-[11px] text-slate-500 mt-2">Sincronizando ventas del mes...</p>}
                    {monthlyReportStatus === 'error' && <p className="text-[11px] text-red-500 mt-2">{monthlyReportError}</p>}
                </div>
                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Ventas reales del mes</p>
                    <p className="text-3xl font-black text-indigo-700 dark:text-indigo-300 mt-1">{formatCLP(monthlyReport.totalVentas)}</p>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                        <div className="rounded border border-emerald-200 dark:border-emerald-800 p-3">
                            <p className="text-[11px] uppercase text-emerald-600 font-bold">Efectivo</p>
                            <p className="text-xl font-black text-emerald-700">{formatCLP(efectivoData.total)}</p>
                            <p className="text-[11px] text-slate-500">{getMetodoCantidad(efectivoData)} ventas</p>
                        </div>
                        <div className="rounded border border-indigo-200 dark:border-indigo-800 p-3">
                            <p className="text-[11px] uppercase text-indigo-600 font-bold">Débito/Terminal</p>
                            <p className="text-xl font-black text-indigo-700">{formatCLP(terminalData.total)}</p>
                            <p className="text-[11px] text-slate-500">{getMetodoCantidad(terminalData)} ventas</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-4 relative">
                <div className="flex justify-between items-center mb-2"><h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{filterTitles[timeFilter]}</h3><div className="flex items-center gap-2"><button onClick={() => setShowDetailedStats(!showDetailedStats)} className={`text-xs font-bold px-3 py-1 rounded-full transition-colors ${showDetailedStats ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>{showDetailedStats ? 'Menos ▲' : 'Más Detalles ▼'}</button></div></div>
                <div className="h-48 w-full">
                    <SimpleBarChart labels={mainChartData.labels} data={mainChartData.data} colors={mainChartData.colors} />
                </div>
                {showDetailedStats && (
                    <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in-down">
                        <div className="h-48 flex flex-col">
                            <h4 className="text-center text-xs font-bold text-slate-400 mb-2">Por Categoría</h4>
                            <SimpleDonutChart segments={categoryBreakdown} />
                            <ChartLegend segments={categoryBreakdown} />
                        </div>
                        <div className="h-48 flex flex-col">
                            <h4 className="text-center text-xs font-bold text-slate-400 mb-2">Por Método de Pago</h4>
                            <SimpleDonutChart segments={paymentBreakdown} />
                            <ChartLegend segments={paymentBreakdown} />
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-slate-700"><div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"><h3 className="font-bold text-slate-700 dark:text-slate-200">Listado ({expensesInTimeRange.length})</h3><div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto no-scrollbar"><button onClick={() => setListFilter('all')} className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${listFilter === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>Todos</button>{categories.slice(0, 3).map(cat => (<button key={cat.id} onClick={() => setListFilter(listFilter === cat.id ? 'all' : cat.id)} className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${listFilter === cat.id ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>{cat.nombre}</button>))}</div></div></div>
                <div className="max-h-[250px] overflow-y-auto">
                    {filteredListExpenses.length === 0 ? (
                        <p className="p-8 text-center text-slate-400 text-sm">No hay gastos en este periodo.</p>
                    ) : (
                        <div className="divide-y divide-slate-50 dark:divide-slate-700">
                            {filteredListExpenses.slice().reverse().map(g => {
                                const expenseCatId = Number(g.categoria_id ?? g.categoria);
                                const cat = categories.find(c => c.id === expenseCatId);
                                const nombreCategoria = cat ? cat.nombre : (g.categoria_nombre || 'Otros');
                                const iconCategoria = cat ? cat.icon : '📦';
                                const colorCategoria = cat ? cat.color?.split(' ')[0] : 'bg-gray-100';
                                return (
                                    <div key={g.id} className="relative p-4 grid grid-cols-[auto_1fr_auto] items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition cursor-default group">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${colorCategoria}`}>{iconCategoria}</div>
                                        <div>
                                            <p className="font-bold text-sm text-slate-800 dark:text-slate-200">{g.descripcion || nombreCategoria}</p>
                                            <p className="text-xs text-slate-400">{new Date(g.fecha).toLocaleDateString('es-CL')} • {g.metodo_pago}</p>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="font-bold text-slate-800 dark:text-white">{formatCLP(g.monto)}</span>
                                            <button
                                                onClick={() => handleDelete(g.id)}
                                                className="mt-2 text-3xl font-extrabold text-red-600 bg-transparent border-none cursor-pointer focus:outline-none"
                                                style={{ lineHeight: '1', width: '40px', height: '40px' }}
                                                title="Eliminar gasto"
                                            >
                                                X
                                            </button>
                                        </div>
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