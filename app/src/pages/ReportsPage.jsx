// Opciones de máquinas (puedes cargar dinámicamente si lo prefieres)
const MAQUINAS = [
  { id: 1, nombre: 'Tuu' },
  { id: 2, nombre: 'Compraqui' },
];
import React, { useState, useEffect } from 'react';
import authFetch from '../utils/authFetch';
import ReportFilters from '../components/Report/ReportFilters';
import PulsoDelDia from '../components/Report/Dia/PulsoDelDia';
import InformeSemanal from '../components/Report/Semana/InformeSemanal';
import InformeMensual from '../components/Report/Mes/InformeMensual';


const TAB_LIST = [
  { key: 'daily', label: 'El Pulso del Día', icon: 'bi bi-heart-pulse' },
  { key: 'weekly', label: 'Informe Semanal', icon: 'bi bi-bar-chart-line' },
  { key: 'monthly', label: 'Informe Mensual', icon: 'bi bi-calendar3' }
];

function getToday() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

// Devuelve la semana actual en formato YYYY-Www
function getCurrentWeek() {
  const now = new Date();
  const onejan = new Date(now.getFullYear(), 0, 1);
  const week = Math.ceil((((now - onejan) / 86400000) + onejan.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${week.toString().padStart(2, '0')}`;
}

function ReportsPage() {
  const [activeTab, setActiveTab] = useState('daily');
  const [filters, setFilters] = useState({
    dateFrom: getToday(),
    dateTo: getToday(),
    week: getCurrentWeek(),
    month: '', // número
    year: '', // número
    monthInput: '', // string 'YYYY-MM' para el input
    category: '',
    topN: '5',
    payment: '',
    maquina: ''
  });
  const [appliedFilters, setAppliedFilters] = useState({
    ...filters
  });
  // Máquina seleccionada para filtrar
  const [maquinaId, setMaquinaId] = useState('');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Al cambiar de tab, setea los filtros predeterminados solo si es necesario
  useEffect(() => {
    if (activeTab === 'daily') {
      setFilters(f => ({
        ...f,
        dateFrom: getToday(),
        dateTo: getToday()
      }));
      setAppliedFilters(f => ({
        ...f,
        dateFrom: getToday(),
        dateTo: getToday()
      }));
    } else if (activeTab === 'weekly') {
      setFilters(f => ({
        ...f,
        week: f.week && f.week !== '' ? f.week : getCurrentWeek()
      }));
      setAppliedFilters(f => ({
        ...f,
        week: f.week && f.week !== '' ? f.week : getCurrentWeek()
      }));
    } else if (activeTab === 'monthly') {
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();
      const monthInput = `${year}-${String(month).padStart(2, '0')}`;
      setFilters(f => ({
        ...f,
        month,
        year,
        monthInput
      }));
      setAppliedFilters(f => ({
        ...f,
        month,
        year,
        monthInput
      }));
    }
  }, [activeTab]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        let url = '';
        let params = [];
        if (activeTab === 'daily') {
          params.push(`dateFrom=${appliedFilters.dateFrom}`);
          params.push(`dateTo=${appliedFilters.dateTo}`);
          if (appliedFilters.payment) params.push(`payment=${appliedFilters.payment}`);
          if (appliedFilters.usuario) params.push(`usuario=${appliedFilters.usuario}`);
          if (appliedFilters.terminal_status) params.push(`terminal_status=${appliedFilters.terminal_status}`);
          if (maquinaId) params.push(`maquina=${maquinaId}`);
          url = `http://localhost:8000/api/reportes/diario/?${params.join('&')}`;
        } else if (activeTab === 'weekly') {
          if (!appliedFilters.week) {
            setReportData(null);
            setLoading(false);
            return;
          }
          params.push(`week=${appliedFilters.week}`);
          if (appliedFilters.payment) params.push(`payment=${appliedFilters.payment}`);
          if (appliedFilters.usuario) params.push(`usuario=${appliedFilters.usuario}`);
          if (appliedFilters.terminal_status) params.push(`terminal_status=${appliedFilters.terminal_status}`);
          if (maquinaId) params.push(`maquina=${maquinaId}`);
          url = `http://localhost:8000/api/reportes/semanal/?${params.join('&')}`;
        } else if (activeTab === 'monthly') {
          let month = appliedFilters.month;
          let year = appliedFilters.year;
          if (!month) {
            const now = new Date();
            month = now.getMonth() + 1;
            year = now.getFullYear();
          }
          params.push(`month=${Number(month)}`);
          params.push(`year=${Number(year)}`);
          if (appliedFilters.payment) params.push(`payment=${appliedFilters.payment}`);
          if (appliedFilters.usuario) params.push(`usuario=${appliedFilters.usuario}`);
          if (appliedFilters.terminal_status) params.push(`terminal_status=${appliedFilters.terminal_status}`);
          url = `http://localhost:8000/api/reportes/mensual/?${params.join('&')}`;
        } else {
          setReportData(null);
          setLoading(false);
          return;
        }
        if (url) {
          const res = await authFetch(url);
          if (!res.ok) throw new Error('Error de red o backend');
          const data = await res.json();
          console.log('Datos recibidos para', activeTab, data); // Depuración
          setReportData(data);
        }
      } catch (err) {
        setReportData({ error: 'No se pudo obtener datos del backend.' });
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [activeTab, appliedFilters]);

  const handleFilterChange = e => {
    const { name, value } = e.target;
    if (name === 'month') {
      // value es 'YYYY-MM' o solo el mes
      let year, month;
      if (value.includes('-')) {
        [year, month] = value.split('-');
        month = Number(month);
        year = Number(year);
      } else {
        // Si solo es el mes, usa el año actual
        const now = new Date();
        month = Number(value);
        year = now.getFullYear();
      }
      setFilters(prev => ({
        ...prev,
        month,
        year,
        monthInput: value
      }));
    } else {
      setFilters(prev => ({ ...prev, [name]: value }));
    }
  };


  // Aplica los filtros seleccionados
  const handleApplyFilters = () => {
    setAppliedFilters({ ...filters });
  };

  const formatCLP = n =>
    n?.toLocaleString('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    });

  const renderTabContent = () => {
    if (loading) {
      return ( 
        <div className="flex items-center justify-center py-12 text-gray-500 gap-2">
          <i className="bi bi-arrow-repeat animate-spin text-2xl"></i>
          Cargando datos del reporte...
        </div>
      );
    }
    if (reportData && reportData.error) {
      return (
        <div className="flex items-center justify-center py-12 text-red-500">
          <i className="bi bi-exclamation-triangle text-2xl mr-2"></i>
          {reportData.error}
        </div>
      );
    }
    // Siempre renderiza el componente del tab, aunque reportData sea null o vacío
    if (activeTab === 'daily') {
      return <PulsoDelDia reportData={reportData} formatCLP={formatCLP} />;
    }
    if (activeTab === 'weekly') {
      // Handler para cambiar la semana seleccionada
      const handleWeekChange = (weekValue) => {
        setFilters(prev => ({ ...prev, week: weekValue }));
        setAppliedFilters(prev => ({ ...prev, week: weekValue }));
      };
      return (
        <InformeSemanal
          reportData={reportData}
          formatCLP={formatCLP}
          selectedWeek={filters.week}
          onWeekChange={handleWeekChange}
        />
      );
    }
    if (activeTab === 'monthly') {
      // Pasar el mes y año actuales y el handler para cambiar mes
      const handleMonthChange = (monthIdx) => {
        // monthIdx es 0-based (0=enero)
        const year = filters.year || new Date().getFullYear();
        setFilters(prev => ({
          ...prev,
          month: monthIdx + 1,
          year,
          monthInput: `${year}-${String(monthIdx + 1).padStart(2, '0')}`
        }));
        setAppliedFilters(prev => ({
          ...prev,
          month: monthIdx + 1,
          year,
          monthInput: `${year}-${String(monthIdx + 1).padStart(2, '0')}`
        }));
      };
      return <InformeMensual reportData={reportData} formatCLP={formatCLP} onMonthChange={handleMonthChange} month={filters.month} year={filters.year} />;
    }
    
    // Si no es ninguno de los tabs conocidos, renderiza vacío o un mensaje
    return null;
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex gap-4 mb-4">
        {TAB_LIST.map(tab => (
          <button
            key={tab.key}
            className={`px-4 py-2 rounded font-semibold border ${activeTab === tab.key ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 border-blue-600'}`}
            onClick={() => setActiveTab(tab.key)}
          >
            <i className={`${tab.icon} mr-2`}></i>{tab.label}
          </button>
        ))}
      </div>
      {renderTabContent()}
    </div>
  );
}

export default ReportsPage;