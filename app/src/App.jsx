import React, { useState } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import { NotificationProvider } from './components/Notification';
import './App.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import InventoryPage from './pages/InventoryPage';
import SalesPage from './pages/SalesPage';
import ReportsPage from './pages/ReportsPage';
import ExpensesPage from './pages/ExpensesPage';
import Sidebar from './components/Sidebar';
import LoginPage from './pages/LoginPage';

function App() {
  const [currentPage, setCurrentPage] = useState('sales');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [modoPrueba, setModoPrueba] = useState(false);

  const handleNavigate = (page) => {
    setCurrentPage(page);
  };

  const handleLogin = () => setIsLoggedIn(true);
  const activarModoPrueba = () => setModoPrueba(true);

  const renderPage = () => {
    switch (currentPage) {
      case 'inventory':
        return <InventoryPage />;
      case 'sales':
        return <SalesPage modoPrueba={modoPrueba} />;
      case 'expenses':
        return <ExpensesPage />;
      case 'reports':
        return <ReportsPage />;
      case 'settings':
        return <div><h1 className="text-xl font-bold">Página de Configuración (Próximamente)</h1></div>;
      default:
        return <SalesPage modoPrueba={modoPrueba} />;
    }
  };

  return (
    <ErrorBoundary>
      <NotificationProvider>
        {!isLoggedIn ? (
          <LoginPage onLogin={handleLogin} activarModoPrueba={activarModoPrueba} />
        ) : (
          <div className="min-h-screen flex bg-gray-100">
            <Sidebar currentPage={currentPage} onNavigate={handleNavigate} user={JSON.parse(localStorage.getItem('user') || '{}')} />
            <main className="flex-grow p-4 ml-[250px]">
              {renderPage()}
            </main>
          </div>
        )}
      </NotificationProvider>
    </ErrorBoundary>
  );
}

export default App;